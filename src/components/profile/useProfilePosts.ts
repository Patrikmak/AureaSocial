"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProfilePost } from "@/components/profile/ProfilePostModal";

export function useProfilePosts({
  profileId,
  profile,
}: {
  profileId: string | null;
  profile: { first_name?: string | null; username?: string | null; avatar_url?: string | null } | null;
}) {
  const [posts, setPosts] = useState<ProfilePost[]>([]);

  const fetchPosts = useCallback(async () => {
    if (!profileId) return;

    const { data: rows } = await supabase
      .from("posts")
      .select("id,user_id,media_url,caption,created_at")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false });

    const user = {
      name: profile?.first_name || profile?.username || "Perfil",
      username: profile?.username || "",
      avatar_url: profile?.avatar_url ?? null,
    };

    setPosts((rows ?? []).map((p: any) => ({ ...p, user })));
  }, [profileId, profile?.avatar_url, profile?.first_name, profile?.username]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    setPosts,
    refetch: fetchPosts,
  };
}
