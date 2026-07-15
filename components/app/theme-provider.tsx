"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

type Theme = "light" | "dark";

type ThemeToggleEvent = ReactMouseEvent<HTMLElement> | MouseEvent | undefined;

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: (event?: ThemeToggleEvent) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const storageKey = "codeparty-theme";
const fallbackTransitionClass = "theme-fade";

type ViewTransitionController = {
  ready: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionController;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const storedTheme = window.localStorage.getItem(storageKey);
    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(storageKey, theme);
  }, [theme]);

  const toggleTheme = useCallback(async (event?: ThemeToggleEvent) => {
    const htmlElement = document.documentElement;
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    const currentTarget =
      event && "currentTarget" in event && event.currentTarget instanceof HTMLElement
        ? event.currentTarget
        : null;

    const rect = currentTarget?.getBoundingClientRect();
    const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const originY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY)
    );

    const applyTheme = () => {
      flushSync(() => {
        setTheme(nextTheme);
      });
    };

    const documentWithTransition = document as DocumentWithViewTransition;
    const startViewTransition = documentWithTransition.startViewTransition;

    if (!startViewTransition) {
      htmlElement.classList.add(fallbackTransitionClass);
      applyTheme();
      window.setTimeout(() => {
        htmlElement.classList.remove(fallbackTransitionClass);
      }, 320);
      return;
    }

    const transition = documentWithTransition.startViewTransition?.(() => {
      applyTheme();
    });

    if (!transition) {
      applyTheme();
      return;
    }

    await transition.ready;

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${originX}px ${originY}px)`,
          `circle(${endRadius}px at ${originX}px ${originY}px)`,
        ],
      },
      {
        duration: 600,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
