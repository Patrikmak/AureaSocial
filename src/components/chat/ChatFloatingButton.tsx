"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChatFloatingButtonProps = {
  unreadCount: number;
  avatars: string[];
  openMessages: () => void;
  className?: string;
};

export default function ChatFloatingButton({
  unreadCount,
  avatars,
  openMessages,
  className,
}: ChatFloatingButtonProps) {
  const badgeText = useMemo(() => {
    if (unreadCount <= 0) return null;
    return unreadCount > 9 ? "9+" : String(unreadCount);
  }, [unreadCount]);

  const visibleAvatars = useMemo(() => avatars.slice(0, 3), [avatars]);

  return (
    <motion.button
      type="button"
      onClick={openMessages}
      className={cn(
        "fixed bottom-[43px] right-4 z-[69] flex items-center gap-3 rounded-full px-4 py-3",
        "bg-white/[0.06] backdrop-blur-xl border border-white/10",
        "shadow-[0_18px_50px_rgba(0,0,0,0.55)]",
        "outline-none",
        className
      )}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      aria-label="Abrir Mensagens"
    >
      {/* Badge */}
      {badgeText && (
        <span
          className={cn(
            "absolute -top-2 -left-2",
            "h-6 min-w-6 px-1.5 rounded-full",
            "bg-fuchsia-500/95 text-white",
            "border border-white/10",
            "shadow-[0_10px_22px_rgba(217,70,239,0.28)]",
            "text-[11px] font-extrabold leading-6 text-center"
          )}
        >
          {badgeText}
        </span>
      )}

      {/* Icon */}
      <div
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center",
          "bg-violet-500/12 border border-violet-400/20",
          "shadow-[0_10px_28px_rgba(139,92,246,0.18)]"
        )}
      >
        <MessageCircle className="h-[18px] w-[18px] text-violet-300" strokeWidth={2.25} />
      </div>

      {/* Label */}
      <div className="flex flex-col items-start leading-tight pr-1">
        <span className="text-sm font-extrabold tracking-tight text-white">Mensagens</span>
        <span className="text-[10px] text-white/55">Sua rede em tempo real</span>
      </div>

      {/* Avatars */}
      {visibleAvatars.length > 0 && (
        <div className="flex -space-x-2">
          {visibleAvatars.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className={cn(
                "p-[2px] rounded-full",
                "bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400"
              )}
            >
              <div className="rounded-full bg-black/90 p-[2px]">
                <img
                  src={src}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover border border-black"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hover shadow intensification */}
      <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200" />
    </motion.button>
  );
}