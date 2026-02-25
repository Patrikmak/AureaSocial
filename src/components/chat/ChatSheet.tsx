"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

type ChatUser = {
  username: string;
  name: string;
  avatar: string;
};

export default function ChatSheet({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ChatUser | null;
}) {
  const initials = (user?.name ?? "").trim().slice(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 border-white/10 bg-[#07070A] text-white rounded-t-[2.5rem] overflow-hidden"
      >
        <div className="px-5 pt-4 pb-3 border-b border-white/10 bg-black/20">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-violet-500/30">
                <AvatarImage src={user?.avatar} alt={user?.name ?? ""} />
                <AvatarFallback className="bg-white/5 text-white">{initials || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-base font-black tracking-tight text-white">
                  {user?.name ?? "Conversa"}
                </SheetTitle>
                <div className="text-[10px] text-gray-400">@{user?.username ?? ""}</div>
              </div>
              <div className="h-1.5 w-12 rounded-full bg-white/10" />
            </div>
          </SheetHeader>
        </div>

        <div className="px-5 py-5">
          <div className="space-y-3">
            <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white/5 border border-white/10 px-4 py-3 text-sm text-gray-200">
              Oi! Vi que rolou uma fusão 😊
            </div>

            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-violet-600/90 border border-white/10 px-4 py-3 text-sm text-white">
              Oi! Bora conversar.
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Escreva uma mensagem..."
              className="h-11 rounded-full bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-violet-500/30"
            />
            <Button
              type="button"
              className="h-11 w-11 p-0 rounded-full bg-cyan-500 hover:bg-cyan-500/90 text-black"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
