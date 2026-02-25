"use client";

import React, { useEffect, useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { Settings as SettingsIcon, Grid, Bookmark, MapPin, Music, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

const Profile = () => {
  const { session } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session?.user.id)
      .single();
    
    if (data) setProfile(data);
  };

  const stats = [
    { label: 'Posts', value: '128' },
    { label: 'Farms', value: '12.4k' },
    { label: 'Matches', value: '452' },

  ];

  const gridImages = [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=400',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  ];

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
            <Link to="/edit-profile" className="absolute bottom-0 right-0 w-6 h-6 bg-violet-500 rounded-full border-4 border-black flex items-center justify-center">
              <span className="text-[10px] font-bold">+</span>
            </Link>
          </div>
          
          <h2 className="text-2xl font-black mb-1">{profile?.first_name || 'Alex Rivera'}</h2>
          
          {profile?.gender && (
            <span className="text-[10px] uppercase tracking-widest text-violet-400 font-bold mb-2">
              {profile.gender}
            </span>
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
                <a key={i} href={link} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors">
                  <LinkIcon size={16} />
                </a>
              ))}
            </div>
          )}

          <div className="flex gap-8 w-full justify-center border-y border-white/5 py-4">
            {stats.map(stat => (
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

        {/* Grid */}
        <div className="grid grid-cols-3 gap-1">
          {gridImages.map((img, i) => (
            <div key={i} className="aspect-square overflow-hidden group relative">
              <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
              <div className="absolute inset-0 bg-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;