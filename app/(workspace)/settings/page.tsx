"use client";

import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import {
  useWorkspaceProfile,
  useWorkspaceProfileActions,
} from "@/components/app/workspace-shell";
import { FeedbackBanner } from "@/components/app/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  profileGoalOptions,
  profileLanguageOptions,
  profileLevelOptions,
  profileProjectTypeOptions,
} from "@/lib/profile-options";
import type { AppProfile } from "@/lib/profile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const profile = useWorkspaceProfile();
  const { updateProfile } = useWorkspaceProfileActions();
  const supabase = getSupabaseBrowserClient();
  const [formData, setFormData] = useState<AppProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      display_name: formData.display_name,
      level: formData.level,
      goal: formData.goal,
      availability_per_week: formData.availability_per_week,
      language: formData.language,
      timezone: formData.timezone,
      project_type: formData.project_type,
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
      setFormData(data);
      updateProfile(data);
    }

    setSuccessMessage("Profile settings saved.");
    setIsSaving(false);
  }

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none">
        <CardHeader>
          <Badge className="w-fit rounded-full bg-white/14 text-white hover:bg-white/14">
            Settings
          </Badge>
          <CardTitle className="mt-4 text-5xl leading-[0.96] tracking-[-0.05em]">
            Control your profile and preferences.
          </CardTitle>
          <CardDescription className="mt-2 max-w-2xl text-base leading-7 text-white/82">
            Keep your public identity, matchmaking preferences, and team context accurate.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border border-[#ece8f8] shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl tracking-[-0.05em] text-[#1f1c38]">
            Profile preferences
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-[#6a6683]">
            Update the profile signals that matter for matchmaking and collaboration fit.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Display name">
            <Input
              value={formData.display_name}
              onChange={(event) =>
                setFormData((current) => ({ ...current, display_name: event.target.value }))
              }
              className="h-10 rounded-[0.9rem] border-[#e8e2f7] bg-[#fcfbff] px-3.5"
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Timezone">
              <Input
                value={formData.timezone}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, timezone: event.target.value }))
                }
                className="h-10 rounded-[0.9rem] border-[#e8e2f7] bg-[#fcfbff] px-3.5"
              />
            </Field>
            <Field label="Availability per week">
              <Input
                type="number"
                min={1}
                max={40}
                value={formData.availability_per_week}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    availability_per_week: Number(event.target.value),
                  }))
                }
                className="h-10 rounded-[0.9rem] border-[#e8e2f7] bg-[#fcfbff] px-3.5"
              />
            </Field>
          </div>

          <ChoiceGroup
            label="Level"
            options={profileLevelOptions}
            value={formData.level}
            onSelect={(value) =>
              setFormData((current) => ({
                ...current,
                level: value as AppProfile["level"],
              }))
            }
          />
          <ChoiceGroup
            label="Goal"
            options={profileGoalOptions}
            value={formData.goal}
            onSelect={(value) =>
              setFormData((current) => ({
                ...current,
                goal: value as AppProfile["goal"],
              }))
            }
          />
          <ChoiceGroup
            label="Language"
            options={profileLanguageOptions}
            value={formData.language}
            onSelect={(value) =>
              setFormData((current) => ({
                ...current,
                language: value as AppProfile["language"],
              }))
            }
          />
          <ChoiceGroup
            label="Project type"
            options={profileProjectTypeOptions}
            value={formData.project_type}
            onSelect={(value) =>
              setFormData((current) => ({
                ...current,
                project_type: value as AppProfile["project_type"],
              }))
            }
          />

          {errorMessage ? <FeedbackBanner tone="error" message={errorMessage} /> : null}
          {successMessage ? <FeedbackBanner tone="success" message={successMessage} /> : null}

          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="h-11 rounded-full bg-[#7650ff] text-white hover:bg-[#6744f0]"
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

function ChoiceGroup({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="grid gap-3">
      <Label className="text-sm font-medium text-[#4f496e]">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={
                active
                  ? "rounded-full border border-[#8d78ff] bg-[#f1ebff] px-3 py-1.5 text-xs font-medium text-[#5b45d9]"
                  : "rounded-full border border-[#e8e2f7] bg-white px-3 py-1.5 text-xs font-medium text-[#5f587f]"
              }
            >
              {formatLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
