"use client";

import type { ReactNode } from "react";

import { ChatUiProvider } from "@/components/chat/chat-ui-provider";
import { ChatWidget } from "@/components/chat/chat-widget";

export function RootClientShell({ children }: { children: ReactNode }) {
  return (
    <ChatUiProvider>
      {children}
      <ChatWidget />
    </ChatUiProvider>
  );
}
