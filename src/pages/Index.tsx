"use client";

import React, { useMemo, useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import VibesBar from '@/components/feed/VibesBar';
import VibeCard from '@/components/feed/VibeCard';
import ChatFloatingButton from '@/components/chat/ChatFloatingButton';
import MessagesOverlay from '@/components/chat/MessagesOverlay';

import { Bell, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);

  const unreadCount = 12;
  const avatars = useMemo(
    () => [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    ],
    []
  );

  const posts = [
    {
      id: 1,
      user: { name: 'Luna Estelar', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', location: 'São Paulo, SP' },
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
      caption: 'Vivendo a melhor vibe de hoje ✨ #lifestyle #neon',
      likes: '1.2k'
    },
    {
      id: 2,
      user: { name: 'Marcos Vini', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', location: 'Rio de Janeiro, RJ' },
      image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800',
      caption: 'Explorando novos horizontes. Quem vem?',
      likes: '850'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-cyan-400 rounded-lg flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Aurēa
          </h1>
        </div>
        <div className="flex gap-4">
          <Link to="/notifications" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
            <Bell size={22} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-violet-500 rounded-full border-2 border-black" />
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto pt-4">
        <VibesBar />

        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Para Você</h2>
            <div className="flex gap-2">
              <span className="text-xs font-medium px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full border border-violet-500/30">Trending</span>
            </div>
          </div>
          
          {posts.map(post => (
            <VibeCard key={post.id} {...post} />
          ))}
        </div>
      </main>

      <MessagesOverlay
        open={isMessagesOpen}
        onOpenChange={setIsMessagesOpen}
        unreadCount={unreadCount}
      />

      <ChatFloatingButton
        unreadCount={unreadCount}
        avatars={avatars}
        openMessages={() => setIsMessagesOpen(true)}
      />

      <BottomNav />
    </div>
  );
};

export default Index;