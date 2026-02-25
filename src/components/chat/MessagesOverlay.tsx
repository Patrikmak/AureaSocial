"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

type MatchRow = {
  id: string;
  user_low: string;
  user_high: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type MessageRow = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type Conversation = {
  matchId: string;
  otherUser: ProfileRow;
  lastMessage?: MessageRow;
  unread: boolean;
};

export type MessagesOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unreadCount: number;
};

function compactTime(iso?: string) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const delta = Math.max(0, Date.now() - t);
  const m = Math.floor(delta / 60_000);
  if (m < 60) return `${m || 1}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function MessagesOverlay({ open, onOpenChange, unreadCount }: MessagesOverlayProps) {
  const { session } = useAuth();

  const [view, setView] = useState<"list" | "chat">("list");
  const [active, setActive] = useState<Conversation | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const badgeText = useMemo(() => {
    if (unreadCount <= 0) return null;
    return unreadCount > 9 ? "9+" : String(unreadCount);
  }, [unreadCount]);

  const close = () => {
    onOpenChange(false);
  };

  const reset = () => {
    setView("list");
    setActive(null);
    setMessages([]);
    setText("");
  };

  useEffect(() => {
    if (!open) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Load conversations (matches + other profiles + last message)
  useEffect(() => {
    if (!open) return;
    if (!session?.user) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: matchesData } = await supabase
        .from("matches")
        .select("id,user_low,user_high,created_at")
        .or(`user_low.eq.${session.user.id},user_high.eq.${session.user.id}`)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      const matches = (matchesData ?? []) as MatchRow[];
      const otherIds = matches
        .map((m) => (m.user_low === session.user.id ? m.user_high : m.user_low))
        .filter(Boolean);

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id,first_name,username,avatar_url")
        .in("id", otherIds);

      if (cancelled) return;

      const profiles = (profilesData ?? []) as ProfileRow[];
      const byId = new Map(profiles.map((p) => [p.id, p] as const));

      const matchIds = matches.map((m) => m.id);
      const { data: lastMessagesRaw } = matchIds.length
        ? await supabase
            .from("match_messages")
            .select("id,match_id,sender_id,body,created_at")
            .in("match_id", matchIds)
            .order("created_at", { ascending: false })
            .limit(80)
        : { data: [] as any[] };

      if (cancelled) return;

      const lastByMatch = new Map<string, MessageRow>();
      (lastMessagesRaw ?? []).forEach((m: any) => {
        if (!lastByMatch.has(m.match_id)) lastByMatch.set(m.match_id, m as MessageRow);
      });

      const convs: Conversation[] = matches
        .map((m) => {
          const otherId = m.user_low === session.user.id ? m.user_high : m.user_low;
          const otherUser = byId.get(otherId);
          if (!otherUser) return null;
          const lastMessage = lastByMatch.get(m.id);
          // No schema for read receipts yet — treat as unread if last message is from the other user.
          const unread = Boolean(lastMessage && lastMessage.sender_id !== session.user.id);
          return { matchId: m.id, otherUser, lastMessage, unread };
        })
        .filter(Boolean) as Conversation[];

      setConversations(convs);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, session?.user]);

  const scrollToEnd = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load & subscribe messages for the active conversation
  useEffect(() => {
    if (!open) return;
    if (!session?.user) return;
    if (view !== "chat") return;
    if (!active?.matchId) return;

    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("match_messages")
        .select("id,match_id,sender_id,body,created_at")
        .eq("match_id", active.matchId)
        .order("created_at", { ascending: true });

      if (cancelled) return;
      setMessages((data ?? []) as MessageRow[]);
      queueMicrotask(scrollToEnd);
    })();

    const channel = supabase
      .channel(`overlay_match_messages:${active.matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "match_messages", filter: `match_id=eq.${active.matchId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as MessageRow]);
          queueMicrotask(scrollToEnd);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [open, session?.user, view, active?.matchId]);

  const send = async () => {
    if (!session?.user) return;
    if (!active?.matchId) return;

    const body = text.trim();
    if (!body) return;

    setText("");
    await supabase.from("match_messages").insert({
      match_id: active.matchId,
      sender_id: session.user.id,
      body,
    });
  };

  const openChat = (c: Conversation) => {
    setActive(c);
    setView("chat");
  };

  const title = "Mensagens";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {/* Backdrop (keeps the feed visible behind) */}
          <button
            type="button"
            onClick={close}
            aria-label="Fechar mensagens"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 bottom-4 w-[92vw] max-w-lg",
              "rounded-[1.75rem] border border-white/10",
              "bg-[#07070A]/95 backdrop-blur-xl",
              "shadow-[0_28px_90px_rgba(0,0,0,0.72)]",
              "overflow-hidden"
            )}
            initial={{ y: 56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 56, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ maxHeight: "90vh" }}
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-white/10 bg-black/20">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-violet-500/12 border border-violet-400/20 flex items-center justify-center">
                    <MessageCircle className="h-[18px] w-[18px] text-violet-300" strokeWidth={2.25} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-base font-black tracking-tight text-white">{title}</div>
                      {badgeText && (
                        <span className="h-6 min-w-6 px-2 rounded-full bg-fuchsia-500/95 text-white text-[11px] font-extrabold leading-6 text-center border border-white/10 shadow-[0_10px_22px_rgba(217,70,239,0.28)]">
                          {badgeText}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/55">Sem quebrar o seu momento</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {view === "chat" && (
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
                      aria-label="Voltar"
                    >
                      <ArrowLeft className="h-5 w-5 text-gray-200" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={close}
                    className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
                    aria-label="Fechar"
                  >
                    <X className="h-5 w-5 text-gray-200" />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {view === "list" ? (
                  <motion.div
                    key="list"
                    initial={{ x: 14, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -14, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="px-4 py-4 overflow-auto"
                    style={{ maxHeight: "calc(90vh - 72px)" }}
                  >
                    {loading ? (
                      <div className="p-5 text-sm text-gray-300">Carregando conversas…</div>
                    ) : conversations.length === 0 ? (
                      <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
                        <div className="text-sm font-extrabold text-white">Nenhuma conversa ainda</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Quando você der match, suas mensagens aparecem aqui.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {conversations.map((c) => {
                          const name = c.otherUser.first_name || c.otherUser.username || "Contato";
                          const preview = c.lastMessage?.body ?? "Diga oi ✨";
                          const time = compactTime(c.lastMessage?.created_at) || compactTime(c.otherUser.id);
                          const initials = name.trim().slice(0, 2).toUpperCase();

                          return (
                            <button
                              key={c.matchId}
                              type="button"
                              onClick={() => openChat(c)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-2xl",
                                "bg-white/0 hover:bg-white/5",
                                "border border-white/0 hover:border-white/10",
                                "transition-colors"
                              )}
                              aria-label={`Abrir conversa com ${name}`}
                            >
                              <div className="relative shrink-0">
                                <div className="p-[2px] rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400">
                                  <div className="rounded-full bg-black/90 p-[2px]">
                                    <Avatar className="h-12 w-12">
                                      <AvatarImage src={c.otherUser.avatar_url ?? undefined} alt={name} />
                                      <AvatarFallback className="bg-white/5 text-white font-bold">
                                        {initials || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                </div>
                                {c.unread && (
                                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_8px_18px_rgba(34,211,238,0.35)] border border-black" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="truncate text-sm font-extrabold text-white">{name}</div>
                                  <div className="shrink-0 text-[10px] text-gray-500">{time}</div>
                                </div>
                                <div className={cn("truncate text-xs", c.unread ? "text-gray-200" : "text-gray-400")}>
                                  {preview}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ x: 14, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -14, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="flex flex-col"
                    style={{ height: "calc(90vh - 72px)" }}
                  >
                    <div className="px-5 py-4 border-b border-white/10 bg-black/10">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-violet-500/30">
                          <AvatarImage
                            src={active?.otherUser.avatar_url ?? undefined}
                            alt={active?.otherUser.first_name ?? active?.otherUser.username ?? ""}
                          />
                          <AvatarFallback className="bg-white/5 text-white">
                            {(active?.otherUser.first_name || active?.otherUser.username || "?")
                              .trim()
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-extrabold text-white">
                            {active?.otherUser.first_name || active?.otherUser.username || "Conversa"}
                          </div>
                          <div className="text-[10px] text-gray-400">Match</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 px-5 py-4 overflow-auto">
                      <div className="space-y-3">
                        {messages.map((m) => {
                          const mine = m.sender_id === session?.user?.id;
                          return (
                            <div
                              key={m.id}
                              className={cn(
                                "max-w-[85%] rounded-2xl border px-4 py-3 text-sm",
                                mine
                                  ? "ml-auto rounded-tr-md bg-violet-600/90 border-white/10 text-white"
                                  : "rounded-tl-md bg-white/5 border-white/10 text-gray-200"
                              )}
                            >
                              {m.body}
                            </div>
                          );
                        })}
                        <div ref={endRef} />
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-3 border-t border-white/10 bg-black/15">
                      <div className="flex items-center gap-3">
                        <Input
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Escreva uma mensagem…"
                          className="h-11 rounded-full bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-violet-500/30"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") send();
                          }}
                        />
                        <Button
                          type="button"
                          onClick={send}
                          disabled={!text.trim()}
                          className="h-11 w-11 p-0 rounded-full bg-cyan-500 hover:bg-cyan-500/90 text-black disabled:opacity-60"
                          aria-label="Enviar"
                        >
                          ➤
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
