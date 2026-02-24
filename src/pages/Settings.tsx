"use client";

import React from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { ChevronLeft, User, Bell, Shield, HelpCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: User, label: 'Editar Perfil', color: 'text-blue-400' },
    { icon: Bell, label: 'Notificações', color: 'text-violet-400' },
    { icon: Shield, label: 'Privacidade', color: 'text-green-400' },
    { icon: HelpCircle, label: 'Ajuda', color: 'text-yellow-400' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      <header className="px-6 py-6 flex items-center gap-4 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Configurações</h1>
      </header>

      <main className="px-6 py-8">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button key={item.label} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <item.icon size={20} className={item.color} />
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronLeft size={18} className="rotate-180 text-gray-600" />
            </button>
          ))}
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 mt-8 text-red-400 bg-red-500/10 rounded-2xl hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-bold">Sair da Conta</span>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;