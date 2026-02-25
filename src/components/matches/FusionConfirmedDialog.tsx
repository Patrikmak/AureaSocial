"use client";

import React, { useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, X } from "lucide-react";
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
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 220,
        y: (Math.random() - 0.5) * 220,
        s: 0.7 + Math.random() * 0.9,
        d: 0.35 + Math.random() * 0.25,
      })),
    [open]
  );

  const otherName = other?.first_name || other?.username || "essa pessoa";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-[#07070A] text-white rounded-[2.25rem] p-0 overflow-hidden">
        <div className="relative px-7 pt-7 pb-7">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-gray-200" />
          </button>

          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-600/20 border border-violet-500/25 flex items-center justify-center">
              <Sparkles className="text-violet-200" size={22} />
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.34em] text-gray-400">Fusão confirmada</div>
              <div className="text-3xl font-black tracking-tight mt-1">Vocês se fundiram ✨</div>
            </div>
          </div>

          {/* Fusion animation */}
          <div className="mt-7 flex items-center justify-center">
            <div className="relative h-32 w-[260px]">
              <AnimatePresence>
                {open && (
                  <>
                    {particles.map((p) => (
                      <motion.span
                        key={p.id}
                        className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-cyan-300/80"
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0.8 }}
                        animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: [0.8, p.s, 0.6] }}
                        transition={{ duration: p.d, ease: "easeOut" }}
                      />
                    ))}
                    <motion.div
                      className="absolute left-1/2 top-1/2 h-[2px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                      initial={{ opacity: 0, scaleX: 0.2 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(34,211,238,0.0), rgba(139,92,246,0.9), rgba(217,70,239,0.9), rgba(34,211,238,0.0))",
                      }}
                    />
                  </>
                )}
              </AnimatePresence>

              <motion.div
                className="absolute left-10 top-6"
                initial={{ x: 0 }}
                animate={open ? { x: 26 } : { x: 0 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                <div className="p-[3px] rounded-full bg-gradient-to-tr from-cyan-400 via-violet-500 to-fuchsia-500">
                  <div className="rounded-full bg-black p-[2px]">
                    <img
                      src={you?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
                      className="w-24 h-24 rounded-full object-cover border-2 border-black"
                      alt=""
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute right-10 top-6"
                initial={{ x: 0 }}
                animate={open ? { x: -26 } : { x: 0 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                <div className="p-[3px] rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400">
                  <div className="rounded-full bg-black p-[2px]">
                    <img
                      src={other?.avatar_url || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200"}
                      className="w-24 h-24 rounded-full object-cover border-2 border-black"
                      alt=""
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-300">
            Você e <span className="text-white font-bold">{otherName}</span> agora têm uma vibração conectada.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <Button
              onClick={onStartChat}
              className={cn(
                "h-12 rounded-full font-black",
                "bg-gradient-to-r from-violet-600 to-cyan-400",
                "text-black hover:opacity-95"
              )}
            >
              <MessageCircle className="mr-2" size={18} />
              Iniciar Conversa
            </Button>
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="h-12 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10"
            >
              Continuar no Descubra
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
