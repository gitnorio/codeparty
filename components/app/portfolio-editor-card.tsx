"use client";

import { ChevronDown, Loader2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { useLanguage } from "@/components/app/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  deriveLanguageValue,
  formatProjectTypeList,
  getProfileLanguageOptions,
  getProfileProjectTypeOptions,
  getTimezonePreview,
  parseLanguageValue,
  profileTimezoneOptions,
  type ProfileLanguageValue,
  type ProfileProjectTypeValue,
  type SelectableLanguage,
} from "@/lib/profile-options";
import {
  formatTechnologyGroupLabel,
  formatTechnologyLabel,
  maxSelectedSkills,
  technologyGroups,
} from "@/lib/technology-options";

export type PortfolioEditorFormData = {
  bio: string;
  location: string;
  resume_path: string | null;
  show_location_on_portfolio: boolean;
  language: ProfileLanguageValue;
  timezone: string;
  show_timezone_on_portfolio: boolean;
  skills: string[];
  project_types: ProfileProjectTypeValue[];
};

export function PortfolioEditorCard({
  formData,
  onChange,
  onResumeSelected,
  onResumeDelete,
  onCancel,
  onSave,
  isSaving,
  resumeLabel,
  hasResume = false,
}: {
  formData: PortfolioEditorFormData;
  onChange: (next: PortfolioEditorFormData) => void;
  onResumeSelected: (file: File | null) => void;
  onResumeDelete: () => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  resumeLabel?: string;
  hasResume?: boolean;
}) {
  const [showTechnicalStack, setShowTechnicalStack] = useState(false);
  const { language } = useLanguage();
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const timezonePreview = useMemo(
    () => getTimezonePreview(formData.timezone),
    [formData.timezone]
  );
  const languageOptions = useMemo(() => getProfileLanguageOptions(language), [language]);
  const projectTypeOptions = useMemo(() => getProfileProjectTypeOptions(language), [language]);
  const selectedLanguages = useMemo(
    () => parseLanguageValue(formData.language),
    [formData.language]
  );

  function toggleLanguage(language: SelectableLanguage) {
    const exists = selectedLanguages.includes(language);
    const nextSelectedLanguages = exists
      ? selectedLanguages.filter((item) => item !== language)
      : [...selectedLanguages, language].sort();
    const nextLanguage = deriveLanguageValue(nextSelectedLanguages);

    if (!nextLanguage) {
      return;
    }

    onChange({
      ...formData,
      language: nextLanguage,
    });
  }

  function toggleSkill(skill: string) {
    const exists = formData.skills.includes(skill);

    if (!exists && formData.skills.length >= maxSelectedSkills) {
      return;
    }

    onChange({
      ...formData,
      skills: exists
        ? formData.skills.filter((item) => item !== skill)
        : [...formData.skills, skill],
    });
  }

  function toggleProjectType(projectType: ProfileProjectTypeValue) {
    const exists = formData.project_types.includes(projectType);
    onChange({
      ...formData,
      project_types: exists
        ? formData.project_types.filter((item) => item !== projectType)
        : [...formData.project_types, projectType],
    });
  }

  return (
    <Card className="mt-5 border border-[#ece8f8] bg-white shadow-[0_24px_80px_rgba(113,87,255,0.06)] dark:border-[#27272f] dark:bg-[#16161d]">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5]">
            {language === "fr" ? "Modifier votre portfolio" : "Edit your portfolio"}
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-app-secondary">
            {language === "fr"
              ? "Mettez à jour votre intro publique et les détails déjà enregistrés dans CodeParty."
              : "Update your public intro and the profile details already stored in CodeParty."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <Field label={language === "fr" ? "Bio" : "Bio"}>
          <textarea
            value={formData.bio}
            onChange={(event) =>
              onChange({ ...formData, bio: event.target.value.slice(0, 500) })
            }
            maxLength={500}
            rows={4}
            placeholder={
              language === "fr"
                ? "Écrivez une courte introduction pour votre portfolio."
                : "Write a short introduction for your portfolio."
            }
            className="w-full rounded-[0.95rem] border border-[#e8e2f7] bg-[#fcfbff] px-3.5 py-2.5 text-sm text-[#1f1c38] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#f2f2f5]"
          />
          <p className="text-xs text-app-meta">{formData.bio.length}/500</p>
        </Field>

        <Field label={language === "fr" ? "CV (PDF, max 500 Ko)" : "Resume (PDF, max 500 KB)"}>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={resumeInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                onResumeSelected(file);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => resumeInputRef.current?.click()}
            >
              {language === "fr" ? "Importer le CV" : "Upload resume"}
            </Button>
            <p className="text-xs text-app-meta">
              {resumeLabel ??
                (formData.resume_path
                  ? language === "fr"
                    ? "CV importé"
                    : "Resume uploaded"
                  : language === "fr"
                    ? "Aucun CV importé pour le moment"
                    : "No resume uploaded yet")}
            </p>
            {hasResume ? (
              <button
                type="button"
                onClick={onResumeDelete}
                title={language === "fr" ? "Supprimer le CV" : "Delete resume"}
                aria-label={language === "fr" ? "Supprimer le CV" : "Delete resume"}
                className="inline-flex size-7 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label={language === "fr" ? "Localisation" : "Location"}>
            <div className="grid gap-2">
              <input
                value={formData.location}
                onChange={(event) =>
                  onChange({ ...formData, location: event.target.value.slice(0, 120) })
                }
                maxLength={120}
                placeholder={language === "fr" ? "Montréal, Canada" : "Montreal, Canada"}
                className="h-10 w-full rounded-[0.95rem] border border-[#e8e2f7] bg-[#fcfbff] px-3.5 text-sm text-[#1f1c38] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#f2f2f5]"
              />
              <p className="text-xs text-app-meta">{formData.location.length}/120</p>
              <VisibilityToggle
                label={
                  language === "fr"
                    ? "Masquer la localisation dans le portfolio"
                    : "Hide location from portfolio"
                }
                checked={!formData.show_location_on_portfolio}
                onToggle={() =>
                  onChange({
                    ...formData,
                    show_location_on_portfolio: !formData.show_location_on_portfolio,
                  })
                }
              />
            </div>
          </Field>

          <Field label={language === "fr" ? "Fuseau horaire" : "Timezone"}>
            <div className="grid gap-2">
              <select
                value={formData.timezone}
                onChange={(event) => onChange({ ...formData, timezone: event.target.value })}
                className="h-10 w-full rounded-[0.95rem] border border-[#e8e2f7] bg-[#fcfbff] px-3.5 text-sm text-[#1f1c38] dark:border-[#27272f] dark:bg-[#1a1a22] dark:text-[#f2f2f5]"
              >
                {profileTimezoneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <VisibilityToggle
                label={
                  language === "fr"
                    ? "Masquer le fuseau horaire dans le portfolio"
                    : "Hide timezone from portfolio"
                }
                checked={!formData.show_timezone_on_portfolio}
                onToggle={() =>
                  onChange({
                    ...formData,
                    show_timezone_on_portfolio: !formData.show_timezone_on_portfolio,
                  })
                }
              />
              <p className="text-xs text-app-meta">
                {language === "fr" ? "Heure locale actuelle :" : "Current local time:"} {timezonePreview}
              </p>
            </div>
          </Field>
        </div>

        <Field label={language === "fr" ? "Langues" : "Languages"}>
          <div className="flex flex-wrap gap-2">
            {languageOptions.map((option) => {
              const active = selectedLanguages.includes(option.value);
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

        <Field label={language === "fr" ? "Types de projet" : "Project types"}>
          <div className="grid gap-3 sm:grid-cols-2">
            {projectTypeOptions.map((option) => {
              const active = formData.project_types.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleProjectType(option.value)}
                  className={
                    active
                      ? "rounded-[1rem] border border-[#8d78ff] bg-[#f1ebff] px-4 py-3 text-left shadow-[0_14px_32px_rgba(123,97,255,0.10)] dark:border-[#6d5ce8] dark:bg-[#2a2340]"
                      : "rounded-[1rem] border border-[#ece8f8] bg-[#fcfbff] px-4 py-3 text-left dark:border-[#27272f] dark:bg-[#1a1a22]"
                  }
                >
                  <p className="text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">{option.label}</p>
                  <p className="mt-1 text-xs leading-6 text-app-secondary">{option.description}</p>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-app-meta">
            {language === "fr" ? "Sélection :" : "Selected:"} {formatProjectTypeList(formData.project_types, language)}
          </p>
        </Field>

        <Field label={language === "fr" ? "Stack technique" : "Technical stack"}>
          <div className="rounded-[1rem] border border-[#ece8f8] bg-[#fcfbff] dark:border-[#27272f] dark:bg-[#1a1a22]">
            <button
              type="button"
              onClick={() => setShowTechnicalStack((current) => !current)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div>
                <p className="text-sm font-medium text-[#1f1c38] dark:text-[#f2f2f5]">
                  {language === "fr" ? "Technologies sélectionnées" : "Selected technologies"}
                </p>
                <p className="mt-1 text-xs text-app-meta">
                  {formData.skills.length > 0
                    ? `${formData.skills.length} / ${maxSelectedSkills} ${language === "fr" ? "sélectionnées" : "selected"}`
                    : language === "fr"
                      ? "Aucune technologie sélectionnée"
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
                      className="rounded-full border border-[#e8e2f7] bg-white px-3 py-1.5 text-xs font-medium text-[#5b45d9] dark:border-[#27272f] dark:bg-[#16161d] dark:text-[#b8acff]"
                    >
                      {formatTechnologyLabel(skill, language)} ×
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-app-meta">
                    {language === "fr"
                      ? "Choisissez parmi les technologies prédéfinies ci-dessous."
                      : "Choose from the predefined technologies below."}
                  </p>
                )}
              </div>
            </div>

            {showTechnicalStack ? (
              <div className="border-t border-[#ece8f8] px-4 py-4 dark:border-[#27272f]">
                <div className="grid gap-4">
                  {technologyGroups.map((group) => (
                    <div key={group.label}>
                      <p className="mb-2 text-sm font-medium text-app-secondary">
                        {formatTechnologyGroupLabel(group.label, language)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.technologies.map((tech) => {
                          const selected = formData.skills.includes(tech);
                          const labelValue = formatTechnologyLabel(tech, language);

                          return (
                            <button
                              key={tech}
                              type="button"
                              onClick={() => toggleSkill(tech)}
                              className={
                                selected
                                  ? "rounded-full border border-[#8d78ff] bg-[#f1ebff] px-3 py-1.5 text-xs font-medium text-[#5b45d9] dark:border-[#6d5ce8] dark:bg-[#2a2340] dark:text-[#b8acff]"
                                  : "rounded-full border border-[#e8e2f7] bg-white px-3 py-1.5 text-xs font-medium text-[#5f587f] dark:border-[#27272f] dark:bg-[#16161d] dark:text-muted-foreground"
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

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            {language === "fr" ? "Annuler" : "Cancel"}
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            {isSaving
              ? language === "fr"
                ? "Enregistrement..."
                : "Saving..."
              : language === "fr"
                ? "Enregistrer les modifications"
                : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function VisibilityToggle({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex w-fit items-center gap-2 text-xs font-medium text-app-secondary transition hover:text-[#5b45d9] dark:hover:text-[#b8acff]"
    >
      <span
        className={`flex size-4 items-center justify-center rounded border ${
          checked
            ? "border-[#8d78ff] bg-[#7650ff] text-white dark:border-[#6d5ce8] dark:bg-[#6d5ce8]"
            : "border-[#d7d1eb] bg-white text-transparent dark:border-[#3a3450] dark:bg-[#1a1a22]"
        }`}
      >
        ✓
      </span>
      {label}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2.5">
      <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-app-meta">
        {label}
      </Label>
      {children}
    </div>
  );
}
