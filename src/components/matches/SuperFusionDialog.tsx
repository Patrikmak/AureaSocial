"use client";

import React, { useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, Star, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SuperFusionDialog({
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
      Array.from({ length: 22 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 320,
        y: (Math.random() - 0.5) * 320,
        s: 0.6 + Math.random() * 1.1,
        d: 0.45 + Math.random() * 0.25,
        c: i % 2 === 0 ? "bg-violet-400/90" : "bg-cyan-300/90",
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
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/20 flex items-center justify-center">
              <Star className="text-cyan-200" size={22} fill="currentColor" strokeWidth={0} />
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.34em] text-gray-400">Superfusão</div>
              <div className="text-3xl font-black tracking-tight mt-1">Superfusão Ativada 💫</div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 relative overflow-hidden">
            <AnimatePresence>
              {open && (
                <>
                  {particles.map((p) => (
                    <motion.span
                      key={p.id}
                      className={cn("absolute left-1/2 top-1/2 h-2 w-2 rounded-full", p.c)}
                      initial={{ x: 0, y: 0, opacity: 0, scale: 0.8 }}
                      animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: [0.8, p.s, 0.6] }}
                      transition={{ duration: p.d, ease: "easeOut" }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-center gap-4">
              <div className="p-[3px] rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400">
                <div className="rounded-full bg-black p-[2px]">
                  <img
                    src={you?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
                    className="w-16 h-16 rounded-full object-cover border-2 border-black"
                    alt=""
                  />
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-400 flex items-center justify-center shadow-[0_16px_50px_rgba(34,211,238,0.18)]">
                  <Sparkles className="text-black" size={18} />
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-[0.28em] text-white/65">Energia</div>
              </div>

              <div className="p-[3px] rounded-full bg-gradient-to-tr from-cyan-400 via-violet-500 to-fuchsia-500">
                <div className="rounded-full bg-black p-[2px]">
                  <img
                    src={other?.avatar_url || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200"}
                    className="w-16 h-16 rounded-full object-cover border-2 border-black"
                    alt=""
                  />
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-gray-200">
              Você e <span className="text-white font-bold">{otherName}</span> ativaram um vínculo raro.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <Button
              onClick={onStartChat}
              className={cn(
                "h-12 rounded-full font-black text-black",
                "bg-gradient-to-r from-cyan-400 to-violet-600",
                "hover:opacity-95"
              )}
            >
              <MessageCircle className="mr-2" size={18} />
              Ir para o chat
              <span className="ml-2 inline-flex items-center rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-extrabold text-white">
                VIP
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
