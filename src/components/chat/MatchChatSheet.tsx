"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

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

type FusionKind = "fusao" | "superfusao";

type SystemItem = {
  kind: "system";
  id: string;
  body: string;
};

type ChatItem = MessageRow | SystemItem;

function isSystemItem(item: ChatItem): item is SystemItem {
  return (item as SystemItem).kind === "system";
}

export default function MatchChatSheet({
  open,
  onOpenChange,
  matchId,
  otherUser,
  fusionKind,
  showFusionIntro,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string | null;
  otherUser: ProfileRow | null;
  fusionKind?: FusionKind | null;
  showFusionIntro?: boolean;
}) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const title = otherUser?.first_name || otherUser?.username || "Conversa";
  const initials = title.trim().slice(0, 2).toUpperCase();

  const canSend = Boolean(session?.user && matchId && text.trim().length > 0);

  const scrollToEnd = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!open) return;
    if (!matchId) return;

    (async () => {
      const { data } = await supabase
        .from("match_messages")
        .select("id,match_id,sender_id,body,created_at")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      setMessages((data ?? []) as MessageRow[]);
      queueMicrotask(scrollToEnd);
    })();
  }, [open, matchId]);

  useEffect(() => {
    if (!open) return;
    if (!matchId) return;

    const channel = supabase
      .channel(`match_messages:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "match_messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as MessageRow]);
          queueMicrotask(scrollToEnd);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, matchId]);

  const send = async () => {
    if (!session?.user || !matchId) return;
    const body = text.trim();
    if (!body) return;

    setText("");
    await supabase.from("match_messages").insert({
      match_id: matchId,
      sender_id: session.user.id,
      body,
    });
  };

  const items = useMemo<ChatItem[]>(() => {
    const base = messages as ChatItem[];
    if (!open || !matchId || !showFusionIntro) return base;

    const intro: SystemItem = {
      kind: "system",
      id: `system-fusion-intro:${matchId}`,
      body:
        fusionKind === "superfusao"
          ? "💫 Superfusão Ativada. Acesso ao chat liberado."
          : "✨ Vocês se fundiram. A conversa começa agora.",
    };

    return [intro, ...base];
  }, [messages, open, matchId, showFusionIntro, fusionKind]);

  const fusionLabel = fusionKind === "superfusao" ? "Superfusão" : "Fusão";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "p-0 border-white/10 bg-[#07070A] text-white rounded-t-[2.5rem] overflow-hidden",
          "shadow-[0_-28px_90px_rgba(0,0,0,0.78)]"
        )}
      >
        <div className="flex h-[86vh] max-h-[720px] flex-col">
          <div className="px-5 pt-4 pb-3 border-b border-white/10 bg-black/20">
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-violet-500/30">
                  <AvatarImage src={otherUser?.avatar_url ?? undefined} alt={title} />
                  <AvatarFallback className="bg-white/5 text-white">{initials || "?"}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <SheetTitle className="truncate text-base font-black tracking-tight text-white">{title}</SheetTitle>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-400">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 border",
                        fusionKind === "superfusao"
                          ? "bg-blue-500/10 border-blue-300/20 text-blue-100"
                          : "bg-violet-500/10 border-violet-400/20 text-violet-200"
                      )}
                    >
                      {fusionKind === "superfusao" ? (
                        <Star size={12} className="opacity-90" fill="currentColor" strokeWidth={0} />
                      ) : (
                        <Sparkles size={12} className="opacity-90" />
                      )}
                      {fusionLabel}
                    </span>
                    {fusionKind === "superfusao" && (
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-400 to-violet-600 px-2 py-0.5 text-[10px] font-black text-black border border-white/10 shadow-[0_14px_44px_rgba(99,102,241,0.18)]">
                        ✦ SELO
                      </span>
                    )}
                    <span className="text-white/35">•</span>
                    <span className="text-white/55">Aurēa Chat</span>
                  </div>
                </div>

                <div className="h-1.5 w-12 rounded-full bg-white/10" />
              </div>
            </SheetHeader>
          </div>

          <div className="flex-1 px-5 py-5 overflow-auto">
            <div className="space-y-3">
              {items.map((m) => {
                if (isSystemItem(m)) {
                  return (
                    <div
                      key={m.id}
                      className="mx-auto max-w-[92%] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-gray-200 text-center"
                    >
                      {m.body}
                    </div>
                  );
                }

                const mine = m.sender_id === session?.user?.id;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[85%] rounded-2xl border px-4 py-3 text-sm",
                      mine
                        ? "ml-auto rounded-tr-md bg-violet-600/90 border-white/10 text-white shadow-[0_18px_42px_rgba(139,92,246,0.18)]"
                        : "rounded-tl-md bg-[#0E0E12] border-white/10 text-gray-200"
                    )}
                  >
                    {m.body}
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
          </div>

          <div className="px-5 pb-5 pt-4 border-t border-white/10 bg-black/25">
            <div className="flex items-center gap-3">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva uma mensagem…"
                className="h-11 rounded-full bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-violet-500/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                disabled={!matchId}
              />
              <Button
                type="button"
                onClick={send}
                disabled={!canSend}
                className={cn(
                  "h-11 w-11 p-0 rounded-full",
                  "bg-violet-600 hover:bg-violet-500 text-white",
                  "shadow-[0_14px_44px_rgba(139,92,246,0.35)]",
                  "disabled:opacity-60 disabled:shadow-none"
                )}
                aria-label="Enviar"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}