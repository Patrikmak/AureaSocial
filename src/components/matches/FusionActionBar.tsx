"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type FusionAction = "voltarFusao" | "desfusao" | "fusao" | "superfusao";

export default function FusionActionBar({
  onAction,
  disabled,
  canUndo,
  className,
}: {
  onAction: (action: FusionAction) => void;
  disabled?: boolean;
  canUndo?: boolean;
  className?: string;
}) {
  const baseBtn =
    "relative grid place-items-center rounded-full border backdrop-blur-xl transition-all duration-200 ease-out";

  const ring = "after:absolute after:inset-0 after:rounded-full after:opacity-0 after:transition-opacity after:duration-200";

  const subtle = "bg-white/[0.06] border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.55)]";

  return (
    <div className={cn("w-full flex items-center justify-center", className)}>
      <div
        className={cn(
          "inline-flex items-center justify-center gap-4 px-5 py-3",
          "rounded-full border border-white/10",
          "bg-black/30 backdrop-blur-xl",
          "shadow-[0_22px_70px_rgba(0,0,0,0.65)]"
        )}
      >
        {/* Voltar Fusão */}
        <motion.button
          type="button"
          disabled={disabled || !canUndo}
          onClick={() => onAction("voltarFusao")}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className={cn(
            baseBtn,
            ring,
            subtle,
            "h-12 w-12",
            "text-amber-200",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "hover:border-amber-400/30 hover:shadow-[0_18px_60px_rgba(251,191,36,0.16)]",
            "after:bg-[radial-gradient(circle_at_30%_30%,rgba(251,191,36,0.28),transparent_55%)] hover:after:opacity-100"
          )}
          aria-label="Voltar Fusão"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
        </motion.button>

        {/* Desfusão */}
        <motion.button
          type="button"
          disabled={disabled}
          onClick={() => onAction("desfusao")}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className={cn(
            baseBtn,
            ring,
            subtle,
            "h-14 w-14",
            "text-rose-200",
            "hover:border-rose-400/30 hover:shadow-[0_18px_60px_rgba(244,114,182,0.18)]",
            "after:bg-[radial-gradient(circle_at_30%_30%,rgba(244,114,182,0.30),transparent_55%)] hover:after:opacity-100",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
          aria-label="Desfusão"
        >
          <X className="h-7 w-7" strokeWidth={2.6} />
        </motion.button>

        {/* Fusão (primary) */}
        <motion.button
          type="button"
          disabled={disabled}
          onClick={() => onAction("fusao")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className={cn(
            baseBtn,
            "h-16 w-16",
            "border-white/10",
            "bg-gradient-to-br from-violet-600 to-fuchsia-500",
            "text-white",
            "shadow-[0_22px_70px_rgba(139,92,246,0.28)]",
            "hover:shadow-[0_26px_85px_rgba(139,92,246,0.38)]",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
          aria-label="Fusão"
        >
          <Heart className="h-8 w-8" fill="currentColor" strokeWidth={0} />
          <span className="absolute inset-0 rounded-full ring-1 ring-white/10" />
        </motion.button>

        {/* Superfusão */}
        <motion.button
          type="button"
          disabled={disabled}
          onClick={() => onAction("superfusao")}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className={cn(
            baseBtn,
            ring,
            "h-12 w-12",
            "border-white/10",
            "bg-gradient-to-br from-cyan-500/25 via-violet-500/15 to-white/[0.06]",
            "text-cyan-200",
            "shadow-[0_16px_50px_rgba(0,0,0,0.55)]",
            "hover:border-cyan-300/30 hover:shadow-[0_18px_60px_rgba(34,211,238,0.18)]",
            "after:bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.30),transparent_55%)] hover:after:opacity-100",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
          aria-label="Superfusão"
        >
          <Star className="h-6 w-6" fill="currentColor" strokeWidth={0} />
        </motion.button>
      </div>
    </div>
  );
}
