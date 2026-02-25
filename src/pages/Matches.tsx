"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import BottomNav from "@/components/layout/BottomNav";
import MatchChatSheet from "@/components/chat/MatchChatSheet";
import MessagesLauncher from "@/components/chat/MessagesLauncher";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MessageCircle } from "lucide-react";

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

type MatchRow = {
  id: string;
  user_low: string;
  user_high: string;
  created_at: string;
};

type FusionItem = {
  matchId: string;
  other: ProfileRow;
  kind: FusionKind;
  lastMessage?: MessageRow;
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

export default function Matches() {
  const { session } = useAuth();
  const location = useLocation();

  const [tab, setTab] = useState<"fusoes" | "mensagens">("fusoes");
  const [items, setItems] = useState<FusionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [activeOther, setActiveOther] = useState<ProfileRow | null>(null);
  const [activeKind, setActiveKind] = useState<FusionKind | null>(null);

  const activeCount = items.length;

  const openChat = (it: FusionItem) => {
    setActiveMatchId(it.matchId);
    setActiveOther(it.other);
    setActiveKind(it.kind);
    setChatOpen(true);
  };

  useEffect(() => {
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
      const matchIds = matches.map((m) => m.id);

      const otherIds = matches
        .map((m) => (m.user_low === session.user.id ? m.user_high : m.user_low))
        .filter(Boolean);

      const { data: profilesData } = otherIds.length
        ? await supabase.from("profiles").select("id,first_name,username,avatar_url").in("id", otherIds)
        : { data: [] as any[] };

      if (cancelled) return;
      const profiles = (profilesData ?? []) as ProfileRow[];
      const byId = new Map(profiles.map((p) => [p.id, p] as const));

      const { data: kindsRaw } = matchIds.length
        ? await supabase.from("match_kinds").select("match_id,kind").in("match_id", matchIds)
        : { data: [] as any[] };

      if (cancelled) return;
      const kindByMatch = new Map<string, FusionKind>();
      (kindsRaw ?? []).forEach((r: any) => kindByMatch.set(r.match_id as string, r.kind as FusionKind));

      const { data: lastMessagesRaw } = matchIds.length
        ? await supabase
            .from("match_messages")
            .select("id,match_id,sender_id,body,created_at")
            .in("match_id", matchIds)
            .order("created_at", { ascending: false })
            .limit(120)
        : { data: [] as any[] };

      if (cancelled) return;
      const lastByMatch = new Map<string, MessageRow>();
      (lastMessagesRaw ?? []).forEach((m: any) => {
        if (!lastByMatch.has(m.match_id)) lastByMatch.set(m.match_id as string, m as MessageRow);
      });

      const next: FusionItem[] = matches
        .map((m) => {
          const otherId = m.user_low === session.user!.id ? m.user_high : m.user_low;
          const other = byId.get(otherId);
          if (!other) return null;
          const kind = kindByMatch.get(m.id) ?? "fusao";
          const lastMessage = lastByMatch.get(m.id);
          return { matchId: m.id, other, kind, lastMessage };
        })
        .filter(Boolean) as FusionItem[];

      // Prioridade visual: superfusão sobe, depois mais recentes
      next.sort((a, b) => {
        const sa = a.kind === "superfusao" ? 1 : 0;
        const sb = b.kind === "superfusao" ? 1 : 0;
        if (sa !== sb) return sb - sa;
        const ta = new Date(a.lastMessage?.created_at ?? 0).getTime();
        const tb = new Date(b.lastMessage?.created_at ?? 0).getTime();
        return tb - ta;
      });

      setItems(next);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  // Deep-link: /matches?chat=username abre chat direto (sem telas intermediárias)
  useEffect(() => {
    if (!session?.user) return;

    const params = new URLSearchParams(location.search);
    const username = params.get("chat");
    if (!username) return;

    let cancelled = false;

    (async () => {
      const { data: p } = await supabase.from("profiles").select("id,first_name,username,avatar_url").eq("username", username).maybeSingle();
      if (cancelled) return;
      if (!p?.id) return;

      const a = session.user.id;
      const b = p.id as string;
      const pair = a < b ? { user_low: a, user_high: b } : { user_low: b, user_high: a };

      const { data: m } = await supabase
        .from("matches")
        .select("id")
        .eq("user_low", pair.user_low)
        .eq("user_high", pair.user_high)
        .maybeSingle();

      if (cancelled) return;
      if (!m?.id) return;

      const { data: k } = await supabase.from("match_kinds").select("kind").eq("match_id", m.id).maybeSingle();
      if (cancelled) return;

      setActiveMatchId(m.id as string);
      setActiveOther(p as ProfileRow);
      setActiveKind(((k?.kind as FusionKind | undefined) ?? "fusao") as FusionKind);
      setChatOpen(true);
      setTab("mensagens");
    })();

    return () => {
      cancelled = true;
    };
  }, [location.search, session?.user]);

  const fusionGrid = useMemo(() => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((it, idx) => {
          const name = it.other.first_name || it.other.username || "Perfil";
          const superSeal = it.kind === "superfusao";

          return (
            <motion.button
              key={it.matchId}
              type="button"
              onClick={() => openChat(it)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut", delay: Math.min(0.18, idx * 0.03) }}
              className={cn(
                "relative rounded-[1.6rem] overflow-hidden border text-left",
                "bg-white/5 border-white/10",
                "hover:bg-white/8 active:scale-[0.99] transition",
                superSeal && "border-blue-300/20 shadow-[0_18px_60px_rgba(99,102,241,0.12)]"
              )}
              aria-label={`Abrir chat com ${name}`}
            >
              <div className="aspect-[4/5] w-full">
                <img
                  src={it.other.avatar_url || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500"}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              {superSeal && (
                <div className="absolute left-3 top-3 rounded-full border border-blue-200/20 bg-black/35 px-3 py-1 text-[10px] font-extrabold tracking-wide text-blue-100 backdrop-blur">
                  💫 Superfusão
                </div>
              )}

              <div className="absolute left-3 right-3 bottom-3">
                <div className="truncate text-sm font-black text-white">{name}</div>
                <div className="mt-0.5 text-[10px] text-white/60">Toque para conversar</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }, [items]);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="sticky top-0 z-40 bg-black/45 backdrop-blur-xl border-b border-white/5"
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.34em] text-white/50">Aurēa</div>
              <h1 className="text-2xl font-black tracking-tight">Fusões</h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-10 rounded-full border border-white/10 bg-white/5 px-4 flex items-center gap-2">
                <Star size={16} className="text-violet-300" />
                <span className="text-xs font-extrabold text-white">{activeCount}</span>
                <span className="text-[10px] text-white/55">ativas</span>
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-4">
            <TabsList className="w-full grid grid-cols-2 bg-white/5 border border-white/10 rounded-full p-1">
              <TabsTrigger
                value="fusoes"
                className="rounded-full data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-100 data-[state=active]:shadow-none"
              >
                Fusões
              </TabsTrigger>
              <TabsTrigger
                value="mensagens"
                className="rounded-full data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-100 data-[state=active]:shadow-none"
              >
                Mensagens
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fusoes" className="mt-5">
              {loading ? (
                <div className="px-6 py-10 text-sm text-white/60">Carregando fusões…</div>
              ) : items.length === 0 ? (
                <div className="mx-4 rounded-[2rem] border border-white/10 bg-white/5 p-7">
                  <div className="text-sm font-extrabold text-white">Nenhuma fusão recíproca ainda</div>
                  <div className="mt-1 text-xs text-white/60">
                    Só aparecem <span className="text-white font-semibold">fusões confirmadas</span>.
                  </div>
                </div>
              ) : (
                <div className="px-4">{fusionGrid}</div>
              )}
            </TabsContent>

            <TabsContent value="mensagens" className="mt-5">
              {loading ? (
                <div className="px-6 py-10 text-sm text-white/60">Carregando mensagens…</div>
              ) : items.length === 0 ? (
                <div className="mx-4 rounded-[2rem] border border-white/10 bg-white/5 p-7">
                  <div className="text-sm font-extrabold text-white">Sem conversas</div>
                  <div className="mt-1 text-xs text-white/60">Suas mensagens aparecem depois de uma fusão confirmada.</div>
                </div>
              ) : (
                <div className="px-4 space-y-2">
                  {items.map((it) => {
                    const name = it.other.first_name || it.other.username || "Contato";
                    const preview = it.lastMessage?.body ?? "Diga oi ✨";
                    const time = compactTime(it.lastMessage?.created_at);
                    const superSeal = it.kind === "superfusao";
                    return (
                      <button
                        key={it.matchId}
                        type="button"
                        onClick={() => openChat(it)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-2xl border text-left",
                          superSeal
                            ? "bg-blue-500/10 hover:bg-blue-500/15 border-blue-300/20"
                            : "bg-white/0 hover:bg-white/5 border-white/0 hover:border-white/10",
                          "transition-colors"
                        )}
                      >
                        <div className="relative shrink-0">
                          <div
                            className={cn(
                              "p-[2px] rounded-full",
                              superSeal
                                ? "bg-gradient-to-tr from-blue-500 via-indigo-500 to-violet-500"
                                : "bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400"
                            )}
                          >
                            <div className="rounded-full bg-black/90 p-[2px]">
                              <img
                                src={it.other.avatar_url || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200"}
                                alt=""
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            </div>
                          </div>
                          {superSeal && (
                            <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-violet-600 text-black text-[11px] font-black grid place-items-center border border-white/10">
                              ✦
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="truncate text-sm font-extrabold text-white flex items-center gap-2">
                              {name}
                              {superSeal && (
                                <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-extrabold text-blue-100 tracking-wide">
                                  💫 Superfusão
                                </span>
                              )}
                            </div>
                            <div className="shrink-0 text-[10px] text-white/45">{time}</div>
                          </div>
                          <div className="truncate text-xs text-white/60">{preview}</div>
                        </div>

                        <div className={cn("shrink-0", superSeal ? "text-blue-200" : "text-violet-200")}>
                          <MessageCircle size={18} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </motion.header>

      <MatchChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
        matchId={activeMatchId}
        otherUser={activeOther}
        fusionKind={activeKind}
        showFusionIntro={false}
      />

      <MessagesLauncher />
      <BottomNav />
    </div>
  );
}
