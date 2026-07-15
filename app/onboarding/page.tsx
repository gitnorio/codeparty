"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Clock3, Code2, Loader2, Moon, Sun } from "lucide-react";

import { LanguageToggleButton } from "@/components/app/language-toggle-button";
import { useLanguage } from "@/components/app/language-provider";
import { Mascot } from "@/components/app/mascot";
import { useTheme } from "@/components/app/theme-provider";
import { Button } from "@/components/ui/button";
import {
  deriveLanguageValue,
  formatLanguageValue,
  formatProjectTypeList,
  getProfileLanguageOptions,
  getProfileProjectTypeOptions,
  getDetectedTimezone,
  getTimezonePreview,
  profileTimezoneOptions,
  type ProfileProjectTypeValue,
  type SelectableLanguage,
} from "@/lib/profile-options";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  formatTechnologyGroupLabel,
  formatTechnologyLabel,
  maxSelectedSkills,
  technologyGroups,
} from "@/lib/technology-options";

type FormData = {
  display_name: string;
  avatar_url: string;
  skills: string[];
  selected_languages: SelectableLanguage[];
  timezone: string;
  project_types: ProfileProjectTypeValue[];
};

const totalSteps = 5;
const stepVariants: Variants = {
  initial: { opacity: 0, x: 44, scale: 0.988 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -44, scale: 0.988 },
};

