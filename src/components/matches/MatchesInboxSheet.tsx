"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Star } from "lucide-react";

type MatchRow = {
  id: string;
  user_low: string;
  user_high: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type FusionKind = "fusao" | "superfusao";

export default function MatchesInboxSheet({
  open,
  onOpenChange,
  onOpenChat,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChat: (payload: { matchId: string; otherUser: ProfileRow }) => void;
}) {
  const { session } = useAuth();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileRow>>({});
  const [kindsByMatchId, setKindsByMatchId] = useState<Record<string, FusionKind>>({});

  useEffect(() => {
    if (!open) return;
    if (!session?.user) return;

    (async () => {
      const { data: m } = await supabase
        .from("matches")
        .select("id,user_low,user_high,created_at")
        .or(`user_low.eq.${session.user.id},user_high.eq.${session.user.id}`)
        .order("created_at", { ascending: false });

      const rows = (m ?? []) as MatchRow[];
      setMatches(rows);

      const matchIds = rows.map((r) => r.id);
      const { data: kindsRaw } = matchIds.length
        ? await supabase.from("match_kinds").select("match_id,kind").in("match_id", matchIds)
        : { data: [] as any[] };

      const kindsDict: Record<string, FusionKind> = {};
      (kindsRaw ?? []).forEach((r: any) => {
        kindsDict[r.match_id] = r.kind;
      });
      setKindsByMatchId(kindsDict);

      const otherIds = rows
        .map((r) => (r.user_low === session.user!.id ? r.user_high : r.user_low))
        .filter(Boolean);

      if (otherIds.length === 0) {
        setProfilesById({});
        return;
      }

      const { data: ps } = await supabase
        .from("profiles")
        .select("id,first_name,username,avatar_url")
        .in("id", otherIds);

      const dict: Record<string, ProfileRow> = {};
      (ps ?? []).forEach((p: any) => {
        dict[p.id] = p;
      });
      setProfilesById(dict);
    })();
  }, [open, session?.user]);

  const items = useMemo(() => {
    if (!session?.user) return [] as { matchId: string; other: ProfileRow; fusionKind: FusionKind }[];
    const base = matches
      .map((m) => {
        const otherId = m.user_low === session.user!.id ? m.user_high : m.user_low;
        const other = profilesById[otherId];
        const fusionKind = kindsByMatchId[m.id] ?? "fusao";
        return other ? { matchId: m.id, other, fusionKind } : null;
      })
      .filter(Boolean) as any;

    base.sort((a: any, b: any) => {
      const sa = a.fusionKind === "superfusao" ? 1 : 0;
      const sb = b.fusionKind === "superfusao" ? 1 : 0;
      return sb - sa;
    });
    return base;

  }, [matches, profilesById, kindsByMatchId, session?.user]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[92vw] sm:w-[420px] p-0 border-white/10 bg-[#07070A] text-white">
        <div className="px-5 pt-5 pb-4 border-b border-white/10 bg-black/20">
          <SheetHeader>
            <SheetTitle className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <MessageCircle size={18} className="text-cyan-300" />
              Conversas
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="p-4">
          {items.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center">
              <div className="text-sm text-gray-300 font-semibold">Nenhuma fusão ainda</div>

              <div className="text-xs text-gray-500 mt-1">Curta pessoas no Descubra para começar.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((it) => {
                const name = it.other.first_name || it.other.username || "Sem nome";
                const initials = name.trim().slice(0, 2).toUpperCase();
                const superSeal = it.fusionKind === "superfusao";
                return (
                  <button
                    key={it.matchId}
                    onClick={() => onOpenChat({ matchId: it.matchId, otherUser: it.other })}
                    className={
                      superSeal
                        ? "w-full flex items-center gap-3 rounded-2xl border border-blue-300/20 bg-blue-500/10 hover:bg-blue-500/15 px-3.5 py-3 transition-colors shadow-[0_18px_60px_rgba(99,102,241,0.12)]"
                        : "w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-3 transition-colors"
                    }
                  >
                    <Avatar className={superSeal ? "h-11 w-11 ring-2 ring-blue-400/25" : "h-11 w-11 ring-2 ring-violet-500/25"}>
                      <AvatarImage src={it.other.avatar_url ?? undefined} alt={name} />
                      <AvatarFallback className="bg-white/5 text-white">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-extrabold text-white flex items-center gap-2">
                        {name}
                        {superSeal && (
                          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-400 to-violet-600 px-2 py-0.5 text-[10px] font-black text-black border border-white/10">
                            ✦
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500">Toque para abrir</div>
                    </div>
                    <div className={superSeal ? "text-blue-200" : "text-cyan-300"}>
                      {superSeal ? <Star size={18} /> : <MessageCircle size={18} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}