"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type VibeItem = { id: string; image: string; durationMs?: number };

type Vibe = {
  id: number;
  name: string;
  img: string;
  isUser?: boolean;
  items?: VibeItem[];
};

const DEFAULT_DURATION_MS = 5000;
const LONG_PRESS_MS = 220;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function lsSet<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

const SEEN_KEY = "aurea:vibes:seen:v1";
const USER_VIBES_KEY = "aurea:vibes:me:v1";

const baseVibes: Vibe[] = [
  {
    id: 1,
    name: "Sua Vibe",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    isUser: true,
  },
  {
    id: 2,
    name: "Alex",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
    items: [
      { id: "alex-1", image: "https://images.unsplash.com/photo-1520975958225-0e8ec2f2b25b?w=1200" },
      { id: "alex-2", image: "https://images.unsplash.com/photo-1520975915438-ebb2a6ef0f8f?w=1200" },
      { id: "alex-3", image: "https://images.unsplash.com/photo-1520975945736-65da2d6b0fdf?w=1200" },
    ],
  },
  {
    id: 3,
    name: "Luna",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    items: [
      { id: "luna-1", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200" },
      { id: "luna-2", image: "https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?w=1200" },
    ],
  },
  {
    id: 4,
    name: "Marc",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    items: [
      { id: "marc-1", image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1200" },
      { id: "marc-2", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200" },
    ],
  },
  {
    id: 5,
    name: "Bia",
    img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop",
    items: [
      { id: "bia-1", image: "https://images.unsplash.com/photo-1520975915438-ebb2a6ef0f8f?w=1200" },
      { id: "bia-2", image: "https://images.unsplash.com/photo-1520975945736-65da2d6b0fdf?w=1200" },
    ],
  },
  {
    id: 6,
    name: "Leo",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    items: [{ id: "leo-1", image: "https://images.unsplash.com/photo-1520975958225-0e8ec2f2b25b?w=1200" }],
  },
];

export default function VibesBar() {
  const reduceMotion = useReducedMotion();

  const [meItems, setMeItems] = useState<VibeItem[]>([]);
  const [seen, setSeen] = useState<Record<number, true>>({});

  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [activeVibeIndex, setActiveVibeIndex] = useState(0);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 for the current item

  const [reply, setReply] = useState("");
  const [burst, setBurst] = useState<{ id: number; x: number; y: number; emoji: string } | null>(null);

  const pressStartRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const ignoreTapRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const itemStartTsRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  useEffect(() => {
    setSeen(lsGet<Record<number, true>>(SEEN_KEY, {}));
    setMeItems(lsGet<VibeItem[]>(USER_VIBES_KEY, []));
  }, []);

  const vibes = useMemo<Vibe[]>(() => {
    return baseVibes.map((v) => (v.isUser ? { ...v, items: meItems } : v));
  }, [meItems]);

  const activeVibe = vibes[activeVibeIndex];
  const activeItems = activeVibe?.items ?? [];
  const activeItem = activeItems[activeItemIndex];

  const durationMs = useMemo(() => {
    const d = activeItem?.durationMs ?? DEFAULT_DURATION_MS;
    return clamp(d, 2500, 9000);
  }, [activeItem]);

  const persistSeen = useCallback((next: Record<number, true>) => {
    setSeen(next);
    lsSet(SEEN_KEY, next);
  }, []);

  const markActiveVibeSeen = useCallback(() => {
    if (!activeVibe || activeVibe.isUser) return;
    if (!activeVibe.items?.length) return;
    if (seen[activeVibe.id]) return;
    persistSeen({ ...seen, [activeVibe.id]: true });
  }, [activeVibe, persistSeen, seen]);

  const closeViewer = useCallback(() => {
    setOpen(false);
    setPaused(false);
    setProgress(0);
    setReply("");
    setBurst(null);
    setActiveItemIndex(0);
    // keep activeVibeIndex: Instagram reopens where you tapped next time
  }, []);

  const openVibe = useCallback(
    (index: number) => {
      const v = vibes[index];
      if (!v) return;

      if (v.isUser && (!v.items || v.items.length === 0)) {
        setCreateOpen(true);
        return;
      }

      setActiveVibeIndex(index);
      setActiveItemIndex(0);
      setPaused(false);
      setProgress(0);
      elapsedRef.current = 0;
      itemStartTsRef.current = performance.now();
      setOpen(true);
    },
    [vibes]
  );

  const goTo = useCallback(
    (vibeIndex: number, itemIndex: number) => {
      const v = vibes[vibeIndex];
      if (!v) return;
      const items = v.items ?? [];
      const safeItemIndex = clamp(itemIndex, 0, Math.max(0, items.length - 1));
      setActiveVibeIndex(vibeIndex);
      setActiveItemIndex(safeItemIndex);
      setPaused(false);
      setProgress(0);
      elapsedRef.current = 0;
      itemStartTsRef.current = performance.now();
    },
    [vibes]
  );

  const next = useCallback(() => {
    if (!activeVibe) return;

    const nextItem = activeItemIndex + 1;
    if (nextItem < activeItems.length) {
      setActiveItemIndex(nextItem);
      setProgress(0);
      elapsedRef.current = 0;
      itemStartTsRef.current = performance.now();
      return;
    }

    // acabou o usuário atual -> marca como visto e vai para próximo usuário
    markActiveVibeSeen();

    const nextVibe = activeVibeIndex + 1;
    if (nextVibe < vibes.length) {
      goTo(nextVibe, 0);
      return;
    }

    // acabou tudo
    closeViewer();
  }, [activeItemIndex, activeItems.length, activeVibe, activeVibeIndex, closeViewer, goTo, markActiveVibeSeen, vibes.length]);

  const prev = useCallback(() => {
    const prevItem = activeItemIndex - 1;
    if (prevItem >= 0) {
      setActiveItemIndex(prevItem);
      setProgress(0);
      elapsedRef.current = 0;
      itemStartTsRef.current = performance.now();
      return;
    }

    const prevVibe = activeVibeIndex - 1;
    if (prevVibe >= 0) {
      const prevItems = vibes[prevVibe].items ?? [];
      goTo(prevVibe, Math.max(0, prevItems.length - 1));
      return;
    }

    goTo(0, 0);
  }, [activeItemIndex, activeVibeIndex, goTo, vibes]);

  // Progress loop (Instagram-like, supports pause/resume)
  useEffect(() => {
    if (!open) return;
    if (!activeItem) return;
    if (reduceMotion) return;

    const tick = (ts: number) => {
      if (paused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!itemStartTsRef.current) itemStartTsRef.current = ts;
      const delta = ts - itemStartTsRef.current;
      const elapsed = elapsedRef.current + delta;
      const p = clamp(elapsed / durationMs, 0, 1);
      setProgress(p);

      if (p >= 1) {
        elapsedRef.current = 0;
        itemStartTsRef.current = ts;
        next();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    itemStartTsRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [activeItem, durationMs, next, open, paused, reduceMotion]);

  // When item changes, reset timer baseline
  useEffect(() => {
    if (!open) return;
    elapsedRef.current = 0;
    itemStartTsRef.current = performance.now();
    setProgress(0);
  }, [open, activeVibeIndex, activeItemIndex]);

  // Pause/resume hooks
  const pause = () => {
    if (paused) return;
    setPaused(true);
    // freeze elapsed
    elapsedRef.current = elapsedRef.current + (performance.now() - itemStartTsRef.current);
    itemStartTsRef.current = performance.now();
  };

  const resume = () => {
    if (!paused) return;
    setPaused(false);
    itemStartTsRef.current = performance.now();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    pressStartRef.current = Date.now();
    ignoreTapRef.current = false;

    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      ignoreTapRef.current = true;
      pause();
    }, LONG_PRESS_MS);
  };

  const onPointerUpOrCancel = (e: React.PointerEvent) => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;

    const startedAt = pressStartRef.current;
    pressStartRef.current = null;

    const start = pointerStartRef.current;
    pointerStartRef.current = null;

    // Resume if it was long press paused (Instagram-like)
    if (startedAt && Date.now() - startedAt >= LONG_PRESS_MS) {
      resume();
      return;
    }

    if (ignoreTapRef.current) return;

    // Ignore tap if the pointer moved too much (drag attempt)
    if (start) {
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx + dy > 10) return;

      const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - bounds.left;
      if (x < bounds.width * 0.42) prev();
      else next();
    }
  };

  const addToMyVibe = async (file: File) => {
    const url = URL.createObjectURL(file);
    const nextItems: VibeItem[] = [{ id: `me-${Date.now()}`, image: url }, ...meItems].slice(0, 16);
    setMeItems(nextItems);
    lsSet(USER_VIBES_KEY, nextItems);
    setCreateOpen(false);

    // Open viewer at "Sua Vibe"
    const meIndex = vibes.findIndex((v) => v.isUser);
    if (meIndex >= 0) openVibe(meIndex);
  };

  const hasUnseen = (v: Vibe) => {
    if (v.isUser) return false;
    if (!v.items || v.items.length === 0) return false;
    return !seen[v.id];
  };

  const onReact = (emoji: string) => {
    setBurst({ id: Date.now(), x: 0, y: 0, emoji });
    window.setTimeout(() => setBurst(null), 650);
  };

  const onSendReply = () => {
    const body = reply.trim();
    if (!body) return;
    setReply("");
    // Intencionalmente local (sem fechar viewer). Integração real de mensagens pode ser conectada depois.
  };

  return (
    <>
      {/* Bar (não alterar layout) */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-4 no-scrollbar scroll-smooth select-none active:cursor-grabbing">
        {vibes.map((v, idx) => {
          const unseen = hasUnseen(v);
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => openVibe(idx)}
              className="flex flex-col items-center gap-1 flex-shrink-0 outline-none"
              aria-label={`Abrir vibe de ${v.name}`}
            >
              <div
                className={cn(
                  "relative p-[3px] rounded-full transition-transform active:scale-95",
                  v.isUser
                    ? "bg-gradient-to-tr from-slate-600 via-slate-500 to-slate-300"
                    : unseen
                      ? "bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400"
                      : "bg-white/10"
                )}
              >
                <div className="bg-black/90 rounded-full p-[2px]">
                  <img
                    src={v.img}
                    alt={v.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-black"
                    draggable={false}
                  />
                </div>
                {v.isUser && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-violet-500 rounded-full border-2 border-black flex items-center justify-center shadow-[0_8px_20px_rgba(139,92,246,0.35)]">
                    <Plus size={12} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium text-gray-300">{v.name}</span>
            </button>
          );
        })}
      </div>

      {/* Create (Sua Vibe) */}
      <AnimatePresence>
        {createOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Criar sua vibe"
          >
            <motion.div
              className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/10 bg-[#07070A]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.75)]"
              initial={{ scale: 0.98, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.34em] text-white/55">Sua Vibe</div>
                  <div className="mt-1 text-2xl font-black tracking-tight text-white">Criar Vibe</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors grid place-items-center"
                  aria-label="Fechar criação"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>

              <p className="mt-3 text-sm text-white/70">
                Escolha uma foto para publicar uma Vibe. Você pode fechar e continuar sem perder nada.
              </p>

              <div className="mt-5">
                <label className="block">
                  <span className="sr-only">Selecionar imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-violet-500/20 file:px-4 file:py-2 file:text-violet-100 file:font-extrabold hover:file:bg-violet-500/30"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) addToMyVibe(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Dica</div>
                  <div className="mt-1 text-sm text-white/80">
                    Vibes funcionam como Stories: duram poucos segundos e navegam por toque.
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Viewer (Instagram-like) */}
      <AnimatePresence>
        {open && activeVibe && activeItem && (
          <motion.div
            className="fixed inset-0 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.button
              type="button"
              onClick={closeViewer}
              className="absolute inset-0 bg-black/85"
              aria-label="Fechar viewer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Draggable stage (swipe down to close) */}
            <motion.div
              className="absolute inset-0"
              drag="y"
              dragConstraints={{ top: 0, bottom: 260 }}
              dragElastic={0.12}
              onDragStart={() => {
                ignoreTapRef.current = true;
                pause();
              }}
              onDragEnd={(_, info) => {
                ignoreTapRef.current = false;
                resume();
                if (info.offset.y > 120 || info.velocity.y > 650) closeViewer();
              }}
            >
              <div className="relative h-full w-full max-w-lg mx-auto overflow-hidden">
                {/* Media */}
                <motion.div
                  key={`${activeVibe.id}:${activeItem.id}`}
                  className="absolute inset-0"
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0.35, scale: 1.02 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0.35, scale: 0.985 }}
                  transition={{ duration: reduceMotion ? 0 : 0.26, ease: "easeOut" }}
                >
                  <img
                    src={activeItem.image}
                    alt={`Vibe de ${activeVibe.name}`}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/75" />
                </motion.div>

                {/* Top UI */}
                <div className="absolute left-0 right-0 top-0 p-4 pt-4">
                  {/* Progress */}
                  <div className="flex gap-1.5">
                    {activeItems.map((it, i) => {
                      const isActive = i === activeItemIndex;
                      const isPast = i < activeItemIndex;
                      const width = isPast ? 100 : isActive ? Math.round(progress * 100) : 0;
                      return (
                        <div key={it.id} className="h-[3px] flex-1 rounded-full overflow-hidden bg-white/20">
                          <div className="h-full bg-white/95" style={{ width: `${width}%` }} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Header row */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-[2px] rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400">
                        <div className="rounded-full bg-black/90 p-[2px]">
                          <img
                            src={activeVibe.img}
                            alt={activeVibe.name}
                            className="h-9 w-9 rounded-full object-cover"
                            draggable={false}
                          />
                        </div>
                      </div>
                      <div className="leading-tight">
                        <div className="text-sm font-extrabold text-white">{activeVibe.name}</div>
                        <div className="text-[11px] text-white/70">{paused ? "Pausado" : "Agora"}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={closeViewer}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 transition"
                      aria-label="Fechar"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Bottom UI: quick reply + reactions */}
                <div className="absolute left-0 right-0 bottom-0 p-4 pb-5">
                  <div className="flex items-center gap-2 mb-3">
                    {(["😍", "😂", "🔥", "✨", "👏"] as const).map((emo) => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => onReact(emo)}
                        className="h-10 w-10 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 active:scale-95 transition grid place-items-center text-lg"
                        aria-label={`Reagir com ${emo}`}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Enviar mensagem…"
                      className="h-11 rounded-full bg-white/10 border-white/10 text-white placeholder:text-white/50 focus-visible:ring-violet-500/30"
                      onFocus={pause}
                      onBlur={resume}
                    />
                    <Button
                      type="button"
                      onClick={onSendReply}
                      disabled={!reply.trim()}
                      className="h-11 w-11 p-0 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-[0_14px_44px_rgba(139,92,246,0.35)] disabled:opacity-60"
                      aria-label="Enviar resposta"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-3 text-[11px] text-white/55">
                    Toque na esquerda/direita para navegar • Segure para pausar • Arraste para baixo para fechar
                  </div>
                </div>

                {/* Reaction burst */}
                <AnimatePresence>
                  {burst && (
                    <motion.div
                      key={burst.id}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1.1, y: -10 }}
                      exit={{ opacity: 0, scale: 1.25, y: -26 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                    >
                      <div className="text-5xl drop-shadow-[0_12px_30px_rgba(0,0,0,0.55)]">{burst.emoji}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation surface */}
                <div
                  className="absolute inset-0"
                  onPointerDown={onPointerDown}
                  onPointerUp={onPointerUpOrCancel}
                  onPointerCancel={onPointerUpOrCancel}
                  aria-label="Controles de navegação da vibe"
                  role="button"
                  tabIndex={0}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
