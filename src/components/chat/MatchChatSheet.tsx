"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

type ProfileRow = {
  id: string;
  first_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type MessageRow = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function MatchChatSheet({
  open,
  onOpenChange,
  matchId,
  otherUser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string | null;
  otherUser: ProfileRow | null;
}) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const title = otherUser?.first_name || otherUser?.username || "Conversa";
  const initials = title.trim().slice(0, 2).toUpperCase();

  const canSend = Boolean(session?.user && matchId && text.trim().length > 0);

  const scrollToEnd = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!open) return;
    if (!matchId) return;

    (async () => {
      const { data } = await supabase
        .from("match_messages")
        .select("id,match_id,sender_id,body,created_at")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      setMessages((data ?? []) as MessageRow[]);
      queueMicrotask(scrollToEnd);
    })();
  }, [open, matchId]);

  useEffect(() => {
    if (!open) return;
    if (!matchId) return;

    const channel = supabase
      .channel(`match_messages:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "match_messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as MessageRow]);
          queueMicrotask(scrollToEnd);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, matchId]);

  const send = async () => {
    if (!session?.user || !matchId) return;
    const body = text.trim();
    if (!body) return;

    setText("");
    await supabase.from("match_messages").insert({
      match_id: matchId,
      sender_id: session.user.id,
      body,
    });
  };

  const grouped = useMemo(() => messages, [messages]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 border-white/10 bg-[#07070A] text-white rounded-t-[2.5rem] overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-white/10 bg-black/20">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-violet-500/30">
                <AvatarImage src={otherUser?.avatar_url ?? undefined} alt={title} />
                <AvatarFallback className="bg-white/5 text-white">{initials || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-base font-black tracking-tight text-white">{title}</SheetTitle>
                <div className="text-[10px] text-gray-400">Fusão</div>

              </div>
              <div className="h-1.5 w-12 rounded-full bg-white/10" />
            </div>
          </SheetHeader>
        </div>

        <div className="px-5 py-5 max-h-[55vh] overflow-auto">
          <div className="space-y-3">
            {grouped.map((m) => {
              const mine = m.sender_id === session?.user?.id;
              return (
                <div
                  key={m.id}
                  className={
                    "max-w-[85%] rounded-2xl border px-4 py-3 text-sm " +
                    (mine
                      ? "ml-auto rounded-tr-md bg-violet-600/90 border-white/10 text-white"
                      : "rounded-tl-md bg-white/5 border-white/10 text-gray-200")
                  }
                >
                  {m.body}
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva uma mensagem..."
              className="h-11 rounded-full bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-violet-500/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
              disabled={!matchId}
            />
            <Button
              type="button"
              onClick={send}
              disabled={!canSend}
              className="h-11 w-11 p-0 rounded-full bg-cyan-500 hover:bg-cyan-500/90 text-black disabled:opacity-60"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
