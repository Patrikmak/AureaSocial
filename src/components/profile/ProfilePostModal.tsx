"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  PencilLine,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { AnimatePresence, motion } from "framer-motion";
import { showError, showSuccess } from "@/utils/toast";

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

function compactCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
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
  const [saved, setSaved] = useState(false);

  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);

  const [doubleTapHeart, setDoubleTapHeart] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState<string>("");

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const lastTapRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const commentsAnchorRef = useRef<HTMLDivElement | null>(null);
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  const isMobile = useMemo(() => window.matchMedia?.("(max-width: 767px)").matches ?? false, []);

  useEffect(() => {
    if (!open) return;
    setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    setComposerOpen(false);
    setCommentText("");
  }, [open, postId]);

  useEffect(() => {
    if (!open) return;
    if (!postId) return;

    let cancelled = false;
    (async () => {
      if (session?.user) {
        const { data: likeRow } = await supabase
          .from("post_likes")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("post_id", postId)
          .maybeSingle();
        if (cancelled) return;
        setLiked(Boolean(likeRow));

        const { data: saveRow } = await supabase
          .from("post_saves")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("post_id", postId)
          .maybeSingle();
        if (cancelled) return;
        setSaved(Boolean(saveRow));
      } else {
        setLiked(false);
        setSaved(false);
      }

      const { count } = await supabase
        .from("post_likes")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId);
      if (cancelled) return;
      setLikesCount(count ?? 0);

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

  const canPrev = index > 0;
  const canNext = index < posts.length - 1;

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

  const toggleSave = async () => {
    if (!session?.user || !postId) return;

    const nextSaved = !saved;
    setSaved(nextSaved);

    if (nextSaved) {
      const { error } = await supabase.from("post_saves").insert({ user_id: session.user.id, post_id: postId });
      if (error) {
        setSaved(false);
        showError("Não foi possível salvar");
      }
      return;
    }

    const { error } = await supabase
      .from("post_saves")
      .delete()
      .eq("user_id", session.user.id)
      .eq("post_id", postId);

    if (error) {
      setSaved(true);
      showError("Não foi possível remover dos salvos");
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

    if (dy > 90 && Math.abs(dx) < 60 && dt < 600) {
      onOpenChange(false);
      return;
    }

    if (Math.abs(dx) > 70 && Math.abs(dy) < 70 && dt < 600) {
      if (dx < 0) next();
      else prev();
      return;
    }

    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      lastTapRef.current = 0;
      await likeIfNeededWithAnimation();
      return;
    }
    lastTapRef.current = now;
  };

  const openComposer = () => {
    setComposerOpen(true);
    commentsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => commentInputRef.current?.focus(), 220);
  };

  const share = async () => {
    if (!post?.media_url) return;

    const url = post.media_url;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav: any = navigator;
      if (nav.share) {
        await nav.share({
          title: "Aurēa",
          text: post.caption ?? "",
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      showSuccess("Link copiado");
    } catch {
      showError("Não foi possível compartilhar");
    }
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
      showError("Não foi possível comentar");
      return;
    }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay ref={overlayRef} className="bg-black/80 backdrop-blur-sm" />
      <DialogContent
        className={cn(
          "p-0 border-white/10 bg-transparent shadow-none",
          "w-[92vw] max-w-md",
          isMobile ? "h-[calc(100vh-1.25rem)]" : "max-h-[86vh]"
        )}
        onPointerDownOutside={() => onOpenChange(false)}
      >
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#07070A] shadow-[0_28px_90px_rgba(0,0,0,0.72)]">
          {/* Top actions (X + owner tools) */}
          <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={startEditCaption}
                  className="h-10 w-10 rounded-full bg-black/35 border border-white/10 backdrop-blur-md flex items-center justify-center text-cyan-200 hover:bg-black/45 transition-colors"
                  aria-label="Editar legenda"
                >
                  <PencilLine size={16} />
                </button>
                <button
                  type="button"
                  onClick={deletePost}
                  className="h-10 w-10 rounded-full bg-black/35 border border-white/10 backdrop-blur-md flex items-center justify-center text-rose-200 hover:bg-black/45 transition-colors"
                  aria-label="Excluir post"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 rounded-full bg-black/35 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/85 hover:text-white hover:bg-black/45 transition-colors"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Desktop nav arrows */}
          {!isMobile && (
            <>
              <button
                onClick={prev}
                disabled={!canPrev}
                className={cn(
                  "absolute left-3 top-[30%] z-30 h-11 w-11 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center transition-colors",
                  canPrev ? "bg-black/35 text-white hover:bg-black/45" : "bg-black/20 text-white/25"
                )}
                aria-label="Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                disabled={!canNext}
                className={cn(
                  "absolute right-3 top-[30%] z-30 h-11 w-11 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center transition-colors",
                  canNext ? "bg-black/35 text-white hover:bg-black/45" : "bg-black/20 text-white/25"
                )}
                aria-label="Próximo"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Media (must not be a button because it contains buttons inside) */}
          <div
            role="button"
            tabIndex={0}
            onClick={onMediaClick}
            onTouchStart={onMediaTouchStart}
            onTouchEnd={onMediaTouchEnd}
            className="relative block w-full cursor-pointer select-none"
            aria-label="Mídia do post"
          >
            <div className="relative aspect-[4/5]">
              <img src={post.media_url} alt="" className="h-full w-full object-cover" draggable={false} />
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-black/55" />

              <AnimatePresence>
                {doubleTapHeart && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="h-20 w-20 rounded-full bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-center">
                      <Heart className="h-10 w-10 text-white" fill="currentColor" strokeWidth={0} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom overlay content */}
              <div className="absolute bottom-4 left-5 right-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-gray-200">
                    <span className="text-white">{compactCount(likesCount)}</span> Farms
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleLike();
                      }}
                      className={cn(
                        "h-10 w-10 rounded-full border border-white/15 backdrop-blur-md flex items-center justify-center transition-colors",
                        liked ? "bg-rose-500/18 text-rose-200" : "bg-white/10 text-gray-100 hover:bg-white/15"
                      )}
                      aria-label={liked ? "Descurtir" : "Curtir"}
                    >
                      <Heart size={18} fill={liked ? "currentColor" : "none"} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openComposer();
                      }}
                      className="h-10 w-10 rounded-full bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center text-gray-100 hover:bg-white/15 transition-colors"
                      aria-label="Comentários"
                    >
                      <MessageCircle size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        share();
                      }}
                      className="h-10 w-10 rounded-full bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center text-gray-100 hover:bg-white/15 transition-colors"
                      aria-label="Compartilhar"
                    >
                      <Share2 size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSave();
                      }}
                      className={cn(
                        "h-10 w-10 rounded-full border border-white/15 backdrop-blur-md flex items-center justify-center transition-colors",
                        saved ? "bg-cyan-500/18 text-cyan-100" : "bg-white/10 text-gray-100 hover:bg-white/15"
                      )}
                      aria-label={saved ? "Remover dos salvos" : "Salvar"}
                    >
                      <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
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

          {/* Comments */}
          <div ref={commentsAnchorRef} className="px-5 pt-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black tracking-tight text-white">Comentários</div>
              <div className="text-[10px] text-gray-500">{comments.length} no total</div>
            </div>
          </div>

          <div className={cn("px-3 pb-5", isMobile ? "" : "")}>
            <ScrollArea className={cn(isMobile ? "h-[38vh]" : "h-[360px]")}
            >
              <div className="px-2 pt-4 space-y-3">
                {/* Composer in the comments area (yellow region) */}
                <AnimatePresence initial={false} mode="wait">
                  {composerOpen ? (
                    <motion.div
                      key="composer-open"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className="flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4"
                    >
                      <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10" />
                      <div className="flex-1 min-w-0">
                        <Input
                          ref={commentInputRef}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              submitComment();
                            }
                          }}
                          className="h-11 rounded-full bg-black/20 border-white/10 text-gray-100 placeholder:text-gray-500"
                          placeholder="Adicionar comentário..."
                        />
                      </div>
                      <Button
                        onClick={submitComment}
                        className="h-11 rounded-full bg-cyan-500/90 hover:bg-cyan-500 text-black font-black"
                      >
                        Enviar
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="composer-closed"
                      type="button"
                      onClick={openComposer}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      className={cn(
                        "w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4",
                        "flex items-center justify-between gap-3",
                        "hover:bg-white/7 transition-colors"
                      )}
                      aria-label="Abrir caixa de comentário"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 grid place-items-center">
                          <MessageCircle className="h-4 w-4 text-violet-200" />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="truncate text-xs font-extrabold text-white">Adicionar comentário</div>
                          <div className="truncate text-[11px] text-gray-400">Toque para escrever</div>
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] font-extrabold text-cyan-200">Comentar</span>
                    </motion.button>
                  )}
                </AnimatePresence>

                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4"
                  >
                    <img
                      src={c.user.avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                      alt=""
                      draggable={false}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate text-xs font-extrabold text-white">{c.user.name}</div>
                        <div className="shrink-0 text-[10px] text-gray-500">{timeAgo(c.created_at)}</div>
                      </div>
                      <div className="mt-1 text-xs text-gray-200 whitespace-pre-wrap">{c.text}</div>
                    </div>

                    {(session?.user?.id === c.user_id || isOwner) && !c.id.startsWith("optimistic-") && (
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-200 hover:bg-white/10 transition-colors"
                        aria-label="Excluir comentário"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {comments.length === 0 && !composerOpen && (
                  <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-center">
                    <div className="text-xs font-extrabold text-white">Sem comentários ainda</div>
                    <div className="mt-1 text-[11px] text-gray-400">Seja o primeiro a comentar.</div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Edit caption */}
          {editingCaption && isOwner && (
            <div className="px-5 pb-4">
              <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-4">
                <div className="text-xs font-extrabold text-white">Editar legenda</div>
                <Textarea
                  value={captionDraft}
                  onChange={(e) => setCaptionDraft(e.target.value)}
                  className="mt-3 min-h-[88px] rounded-2xl bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-violet-500/30"
                  placeholder="Escreva uma legenda..."
                />
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="ghost" className="rounded-full" onClick={() => setEditingCaption(false)}>
                    Cancelar
                  </Button>
                  <Button className="rounded-full bg-violet-600 hover:bg-violet-600/90 text-white" onClick={saveCaption}>
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-4 border-t border-white/10 bg-black/30">
            <div className="text-[10px] text-gray-500">{timeAgo(post.created_at)}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}