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

export function formatLanguageValue(language: string | null | undefined) {
  if (language === "fr_en") return "Français & English";
  if (language === "fr") return "Français";
  if (language === "en") return "English";
  return "Not selected";
}

export function formatProjectTypeValue(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatProjectTypeList(values: string[] | null | undefined) {
  if (!values || values.length === 0) {
    return "Not selected";
  }

  return values.map((item) => formatProjectTypeValue(item)).join(", ");
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
