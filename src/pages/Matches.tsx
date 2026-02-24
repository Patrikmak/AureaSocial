"use client";

import React from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { X, Heart, Star, Undo2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Matches = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 overflow-hidden">
      <header className="px-6 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-tight">DESCUBRA</h1>
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <Star size={20} className="text-yellow-500" />
        </div>
      </header>

      <main className="px-4 h-[70vh] relative flex items-center justify-center">
        {/* Card Stack Simulation */}
        <div className="relative w-full max-w-sm aspect-[3/4]">
          <motion.div 
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
          >
            <img 
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800" 
              className="w-full h-full object-cover pointer-events-none" 
              alt="Match candidate" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
            
            <div className="absolute bottom-8 left-8 right-8 pointer-events-none">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-3xl font-bold">Sophia, 22</h2>
                <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
              </div>
              <p className="text-gray-300 text-sm mb-4">Designer & Coffee Lover ☕️. Vamos criar algo incrível juntos?</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] border border-white/10">Artes</span>
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] border border-white/10">Viagens</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Action Buttons */}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-6">
        <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-yellow-500">
          <Undo2 size={24} />
        </button>
        <button className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
          <X size={32} />
        </button>
        <button className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
          <Heart size={32} fill="currentColor" />
        </button>
        <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400">
          <Star size={24} fill="currentColor" />
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Matches;