export const profileLanguageOptions = [
  { label: "English", value: "en" },
  { label: "Français", value: "fr" },
] as const;

export const profileProjectTypeOptions = [
  {
    label: "Web app",
    value: "web_app",
    description: "Browser-based products and SaaS experiences.",
  },
  {
    label: "Mobile app",
    value: "mobile_app",
    description: "iOS, Android, or cross-platform mobile products.",
  },
  {
    label: "API",
    value: "api",
    description: "Backend-first services, integrations, and endpoints.",
  },
  {
    label: "AI app",
    value: "ai_app",
    description: "Products with AI in the core workflow.",
  },
] as const;

export function getProfileLanguageOptions(locale: "en" | "fr" = "en") {
  return profileLanguageOptions.map((option) => ({
    ...option,
    label:
      locale === "fr"
        ? option.value === "en"
          ? "Anglais"
          : "Français"
        : option.value === "en"
          ? "English"
          : "French",
  }));
}

export function getProfileProjectTypeOptions(locale: "en" | "fr" = "en") {
  if (locale === "fr") {
    return profileProjectTypeOptions.map((option) => {
      if (option.value === "web_app") {
        return {
          ...option,
          label: "Application web",
          description: "Produits web, plateformes SaaS et expériences dans le navigateur.",
        };
      }

      if (option.value === "mobile_app") {
        return {
          ...option,
          label: "Application mobile",
          description: "Produits iOS, Android ou mobiles cross-platform.",
        };
      }

      if (option.value === "api") {
        return {
          ...option,
          label: "API",
          description: "Services backend, intégrations et endpoints.",
        };
      }

      return {
        ...option,
        label: "Application IA",
        description: "Produits où l’IA fait partie du flux principal.",
      };
    });
  }

  return [...profileProjectTypeOptions];
}

export const profileTimezoneOptions = [
  { value: "America/Toronto", label: "Toronto (Eastern Time)" },
  { value: "America/Montreal", label: "Montreal (Eastern Time)" },
  { value: "America/New_York", label: "New York (Eastern Time)" },
  { value: "America/Chicago", label: "Chicago (Central Time)" },
  { value: "America/Denver", label: "Denver (Mountain Time)" },
  { value: "America/Los_Angeles", label: "Los Angeles (Pacific Time)" },
  { value: "America/Vancouver", label: "Vancouver (Pacific Time)" },
  { value: "Europe/London", label: "London (Greenwich Mean Time)" },
  { value: "Europe/Paris", label: "Paris (Central European Time)" },
  { value: "Europe/Berlin", label: "Berlin (Central European Time)" },
  { value: "Europe/Madrid", label: "Madrid (Central European Time)" },
  { value: "Africa/Casablanca", label: "Casablanca (Western European Time)" },
  { value: "Asia/Tokyo", label: "Tokyo (Japan Time)" },
  { value: "Asia/Dubai", label: "Dubai (Gulf Time)" },
  { value: "Asia/Kolkata", label: "Mumbai (India Standard Time)" },
  { value: "Australia/Sydney", label: "Sydney (Australian Eastern Time)" },
] as const;

export type ProfileLanguageValue = "fr" | "en" | "fr_en";
export type SelectableLanguage = "fr" | "en";
export type ProfileProjectTypeValue =
  | "web_app"
  | "mobile_app"
  | "api"
  | "ai_app";

export function deriveLanguageValue(
  selectedLanguages: SelectableLanguage[]
): ProfileLanguageValue | null {
  const hasFrench = selectedLanguages.includes("fr");
  const hasEnglish = selectedLanguages.includes("en");

  if (hasFrench && hasEnglish) return "fr_en";
  if (hasFrench) return "fr";
  if (hasEnglish) return "en";
  return null;
}

export function parseLanguageValue(
  language: ProfileLanguageValue | null | undefined
): SelectableLanguage[] {
  if (language === "fr_en") return ["fr", "en"];
  if (language === "fr") return ["fr"];
  if (language === "en") return ["en"];
  return [];
}

export function formatLanguageValue(
  language: string | null | undefined,
  locale: "en" | "fr" = "en"
) {
  if (locale === "fr") {
    if (language === "fr_en") return "Français et anglais";
    if (language === "fr") return "Français";
    if (language === "en") return "Anglais";
    return "Non sélectionné";
  }

  if (language === "fr_en") return "French & English";
  if (language === "fr") return "French";
  if (language === "en") return "English";
  return "Not selected";
}

export function formatProjectTypeValue(value: string, locale: "en" | "fr" = "en") {
  if (locale === "fr") {
    if (value === "web_app") return "Application web";
    if (value === "mobile_app") return "Application mobile";
    if (value === "api") return "API";
    if (value === "ai_app") return "Application IA";
  } else {
    if (value === "web_app") return "Web app";
    if (value === "mobile_app") return "Mobile app";
    if (value === "api") return "API";
    if (value === "ai_app") return "AI app";
  }

  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatProjectTypeList(
  values: string[] | null | undefined,
  locale: "en" | "fr" = "en"
) {
  if (!values || values.length === 0) {
    return locale === "fr" ? "Non sélectionné" : "Not selected";
  }

  return values.map((item) => formatProjectTypeValue(item, locale)).join(", ");
}

export function getDetectedTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Toronto";
  } catch {
    return "America/Toronto";
  }
}

export function getTimezonePreview(timezone: string | null | undefined) {
  if (!timezone) {
    return "Not shared";
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      weekday: "short",
    }).format(new Date());
  } catch {
    return "Unavailable";
  }
}

export function formatTimezoneValue(timezone: string | null | undefined) {
  if (!timezone) {
    return "Not shared";
  }

  const option = profileTimezoneOptions.find((item) => item.value === timezone);
  return option?.label ?? timezone;
}
