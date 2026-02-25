"use client";

import React, { useEffect, useMemo, useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import MatchChatSheet from '@/components/chat/MatchChatSheet';
import MessagesLauncher from '@/components/chat/MessagesLauncher';
import FusionActionBar, { FusionAction } from '@/components/matches/FusionActionBar';
import FusionConfirmedDialog from '@/components/matches/FusionConfirmedDialog';
import SuperfusionConfirmedDialog from '@/components/matches/SuperfusionConfirmedDialog';
import MatchesInboxSheet from '@/components/matches/MatchesInboxSheet';

type ProfileRow = {
  id: string;
  first_name: string | null;
  username: string | null;
  avatar_url: string | null;
  location: string | null;
};

type SwipeDirection = 'like' | 'pass' | 'superlike';

type Candidate = {
  id: string;
  profile: ProfileRow;
};

const Matches = () => {
  const { session } = useAuth();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [index, setIndex] = useState(0);
  const [anim, setAnim] = useState<{ x: number; y: number; rot: number; opacity: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const [lastAction, setLastAction] = useState<{ candidate: Candidate; action: SwipeDirection } | null>(null);

  // Match + chat
  const [matchOpen, setMatchOpen] = useState(false);
  const [superMatchOpen, setSuperMatchOpen] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [activeOther, setActiveOther] = useState<ProfileRow | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFusionKind, setChatFusionKind] = useState<"fusao" | "superfusao" | null>(null);
  const [showFusionIntro, setShowFusionIntro] = useState(false);

  // Inbox (prévia das fusões)
  const [inboxOpen, setInboxOpen] = useState(false);

  // Superfusão: feedback visual de envio + destaque recebido
  const [superfusionSentFx, setSuperfusionSentFx] = useState(false);
  const [receivedSuperfusionIds, setReceivedSuperfusionIds] = useState<Set<string>>(new Set());

  const you = useMemo(
    () => ({
      avatar_url: null as string | null,
      first_name: null as string | null,
      username: session?.user?.email?.split('@')[0] ?? null,
    }),
    [session?.user?.email]
  );

  // Load your profile (for the dialog avatar)
  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url,first_name,username')
        .eq('id', session.user.id)
        .maybeSingle();

      if (cancelled) return;
      if (!data) return;
      you.avatar_url = data.avatar_url;
      you.first_name = data.first_name;
      you.username = data.username;
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user, you]);

  // Load candidates
  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id,first_name,username,avatar_url,location')
        .neq('id', session.user.id)
        .limit(30);

      if (cancelled) return;
      const rows = (data ?? []) as ProfileRow[];
      setCandidates(rows.map((p) => ({ id: p.id, profile: p })));
      setIndex(0);

      const ids = rows.map((r) => r.id);
      if (!ids.length) {
        setReceivedSuperfusionIds(new Set());
        return;
      }

      const { data: incoming } = await supabase
        .from('swipes')
        .select('swiper_id')
        .eq('target_id', session.user.id)
        .eq('direction', 'superlike')
        .in('swiper_id', ids);

      if (cancelled) return;
      setReceivedSuperfusionIds(new Set((incoming ?? []).map((r: any) => r.swiper_id as string)));
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  const current = candidates[index] ?? null;

  const computePair = (a: string, b: string) => {
    return a < b ? { user_low: a, user_high: b } : { user_low: b, user_high: a };
  };

  const createMatchIfNeeded = async (targetId: string) => {
    if (!session?.user) return null;
    const pair = computePair(session.user.id, targetId);

    const { data: existing } = await supabase
      .from('matches')
      .select('id')
      .eq('user_low', pair.user_low)
      .eq('user_high', pair.user_high)
      .maybeSingle();

    if (existing?.id) return existing.id as string;

    const { data: inserted } = await supabase
      .from('matches')
      .insert(pair)
      .select('id')
      .maybeSingle();

    return (inserted?.id as string) ?? null;
  };

  const hasReciprocal = async (targetId: string, expected: SwipeDirection) => {
    if (!session?.user) return false;
    const { data } = await supabase
      .from('swipes')
      .select('id,direction')
      .eq('swiper_id', targetId)
      .eq('target_id', session.user.id)
      .maybeSingle();

    return Boolean(data && data.direction === expected);
  };

  const upsertSwipe = async (targetId: string, direction: SwipeDirection) => {
    if (!session?.user) return;
    await supabase.from('swipes').upsert({
      swiper_id: session.user.id,
      target_id: targetId,
      direction,
    });
  };

  const upsertMatchKind = async (matchId: string | null, kind: "fusao" | "superfusao") => {
    if (!matchId) return;
    await supabase.from('match_kinds').upsert({ match_id: matchId, kind });
  };

  const animateOut = async (direction: SwipeDirection) => {
    if (direction === 'pass') {
      setAnim({ x: -240, y: 30, rot: -10, opacity: 0 });
      return;
    }
    if (direction === 'like') {
      setAnim({ x: 240, y: -10, rot: 10, opacity: 0 });
      return;
    }
    setAnim({ x: 0, y: -220, rot: 0, opacity: 0 });
  };

  const nextCard = () => {
    setAnim(null);
    setIndex((i) => Math.min(i + 1, candidates.length));
  };

  const doAction = async (action: FusionAction) => {
    if (!session?.user) return;
    if (!current) return;
    if (busy) return;

    if (action === 'voltarFusao') {
      if (!lastAction) return;
      setBusy(true);
      // Undo by deleting your swipe
      await supabase
        .from('swipes')
        .delete()
        .eq('swiper_id', session.user.id)
        .eq('target_id', lastAction.candidate.id);

      setCandidates((prev) => {
        const next = [...prev];
        next.splice(index, 0, lastAction.candidate);
        return next;
      });
      setLastAction(null);
      setBusy(false);
      return;
    }

    const swipeDir: SwipeDirection =
      action === 'desfusao' ? 'pass' : action === 'fusao' ? 'like' : 'superlike';

    if (swipeDir === 'superlike') {
      setSuperfusionSentFx(true);
      window.setTimeout(() => setSuperfusionSentFx(false), 520);
    }

    setBusy(true);
    setLastAction({ candidate: current, action: swipeDir });

    await upsertSwipe(current.id, swipeDir);
    await animateOut(swipeDir);

    window.setTimeout(async () => {
      nextCard();

      // Fusão logic

      const reciprocalLike = await hasReciprocal(current.id, 'like');
      const reciprocalSuper = await hasReciprocal(current.id, 'superlike');

      if (swipeDir === 'like' && reciprocalLike) {
        const matchId = await createMatchIfNeeded(current.id);
        await upsertMatchKind(matchId, "fusao");
        setActiveMatchId(matchId);
        setActiveOther(current.profile);
        setChatFusionKind("fusao");
        setMatchOpen(true);
      }

      if (swipeDir === 'superlike' && reciprocalSuper) {
        const matchId = await createMatchIfNeeded(current.id);
        await upsertMatchKind(matchId, "superfusao");
        setActiveMatchId(matchId);
        setActiveOther(current.profile);
        setChatFusionKind("superfusao");
        setSuperMatchOpen(true);
      }

      setBusy(false);
    }, 260);
  };

  const startChat = (kind?: "fusao" | "superfusao") => {
    setMatchOpen(false);
    setSuperMatchOpen(false);
    setChatFusionKind(kind ?? chatFusionKind);
    setShowFusionIntro(true);
    setChatOpen(true);
  };

  const openChatFromInbox = async (payload: { matchId: string; otherUser: ProfileRow }) => {
    setInboxOpen(false);
    setActiveMatchId(payload.matchId);
    setActiveOther(payload.otherUser);

    const { data } = await supabase.from('match_kinds').select('kind').eq('match_id', payload.matchId).maybeSingle();
    const kind = (data?.kind as ("fusao" | "superfusao") | undefined) ?? "fusao";

    setChatFusionKind(kind);
    setShowFusionIntro(false);
    setChatOpen(true);
  };

  useEffect(() => {
    if (!matchOpen) return;
    const t = window.setTimeout(() => startChat("fusao"), 8000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchOpen]);

  useEffect(() => {
    if (!superMatchOpen) return;
    const t = window.setTimeout(() => startChat("superfusao"), 8000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [superMatchOpen]);

  const receivedSuperfusion = Boolean(current && receivedSuperfusionIds.has(current.id));

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 overflow-hidden">
      <header className="px-6 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-tight">DESCUBRA</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInboxOpen(true)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
            aria-label="Abrir fusões"
          >
            <Star size={20} className="text-yellow-500" />
          </button>
        </div>
      </header>

      <main className="px-4 h-[70vh] relative flex items-center justify-center">
        <div className="relative w-full max-w-sm aspect-[3/4]">
          {current ? (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: anim?.opacity ?? 1,
                x: anim?.x ?? 0,
                y: anim?.y ?? 0,
                rotate: anim?.rot ?? 0,
              }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Destaque: você recebeu uma Superfusão dessa pessoa */}
              {receivedSuperfusion && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 via-indigo-500/10 to-transparent" />
                  <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-blue-400/25 blur-3xl" />
                  <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />
                  <div className="absolute left-6 top-6 rounded-full border border-blue-200/20 bg-black/35 px-3 py-1 text-[10px] font-extrabold tracking-wide text-blue-100 backdrop-blur">
                    💫 Superfusão recebida
                  </div>
                </div>
              )}

              {/* Feedback: superfusão enviada */}
              <AnimatePresence>
                {superfusionSentFx && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 via-indigo-500/10 to-transparent" />
                    {Array.from({ length: 18 }).map((_, i) => (
                      <motion.span
                        key={i}
                        className={cn(
                          "absolute left-1/2 top-1/2 h-2 w-2 rounded-full",
                          i % 2 === 0 ? "bg-blue-300/90" : "bg-violet-400/90"
                        )}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0.7 }}
                        animate={{
                          x: (Math.random() - 0.5) * 260,
                          y: (Math.random() - 0.5) * 260,
                          opacity: [0, 1, 0],
                          scale: [0.7, 1.15, 0.6],
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    ))}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-black tracking-tight text-white backdrop-blur">
                      💫 Superfusão enviada
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <img
                src={
                  current.profile.avatar_url ||
                  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800'
                }
                className="w-full h-full object-cover"
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-3xl font-bold">
                    {current.profile.first_name || current.profile.username || 'Perfil'}
                    <span className="text-white/50">,</span>
                    <span className="text-white/80"> 22</span>
                  </h2>
                  <div className={cn(
                    "w-3 h-3 rounded-full border-2 border-black",
                    receivedSuperfusion ? "bg-blue-400 shadow-[0_10px_24px_rgba(96,165,250,0.35)]" : "bg-green-500"
                  )} />
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  {current.profile.location || 'Aurēa vibes — vamos nos fundir?'}
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] border border-white/10">
                    Artes
                  </span>
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] border border-white/10">
                    Viagens
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 rounded-[3rem] border border-white/10 bg-white/5 flex items-center justify-center">
              <div className="text-sm text-gray-300">Sem mais perfis por enquanto.</div>
            </div>
          )}
        </div>
      </main>

      {/* FusionActionBar (below card) */}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2">
        <FusionActionBar onAction={doAction} disabled={!current || busy} canUndo={Boolean(lastAction)} />
      </div>

      {/* Fusão confirmada */}
      <FusionConfirmedDialog
        open={matchOpen}
        onOpenChange={setMatchOpen}
        you={you}
        other={activeOther}
        onStartChat={startChat}
      />

      {/* Superfusão */}
      <SuperfusionConfirmedDialog
        open={superMatchOpen}
        onOpenChange={setSuperMatchOpen}
        you={you}
        other={activeOther}
        onStartChat={startChat}
      />

      {/* Inbox (prévia de fusões) */}
      <MatchesInboxSheet open={inboxOpen} onOpenChange={setInboxOpen} onOpenChat={openChatFromInbox} />

      {/* Chat overlay (existing bottom sheet component) */}
      <MatchChatSheet
        open={chatOpen}
        onOpenChange={(next) => {
          setChatOpen(next);
          if (!next) setShowFusionIntro(false);
        }}
        matchId={activeMatchId}
        otherUser={activeOther}
        fusionKind={chatFusionKind}
        showFusionIntro={showFusionIntro}
      />

      <MessagesLauncher />

      <BottomNav />
    </div>
  );
};

export default Matches;