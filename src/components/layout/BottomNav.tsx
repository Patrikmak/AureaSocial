"use client";

import React from 'react';
import { Home, Search, Heart, User, PlusSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, path: '/', label: 'Feed' },
    { icon: Search, path: '/explore', label: 'Explorar' },
    { icon: PlusSquare, path: '/create', label: 'Postar' },
    { icon: Heart, path: '/matches', label: 'Fusões' },

    { icon: User, path: '/profile', label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 z-50 shadow-2xl">
      <ul className="flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path}>
              <Link 
                to={item.path}
                className={cn(
                  "flex flex-col items-center transition-all duration-300",
                  isActive ? "text-violet-400 scale-110" : "text-gray-400 hover:text-white"
                )}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && <span className="w-1 h-1 bg-violet-400 rounded-full mt-1 animate-pulse" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;