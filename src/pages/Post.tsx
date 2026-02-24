"use client";

import React, { useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import BottomNav from "@/components/layout/BottomNav";
import { ChevronLeft, Heart, MessageCircle, Share2 } from "lucide-react";

type Post = {
  id: string;
  user: { name: string; username: string; avatar: string; location: string };
  image: string;
  caption: string;
  likes: string;
};

type Comment = {
  id: string;
  user: { name: string; username: string; avatar: string };
  text: string;
  time: string;
};

const PostPage = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [searchParams] = useSearchParams();
  const focusCommentId = searchParams.get("comment");

  const postsById = useMemo<Record<string, Post>>(
    () => ({
      "1": {
        id: "1",
        user: {
          name: "Luna Estelar",
          username: "luna.estelar",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
          location: "São Paulo, SP",
        },
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200",
        caption: "Vivendo a melhor vibe de hoje ✨ #lifestyle #neon",
        likes: "1.2k",
      },
      "2": {
        id: "2",
        user: {
          name: "Marcos Vini",
          username: "marcos.vini",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
          location: "Rio de Janeiro, RJ",
        },
        image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1200",
        caption: "Explorando novos horizontes. Quem vem?",
        likes: "850",
      },
    }),
    []
  );

  const commentsByPostId = useMemo<Record<string, Comment[]>>(
    () => ({
      "1": [
        {
          id: "c1",
          user: {
            name: "Alex Rivera",
            username: "alex.rivera",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
          },
          text: "Incrível! 🔥",
          time: "3h",
        },
        {
          id: "c2",
          user: {
            name: "Sophia",
            username: "sophia",
            avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100",
          },
          text: "Essa luz tá perfeita. Onde foi?",
          time: "1h",
        },
      ],
      "2": [
        {
          id: "c1",
          user: {
            name: "Luna Estelar",
            username: "luna.estelar",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
          },
          text: "Partiu! 🙌",
          time: "2h",
        },
      ],
    }),
    []
  );

  const post = postId ? postsById[postId] : undefined;
  const comments = postId ? commentsByPostId[postId] ?? [] : [];

  useEffect(() => {
    if (!focusCommentId) return;
    const el = document.getElementById(`comment-${focusCommentId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusCommentId]);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#050505] text-white pb-32">
        <header className="px-6 py-6 flex items-center gap-4 border-b border-white/5">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Post</h1>
        </header>

        <main className="px-6 py-10">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-sm text-gray-300">Post não encontrado.</p>
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl px-6 py-5 flex items-center gap-4 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          <button
            className="group flex items-center gap-3"
            onClick={() => navigate(`/profile/${encodeURIComponent(post.user.username)}`)}
          >
            <img
              src={post.user.avatar}
              className="w-9 h-9 rounded-full object-cover border border-violet-500/40 group-hover:border-violet-400/70 transition-colors"
              alt=""
            />
            <div className="text-left leading-tight">
              <div className="text-sm font-extrabold tracking-tight">{post.user.name}</div>
              <div className="text-[10px] text-gray-400">{post.user.location}</div>
            </div>
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        <div className="px-4 pt-5">
          <div className="rounded-[2.75rem] overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
            <div className="relative aspect-[4/5]">
              <img src={post.image} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

              <div className="absolute bottom-5 left-5 right-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-gray-200">
                    <span className="text-white">{post.likes}</span> vibes
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-full bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center text-violet-200 hover:text-violet-100 hover:bg-white/15 transition-colors">
                      <Heart size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center text-cyan-200 hover:text-cyan-100 hover:bg-white/15 transition-colors">
                      <MessageCircle size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center text-gray-100 hover:bg-white/15 transition-colors">
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>

                <p className="mt-4 text-sm text-gray-200">
                  <span className="font-extrabold text-white mr-2">{post.user.name}</span>
                  {post.caption}
                </p>
              </div>
            </div>

            <div className="px-5 py-5 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black tracking-tight">Comentários</h2>
                <span className="text-[10px] text-gray-500">{comments.length} no total</span>
              </div>

              <div className="space-y-3">
                {comments.map((c) => {
                  const isFocused = focusCommentId === c.id;
                  return (
                    <button
                      key={c.id}
                      id={`comment-${c.id}`}
                      onClick={() => navigate(`/profile/${encodeURIComponent(c.user.username)}`)}
                      className={
                        "w-full text-left flex items-start gap-3 rounded-2xl border px-3.5 py-3 transition-colors " +
                        (isFocused
                          ? "border-cyan-400/40 bg-cyan-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/7")
                      }
                    >
                      <img src={c.user.avatar} className="w-9 h-9 rounded-full object-cover border border-white/10" alt="" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-extrabold text-white">{c.user.name}</div>
                          <div className="text-[10px] text-gray-500">{c.time}</div>
                        </div>
                        <div className="text-xs text-gray-200 mt-0.5">{c.text}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default PostPage;