function extractDisplayName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
} | null) {
  if (!user) return "";

  const metadata = user.user_metadata ?? {};
  const candidates = [
    metadata.user_name,
    metadata.preferred_username,
    metadata.nickname,
    metadata.full_name,
    metadata.name,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  if (typeof user.email === "string" && user.email.includes("@")) {
    return user.email.split("@")[0];
  }

  return "";
}

function extractAvatarUrl(user: {
  user_metadata?: Record<string, unknown>;
} | null) {
  const metadata = user?.user_metadata ?? {};
  const candidates = [metadata.avatar_url, metadata.picture, metadata.avatar];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const [step, setStep] = useState(1);
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [skillsLimitMessage, setSkillsLimitMessage] = useState<string | null>(null);
  const [showMoreTechnologies, setShowMoreTechnologies] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    display_name: "",
    avatar_url: "",
    skills: [],
    selected_languages: [],
    timezone: "America/Toronto",
    project_types: [],
  });

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        if (mounted) {
          setSubmitError(sessionError.message);
        }
        return;
      }

      if (!session?.user) {
        router.replace("/");
        return;
      }

      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle<{ id: string }>();

      if (profileError) {
        if (mounted) {
          setSubmitError(profileError.message);
        }
        return;
      }

      if (existingProfile) {
        router.replace("/dashboard");
        return;
      }

      if (!mounted) {
        return;
      }

      setFormData((current) => ({
        ...current,
        display_name: current.display_name || extractDisplayName(session.user),
        avatar_url: current.avatar_url || extractAvatarUrl(session.user),
        timezone: getDetectedTimezone(),
      }));
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace("/");
      }
    });

    void bootstrap();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const progressValue = useMemo(() => (step / totalSteps) * 100, [step]);
  const selectedLanguageValue = deriveLanguageValue(formData.selected_languages);
  const timezonePreview = getTimezonePreview(formData.timezone);
  const languageOptions = useMemo(() => getProfileLanguageOptions(language), [language]);
  const projectTypeOptions = useMemo(() => getProfileProjectTypeOptions(language), [language]);

  function goNext() {
    setStep((current) => Math.min(totalSteps, current + 1));
  }

  function goBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  function updateFormData(patch: Partial<FormData>) {
    setFormData((current) => ({ ...current, ...patch }));
  }

  function toggleSkill(skill: string) {
    setSkillsLimitMessage(null);

    setFormData((current) => {
      const exists = current.skills.includes(skill);

      if (!exists && current.skills.length >= maxSelectedSkills) {
        setSkillsLimitMessage(
          language === "fr"
            ? "Vous pouvez choisir jusqu’à 8 technologies."
            : "You can choose up to 8 technologies."
        );
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
      const exists = current.selected_languages.includes(language);
      return {
        ...current,
        selected_languages: exists
          ? current.selected_languages.filter((item) => item !== language)
          : [...current.selected_languages, language].sort(),
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

  async function handleFinalSubmit() {
    setSubmitError(null);
    setSubmitState("saving");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setSubmitState("error");
      setSubmitError(sessionError.message);
      return;
    }

    if (!session?.user) {
      setSubmitState("error");
      setSubmitError(
        language === "fr"
          ? "Vous devez être connecté pour terminer l’onboarding."
          : "You must be logged in to complete onboarding."
      );
      return;
    }

    if (
      !formData.display_name.trim() ||
      formData.skills.length === 0 ||
      !selectedLanguageValue ||
      !formData.timezone ||
      formData.project_types.length === 0
    ) {
      setSubmitState("error");
      setSubmitError(
        language === "fr"
          ? "Veuillez compléter chaque étape avant de continuer."
          : "Please complete every onboarding step before continuing."
      );
      return;
    }

    if (formData.display_name.trim().length > 39) {
      setSubmitState("error");
      setSubmitError(
        language === "fr"
          ? "Le nom d’utilisateur doit contenir 39 caractères ou moins."
          : "Username must be 39 characters or fewer."
      );
      return;
    }

    if (formData.avatar_url.trim().length > 500) {
      setSubmitState("error");
      setSubmitError(
        language === "fr"
          ? "L’URL de l’avatar doit contenir 500 caractères ou moins."
          : "Avatar URL must be 500 characters or fewer."
      );
      return;
    }

    const payload = {
      id: session.user.id,
      display_name: formData.display_name.trim(),
      avatar_url: formData.avatar_url.trim() || null,
      skills: formData.skills,
      language: selectedLanguageValue,
      timezone: formData.timezone,
      project_type: formData.project_types,
    };

    const { error } = await supabase.from("profiles").upsert(payload, {
      onConflict: "id",
    });

    if (error) {
      setSubmitState("error");
      setSubmitError(error.message);
      return;
    }

    setSubmitState("done");
    router.replace("/matchmaking");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaff] px-4 py-8 text-[#1f1c38] dark:bg-[#0d0d12] dark:text-[#f2f2f5] md:px-6 md:py-10">
      <section className="w-full max-w-[620px]">
        <div className="mb-5 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full border border-[#e8e2f7] bg-white px-4 py-2 text-sm text-[#4f496e] transition hover:bg-[#faf8ff] dark:border-[#27272f] dark:bg-[#16161d] dark:text-[#d0cde0] dark:hover:bg-[#1a1a22]"
            >
              <ArrowLeft className="size-4" />
              {language === "fr" ? "Retour" : "Back"}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-[#e8e2f7] bg-white px-4 py-2 text-sm text-[#6a6683] dark:border-[#27272f] dark:bg-[#16161d] dark:text-muted-foreground">
              {language === "fr" ? `Étape ${step} sur ${totalSteps}` : `Step ${step} of ${totalSteps}`}
            </div>
            <LanguageToggleButton />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title={
                theme === "dark"
                  ? language === "fr"
                    ? "Passer en mode clair"
                    : "Switch to light mode"
                  : language === "fr"
                    ? "Passer en mode sombre"
                    : "Switch to dark mode"
              }
              aria-label={
                theme === "dark"
                  ? language === "fr"
                    ? "Passer en mode clair"
                    : "Switch to light mode"
                  : language === "fr"
                    ? "Passer en mode sombre"
                    : "Switch to dark mode"
              }
              className="size-10 rounded-full border-[#e8e2f7] bg-white text-[#5f4c9b] hover:bg-[#f7f4ff] dark:border-[#27272f] dark:bg-[#16161d] dark:text-[#f2f2f5] dark:hover:bg-[#1a1a22]"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </div>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-[#ece8f8] dark:bg-[#23232c]">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#9a84ff_100%)]"
            animate={{ width: `${progressValue}%` }}
            transition={{ type: "spring", stiffness: 110, damping: 24 }}
          />
        </div>

        <div className="relative overflow-hidden rounded-[2.1rem] border border-[#ece8f8] bg-white shadow-[0_30px_100px_rgba(113,87,255,0.08)] dark:border-[#27272f] dark:bg-[#16161d] dark:shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(118,80,255,0.08),transparent_70%)] dark:bg-[radial-gradient(circle_at_top,rgba(109,92,232,0.18),transparent_70%)]" />
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="relative p-7 sm:p-8"
            >
              {step === 1 ? (
                <WelcomeStep
                  displayName={formData.display_name}
                  avatarUrl={formData.avatar_url}
                  onStart={goNext}
                  language={language}
                />
              ) : null}
              {step === 2 ? (
                <SkillsStep
                  language={language}
                  selectedSkills={formData.skills}
                  limitMessage={skillsLimitMessage}
                  showMoreTechnologies={showMoreTechnologies}
                  onToggleSkill={toggleSkill}
                  onToggleMore={() => setShowMoreTechnologies((current) => !current)}
                  onContinue={goNext}
                />
              ) : null}
              {step === 3 ? (
                <LanguageStep
                  language={language}
                  selectedLanguages={formData.selected_languages}
                  languageOptions={languageOptions}
                  timezone={formData.timezone}
                  timezonePreview={timezonePreview}
                  onToggleLanguage={toggleLanguage}
                  onTimezoneChange={(value) => updateFormData({ timezone: value })}
                  onContinue={goNext}
                />
              ) : null}
              {step === 4 ? (
                <ProjectTypeStep
                  language={language}
                  projectTypeOptions={projectTypeOptions}
                  selectedProjectTypes={formData.project_types}
                  onToggleProjectType={toggleProjectType}
                  onContinue={goNext}
                />
              ) : null}
              {step === 5 ? (
                <SummaryStep
                  language={language}
                  formData={formData}
                  submitError={submitError}
                  submitState={submitState}
                  selectedLanguageValue={selectedLanguageValue}
                  timezonePreview={timezonePreview}
                  onSubmit={handleFinalSubmit}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}

function WelcomeStep({
  displayName,
  avatarUrl,
  onStart,
  language,
}: {
  displayName: string;
  avatarUrl: string;
  onStart: () => void;
  language: "en" | "fr";
}) {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <Mascot pose="welcome" size="md" centered className="mb-3 sm:mx-0 sm:justify-start" />
        <h1 className="mt-6 text-5xl font-semibold tracking-[-0.06em] text-[#1f1c38] dark:text-[#f2f2f5] sm:text-6xl">
          {language === "fr" ? "Bienvenue sur CodeParty" : "Welcome to CodeParty"}
        </h1>
        <p className="mt-5 max-w-[450px] text-lg leading-8 text-[#6a6683] dark:text-muted-foreground">
          {language === "fr"
            ? "Configurons votre profil pour que votre compte soit prêt partout dans l’application. Vous pourrez tout modifier plus tard dans les paramètres."
            : "Let’s set up your profile so your account is ready across the workspace. You can update everything later in settings."}
        </p>
      </div>

      <div className="mt-10 rounded-[1.8rem] bg-[#f6f2ff] p-5 dark:bg-[#1a1a22]">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName || "GitHub profile"}
              width={64}
              height={64}
              className="size-16 rounded-full object-cover shadow-[0_18px_40px_rgba(118,80,255,0.22)]"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7650ff_0%,#a08dff_100%)] text-white shadow-[0_18px_40px_rgba(118,80,255,0.22)]">
              <Code2 className="size-8" />
            </div>
          )}
          <div>
            <p className="text-2xl font-medium text-[#1f1c38] dark:text-[#f2f2f5]">
              {displayName || (language === "fr" ? "Votre profil GitHub" : "Your GitHub profile")}
            </p>
            <p className="mt-1 text-sm text-[#877faf] dark:text-muted-foreground">
              {language === "fr" ? "Compte GitHub connecté" : "Connected GitHub account"}
            </p>
          </div>
        </div>
      </div>

      <Button
        type="button"
        onClick={onStart}
        className="mt-10 h-14 rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] text-lg text-white hover:opacity-95"
      >
        {language === "fr" ? "Commencer" : "Start"}
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

function SkillsStep({
  language,
  selectedSkills,
  limitMessage,
  showMoreTechnologies,
  onToggleSkill,
  onToggleMore,
  onContinue,
}: {
  language: "en" | "fr";
  selectedSkills: string[];
  limitMessage: string | null;
  showMoreTechnologies: boolean;
  onToggleSkill: (skill: string) => void;
  onToggleMore: () => void;
  onContinue: () => void;
}) {
  const primaryGroups = technologyGroups.slice(0, 3);
  const secondaryGroups = technologyGroups.slice(3);

  return (
    <div className="flex flex-col">
      <StepHeader
        eyebrow={language === "fr" ? "Étape 2" : "Step 2"}
        title={language === "fr" ? "Ta stack technique" : "Your technical stack"}
        description={
          language === "fr"
            ? "Choisissez jusqu’à 8 technologies pour décrire votre profil. Ces choix aident un peu le matchmaking et vous pouvez les modifier à tout moment."
            : "Choose up to 8 technologies to describe your profile. These choices help matchmaking a bit, and you can change them anytime."
        }
      />

      <div className="mt-8 space-y-6">
        {primaryGroups.map((group) => (
          <TechnologyGroup
            language={language}
            key={group.label}
            label={group.label}
            selectedSkills={selectedSkills}
            technologies={group.technologies}
            onToggleSkill={onToggleSkill}
          />
        ))}

        <button
          type="button"
          onClick={onToggleMore}
          className="text-sm font-medium text-[#7650ff] transition hover:text-[#5b45d9] dark:text-[#a698ff] dark:hover:text-[#c0b4ff]"
        >
          {showMoreTechnologies
            ? language === "fr"
              ? "− Voir moins de technologies"
              : "− Show fewer technologies"
            : language === "fr"
              ? "+ Voir plus de technologies"
              : "+ See more technologies"}
        </button>

        <AnimatePresence>
          {showMoreTechnologies ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6"
            >
              {secondaryGroups.map((group) => (
                <TechnologyGroup
                  language={language}
                  key={group.label}
                  label={group.label}
                  selectedSkills={selectedSkills}
                  technologies={group.technologies}
                  onToggleSkill={onToggleSkill}
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <p className="text-[#7d76a2] dark:text-muted-foreground">
          {selectedSkills.length} / {maxSelectedSkills} {language === "fr" ? "sélectionnées" : "selected"}
        </p>
        <AnimatePresence>
          {limitMessage ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="text-[#8f84bc] dark:text-[#a698ff]"
            >
              {limitMessage}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-4 rounded-[1.6rem] bg-[#f8f4ff] p-4 dark:bg-[#1a1a22]">
        <p className="text-sm uppercase tracking-[0.16em] text-[#9086b5] dark:text-muted-foreground">
          {language === "fr" ? "Technologies sélectionnées" : "Selected technologies"}
        </p>
        <div className="mt-3 flex min-h-[56px] flex-wrap gap-2">
          {selectedSkills.length > 0 ? (
            selectedSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-[#5b45d9] dark:bg-[#23232c] dark:text-[#b8acff]"
              >
                <Check className="size-3" />
                {formatTechnologyLabel(skill, language)}
              </span>
            ))
          ) : (
            <span className="text-sm text-[#9188b3] dark:text-muted-foreground">
              {language === "fr"
                ? "Sélectionnez au moins une technologie pour continuer."
                : "Select at least one technology to continue."}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto pt-8">
        <Button
          type="button"
          onClick={onContinue}
          disabled={selectedSkills.length === 0}
          className="h-14 w-full rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] text-lg text-white hover:opacity-95"
        >
          {language === "fr" ? "Continuer" : "Continue"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function TechnologyGroup({
  language,
  label,
  technologies,
  selectedSkills,
  onToggleSkill,
}: {
  language: "en" | "fr";
  label: string;
  technologies: readonly string[];
  selectedSkills: string[];
  onToggleSkill: (skill: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-[#6a6683] dark:text-muted-foreground">
        {formatTechnologyGroupLabel(label as (typeof technologyGroups)[number]["label"], language)}
      </p>
      <div className="flex flex-wrap gap-3">
        {technologies.map((tech) => {
          const selected = selectedSkills.includes(tech);
          const labelValue = formatTechnologyLabel(tech, language);

          return (
            <motion.button
              key={tech}
              type="button"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onToggleSkill(tech)}
              className={`rounded-full border px-4 py-3 text-sm font-medium transition ${
                selected
                  ? "border-[#8d78ff] bg-[#efe9ff] text-[#5b45d9] shadow-[0_14px_32px_rgba(123,97,255,0.10)] dark:border-[#6d5ce8] dark:bg-[#2a2340] dark:text-[#b8acff]"
                  : "border-[#e8e2f7] bg-white text-[#5f587f] hover:bg-[#faf8ff] dark:border-[#27272f] dark:bg-[#16161d] dark:text-[#d0cde0] dark:hover:bg-[#1a1a22]"
              }`}
            >
              {labelValue}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function LanguageStep({
  language,
  languageOptions,
  selectedLanguages,
  timezone,
  timezonePreview,
  onToggleLanguage,
  onTimezoneChange,
  onContinue,
}: {
  language: "en" | "fr";
  languageOptions: Array<{ label: string; value: SelectableLanguage }>;
  selectedLanguages: SelectableLanguage[];
  timezone: string;
  timezonePreview: string;
  onToggleLanguage: (value: SelectableLanguage) => void;
  onTimezoneChange: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col">
      <StepHeader
        eyebrow={language === "fr" ? "Étape 3" : "Step 3"}
        title={language === "fr" ? "Quelles langues parlez-vous ?" : "What languages do you speak?"}
        description={
          language === "fr"
            ? "Choisissez les langues dans lesquelles vous pouvez collaborer, puis confirmez le fuseau horaire attaché à votre profil."
            : "Choose the languages you can collaborate in, then confirm the timezone attached to your profile."
        }
      />

      <div className="mt-8 flex flex-wrap gap-3">
        {languageOptions.map((option) => {
          const active = selectedLanguages.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggleLanguage(option.value)}
              className={
                active
                  ? "rounded-full border border-[#8d78ff] bg-[#f1ebff] px-4 py-3 text-sm font-medium text-[#5b45d9] dark:border-[#6d5ce8] dark:bg-[#2a2340] dark:text-[#b8acff]"
                  : "rounded-full border border-[#e8e2f7] bg-white px-4 py-3 text-sm font-medium text-[#5f587f] dark:border-[#27272f] dark:bg-[#16161d] dark:text-[#d0cde0]"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-3">
        <label className="text-sm font-medium text-[#4f496e] dark:text-[#d0cde0]">
          {language === "fr" ? "Fuseau horaire" : "Timezone"}
        </label>
        <select
          value={timezone}
          onChange={(event) => onTimezoneChange(event.target.value)}
          className="h-14 w-full rounded-[1.2rem] border border-[#e8e2f7] bg-[#fcfbff] px-4 text-base text-[#1f1c38] outline-none transition focus:border-[#7b61ff]/45 dark:border-[#27272f] dark:bg-[#16161d] dark:text-[#f2f2f5]"
        >
          {profileTimezoneOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 rounded-[1.4rem] bg-[#f8f4ff] p-4 dark:bg-[#1a1a22]">
        <div className="flex items-center gap-2 text-sm font-medium text-[#5b45d9] dark:text-[#b8acff]">
          <Clock3 className="size-4" />
          {language === "fr" ? "Aperçu de l’heure locale" : "Local time preview"}
        </div>
        <p className="mt-2 text-sm leading-6 text-[#6a6683] dark:text-muted-foreground">
          {timezonePreview} {language === "fr" ? "dans" : "in"} {timezone}
        </p>
      </div>

      <div className="mt-auto pt-8">
        <Button
          type="button"
          onClick={onContinue}
          disabled={selectedLanguages.length === 0 || !timezone}
          className="h-14 w-full rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] text-lg text-white hover:opacity-95"
        >
          {language === "fr" ? "Continuer" : "Continue"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ProjectTypeStep({
  language,
  projectTypeOptions,
  selectedProjectTypes,
  onToggleProjectType,
  onContinue,
}: {
  language: "en" | "fr";
  projectTypeOptions: Array<{
    label: string;
    value: ProfileProjectTypeValue;
    description: string;
  }>;
  selectedProjectTypes: ProfileProjectTypeValue[];
  onToggleProjectType: (value: ProfileProjectTypeValue) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col">
      <StepHeader
        eyebrow={language === "fr" ? "Étape 4" : "Step 4"}
        title={language === "fr" ? "Que voulez-vous construire ?" : "What would you like to build?"}
        description={
          language === "fr"
            ? "Sélectionnez tous les types de projet qui correspondent à votre profil. Vous pouvez en choisir un ou plusieurs."
            : "Select every project type that fits your profile. You can choose one or many."
        }
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {projectTypeOptions.map((option) => (
          <SelectableCard
            key={option.value}
            selected={selectedProjectTypes.includes(option.value)}
            onClick={() => onToggleProjectType(option.value)}
            title={option.label}
            description={option.description}
            icon={<Code2 className="size-5" />}
          />
        ))}
      </div>

      <div className="mt-auto pt-8">
        <Button
          type="button"
          onClick={onContinue}
          disabled={selectedProjectTypes.length === 0}
          className="h-14 w-full rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] text-lg text-white hover:opacity-95"
        >
          {language === "fr" ? "Continuer" : "Continue"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SummaryStep({
  language,
  formData,
  submitError,
  submitState,
  selectedLanguageValue,
  timezonePreview,
  onSubmit,
}: {
  language: "en" | "fr";
  formData: FormData;
  submitError: string | null;
  submitState: "idle" | "saving" | "done" | "error";
  selectedLanguageValue: string | null;
  timezonePreview: string;
  onSubmit: () => void | Promise<void>;
}) {
  const summaryItems = [
    { label: language === "fr" ? "Nom d’utilisateur" : "Username", value: formData.display_name || (language === "fr" ? "Non sélectionné" : "Not selected") },
    {
      label: language === "fr" ? "Langues" : "Languages",
      value: formatLanguageValue(selectedLanguageValue, language),
    },
    { label: language === "fr" ? "Fuseau horaire" : "Timezone", value: formData.timezone || (language === "fr" ? "Non sélectionné" : "Not selected") },
    { label: language === "fr" ? "Aperçu de l’heure locale" : "Local time preview", value: timezonePreview },
    {
      label: language === "fr" ? "Stack technique" : "Technical stack",
      value:
        formData.skills.map((skill) => formatTechnologyLabel(skill, language)).join(", ") ||
        (language === "fr" ? "Non sélectionnée" : "Not selected"),
    },
    {
      label: language === "fr" ? "Types de projet" : "Project types",
      value: formatProjectTypeList(
        formData.project_types,
        language
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      <StepHeader
        eyebrow={language === "fr" ? "Étape 5" : "Step 5"}
        title={language === "fr" ? "Résumé de votre profil" : "Your profile summary"}
        description={
          language === "fr"
            ? "Voici la configuration du profil qui sera enregistrée sur votre compte. Vous pourrez la modifier plus tard dans les paramètres."
            : "This is the profile setup that will be saved to your account. You can edit it later in settings."
        }
      />

      <div className="mt-8 grid gap-3">
        {summaryItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.045 }}
            className="rounded-[1.45rem] border border-[#ece8f8] bg-[#fcfbff] px-5 py-4 dark:border-[#27272f] dark:bg-[#1a1a22]"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[#8f84bc] dark:text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-2 text-lg font-medium text-[#1f1c38] dark:text-[#f2f2f5]">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto pt-8">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={submitState === "saving"}
          className="h-14 w-full rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] text-lg text-white hover:opacity-95"
        >
          {submitState === "saving" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {language === "fr" ? "Enregistrement du profil..." : "Saving profile..."}
            </>
          ) : (
            <>
              {language === "fr" ? "Join a party!" : "Join a party!"}
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        <AnimatePresence>
          {submitState === "error" && submitError ? (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="mt-4 rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
            >
              {submitError}
            </motion.p>
          ) : null}

          {submitState === "done" ? (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="mt-4 rounded-[1.2rem] border border-[#d8cff8] bg-[#f3eeff] px-4 py-3 text-sm text-[#5b45d9] dark:border-[#3b3454] dark:bg-[#221d33] dark:text-[#b8acff]"
            >
              {language === "fr"
                ? "Profil enregistré avec succès. Redirection vers le matchmaking..."
                : "Profile saved successfully. Redirecting to matchmaking..."}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="inline-flex rounded-full bg-[#f3eeff] px-4 py-2 text-sm uppercase tracking-[0.18em] text-[#7c67ec] dark:bg-[#272138] dark:text-[#b8acff]">
        {eyebrow}
      </div>
      <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#1f1c38] dark:text-[#f2f2f5] sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 max-w-[460px] text-base leading-8 text-[#6a6683] dark:text-muted-foreground sm:text-lg">
        {description}
      </p>
    </div>
  );
}

function SelectableCard({
  selected,
  onClick,
  title,
  description,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`w-full rounded-[1.55rem] border p-5 text-left transition ${
        selected
          ? "border-[#8d78ff] bg-[#f1ebff] shadow-[0_18px_42px_rgba(123,97,255,0.10)] dark:border-[#6d5ce8] dark:bg-[#2a2340]"
          : "border-[#ece8f8] bg-[#fcfbff] hover:bg-[#faf8ff] dark:border-[#27272f] dark:bg-[#16161d] dark:hover:bg-[#1a1a22]"
      }`}
    >
      <div className="flex items-start gap-4">
        {icon ? (
          <div
            className={`rounded-xl p-2 ${
              selected ? "bg-[#7650ff] text-white dark:bg-[#6d5ce8]" : "bg-[#f0ecff] text-[#7650ff] dark:bg-[#272138] dark:text-[#a698ff]"
            }`}
          >
            {icon}
          </div>
        ) : null}
        <div className="flex-1">
          <p className="text-xl font-medium text-[#1f1c38] dark:text-[#f2f2f5]">{title}</p>
          <p className="mt-2 text-sm leading-7 text-[#6a6683] dark:text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.button>
  );
}
