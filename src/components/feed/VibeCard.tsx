"use client";

import React, { useMemo, useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

interface VibeCardProps {
  user: {
    name: string;
    avatar: string;
    location: string;
  };
  image: string;
  caption: string;
  likes: string;
}

function parseCompactCount(input: string) {
  const raw = input.trim().toLowerCase();
  const mult = raw.endsWith('k') ? 1_000 : raw.endsWith('m') ? 1_000_000 : 1;
  const numStr = mult === 1 ? raw : raw.slice(0, -1);
  const n = Number(numStr.replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * mult) : 0;
}

function formatCompactCount(n: number) {
  if (n >= 1_000_000) {
    const v = (n / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${v}m`;
  }
  if (n >= 1_000) {
    const v = (n / 1_000).toFixed(1).replace(/\.0$/, '');
    return `${v}k`;
  }
  return `${n}`;
}

const VibeCard = ({ user, image, caption, likes }: VibeCardProps) => {
  const initialLikes = useMemo(() => parseCompactCount(likes), [likes]);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);

  const toggleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      setLikesCount((c) => c + (next ? 1 : -1));
      return next;
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] overflow-hidden shadow-xl"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-violet-500/50" alt="" />
          <div>
            <h3 className="text-sm font-bold text-white">{user.name}</h3>
            <p className="text-[10px] text-gray-400">{user.location}</p>
          </div>
        </div>
        <button className="text-gray-400"><MoreHorizontal size={20} /></button>
      </div>

      {/* Image Content */}
      <div className="relative aspect-[4/5] group">
        <img src={image} className="w-full h-full object-cover" alt="Post content" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quick Action Overlay (Tinder Style) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
          <button
            onClick={toggleLike}
            className={
              "w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors " +
              (liked ? "text-rose-300 bg-rose-500/15" : "text-white hover:bg-rose-500/20 hover:text-rose-300")
            }
            aria-label={liked ? 'Descurtir' : 'Curtir'}
          >
            <Heart size={24} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-violet-500/20 hover:text-violet-300 transition-colors">
            <MessageCircle size={24} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-4">
            <button
              onClick={toggleLike}
              className={
                "transition-transform hover:scale-110 " +
                (liked ? "text-rose-300" : "text-violet-300")
              }
              aria-label={liked ? 'Descurtir' : 'Curtir'}
            >
              <Heart size={24} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <MessageCircle className="text-gray-300 cursor-pointer hover:scale-110 transition-transform" size={24} />
            <Share2 className="text-gray-300 cursor-pointer hover:scale-110 transition-transform" size={24} />
          </div>
          <Bookmark className="text-gray-300 cursor-pointer" size={24} />
        </div>
        <p className="text-sm text-white font-medium mb-1">{formatCompactCount(likesCount)} vibes</p>
        <p className="text-sm text-gray-300">
          <span className="font-bold text-white mr-2">{user.name}</span>
          {caption}
        </p>
      </div>
    </motion.div>
  );
};

export default VibeCard;