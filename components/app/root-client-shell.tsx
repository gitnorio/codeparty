"use client";

import type { ReactNode } from "react";

import { ChatUiProvider } from "@/components/chat/chat-ui-provider";
import { ChatWidget } from "@/components/chat/chat-widget";
import { ThemeProvider } from "@/components/app/theme-provider";

export function RootClientShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ChatUiProvider>
        {children}
        <ChatWidget />
      </ChatUiProvider>
    </ThemeProvider>
  );
}
