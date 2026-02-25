"use client";

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/layout/BottomNav";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ImagePlus, Loader2, MapPin, Send } from "lucide-react";

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default function CreatePost() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [posting, setPosting] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  const canPost = Boolean(session?.user && file && !posting);

  const pick = (f: File | null) => {
    setFile(f);
  };

  const post = async () => {
    if (!session?.user) return;
    if (!file) return;

    setPosting(true);

    try {
      const path = `posts/${session.user.id}/${Date.now()}_${safeFilename(file.name || "image")}`;

      const { error: uploadError } = await supabase.storage.from("posts").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("posts").getPublicUrl(path);
      const mediaUrl = data.publicUrl;

      const { error: insertError } = await supabase.from("posts").insert({
        user_id: session.user.id,
        media_url: mediaUrl,
        caption: caption.trim() ? caption.trim() : null,
        location: location.trim() ? location.trim() : null,
      });
      if (insertError) throw insertError;

      navigate("/profile");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl px-6 py-5 flex items-center gap-4 border-b border-white/5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-base font-black tracking-tight">Criar publicação</div>
          <div className="text-[10px] text-white/55">Aparece no seu perfil depois de postar</div>
        </div>
        <Button
          type="button"
          onClick={post}
          disabled={!canPost}
          className={cn(
            "h-10 rounded-full px-4",
            "bg-violet-600 hover:bg-violet-500 text-white",
            "shadow-[0_18px_55px_rgba(139,92,246,0.25)]",
            "disabled:opacity-60 disabled:shadow-none"
          )}
        >
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="ml-2 text-sm font-extrabold">Postar</span>
        </Button>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5">
        <Card className="rounded-[2rem] border-white/10 bg-white/5 p-4">
          <div className="grid gap-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-black/30 overflow-hidden">
              {previewUrl ? (
                <div className="relative aspect-[4/5]">
                  <img src={previewUrl} alt="Pré-visualização" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              ) : (
                <label className="block">
                  <div className="aspect-[4/5] grid place-items-center p-8 text-center">
                    <div className="mx-auto h-14 w-14 rounded-full bg-violet-500/12 border border-violet-400/20 grid place-items-center">
                      <ImagePlus className="h-6 w-6 text-violet-300" />
                    </div>
                    <div className="mt-4 text-sm font-extrabold">Envie uma foto</div>
                    <div className="mt-1 text-xs text-gray-400">Obrigatório</div>
                    <div className="mt-4 inline-flex rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-white/90">
                      Selecionar imagem
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pick(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>

            {previewUrl && (
              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-white/90 hover:bg-white/10 transition-colors cursor-pointer">
                  <ImagePlus className="h-4 w-4 text-violet-200" />
                  Trocar foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pick(e.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => pick(null)}
                  className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Remover
                </button>
              </div>
            )}

            <div className="grid gap-3">
              <div>
                <div className="text-xs font-extrabold text-white mb-2">Legenda</div>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escreva uma descrição…"
                  className="min-h-[96px] rounded-[1.25rem] bg-black/30 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-violet-500/30"
                />
              </div>

              <div>
                <div className="text-xs font-extrabold text-white mb-2">Localização</div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-200" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: São Paulo, SP"
                    className="h-12 pl-11 rounded-full bg-black/30 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-cyan-500/25"
                  />
                </div>
              </div>
            </div>

            {!session?.user && (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-xs text-gray-300">
                Você precisa estar logado para postar.
              </div>
            )}
          </div>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
