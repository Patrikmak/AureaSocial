"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Heart, MoreHorizontal, Trash2, PencilLine } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";

export type ProfilePost = {
  id: string;
  user_id: string;
  media_url: string;
  caption: string | null;
  location?: string | null;
  created_at: string;
  user: {
    name: string;
    username: string;
    avatar_url: string | null;
  };
};

export type PostComment = {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  user: {
    name: string;
    username: string;
    avatar_url: string | null;
  };
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.max(1, Math.floor(diff / 1000));
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day >= 7) return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  if (day >= 1) return `há ${day} dia${day > 1 ? "s" : ""}`;
  if (hr >= 1) return `há ${hr}h`;
  if (min >= 1) return `há ${min}min`;
  return `há ${sec}s`;
}

export default function ProfilePostModal({
  open,
  onOpenChange,
  posts,
  initialIndex,
  isOwner,
  onPostDeleted,
  onCaptionUpdated,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  posts: ProfilePost[];
  initialIndex: number;
  isOwner: boolean;
  onPostDeleted: (postId: string) => void;
  onCaptionUpdated: (postId: string, caption: string | null) => void;
}) {
  const { session } = useAuth();
  const [index, setIndex] = useState(initialIndex);

  const post = posts[index];
  const postId = post?.id;

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [doubleTapHeart, setDoubleTapHeart] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState<string>("");

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const lastTapRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const isMobile = useMemo(() => window.matchMedia?.("(max-width: 767px)").matches ?? false, []);

  useEffect(() => {
    if (!open) return;
    setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    if (!postId) return;

    let cancelled = false;
    (async () => {
      // Like state
      if (session?.user) {
        const { data: likeRow } = await supabase
          .from("post_likes")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("post_id", postId)
          .maybeSingle();
        if (cancelled) return;
        setLiked(Boolean(likeRow));
      } else {
        setLiked(false);
      }

      // Like count
      const { count } = await supabase
        .from("post_likes")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId);
      if (cancelled) return;
      setLikesCount(count ?? 0);

      // Comments
      const { data: commentRows } = await supabase
        .from("post_comments")
        .select("id, post_id, user_id, text, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      const userIds = Array.from(new Set((commentRows ?? []).map((c) => c.user_id)));
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id, first_name, username, avatar_url").in("id", userIds)
        : { data: [] as any[] };

      const byId = new Map((profiles ?? []).map((p: any) => [p.id, p] as const));

      const enriched: PostComment[] = (commentRows ?? []).map((c: any) => {
        const p = byId.get(c.user_id);
        return {
          ...c,
          user: {
            name: p?.first_name || p?.username || "Perfil",
            username: p?.username || "",
            avatar_url: p?.avatar_url ?? null,
          },
        };
      });

      setComments(enriched);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, postId, session?.user]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(posts.length - 1, i + 1));

  const triggerBigHeart = () => {
    setDoubleTapHeart(true);
    window.setTimeout(() => setDoubleTapHeart(false), 650);
  };

  const toggleLike = async () => {
    if (!session?.user || !postId) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((c) => c + (nextLiked ? 1 : -1));

    if (nextLiked) {
      const { error } = await supabase.from("post_likes").insert({ user_id: session.user.id, post_id: postId });
      if (error) {
        setLiked(false);
        setLikesCount((c) => c - 1);
      }
      return;
    }

    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("user_id", session.user.id)
      .eq("post_id", postId);

    if (error) {
      setLiked(true);
      setLikesCount((c) => c + 1);
    }
  };

  const likeIfNeededWithAnimation = async () => {
    if (!session?.user) return;
    triggerBigHeart();
    if (!liked) await toggleLike();
  };

  const onMediaClick = async () => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      lastTapRef.current = 0;
      await likeIfNeededWithAnimation();
      return;
    }
    lastTapRef.current = now;
  };

  const onMediaTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };

  const onMediaTouchEnd = async (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const dt = Date.now() - start.t;

    // swipe down to close
    if (dy > 90 && Math.abs(dx) < 60 && dt < 600) {
      onOpenChange(false);
      return;
    }

    // swipe left/right to navigate
    if (Math.abs(dx) > 70 && Math.abs(dy) < 70 && dt < 600) {
      if (dx < 0) next();
      else prev();
      return;
    }

    // double tap
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      lastTapRef.current = 0;
      await likeIfNeededWithAnimation();
      return;
    }
    lastTapRef.current = now;
  };

  const submitComment = async () => {
    if (!session?.user || !postId) return;
    const text = commentText.trim();
    if (!text) return;

    setCommentText("");

    const optimistic: PostComment = {
      id: `optimistic-${Date.now()}`,
      post_id: postId,
      user_id: session.user.id,
      text,
      created_at: new Date().toISOString(),
      user: {
        name: "Você",
        username: "",
        avatar_url: null,
      },
    };

    setComments((c) => [...c, optimistic]);

    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, user_id: session.user.id, text })
      .select("id, post_id, user_id, text, created_at")
      .single();

    if (error || !data) {
      setComments((c) => c.filter((x) => x.id !== optimistic.id));
      return;
    }

    // Load your profile for username/avatar
    const { data: me } = await supabase
      .from("profiles")
      .select("id, first_name, username, avatar_url")
      .eq("id", session.user.id)
      .maybeSingle();

    setComments((c) =>
      c.map((x) =>
        x.id === optimistic.id
          ? {
              ...data,
              user: {
                name: me?.first_name || me?.username || "Você",
                username: me?.username || "",
                avatar_url: me?.avatar_url ?? null,
              },
            }
          : x
      )
    );
  };

  const deleteComment = async (commentId: string) => {
    if (!session?.user) return;
    const target = comments.find((c) => c.id === commentId);
    if (!target) return;

    const canDelete = target.user_id === session.user.id || (isOwner && post?.user_id === session.user.id);
    if (!canDelete) return;

    setComments((c) => c.filter((x) => x.id !== commentId));
    await supabase.from("post_comments").delete().eq("id", commentId);
  };

  const startEditCaption = () => {
    if (!isOwner) return;
    setCaptionDraft(post?.caption ?? "");
    setEditingCaption(true);
  };

  const saveCaption = async () => {
    if (!isOwner || !postId) return;
    const next = captionDraft.trim();
    const caption = next.length ? next : null;
    setEditingCaption(false);
    onCaptionUpdated(postId, caption);
    await supabase.from("posts").update({ caption }).eq("id", postId);
  };

  const deletePost = async () => {
    if (!isOwner || !postId) return;
    onPostDeleted(postId);
    onOpenChange(false);
    await supabase.from("posts").delete().eq("id", postId);
  };

  if (!post) return null;

  const canPrev = index > 0;
  const canNext = index < posts.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay ref={overlayRef} className="bg-black/80 backdrop-blur-sm" />
      <DialogContent
        className={cn(
          "p-0 border-white/10 bg-transparent shadow-none",
          "w-[calc(100vw-1.25rem)] max-w-[980px]",
          isMobile ? "h-[calc(100vh-1.25rem)]" : "h-[min(760px,calc(100vh-4rem))]"
        )}
        onPointerDownOutside={() => onOpenChange(false)}
      >
        <div
          className={cn(
            "relative grid h-full overflow-hidden",
            "rounded-[2rem] border border-white/10 bg-[#07070a]",
            isMobile ? "grid-rows-[1fr_auto]" : "md:grid-cols-[1.35fr_1fr]"
          )}
        >
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 z-30 h-10 w-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>

          {/* Desktop arrows */}
          {!isMobile && (
            <>
              <button
                onClick={prev}
                disabled={!canPrev}
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 z-30 h-11 w-11 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center transition-colors",
                  canPrev ? "bg-white/5 text-white hover:bg-white/10" : "bg-white/3 text-white/30"
                )}
                aria-label="Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                disabled={!canNext}
                className={cn(
                  "absolute right-14 top-1/2 -translate-y-1/2 z-30 h-11 w-11 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center transition-colors",
                  canNext ? "bg-white/5 text-white hover:bg-white/10" : "bg-white/3 text-white/30"
                )}
                aria-label="Próximo"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Media */}
          <div className={cn("relative", isMobile ? "" : "md:rounded-l-[2rem]")}> 
            <div className="relative h-full">
              <button
                type="button"
                onClick={onMediaClick}
                onTouchStart={onMediaTouchStart}
                onTouchEnd={onMediaTouchEnd}
                className="relative block w-full h-full"
                aria-label="Mídia do post"
              >
                <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                <AnimatePresence>
                  {doubleTapHeart && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 380, damping: 22 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="h-20 w-20 rounded-full bg-black/35 border border-white/10 backdrop-blur-md flex items-center justify-center">
                        <Heart className="h-10 w-10 text-white" fill="currentColor" strokeWidth={0} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* Footer overlay: likes + actions + caption */}
              <div className="absolute left-5 right-5 bottom-5 z-20">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-gray-200">
                    <span className="text-white">{likesCount}</span> Farms
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleLike}
                      className={cn(
                        "h-10 w-10 rounded-full bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center transition-colors",
                        liked ? "text-rose-300 bg-rose-500/15" : "text-violet-200 hover:text-violet-100 hover:bg-white/15"
                      )}
                      aria-label={liked ? "Descurtir" : "Curtir"}
                    >
                      <Heart size={18} fill={liked ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-200">
                  <span className="font-extrabold text-white mr-2">{post.user.name}</span>
                  {post.caption}
                </div>
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className={cn("flex flex-col", isMobile ? "border-t border-white/10" : "md:border-l md:border-white/10")}> 
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src={
                    post.user.avatar_url ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
                  }
                  className="w-9 h-9 rounded-full object-cover border border-violet-500/40"
                  alt=""
                />
                <div className="leading-tight">
                  <div className="text-sm font-extrabold tracking-tight text-white">{post.user.name}</div>
                  <div className="text-[10px] text-gray-500">@{post.user.username}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner && (
                  <>
                    <button
                      onClick={startEditCaption}
                      className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-200 hover:bg-white/10 transition-colors"
                      aria-label="Editar legenda"
                    >
                      <PencilLine size={16} />
                    </button>
                    <button
                      onClick={deletePost}
                      className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-rose-200 hover:bg-white/10 transition-colors"
                      aria-label="Excluir post"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                <button
                  className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-200 hover:bg-white/10 transition-colors"
                  aria-label="Mais"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            {editingCaption && isOwner && (
              <div className="px-5 py-4 border-b border-white/10 bg-black/30">
                <div className="text-xs font-bold text-gray-200 mb-2">Editar legenda</div>
                <Textarea
                  value={captionDraft}
                  onChange={(e) => setCaptionDraft(e.target.value)}
                  className="min-h-[86px] rounded-2xl bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500"
                  placeholder="Escreva uma legenda..."
                />
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => setEditingCaption(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="rounded-full bg-violet-600 hover:bg-violet-600/90 text-white"
                    onClick={saveCaption}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            )}

            <div className={cn("flex-1", isMobile ? "min-h-[36vh]" : "min-h-0")}>
              <ScrollArea className={cn("h-full", isMobile ? "max-h-[36vh]" : "")}> 
                <div className="px-5 py-4 space-y-3">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3"
                    >
                      <img
                        src={
                          c.user.avatar_url ||
                          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
                        }
                        className="w-9 h-9 rounded-full object-cover border border-white/10"
                        alt=""
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-extrabold text-white">{c.user.name}</div>
                          <div className="text-[10px] text-gray-500">{timeAgo(c.created_at)}</div>
                        </div>
                        <div className="text-xs text-gray-200 mt-0.5 whitespace-pre-wrap">{c.text}</div>
                      </div>
                      {(session?.user?.id === c.user_id || isOwner) && !c.id.startsWith("optimistic-") && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-200 hover:bg-white/10 transition-colors"
                          aria-label="Excluir comentário"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="px-5 py-4 border-t border-white/10 bg-black/30">
              <div className="text-[10px] text-gray-500 mb-2">{timeAgo(post.created_at)}</div>
              <div className="flex items-center gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitComment();
                    }
                  }}
                  className="rounded-full bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500"
                  placeholder="Adicionar comentário..."
                />
                <Button
                  onClick={submitComment}
                  className="rounded-full bg-cyan-500/90 hover:bg-cyan-500 text-black font-black"
                >
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}