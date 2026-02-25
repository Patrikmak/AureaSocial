"use client";

import React, { useState } from "react";
import ChatFloatingButton from "@/components/chat/ChatFloatingButton";
import MessagesOverlay from "@/components/chat/MessagesOverlay";
import { useIsMobile } from "@/hooks/use-mobile";

export type MessagesLauncherProps = {
  unreadCount?: number;
  avatars?: string[];
};

const FALLBACK_AVATARS = [
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
];

export default function MessagesLauncher({ unreadCount = 12, avatars }: MessagesLauncherProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const resolvedAvatars = avatars ?? FALLBACK_AVATARS;

  // Mobile: o acesso às mensagens de fusões acontece via ícone no header (sem overlay/flutuante).
  if (isMobile) return null;

  return (
    <>
      <MessagesOverlay open={open} onOpenChange={setOpen} unreadCount={unreadCount} />

      <ChatFloatingButton
        unreadCount={unreadCount}
        avatars={resolvedAvatars}
        openMessages={() => setOpen(true)}
      />
    </>
  );
}