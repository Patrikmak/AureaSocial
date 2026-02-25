"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Vibe = {
  id: number;
  name: string;
  img: string;
  isUser?: boolean;
  // A vibe is a small list of media items (like Instagram stories)
  items?: { id: string; image: string; durationMs?: number }[];
};

const vibes: Vibe[] = [
  {
    id: 1,
    name: "Sua Vibe",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    isUser: true,
    items: [
      {
        id: "me-1",
        image:
          "https://images.unsplash.com/photo-1520975958225-0e8ec2f2b25b?w=1200",
      },
      {
        id: "me-2",
        image:
          "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200",
      },
    ],
  },
  {
    id: 2,
    name: "Alex",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
    items: [
      {
        id: "alex-1",
        image:
          "https://images.unsplash.com/photo-1520975958225-0e8ec2f2b25b?w=1200",
      },
      {
        id: "alex-2",
        image:
          "https://images.unsplash.com/photo-1520975915438-ebb2a6ef0f8f?w=1200",
      },
      {
        id: "alex-3",
        image:
          "https://images.unsplash.com/photo-1520975945736-65da2d6b0fdf?w=1200",
      },
    ],
  },
  {
    id: 3,
    name: "Luna",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    items: [
      {
        id: "luna-1",
        image:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200",
      },
      {
        id: "luna-2",
        image:
          "https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?w=1200",
      },
    ],
  },
  {
    id: 4,
    name: "Marc",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    items: [
      {
        id: "marc-1",
        image:
          "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1200",
      },
      {
        id: "marc-2",
        image:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
      },
    ],
  },
  {
    id: 5,
    name: "Bia",
    img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop",
    items: [
      {
        id: "bia-1",
        image:
          "https://images.unsplash.com/photo-1520975915438-ebb2a6ef0f8f?w=1200",
      },
      {
        id: "bia-2",
        image:
          "https://images.unsplash.com/photo-1520975945736-65da2d6b0fdf?w=1200",
      },
    ],
  },
  {
    id: 6,
    name: "Leo",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    items: [
      {
        id: "leo-1",
        image:
          "https://images.unsplash.com/photo-1520975958225-0e8ec2f2b25b?w=1200",
      },
    ],
  },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const DEFAULT_DURATION_MS = 4200;

export default function VibesBar() {
  const [open, setOpen] = useState(false);
  const [activeVibeIndex, setActiveVibeIndex] = useState(0);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const pressStartRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const reduceMotion = useReducedMotion();

  const activeVibe = vibes[activeVibeIndex];
  const activeItems = activeVibe?.items ?? [];
  const activeItem = activeItems[activeItemIndex];

  const durationMs = useMemo(() => {
    const d = activeItem?.durationMs ?? DEFAULT_DURATION_MS;
    return clamp(d, 1800, 9000);
  }, [activeItem]);

  const close = useCallback(() => {
    setOpen(false);
    setPaused(false);
    setActiveItemIndex(0);
  }, []);

  const openVibe = useCallback((index: number) => {
    setActiveVibeIndex(index);
    setActiveItemIndex(0);
    setPaused(false);
    setOpen(true);
  }, []);

  const next = useCallback(() => {
    if (!activeVibe) return;
    const nextItem = activeItemIndex + 1;
    if (nextItem < activeItems.length) {
      setActiveItemIndex(nextItem);
      return;
    }

    const nextVibe = activeVibeIndex + 1;
    if (nextVibe < vibes.length) {
      setActiveVibeIndex(nextVibe);
      setActiveItemIndex(0);
      return;
    }

    close();
  }, [activeItemIndex, activeItems.length, activeVibe, activeVibeIndex, close]);

  const prev = useCallback(() => {
    const prevItem = activeItemIndex - 1;
    if (prevItem >= 0) {
      setActiveItemIndex(prevItem);
      return;
    }

    const prevVibe = activeVibeIndex - 1;
    if (prevVibe >= 0) {
      const prevItems = vibes[prevVibe].items ?? [];
      setActiveVibeIndex(prevVibe);
      setActiveItemIndex(Math.max(0, prevItems.length - 1));
      return;
    }

    // Already at the start: keep at 0
    setActiveVibeIndex(0);
    setActiveItemIndex(0);
  }, [activeItemIndex, activeVibeIndex]);

  // Auto-advance
  useEffect(() => {
    if (!open) return;
    if (paused) return;
    if (reduceMotion) return;
    if (!activeItem) return;

    const t = window.setTimeout(() => {
      next();
    }, durationMs);

    return () => window.clearTimeout(t);
  }, [open, paused, reduceMotion, durationMs, next, activeItem]);

  // Keyboard
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, next, prev]);

  const onPointerDown = () => {
    pressStartRef.current = Date.now();
    longPressTimerRef.current = window.setTimeout(() => {
      setPaused(true);
    }, 200);
  };

  const onPointerUpOrCancel = () => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;

    const startedAt = pressStartRef.current;
    pressStartRef.current = null;

    // If it became paused by long press, resume on release (Instagram-like)
    if (startedAt && Date.now() - startedAt >= 200) {
      setPaused(false);
    }
  };

  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // ignore taps if the user performed a press/hold (handled by pointer up)
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    if (x < bounds.width * 0.42) prev();
    else next();
  };

  return (
    <>
      {/* Bar */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-4 no-scrollbar scroll-smooth select-none active:cursor-grabbing">
        {vibes.map((v, idx) => (
          <button
            key={v.id}
            type="button"
            onClick={() => openVibe(idx)}
            className="flex flex-col items-center gap-1 flex-shrink-0 outline-none"
            aria-label={`Abrir vibe de ${v.name}`}
          >
            <div
              className={cn(
                "relative p-[3px] rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400 transition-transform active:scale-95",
                v.isUser && "from-slate-600 via-slate-500 to-slate-300"
              )}
            >
              <div className="bg-black/90 rounded-full p-[2px]">
                <img
                  src={v.img}
                  alt={v.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-black"
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
        ))}
      </div>

      {/* Viewer */}
      <AnimatePresence>
        {open && activeVibe && activeItem && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Safe area */}
            <div className="absolute inset-0" />

            <div className="relative h-full w-full max-w-lg mx-auto">
              {/* Media */}
              <motion.div
                key={activeItem.id}
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
                {/* Contrast overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/55" />
              </motion.div>

              {/* Top UI */}
              <div className="absolute left-0 right-0 top-0 p-4 pt-4">
                {/* Progress */}
                <div className="flex gap-1.5">
                  {activeItems.map((it, i) => {
                    const isActive = i === activeItemIndex;
                    const isPast = i < activeItemIndex;
                    return (
                      <div
                        key={it.id}
                        className={cn(
                          "h-[3px] flex-1 rounded-full overflow-hidden bg-white/20"
                        )}
                      >
                        <motion.div
                          className="h-full bg-white/95"
                          initial={{ width: isPast ? "100%" : "0%" }}
                          animate={{
                            width: isPast ? "100%" : isActive ? "100%" : "0%",
                          }}
                          transition={
                            isActive
                              ? {
                                  duration: paused || reduceMotion ? 0 : durationMs / 1000,
                                  ease: "linear",
                                }
                              : { duration: 0 }
                          }
                        />
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
                      <div className="text-sm font-semibold text-white">
                        {activeVibe.name}
                      </div>
                      <div className="text-[11px] text-white/70">
                        {paused ? "Pausado" : "Agora"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={close}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 transition"
                    aria-label="Fechar"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Tap areas */}
              <div
                className="absolute inset-0"
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUpOrCancel}
                onPointerCancel={onPointerUpOrCancel}
                onClick={onTap}
                role="button"
                tabIndex={0}
                aria-label="Controles de navegação da vibe"
              >
                <div className="absolute left-0 top-0 h-full w-1/2" />
                <div className="absolute right-0 top-0 h-full w-1/2" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
