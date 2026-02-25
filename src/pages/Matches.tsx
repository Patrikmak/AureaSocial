"use client";

import React, { useEffect, useMemo, useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import MatchChatSheet from '@/components/chat/MatchChatSheet';
import MessagesLauncher from '@/components/chat/MessagesLauncher';
import FusionActionBar, { FusionAction } from '@/components/matches/FusionActionBar';
import FusionConfirmedDialog from '@/components/matches/FusionConfirmedDialog';
import SuperFusionDialog from '@/components/matches/SuperFusionDialog';

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
        setActiveMatchId(matchId);
        setActiveOther(current.profile);
        setMatchOpen(true);
      }

      if (swipeDir === 'superlike' && reciprocalSuper) {
        const matchId = await createMatchIfNeeded(current.id);
        setActiveMatchId(matchId);
        setActiveOther(current.profile);
        setSuperMatchOpen(true);
      }

      setBusy(false);
    }, 260);
  };

  const startChat = () => {
    setMatchOpen(false);
    setSuperMatchOpen(false);
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 overflow-hidden">
      <header className="px-6 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-tight">DESCUBRA</h1>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Star size={20} className="text-yellow-500" />
          </div>
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
                  <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
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
      <SuperFusionDialog
        open={superMatchOpen}
        onOpenChange={setSuperMatchOpen}
        you={you}
        other={activeOther}
        onStartChat={startChat}
      />

      {/* Chat overlay (existing bottom sheet component) */}
      <MatchChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
        matchId={activeMatchId}
        otherUser={activeOther}
      />

      <MessagesLauncher />

      <BottomNav />
    </div>
  );
};

export default Matches;