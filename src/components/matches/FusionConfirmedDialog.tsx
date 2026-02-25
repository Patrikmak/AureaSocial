"use client";

import React, { useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function FusionConfirmedDialog({
  open,
  onOpenChange,
  you,
  other,
  onStartChat,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  you: { avatar_url?: string | null; first_name?: string | null; username?: string | null } | null;
  other: { avatar_url?: string | null; first_name?: string | null; username?: string | null } | null;
  onStartChat: () => void;
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 260,
        y: (Math.random() - 0.5) * 240,
        s: 0.75 + Math.random() * 0.85,
        d: 0.55 + Math.random() * 0.35,
      })),
    [open]
  );

  const youName = you?.first_name || you?.username || "Você";
  const otherName = other?.first_name || other?.username || "essa pessoa";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-none w-[100vw] h-[100vh] p-0 border-0 bg-transparent text-white",
          "shadow-none overflow-hidden"
        )}
      >
        <div className="relative h-full w-full">
          {/* Soft fade backdrop (keeps identity premium, not harsh) */}
          <motion.div
            className="absolute inset-0 bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          />

          {/* Vignette + subtle aurora glow */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              background:
                "radial-gradient(700px 420px at 50% 42%, rgba(139,92,246,0.18), rgba(0,0,0,0) 62%), radial-gradient(540px 320px at 48% 54%, rgba(217,70,239,0.12), rgba(0,0,0,0) 64%)",
            }}
          />

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-5 top-5 h-11 w-11 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center z-20"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-gray-200" />
          </button>

          <div className="relative z-10 h-full w-full flex items-center justify-center px-6">
            <div className="w-full max-w-lg">
              {/* Title */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] tracking-[0.34em] uppercase text-gray-300">
                  <Sparkles size={12} className="text-violet-200" />
                  Fusão confirmada
                </div>

                <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight">
                  Vocês se fundiram <span className="text-white/80">✨</span>
                </h2>
                <p className="mt-2 text-sm text-gray-300">Uma nova fusão foi criada.</p>
              </div>

              {/* Animation stage */}
              <div className="mt-8 relative">
                <div className="relative h-[220px]">
                  {/* Particles */}
                  <AnimatePresence>
                    {open &&
                      particles.map((p) => (
                        <motion.span
                          key={p.id}
                          className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-violet-300/60"
                          initial={{ x: 0, y: 0, opacity: 0, scale: 0.8 }}
                          animate={{ x: p.x, y: p.y, opacity: [0, 0.9, 0], scale: [0.7, p.s, 0.6] }}
                          transition={{ duration: p.d, ease: "easeOut" }}
                        />
                      ))}
                  </AnimatePresence>

                  {/* Connection glow */}
                  <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-64 rounded-full blur-3xl"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={open ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    style={{ background: "rgba(139,92,246,0.22)" }}
                  />

                  {/* Energy line */}
                  <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[2px] w-[280px] rounded-full"
                    initial={{ opacity: 0, scaleX: 0.18 }}
                    animate={open ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.18 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(139,92,246,0), rgba(139,92,246,0.95), rgba(217,70,239,0.85), rgba(139,92,246,0))",
                    }}
                  />

                  {/* Profile cards */}
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2"
                    initial={{ x: 0, rotate: -2, opacity: 0, scale: 0.96 }}
                    animate={open ? { x: 54, rotate: 0, opacity: 1, scale: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.32, ease: "easeOut" }}
                  >
                    <div className="w-[170px] h-[220px] rounded-[2.25rem] overflow-hidden border border-white/10 bg-white/5 shadow-[0_24px_70px_rgba(0,0,0,0.6)]">
                      <img
                        src={you?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600"}
                        alt=""
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.0) 50%, rgba(0,0,0,0.88) 100%)" }} />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="text-sm font-extrabold tracking-tight truncate">{youName}</div>
                        <div className="text-[10px] text-white/55">Aurēa</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="absolute right-0 top-1/2 -translate-y-1/2"
                    initial={{ x: 0, rotate: 2, opacity: 0, scale: 0.96 }}
                    animate={open ? { x: -54, rotate: 0, opacity: 1, scale: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.32, ease: "easeOut" }}
                  >
                    <div className="w-[170px] h-[220px] rounded-[2.25rem] overflow-hidden border border-white/10 bg-white/5 shadow-[0_24px_70px_rgba(0,0,0,0.6)]">
                      <img
                        src={other?.avatar_url || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600"}
                        alt=""
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.0) 50%, rgba(0,0,0,0.88) 100%)" }} />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="text-sm font-extrabold tracking-tight truncate">{otherName}</div>
                        <div className="text-[10px] text-white/55">Fusão</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-7 grid grid-cols-1 gap-3">
                <Button
                  onClick={onStartChat}
                  className={cn(
                    "h-12 rounded-full font-black",
                    "bg-violet-600 hover:bg-violet-500 text-white",
                    "shadow-[0_18px_55px_rgba(139,92,246,0.35)]"
                  )}
                >
                  Iniciar Conversa
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  className="h-12 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10"
                >
                  Agora não
                </Button>
              </div>

              <div className="mt-5 text-center text-xs text-white/50">
                Você e <span className="text-white font-semibold">{otherName}</span> estão conectados.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}