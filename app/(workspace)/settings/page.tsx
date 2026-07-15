"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import {
  useWorkspaceProfile,
  useWorkspaceProfileActions,
} from "@/components/app/workspace-shell";
import { FeedbackBanner } from "@/components/app/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { AppProfile } from "@/lib/profile";
import {
  deriveLanguageValue,
  formatProjectTypeList,
  getTimezonePreview,
  parseLanguageValue,
  profileLanguageOptions,
  profileProjectTypeOptions,
  profileTimezoneOptions,
  type ProfileProjectTypeValue,
  type SelectableLanguage,
} from "@/lib/profile-options";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { maxSelectedSkills, technologyGroups } from "@/lib/technology-options";

type SettingsFormData = {
  display_name: string;
  avatar_url: string;
  skills: string[];
  selectedLanguages: SelectableLanguage[];
  timezone: string;
  project_types: ProfileProjectTypeValue[];
};

export default function SettingsPage() {
  const profile = useWorkspaceProfile();
  const { updateProfile } = useWorkspaceProfileActions();
  const supabase = getSupabaseBrowserClient();
  const [formData, setFormData] = useState<SettingsFormData>({
    display_name: profile.display_name,
    avatar_url: profile.avatar_url ?? "",
    skills: profile.skills,
    selectedLanguages: parseLanguageValue(profile.language),
    timezone: profile.timezone,
    project_types: profile.project_type,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showTechnicalStack, setShowTechnicalStack] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const timezonePreview = useMemo(
    () => getTimezonePreview(formData.timezone),
    [formData.timezone]
  );

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const language = deriveLanguageValue(formData.selectedLanguages);

    if (!language) {
      setErrorMessage("Select at least one language.");
      setIsSaving(false);
      return;
    }

    const payload = {
      avatar_url: formData.avatar_url.trim() || null,
      skills: formData.skills,
      language,
      timezone: formData.timezone,
      project_type: formData.project_types,
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", profile.id)
      .select("*")
      .single<AppProfile>();

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    if (data) {
      setFormData({
        display_name: data.display_name,
        avatar_url: data.avatar_url ?? "",
        skills: data.skills,
        selectedLanguages: parseLanguageValue(data.language),
        timezone: data.timezone,
        project_types: data.project_type,
      });
      updateProfile(data);
    }

    setSuccessMessage("Profile settings saved.");
    setIsSaving(false);
  }

  function toggleSkill(skill: string) {
    setErrorMessage(null);

    setFormData((current) => {
      const exists = current.skills.includes(skill);

      if (!exists && current.skills.length >= maxSelectedSkills) {
        setErrorMessage(`You can select up to ${maxSelectedSkills} technologies.`);
        return current;
      }

      return {
        ...current,
        skills: exists
          ? current.skills.filter((item) => item !== skill)
          : [...current.skills, skill],
      };
    });
  }

  function toggleLanguage(language: SelectableLanguage) {
    setFormData((current) => {
      const exists = current.selectedLanguages.includes(language);
      return {
        ...current,
        selectedLanguages: exists
          ? current.selectedLanguages.filter((item) => item !== language)
          : [...current.selectedLanguages, language].sort(),
      };
    });
  }

  function toggleProjectType(projectType: ProfileProjectTypeValue) {
    setFormData((current) => {
      const exists = current.project_types.includes(projectType);
      return {
        ...current,
        project_types: exists
          ? current.project_types.filter((item) => item !== projectType)
          : [...current.project_types, projectType],
      };
    });
  }

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none dark:bg-[linear-gradient(135deg,#6d5ce8_0%,#5f50d2_100%)]">
        <CardHeader>
          <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
            Control your profile and preferences.
          </CardTitle>
          <CardDescription className="mt-2 max-w-2xl text-base leading-7 text-white/82">
            Keep your public profile accurate. Everything here can be updated anytime.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border border-[#ece8f8] shadow-none dark:border-[#27272f] dark:bg-[#1a1a22]">
        <CardHeader>
          <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
            Profile settings
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-app-secondary">
            Update the information saved from onboarding.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <Field label="Languages">
            <div className="flex flex-wrap gap-2">
              {profileLanguageOptions.map((option) => {
                const active = formData.selectedLanguages.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleLanguage(option.value)}
                    className={
                      active
                        ? "rounded-full border border-[#8d78ff] bg-[#f1ebff] px-3 py-1.5 text-xs font-medium text-[#5b45d9] dark:border-[#6d5ce8] dark:bg-[#2a2340] dark:text-[#b8acff]"
                        : "rounded-full border border-[#e8e2f7] bg-white px-3 py-1.5 text-xs font-medium text-[#5f587f] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-muted-foreground"
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Timezone">
            <select
              value={formData.timezone}
              onChange={(event) =>
                setFormData((current) => ({ ...current, timezone: event.target.value }))
              }
              className="h-10 w-full max-w-[25rem] rounded-[0.9rem] border border-[#e8e2f7] bg-[#fcfbff] px-3.5 text-sm text-[#1f1c38] dark:border-[#27272f] dark:bg-[#16161d] dark:text-[#f2f2f5]"
            >
              {profileTimezoneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-app-meta">Current local time: {timezonePreview}</p>
          </Field>

          <Field label="Project types">
            <div className="grid max-w-[44rem] gap-3 sm:grid-cols-2">
              {profileProjectTypeOptions.map((option) => {
                const active = formData.project_types.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleProjectType(option.value)}
                    className={
                      active
                        ? "rounded-[1rem] border border-[#8d78ff] bg-[#f1ebff] px-4 py-3 text-left shadow-[0_14px_32px_rgba(123,97,255,0.10)] dark:border-[#6d5ce8] dark:bg-[#2a2340]"
                        : "rounded-[1rem] border border-[#ece8f8] bg-[#fcfbff] px-4 py-3 text-left dark:border-[#27272f] dark:bg-[#16161d]"
                    }
                  >
                    <p className="text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">{option.label}</p>
                    <p className="mt-1 text-xs leading-6 text-app-secondary">{option.description}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-app-meta">
              Selected: {formatProjectTypeList(formData.project_types)}
            </p>
          </Field>

          <Field label="Technical stack">
            <div className="max-w-[46rem] rounded-[1rem] border border-[#ece8f8] bg-[#fcfbff] dark:border-[#27272f] dark:bg-[#16161d]">
              <button
                type="button"
                onClick={() => setShowTechnicalStack((current) => !current)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">Selected technologies</p>
                  <p className="mt-1 text-xs text-app-meta">
                    {formData.skills.length > 0
                      ? `${formData.skills.length} / ${maxSelectedSkills} selected`
                      : "No technologies selected yet"}
                  </p>
                </div>
                <ChevronDown
                  className={`size-4 text-app-meta transition-transform dark:text-muted-foreground ${showTechnicalStack ? "rotate-180" : ""}`}
                />
              </button>

              <div className="border-t border-[#ece8f8] px-4 py-3 dark:border-[#27272f]">
                <div className="flex flex-wrap gap-2">
                  {formData.skills.length > 0 ? (
                    formData.skills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className="rounded-full border border-[#e8e2f7] bg-white px-3 py-1.5 text-xs font-medium text-[#5b45d9] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#b8acff]"
                      >
                        {skill.replaceAll(": Other", " · Other")} ×
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-app-meta">
                      Choose from the predefined technologies below.
                    </p>
                  )}
                </div>
              </div>

              {showTechnicalStack ? (
                <div className="border-t border-[#ece8f8] px-4 py-4 dark:border-[#27272f]">
                  <div className="grid gap-4">
                    {technologyGroups.map((group) => (
                      <div key={group.label}>
                        <p className="mb-2 text-sm font-medium text-app-secondary">{group.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.technologies.map((tech) => {
                            const selected = formData.skills.includes(tech);
                            const labelValue = tech.endsWith(": Other") ? "Other" : tech;

                            return (
                              <button
                                key={tech}
                                type="button"
                                onClick={() => toggleSkill(tech)}
                                className={
                                  selected
                                    ? "rounded-full border border-[#8d78ff] bg-[#f1ebff] px-3 py-1.5 text-xs font-medium text-[#5b45d9] dark:border-[#6d5ce8] dark:bg-[#2a2340] dark:text-[#b8acff]"
                                    : "rounded-full border border-[#e8e2f7] bg-white px-3 py-1.5 text-xs font-medium text-[#5f587f] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-muted-foreground"
                                }
                              >
                                {labelValue}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Field>

          {errorMessage ? <FeedbackBanner tone="error" message={errorMessage} /> : null}
          {successMessage ? <FeedbackBanner tone="success" message={successMessage} /> : null}

          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="h-11 w-fit rounded-full bg-[#7650ff] px-5 text-white hover:bg-[#6744f0]"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save settings"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3">
      <Label className="text-sm font-medium text-[#4f496e]">{label}</Label>
      {children}
    </div>
  );
}
