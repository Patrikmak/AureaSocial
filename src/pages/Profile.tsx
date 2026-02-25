"use client";

import React, { useEffect, useMemo, useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { Settings as SettingsIcon, Grid, Bookmark, MapPin, Music, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import ProfilePostModal, { ProfilePost } from '@/components/profile/ProfilePostModal';

const Profile = () => {
  const { session } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [openPost, setOpenPost] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [gridScrollY, setGridScrollY] = useState<number | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session?.user.id)
      .single();

    if (data) setProfile(data);
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
    })();
  }, [profile, session?.user]);

  const stats = useMemo(
    () => [
      { label: 'Posts', value: String(posts.length || 0) },
      { label: 'Farms', value: '12.4k' },
      { label: 'Fusões', value: '452' },
    ],
    [posts.length]
  );

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
    setPosts((p) => p.filter((x) => x.id !== postId));
  };

  const onCaptionUpdated = (postId: string, caption: string | null) => {
    setPosts((p) => p.map((x) => (x.id === postId ? { ...x, caption } : x)));
  };

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
          <button className="pb-4 border-b-2 border-violet-500 text-violet-400 flex-1 flex justify-center">
            <Grid size={20} />
          </button>
          <button className="pb-4 text-gray-600 flex-1 flex justify-center">
            <Bookmark size={20} />
          </button>
        </div>

        {/* Grid / Empty */}
        {posts.length === 0 ? (
          <div className="px-6 py-10">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center">
              <div className="text-sm font-extrabold text-white">Nenhuma publicação ainda</div>
              <div className="mt-1 text-xs text-gray-400">
                Toque no <span className="font-bold text-violet-300">+</span> no menu inferior para criar sua primeira.
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((p, i) => (
              <button
                key={p.id}
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
        posts={posts}
        initialIndex={activeIndex}
        isOwner={true}
        onPostDeleted={onPostDeleted}
        onCaptionUpdated={onCaptionUpdated}
      />

      <BottomNav />
    </div>
  );
};

export default Profile;