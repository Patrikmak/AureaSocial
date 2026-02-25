"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export default function useUnreadMessagesCount() {
  const { session } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!session?.user) {
      setCount(0);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      const { data, error } = await supabase.rpc("get_unread_message_count");
      if (error) return;
      if (cancelled) return;
      setCount((data as number) ?? 0);
    };

    refresh();

    const channel = supabase
      .channel(`unread_count:${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "match_messages" },
        () => {
          refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "match_read_states", filter: `user_id=eq.${session.user.id}` },
        () => {
          refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "match_read_states", filter: `user_id=eq.${session.user.id}` },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session?.user]);

  return count;
}
