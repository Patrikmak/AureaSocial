"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

const stories = [
  { id: 1, name: 'Seu Story', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', isUser: true },
  { id: 2, name: 'Alex', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' },
  { id: 3, name: 'Luna', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
  { id: 4, name: 'Marc', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' },
  { id: 5, name: 'Bia', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop' },
  { id: 6, name: 'Leo', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
];

const StoryBar = () => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-4 no-scrollbar scroll-smooth select-none active:cursor-grabbing">
      {stories.map((story) => (
        <div key={story.id} className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className={cn(
            "relative p-[3px] rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400 transition-transform active:scale-95",
            story.isUser && "from-gray-600 to-gray-400"
          )}>
            <div className="bg-black rounded-full p-[2px]">
              <img 
                src={story.img} 
                alt={story.name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-black"
              />
            </div>
            {story.isUser && (
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-violet-500 rounded-full border-2 border-black flex items-center justify-center">
                <Plus size={12} className="text-white" strokeWidth={3} />
              </div>
            )}
          </div>
          <span className="text-[10px] font-medium text-gray-300">{story.name}</span>
        </div>
      ))}
    </div>
  );
};

export default StoryBar;