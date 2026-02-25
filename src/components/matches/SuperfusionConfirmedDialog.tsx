"use client";

import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SuperfusionConfirmedDialog({
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
      Array.from({ length: 34 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 360,
        y: (Math.random() - 0.5) * 360,
        s: 0.7 + Math.random() * 1.35,
        d: 0.55 + Math.random() * 0.35,
        c: i % 3 === 0 ? "bg-blue-300/90" : i % 3 === 1 ? "bg-violet-400/90" : "bg-indigo-300/90",
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

          {/* Header */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/12 border border-blue-300/20 flex items-center justify-center shadow-[0_18px_55px_rgba(96,165,250,0.25)]">
              <Star className="text-blue-200" size={22} fill="currentColor" strokeWidth={0} />
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.34em] text-white/60">Superfusão Confirmada</div>
              <div className="text-3xl font-black tracking-tight mt-1">💫 Superfusão Ativada</div>
            </div>
          </div>

          {/* Core scene */}
          <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
            </div>

            <AnimatePresence>
              {open && (
                <>
                  {particles.map((p) => (
                    <motion.span
                      key={p.id}
                      className={cn("absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full", p.c)}
                      initial={{ x: 0, y: 0, opacity: 0, scale: 0.65 }}
                      animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: [0.65, p.s, 0.55] }}
                      transition={{ duration: p.d, ease: "easeOut" }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>

            <div className="relative flex items-center justify-center gap-4">
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-blue-400/20 blur-xl" />
                <div className="p-[3px] rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-violet-500 shadow-[0_18px_60px_rgba(99,102,241,0.22)]">
                  <div className="rounded-full bg-black p-[2px]">
                    <img
                      src={you?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
                      className="w-16 h-16 rounded-full object-cover border-2 border-black"
                      alt=""
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-[0_22px_70px_rgba(59,130,246,0.25)]">
                  <span className="text-black text-lg font-black">✦</span>
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-[0.28em] text-white/70">Vínculo</div>
              </div>

              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-violet-400/20 blur-xl" />
                <div className="p-[3px] rounded-full bg-gradient-to-tr from-violet-500 via-indigo-500 to-blue-500 shadow-[0_18px_60px_rgba(167,139,250,0.18)]">
                  <div className="rounded-full bg-black p-[2px]">
                    <img
                      src={other?.avatar_url || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200"}
                      className="w-16 h-16 rounded-full object-cover border-2 border-black"
                      alt=""
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="relative mt-4 text-center text-sm text-gray-100">
              Você e <span className="text-white font-black">{otherName}</span> tocaram o raro.
              <span className="text-white/70"> O chat foi liberado.</span>
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <Button
              onClick={onStartChat}
              className={cn(
                "h-12 rounded-full font-black text-black",
                "bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-600",
                "hover:opacity-95"
              )}
            >
              <MessageCircle className="mr-2" size={18} />
              Ir para o chat
              <span className="ml-2 inline-flex items-center rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-extrabold text-white">
                SELO
              </span>
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
