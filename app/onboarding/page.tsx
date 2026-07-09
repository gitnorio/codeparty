"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock3, Globe2, Loader2, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  profileGoalOptions,
  profileLanguageOptions,
  profileLevelOptions,
  profileProjectTypeOptions,
} from "@/lib/profile-options";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type ProfileFormState = {
  displayName: string;
  level: (typeof profileLevelOptions)[number];
  skills: string[];
  goal: (typeof profileGoalOptions)[number];
  availabilityPerWeek: number;
  language: (typeof profileLanguageOptions)[number];
  timezone: string;
  projectType: (typeof profileProjectTypeOptions)[number];
};

const initialFormState: ProfileFormState = {
  displayName: "",
  level: "junior",
  skills: [],
  goal: "fullstack",
  availabilityPerWeek: 10,
  language: "fr",
  timezone: "America/Toronto",
  projectType: "web_app",
};

const popularSkills = [
  "React",
  "Next.js",
  "TypeScript",
  "TailwindCSS",
  "Node.js",
  "Supabase",
  "PostgreSQL",
  "Python",
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [formState, setFormState] = useState<ProfileFormState>(initialFormState);
  const [skillInput, setSkillInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function prepareOnboarding() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        setErrorMessage(sessionError.message);
        setIsLoading(false);
        return;
      }

      if (!session?.user) {
        router.replace("/");
        return;
      }

      const githubName =
        session.user.user_metadata.full_name ??
        session.user.user_metadata.user_name ??
        session.user.user_metadata.preferred_username ??
        "";

      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data) {
        router.replace("/dashboard");
        return;
      }

      let userTimezone = "America/Toronto";
      try {
        userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || userTimezone;
      } catch {}

      setFormState((current) => ({
        ...current,
        displayName: current.displayName || githubName,
        timezone: userTimezone,
      }));
      setIsLoading(false);
    }

    void prepareOnboarding();
  }, [router, supabase]);

  function addSkill(skillName: string) {
    const trimmed = skillName.trim();
    if (!trimmed) return;
    if (formState.skills.some((skill) => skill.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput("");
      return;
    }

    setFormState((current) => ({
      ...current,
      skills: [...current.skills, trimmed],
    }));
    setSkillInput("");
  }

  function removeSkill(indexToRemove: number) {
    setFormState((current) => ({
      ...current,
      skills: current.skills.filter((_, index) => index !== indexToRemove),
    }));
  }

  function handleSkillKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill(skillInput);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setErrorMessage(sessionError.message);
      setIsSubmitting(false);
      return;
    }

    if (!session?.user) {
      router.replace("/");
      setIsSubmitting(false);
      return;
    }

    const profilePayload: Database["public"]["Tables"]["profiles"]["Insert"] = {
      id: session.user.id,
      display_name: formState.displayName.trim(),
      level: formState.level,
      skills: formState.skills,
      goal: formState.goal,
      availability_per_week: formState.availabilityPerWeek,
      language: formState.language,
      timezone: formState.timezone.trim(),
      project_type: formState.projectType,
    };

    const { error } = await supabase.from("profiles").insert(profilePayload);

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/dashboard");
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fbfaff] px-4 py-4 md:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl items-center justify-center rounded-[2.25rem] border border-[#ece8f8] bg-white">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="size-8 animate-spin text-[#7650ff]" />
            <p className="text-sm tracking-wide text-[#6a6683]">
              Preparing your developer profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaff] px-4 py-4 md:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 rounded-[2.25rem] border border-[#ece8f8] bg-white p-5 shadow-[0_30px_100px_rgba(113,87,255,0.08)] lg:grid-cols-[0.92fr_1.08fr] lg:p-6">
        <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#7448ff_0%,#8e6bff_100%)] text-white shadow-none">
          <CardHeader className="pb-5">
            <Badge className="w-fit rounded-full bg-white/14 text-white hover:bg-white/14">
              Onboarding
            </Badge>
            <CardTitle className="mt-4 text-5xl leading-[1] tracking-[-0.05em]">
              Build a profile that helps us place you in the right team.
            </CardTitle>
            <CardDescription className="text-lg leading-8 text-white/82">
              Ton compte GitHub est prêt. Il manque maintenant les signaux
              produit qui serviront au matchmaking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DarkStep
              icon={Target}
              title="Clear role"
              description="On veut savoir si tu avances surtout en frontend, backend, fullstack ou mobile."
            />
            <DarkStep
              icon={Clock3}
              title="Real availability"
              description="La disponibilité hebdomadaire est le meilleur filtre pour construire une équipe sérieuse."
            />
            <DarkStep
              icon={Globe2}
              title="Shared context"
              description="Langue et timezone servent à éviter les équipes qui ne peuvent pas réellement collaborer."
            />

            <div className="grid gap-3 pt-3 sm:grid-cols-3">
              <MiniPurpleStat value="3-5" label="members" />
              <MiniPurpleStat value="1" label="project" />
              <MiniPurpleStat value="CV" label="proof" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#ece8f8] bg-[#fffefe] shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Badge variant="outline" className="rounded-full bg-[#f6f2ff] text-[#7650ff]">
                  Profile setup
                </Badge>
                <CardTitle className="mt-4 text-4xl tracking-[-0.05em] text-[#1f1c38]">
                  Complete your profile
                </CardTitle>
              </div>
              <div className="rounded-[1.5rem] bg-[#f7f3ff] px-5 py-4 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8f84bc]">Step</p>
                <p className="mt-1 text-3xl font-semibold text-[#7650ff]">02</p>
              </div>
            </div>
            <CardDescription className="text-base leading-7 text-[#6a6683]">
              This profile is what turns simple authentication into a usable matchmaking signal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-5">
              <Field label="Display name">
                <Input
                  required
                  value={formState.displayName}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl border-[#e8e2f7] bg-[#fcfbff]"
                  placeholder="Ex. Alex Martin"
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Level">
                  <Select
                    value={formState.level}
                    onValueChange={(value) =>
                      setFormState((current) => ({
                        ...current,
                        level: value as ProfileFormState["level"],
                      }))
                    }
                  >
                    <SelectTrigger className="h-12 w-full rounded-2xl border-[#e8e2f7] bg-[#fcfbff]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {profileLevelOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Primary goal">
                  <Select
                    value={formState.goal}
                    onValueChange={(value) =>
                      setFormState((current) => ({
                        ...current,
                        goal: value as ProfileFormState["goal"],
                      }))
                    }
                  >
                    <SelectTrigger className="h-12 w-full rounded-2xl border-[#e8e2f7] bg-[#fcfbff]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {profileGoalOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Skills">
                <div className="grid gap-3">
                  <Input
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    className="h-12 rounded-2xl border-[#e8e2f7] bg-[#fcfbff]"
                    placeholder="Add a skill, then press Enter"
                  />
                  <div className="flex flex-wrap gap-2">
                    {popularSkills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="rounded-full bg-[#f3eeff] px-3 py-1.5 text-xs font-medium text-[#7650ff] transition hover:bg-[#eadfff]"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </Field>

              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Hours / week">
                  <Input
                    required
                    min={1}
                    max={40}
                    type="number"
                    value={formState.availabilityPerWeek}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        availabilityPerWeek: Number(event.target.value),
                      }))
                    }
                    className="h-12 rounded-2xl border-[#e8e2f7] bg-[#fcfbff]"
                  />
                </Field>

                <Field label="Language">
                  <Select
                    value={formState.language}
                    onValueChange={(value) =>
                      setFormState((current) => ({
                        ...current,
                        language: value as ProfileFormState["language"],
                      }))
                    }
                  >
                    <SelectTrigger className="h-12 w-full rounded-2xl border-[#e8e2f7] bg-[#fcfbff]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {profileLanguageOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Project type">
                  <Select
                    value={formState.projectType}
                    onValueChange={(value) =>
                      setFormState((current) => ({
                        ...current,
                        projectType: value as ProfileFormState["projectType"],
                      }))
                    }
                  >
                    <SelectTrigger className="h-12 w-full rounded-2xl border-[#e8e2f7] bg-[#fcfbff]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {profileProjectTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Timezone">
                <Input
                  required
                  value={formState.timezone}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      timezone: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl border-[#e8e2f7] bg-[#fcfbff]"
                  placeholder="America/Toronto"
                />
              </Field>

              {formState.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formState.skills.map((skill, index) => (
                    <button
                      key={`${skill}-${index}`}
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="rounded-full border border-[#e3dcf5] bg-white px-3 py-1.5 text-xs font-medium text-[#3b3458]"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="flex items-center gap-3 text-sm text-[#504b6b]">
                <div className="flex size-5 items-center justify-center rounded-md bg-[#eee8ff] text-[#7650ff]">
                  <Check className="size-3" />
                </div>
                Used only for team matching and project alignment
              </div>

              {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-14 rounded-full bg-[#7650ff] text-lg text-white hover:bg-[#6744f0]"
              >
                {isSubmitting ? "Creating profile..." : "Create my profile"}
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
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
      <Label className="text-sm font-medium text-[#3f3a5b]">{label}</Label>
      {children}
    </div>
  );
}

function DarkStep({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Target;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white/12 p-2 text-white">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-lg font-medium text-white">{title}</p>
          <p className="mt-1 text-sm leading-7 text-white/80">{description}</p>
        </div>
      </div>
    </div>
  );
}

function MiniPurpleStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4 text-center">
      <p className="text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/72">{label}</p>
    </div>
  );
}
