"use client";

import type { ReactNode } from "react";

import { LanguageProvider, useLanguage } from "@/components/app/language-provider";
import { ChatUiProvider } from "@/components/chat/chat-ui-provider";
import { ChatWidget } from "@/components/chat/chat-widget";
import { ThemeProvider } from "@/components/app/theme-provider";

export function RootClientShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ChatUiProvider>
          <div className="flex min-h-full flex-1 flex-col">
            <div className="flex-1">{children}</div>
            <footer className="px-4 pb-6 pt-2 text-center md:px-6">
              <FooterCopy />
            </footer>
          </div>
          <ChatWidget />
        </ChatUiProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function FooterCopy() {
  const { language } = useLanguage();
  return (
    <p className="text-xs tracking-[0.12em] text-[#8f84bc] dark:text-muted-foreground">
      {language === "fr"
        ? "© 2026 CodeParty. Tous droits réservés."
        : "© 2026 CodeParty. All rights reserved."}
    </p>
  );
}
