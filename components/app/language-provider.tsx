"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type AppLanguage = "en" | "fr";

type LanguageContextValue = {
  language: AppLanguage;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const storageKey = "codeparty-language";
const languageChangeEvent = "codeparty-language-change";

function getLanguageSnapshot(): AppLanguage {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLanguage = window.localStorage.getItem(storageKey);
  if (storedLanguage === "en" || storedLanguage === "fr") {
    return storedLanguage;
  }

  return window.navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}

function subscribeToLanguage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      onStoreChange();
    }
  };

  const handleLanguageChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(languageChangeEvent, handleLanguageChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(languageChangeEvent, handleLanguageChange);
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore<AppLanguage>(
    subscribeToLanguage,
    getLanguageSnapshot,
    () => "en"
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      toggleLanguage: () => {
        const nextLanguage: AppLanguage = language === "en" ? "fr" : "en";
        window.localStorage.setItem(storageKey, nextLanguage);
        window.dispatchEvent(new Event(languageChangeEvent));
      },
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
