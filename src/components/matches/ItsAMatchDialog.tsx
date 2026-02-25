"use client";

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageCircle } from "lucide-react";

export default function ItsAMatchDialog({
  open,
  onOpenChange,
  you,
  other,
  onMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  you: { avatar_url?: string | null; first_name?: string | null; username?: string | null } | null;
  other: { avatar_url?: string | null; first_name?: string | null; username?: string | null } | null;
  onMessage: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-[#07070A] text-white rounded-[2.5rem] p-0 overflow-hidden">
        <div className="px-7 pt-8 pb-7">
          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-600/20 border border-violet-500/25 flex items-center justify-center">
              <Sparkles className="text-violet-200" size={22} />
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Deu match</div>
              <div className="text-3xl font-black tracking-tight mt-1">É um match!</div>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-center">
            <div className="relative h-28">
              <img
                src={you?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
                className="w-24 h-24 rounded-full object-cover border-4 border-black ring-2 ring-cyan-500/25"
                alt=""
              />
              <img
                src={other?.avatar_url || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200"}
                className="w-24 h-24 rounded-full object-cover border-4 border-black ring-2 ring-violet-500/25 absolute -right-10 top-4"
                alt=""
              />
            </div>
          </div>

          <p className="mt-7 text-center text-sm text-gray-300">
            Você e <span className="text-white font-bold">{other?.first_name || other?.username || "essa pessoa"}</span> curtiram um ao outro.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-3">
            <Button
              onClick={onMessage}
              className="h-12 rounded-full bg-cyan-500 hover:bg-cyan-500/90 text-black font-black"
            >
              <MessageCircle className="mr-2" size={18} />
              Enviar mensagem
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
