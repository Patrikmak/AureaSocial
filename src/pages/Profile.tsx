"use client";

import React, { useEffect, useMemo, useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { Settings as SettingsIcon, Grid, Bookmark, MapPin, Music, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import ProfilePostModal, { ProfilePost } from '@/components/profile/ProfilePostModal';
import { cn } from '@/lib/utils';

function formatCompactCount(n: number) {
  if (n >= 1_000_000) {
    const v = (n / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${v}M`;
  }
  if (n >= 1_000) {
    const v = (n / 1_000).toFixed(1).replace(/\.0$/, '');
    return `${v}k`;
  }
  return `${n}`;
}

type Tab = 'posts' | 'saved';

const Profile = () => {
  const { session } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  const [tab, setTab] = useState<Tab>('posts');

  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [savedPosts, setSavedPosts] = useState<ProfilePost[]>([]);

  const [farmsTotal, setFarmsTotal] = useState(0);
  const [fusionsCount, setFusionsCount] = useState(0);

  const [openPost, setOpenPost] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [gridScrollY, setGridScrollY] = useState<number | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
      fetchPosts();
      fetchFusionsCount();
      fetchSavedPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Real-time: fusões e salvos
  useEffect(() => {
    if (!session?.user) return;

    const userId = session.user.id;

    const matchesLow = supabase
      .channel(`profile_matches_low:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `user_low=eq.${userId}` },
        () => {
          fetchFusionsCount();
        }
      )
      .subscribe();

    const matchesHigh = supabase
      .channel(`profile_matches_high:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `user_high=eq.${userId}` },
        () => {
          fetchFusionsCount();
        }
      )
      .subscribe();

    const saves = supabase
      .channel(`profile_post_saves:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_saves', filter: `user_id=eq.${userId}` },
        () => {
          fetchSavedPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchesLow);
      supabase.removeChannel(matchesHigh);
      supabase.removeChannel(saves);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session?.user.id)
      .single();

    if (data) setProfile(data);
  };

  const fetchFarmsTotal = async (postIds: string[]) => {
    if (!postIds.length) {
      setFarmsTotal(0);
      return;
    }

    const { count } = await supabase
      .from('post_likes')
      .select('id', { count: 'exact', head: true })
      .in('post_id', postIds);

    setFarmsTotal(count ?? 0);
  };

  const fetchFusionsCount = async () => {
    if (!session?.user) return;
    const userId = session.user.id;

    const { count } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .or(`user_low.eq.${userId},user_high.eq.${userId}`);

    setFusionsCount(count ?? 0);
  };

  const fetchPosts = async () => {
    if (!session?.user) return;

    const { data: rows } = await supabase
      .from('posts')
      .select('id,user_id,media_url,caption,location,created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    const user = {
      name: profile?.first_name || profile?.username || 'Você',
      username: profile?.username || 'seu_perfil',
      avatar_url: profile?.avatar_url ?? null,
    };

    const mapped: ProfilePost[] = (rows ?? []).map((p: any) => ({
      ...p,
      user,
    }));

    setPosts(mapped);
    await fetchFarmsTotal((rows ?? []).map((p: any) => String(p.id)));
  };

  const fetchSavedPosts = async () => {
    if (!session?.user) return;

    const { data: saves } = await supabase
      .from('post_saves')
      .select('post_id,created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    const postIds = (saves ?? []).map((s: any) => s.post_id as string).filter(Boolean);
    if (!postIds.length) {
      setSavedPosts([]);
      return;
    }

    const { data: rows } = await supabase
      .from('posts')
      .select('id,user_id,media_url,caption,location,created_at')
      .in('id', postIds);

    const owners = Array.from(new Set((rows ?? []).map((r: any) => r.user_id)));
    const { data: ownerProfiles } = owners.length
      ? await supabase.from('profiles').select('id,first_name,username,avatar_url').in('id', owners)
      : { data: [] as any[] };

    const byId = new Map((ownerProfiles ?? []).map((p: any) => [p.id, p] as const));

    const byPostId = new Map((rows ?? []).map((p: any) => [String(p.id), p] as const));
    const ordered = postIds
      .map((id) => {
        const p = byPostId.get(String(id));
        if (!p) return null;
        const owner = byId.get(p.user_id);
        return {
          ...p,
          user: {
            name: owner?.first_name || owner?.username || 'Perfil',
            username: owner?.username || '',
            avatar_url: owner?.avatar_url ?? null,
          },
        } as ProfilePost;
      })
      .filter(Boolean) as ProfilePost[];

    setSavedPosts(ordered);
  };

  useEffect(() => {
    // Refresh posts once we have profile data for the modal header
    if (!session?.user) return;
    if (!profile) return;
    (async () => {
      const { data: rows } = await supabase
        .from('posts')
        .select('id,user_id,media_url,caption,location,created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      const user = {
        name: profile?.first_name || profile?.username || 'Você',
        username: profile?.username || 'seu_perfil',
        avatar_url: profile?.avatar_url ?? null,
      };

      setPosts((rows ?? []).map((p: any) => ({ ...p, user })));
      await fetchFarmsTotal((rows ?? []).map((p: any) => String(p.id)));
    })();
  }, [profile, session?.user]);

  const stats = useMemo(
    () => [
      { label: 'Posts', value: String(posts.length || 0) },
      { label: 'Farms', value: formatCompactCount(farmsTotal) },
      { label: 'Fusões', value: String(fusionsCount) },
    ],
    [posts.length, farmsTotal, fusionsCount]
  );

  const activePosts = tab === 'posts' ? posts : savedPosts;

  const openAt = (i: number) => {
    setGridScrollY(window.scrollY);
    setActiveIndex(i);
    setOpenPost(true);
  };

  const closeModal = (next: boolean) => {
    setOpenPost(next);
    if (!next && gridScrollY !== null) {
      window.setTimeout(() => window.scrollTo({ top: gridScrollY, behavior: 'auto' }), 0);
      setGridScrollY(null);
    }
  };

  const onPostDeleted = (postId: string) => {
    setPosts((p) => {
      const next = p.filter((x) => x.id !== postId);
      fetchFarmsTotal(next.map((x) => x.id));
      return next;
    });
  };

  const onCaptionUpdated = (postId: string, caption: string | null) => {
    setPosts((p) => p.map((x) => (x.id === postId ? { ...x, caption } : x)));
    setSavedPosts((p) => p.map((x) => (x.id === postId ? { ...x, caption } : x)));
  };

  const modalIsOwner = Boolean(activePosts[activeIndex]?.user_id && session?.user?.id && activePosts[activeIndex]?.user_id === session.user.id);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      <header className="px-6 py-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">@{profile?.username || 'seu_perfil'}</h1>
        <Link to="/settings" className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <SettingsIcon size={24} className="text-gray-400" />
        </Link>
      </header>

      <main>
        {/* Profile Info */}
        <div className="px-6 flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <div className="p-1 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-400">
              <img
                src={profile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"}
                className="w-24 h-24 rounded-full object-cover border-4 border-black"
                alt="Profile"
              />
            </div>
            <Link
              to="/edit-profile"
              className="absolute bottom-0 right-0 w-6 h-6 bg-violet-500 rounded-full border-4 border-black flex items-center justify-center"
            >
              <span className="text-[10px] font-bold">+</span>
            </Link>
          </div>

          <h2 className="text-2xl font-black mb-1">{profile?.first_name || 'Alex Rivera'}</h2>

          {profile?.gender && (
            <span className="text-[10px] uppercase tracking-widest text-violet-400 font-bold mb-2">{profile.gender}</span>
          )}

          {profile?.location && (
            <div className="flex items-center gap-1 text-gray-400 text-xs mb-4">
              <MapPin size={12} />
              <span>{profile.location}</span>
            </div>
          )}

          <p className="text-sm text-gray-300 max-w-xs mb-4">
            {profile?.bio || 'Criando conexões reais através da arte e tecnologia. 🚀✨'}
          </p>

          {profile?.favorite_music && (
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full text-xs text-cyan-400 mb-4">
              <Music size={12} />
              <span>{profile.favorite_music}</span>
            </div>
          )}

          {profile?.links && profile.links.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {profile.links.map((link: string, i: number) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <LinkIcon size={16} />
                </a>
              ))}
            </div>
          )}

          <div className="flex gap-8 w-full justify-center border-y border-white/5 py-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-lg font-bold">{stat.value}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-around border-b border-white/5 mb-1">
          <button
            type="button"
            onClick={() => setTab('posts')}
            className={cn(
              'pb-4 flex-1 flex justify-center transition-colors',
              tab === 'posts' ? 'border-b-2 border-violet-500 text-violet-400' : 'text-gray-600'
            )}
            aria-label="Ver posts"
          >
            <Grid size={20} />
          </button>
          <button
            type="button"
            onClick={() => setTab('saved')}
            className={cn(
              'pb-4 flex-1 flex justify-center transition-colors',
              tab === 'saved' ? 'border-b-2 border-violet-500 text-violet-400' : 'text-gray-600'
            )}
            aria-label="Ver salvos"
          >
            <Bookmark size={20} />
          </button>
        </div>

        {/* Grid / Empty */}
        {activePosts.length === 0 ? (
          <div className="px-6 py-10">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center">
              <div className="text-sm font-extrabold text-white">
                {tab === 'posts' ? 'Nenhuma publicação ainda' : 'Nenhum post salvo ainda'}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {tab === 'posts'
                  ? (
                    <>
                      Toque no <span className="font-bold text-violet-300">+</span> no menu inferior para criar sua primeira.
                    </>
                  )
                  : 'Quando você salvar posts, eles aparecem aqui.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {activePosts.map((p, i) => (
              <button
                key={`${tab}:${p.id}`}
                type="button"
                onClick={() => openAt(i)}
                className="aspect-square overflow-hidden group relative"
                aria-label="Abrir post"
              >
                <img
                  src={p.media_url}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt=""
                />
                <div className="absolute inset-0 bg-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </main>

      <ProfilePostModal
        open={openPost}
        onOpenChange={closeModal}
        posts={activePosts}
        initialIndex={activeIndex}
        isOwner={modalIsOwner}
        onPostDeleted={onPostDeleted}
        onCaptionUpdated={onCaptionUpdated}
      />

      <BottomNav />
    </div>
  );
};

export default Profile;