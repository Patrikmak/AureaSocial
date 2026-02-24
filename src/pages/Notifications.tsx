"use client";

import React from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { ChevronLeft, Heart, UserPlus, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const navigate = useNavigate();
  
  const notifications = [
    { id: 1, type: 'like', user: 'Luna Estelar', content: 'curtiu sua foto.', time: '2m', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { id: 2, type: 'match', user: 'Sophia', content: 'Novo match! Diga oi.', time: '1h', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100' },
    { id: 3, type: 'comment', user: 'Alex Rivera', content: 'comentou: "Incrível! 🔥"', time: '3h', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      <header className="px-6 py-6 flex items-center gap-4 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Notificações</h1>
      </header>

      <main className="px-4 py-6">
        <div className="space-y-6">
          {notifications.map((notif) => (
            <div key={notif.id} className="flex items-center gap-4 p-2 hover:bg-white/5 rounded-2xl transition-colors">
              <img src={notif.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-bold">{notif.user}</span> {notif.content}
                </p>
                <span className="text-[10px] text-gray-500">{notif.time}</span>
              </div>
              <div className="w-8 h-8 flex items-center justify-center">
                {notif.type === 'like' && <Heart size={16} className="text-red-500" fill="currentColor" />}
                {notif.type === 'match' && <UserPlus size={16} className="text-violet-500" />}
                {notif.type === 'comment' && <MessageSquare size={16} className="text-cyan-400" />}
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Notifications;