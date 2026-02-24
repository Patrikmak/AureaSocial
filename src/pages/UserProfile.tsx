"use client";

import React, { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BottomNav from "@/components/layout/BottomNav";
import { ChevronLeft, MapPin, MessageCircle } from "lucide-react";

type PublicProfile = {
  username: string;
  name: string;
  avatar: string;
  location: string;
  bio: string;
  tags: string[];
};

const UserProfile = () => {
  const navigate = useNavigate();
  const { username } = useParams();

  const profilesByUsername = useMemo<Record<string, PublicProfile>>(
    () => ({
      "luna.estelar": {
        username: "luna.estelar",
        name: "Luna Estelar",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        location: "São Paulo, SP",
        bio: "Noites neon, café forte e playlists infinitas. ✨",
        tags: ["Lifestyle", "Neon", "Arte"],
      },
      sophia: {
        username: "sophia",
        name: "Sophia",
        avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
        location: "Rio de Janeiro, RJ",
        bio: "Designer & Coffee Lover ☕️. Bora criar algo incrível juntos?",
        tags: ["Design", "Viagens", "Música"],
      },
      "alex.rivera": {
        username: "alex.rivera",
        name: "Alex Rivera",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
        location: "Lisboa, Portugal",
        bio: "Criando conexões reais através da arte e tecnologia. 🚀",
        tags: ["Tech", "Arte", "Coffee"],
      },
      "marcos.vini": {
        username: "marcos.vini",
        name: "Marcos Vini",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
        location: "Rio de Janeiro, RJ",
        bio: "Mar, trilha e câmera na mochila. 📷",
        tags: ["Foto", "Trilhas", "Praia"],
      },
    }),
    []
  );

  const profile = username ? profilesByUsername[decodeURIComponent(username)] : undefined;

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050505] text-white pb-32">
        <header className="px-6 py-6 flex items-center gap-4 border-b border-white/5">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Perfil</h1>
        </header>

        <main className="px-6 py-10">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-sm text-gray-300">Perfil não encontrado.</p>
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl px-6 py-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="leading-tight">
            <div className="text-xs text-gray-500">@{profile.username}</div>
            <h1 className="text-lg font-black tracking-tight">{profile.name}</h1>
          </div>
        </div>

        <button
          onClick={() => navigate(`/matches?chat=${encodeURIComponent(profile.username)}`)}
          className="h-10 px-4 rounded-full bg-violet-600/90 hover:bg-violet-600 text-white font-bold text-xs flex items-center gap-2 border border-white/10 shadow-lg shadow-violet-500/15 transition-colors"
        >
          <MessageCircle size={16} />
          Mensagem
        </button>
      </header>

      <main className="max-w-lg mx-auto px-6 pt-6">
        <div className="rounded-[2.75rem] border border-white/10 bg-white/5 overflow-hidden shadow-2xl">
          <div className="px-6 pt-6 pb-5">
            <div className="flex items-center gap-4">
              <div className="p-1 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-400">
                <img src={profile.avatar} className="w-20 h-20 rounded-full object-cover border-4 border-black" alt="" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin size={12} />
                  <span>{profile.location}</span>
                </div>
                <p className="mt-2 text-sm text-gray-200 leading-relaxed">{profile.bio}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {profile.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-200"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square rounded-2xl border border-white/10 overflow-hidden bg-white/5">
                  <img
                    src={`https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&sig=${encodeURIComponent(profile.username)}-${i}`}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
              <div>
                <div className="text-xs text-gray-500">Quer ver mais?</div>
                <div className="text-sm font-extrabold">Conecte e converse</div>
              </div>
              <Link
                to={`/matches?chat=${encodeURIComponent(profile.username)}`}
                className="h-10 px-4 rounded-full bg-cyan-500/90 hover:bg-cyan-500 text-black font-black text-xs flex items-center transition-colors"
              >
                Abrir chat
              </Link>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default UserProfile;
