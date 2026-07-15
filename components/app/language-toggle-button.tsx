"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/app/language-provider";

export function LanguageToggleButton() {
  const { language, toggleLanguage } = useLanguage();
  const nextLanguage = language === "en" ? "fr" : "en";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleLanguage}
      title={language === "en" ? "Passer en français" : "Switch to English"}
      aria-label={language === "en" ? "Passer en français" : "Switch to English"}
      className="size-11 rounded-full border-[#e7e1f6] bg-white text-[#5f4c9b] hover:bg-[#f7f4ff] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#f2f2f5] dark:hover:bg-[#23232c]"
    >
      <span className="text-base leading-none" aria-hidden="true">
        {nextLanguage === "fr" ? "🇫🇷" : "🇬🇧"}
      </span>
    </Button>
  );
}
