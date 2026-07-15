"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ChatUiContextValue = {
  isOpen: boolean;
  unreadCount: number;
  isBrowserTabActive: boolean;
  openWidget: () => void;
  minimizeWidget: () => void;
  incrementUnread: () => void;
  resetUnread: () => void;
};

const CHAT_WIDGET_STATE_KEY = "codeparty.chat-widget.open";

const ChatUiContext = createContext<ChatUiContextValue | null>(null);

export function ChatUiProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return window.sessionStorage.getItem(CHAT_WIDGET_STATE_KEY) === "open";
    } catch {
      return false;
    }
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBrowserTabActive, setIsBrowserTabActive] = useState(true);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        CHAT_WIDGET_STATE_KEY,
        isOpen ? "open" : "minimized"
      );
    } catch {}
  }, [isOpen]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsBrowserTabActive(document.visibilityState === "visible");
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const openWidget = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const minimizeWidget = useCallback(() => {
    setIsOpen(false);
  }, []);

  const incrementUnread = useCallback(() => {
    setUnreadCount((current) => current + 1);
  }, []);

  const resetUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const value = useMemo<ChatUiContextValue>(
    () => ({
      isOpen,
      unreadCount,
      isBrowserTabActive,
      openWidget,
      minimizeWidget,
      incrementUnread,
      resetUnread,
    }),
    [
      incrementUnread,
      isBrowserTabActive,
      isOpen,
      minimizeWidget,
      openWidget,
      resetUnread,
      unreadCount,
    ]
  );

  return <ChatUiContext.Provider value={value}>{children}</ChatUiContext.Provider>;
}

export function useChatUi() {
  const context = useContext(ChatUiContext);

  if (!context) {
    throw new Error("useChatUi must be used inside ChatUiProvider");
  }

  return context;
}
