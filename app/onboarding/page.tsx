"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Layers3,
  MonitorSmartphone,
  Server,
  Smartphone,
  Sparkles,
  UserRound,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ensureWaitingMatchmakingEntry } from "@/lib/matchmaking";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Level = "beginner" | "junior" | "intermediate";
type Goal = "frontend" | "backend" | "fullstack" | "mobile";
type Language = "fr" | "en" | "fr_en";
type ProjectType = "web_app" | "mobile_app" | "api" | "ai_app";

type FormData = {
  display_name: string;
  level: Level | "";
  skills: string[];
  goal: Goal | "";
  availability_per_week: 5 | 10 | 15 | null;
  language: Language | "";
  timezone: string;
  project_type: ProjectType | "";
};

const totalSteps = 8;
const maxSelectedSkills = 8;

const technologyGroups = [
  {
    label: "Frontend",
    technologies: [
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Vue",
      "Angular",
      "HTML/CSS",
      "Tailwind CSS",
    ],
  },
  {
    label: "Backend",
    technologies: ["Node.js", "Python", "Java", "PHP", "Ruby", "C#", "Go"],
  },
  {
    label: "Databases",
    technologies: ["PostgreSQL", "MySQL", "MongoDB", "Supabase", "Firebase"],
  },
  {
    label: "Backend Frameworks",
    technologies: ["Express", "Django", "Flask", "Spring Boot", "Laravel", ".NET"],
  },
  {
    label: "Mobile",
    technologies: ["React Native", "Flutter", "Swift", "Kotlin"],
  },
  {
    label: "DevOps & Tools",
    technologies: ["Git", "Docker", "AWS", "Vercel", "GitHub Actions"],
  },
  {
    label: "Other",
    technologies: ["SQL", "GraphQL", "REST API", "Tailwind", "Figma"],
  },
] as const;

const levelOptions: Array<{
  label: string;
  value: Level;
  description: string;
}> = [
  {
    label: "Beginner",
    value: "beginner",
    description: "You know the basics and want a supportive team environment.",
  },
  {
    label: "Junior",
    value: "junior",
    description: "You can ship features and want more real-world collaboration.",
  },
  {
    label: "Intermediate",
    value: "intermediate",
    description: "You can contribute with confidence and help move the team forward.",
  },
];

const goalOptions: Array<{
  label: string;
  value: Goal;
  description: string;
  icon: typeof MonitorSmartphone;
}> = [
  {
    label: "Frontend",
    value: "frontend",
    description: "Interfaces, components, product polish.",
    icon: MonitorSmartphone,
  },
  {
    label: "Backend",
    value: "backend",
    description: "APIs, data models, server logic.",
    icon: Server,
  },
  {
    label: "Fullstack",
    value: "fullstack",
    description: "End-to-end building across product and backend.",
    icon: Layers3,
  },
  {
    label: "Mobile",
    value: "mobile",
    description: "Native or cross-platform app development.",
    icon: Smartphone,
  },
];

const availabilityOptions = [
  { label: "5h / week", value: 5, note: "Light commitment" },
  { label: "10h / week", value: 10, note: "Balanced pace" },
  { label: "15h+ / week", value: 15, note: "High involvement" },
] as const;

const languageOptions: Array<{
  label: string;
  value: Language;
  description: string;
}> = [
  { label: "French", value: "fr", description: "Best if you prefer collaborating in French." },
  { label: "English", value: "en", description: "Best if you prefer collaborating in English." },
  {
    label: "French & English",
    value: "fr_en",
    description: "Good if you are comfortable in both languages.",
  },
];

const projectCards: Array<{
  label: string;
  value: ProjectType;
  description: string;
}> = [
  { label: "Web app", value: "web_app", description: "A browser-first product your team can ship." },
  { label: "Mobile app", value: "mobile_app", description: "A mobile experience built for iOS or Android." },
  { label: "API", value: "api", description: "A backend-first service with endpoints and integrations." },
  { label: "AI app", value: "ai_app", description: "A product that uses AI in a meaningful workflow." },
];

const stepVariants: Variants = {
  initial: { opacity: 0, x: 44, scale: 0.988 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -44, scale: 0.988 },
};

function extractDisplayName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
} | null) {
  if (!user) {
    return "";
  }

  const metadata = user.user_metadata ?? {};
  const candidates = [
    metadata.full_name,
    metadata.name,
    metadata.user_name,
    metadata.preferred_username,
    metadata.nickname,
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

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [step, setStep] = useState(1);
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [skillsLimitMessage, setSkillsLimitMessage] = useState<string | null>(null);
  const [showMoreTechnologies, setShowMoreTechnologies] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    display_name: "",
    level: "",
    skills: [],
    goal: "",
    availability_per_week: null,
    language: "",
    timezone: "America/Toronto",
    project_type: "",
  });

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      let timezone = "America/Toronto";
      try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || timezone;
      } catch {}

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

      const sessionDisplayName = extractDisplayName(session?.user ?? null);

      if (!mounted) return;

      setFormData((current) => ({
        ...current,
        display_name: current.display_name || sessionDisplayName,
        timezone,
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

  function goNext() {
    setStep((current) => Math.min(totalSteps, current + 1));
  }

  function goBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  function updateFormData(patch: Partial<FormData>) {
    setFormData((current) => ({ ...current, ...patch }));
  }

  function handleSingleChoiceAdvance<T extends Level | Goal | Language | ProjectType | 5 | 10 | 15>(
    key: keyof FormData,
    value: T
  ) {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }));

    window.setTimeout(() => {
      setStep((current) => Math.min(totalSteps, current + 1));
    }, 180);
  }

  function toggleSkill(skill: string) {
    setSkillsLimitMessage(null);
    setFormData((current) => {
      const exists = current.skills.includes(skill);

      if (!exists && current.skills.length >= maxSelectedSkills) {
        setSkillsLimitMessage("You can choose up to 8 technologies.");
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
      setSubmitError("You must be logged in to complete onboarding.");
      return;
    }

    if (
      !formData.display_name ||
      !formData.level ||
      formData.skills.length === 0 ||
      !formData.goal ||
      !formData.availability_per_week ||
      !formData.language ||
      !formData.project_type
    ) {
      setSubmitState("error");
      setSubmitError("Please complete every onboarding step before continuing.");
      return;
    }

    const payload = {
      id: session.user.id,
      display_name: formData.display_name,
      level: formData.level,
      skills: formData.skills,
      goal: formData.goal,
      availability_per_week: formData.availability_per_week,
      language: formData.language,
      timezone: formData.timezone || "America/Toronto",
      project_type: formData.project_type,
    };

    const { error } = await supabase.from("profiles").upsert(payload, {
      onConflict: "id",
    });

    if (error) {
      setSubmitState("error");
      setSubmitError(error.message);
      return;
    }

    const queueResult = await ensureWaitingMatchmakingEntry(
      supabase,
      session.user.id
    );

    if (queueResult.error) {
      setSubmitState("error");
      setSubmitError(queueResult.error.message);
      return;
    }

    setSubmitState("done");
    router.replace("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaff] px-4 py-8 text-[#1f1c38] md:px-6">
      <section className="w-full max-w-[620px]">
        <div className="mb-5 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full border border-[#e8e2f7] bg-white px-4 py-2 text-sm text-[#4f496e] transition hover:bg-[#faf8ff]"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f3eeff] px-4 py-2 text-sm text-[#7650ff]">
              <Sparkles className="size-4" />
              CodeParty onboarding
            </div>
          )}

          <div className="rounded-full border border-[#e8e2f7] bg-white px-4 py-2 text-sm text-[#6a6683]">
            Step {step} of {totalSteps}
          </div>
        </div>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-[#ece8f8]">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#9a84ff_100%)]"
            animate={{ width: `${progressValue}%` }}
            transition={{ type: "spring", stiffness: 110, damping: 24 }}
          />
        </div>

        <div className="relative overflow-hidden rounded-[2.1rem] border border-[#ece8f8] bg-white shadow-[0_30px_100px_rgba(113,87,255,0.08)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(118,80,255,0.08),transparent_70%)]" />
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
                <WelcomeStep displayName={formData.display_name} onStart={goNext} />
              ) : null}
              {step === 2 ? (
                <IdentityStep
                  displayName={formData.display_name}
                  selectedLevel={formData.level}
                  onNameChange={(value) => updateFormData({ display_name: value })}
                  onSelectLevel={(value) => handleSingleChoiceAdvance("level", value)}
                />
              ) : null}
              {step === 3 ? (
                <SkillsStep
                  selectedSkills={formData.skills}
                  limitMessage={skillsLimitMessage}
                  showMoreTechnologies={showMoreTechnologies}
                  onToggleSkill={toggleSkill}
                  onToggleMore={() => setShowMoreTechnologies((current) => !current)}
                  onContinue={goNext}
                />
              ) : null}
              {step === 4 ? (
                <GoalStep
                  selectedGoal={formData.goal}
                  onSelectGoal={(value) => handleSingleChoiceAdvance("goal", value)}
                />
              ) : null}
              {step === 5 ? (
                <AvailabilityStep
                  selectedValue={formData.availability_per_week}
                  onSelectAvailability={(value) =>
                    handleSingleChoiceAdvance("availability_per_week", value)
                  }
                />
              ) : null}
              {step === 6 ? (
                <LanguageStep
                  selectedLanguage={formData.language}
                  timezone={formData.timezone}
                  onSelectLanguage={(value) => {
                    updateFormData({ timezone: "America/Toronto" });
                    handleSingleChoiceAdvance("language", value);
                  }}
                />
              ) : null}
              {step === 7 ? (
                <ProjectTypeStep
                  selectedProjectType={formData.project_type}
                  onSelectProjectType={(value) =>
                    handleSingleChoiceAdvance("project_type", value)
                  }
                />
              ) : null}
              {step === 8 ? (
                <SummaryStep
                  formData={formData}
                  submitError={submitError}
                  submitState={submitState}
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
  onStart,
}: {
  displayName: string;
  onStart: () => void;
}) {
  return (
    <div className="flex min-h-[620px] flex-col justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#f3eeff] px-4 py-2 text-sm text-[#7650ff]">
          <Sparkles className="size-4" />
          CodeParty onboarding
        </div>
        <h1 className="mt-6 text-5xl font-semibold tracking-[-0.06em] text-[#1f1c38] sm:text-6xl">
          Welcome to CodeParty
        </h1>
        <p className="mt-5 max-w-[430px] text-lg leading-8 text-[#6a6683]">
          Let’s configure your profile so we can place you in the right team, project, and collaboration rhythm.
        </p>
      </div>

      <div className="mt-10 rounded-[1.8rem] bg-[#f6f2ff] p-5">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7650ff_0%,#a08dff_100%)] text-white shadow-[0_18px_40px_rgba(118,80,255,0.22)]">
            <UserRound className="size-8" />
          </div>
          <div>
            <p className="text-2xl font-medium text-[#1f1c38]">
              {displayName || "Your GitHub profile"}
            </p>
            <p className="mt-1 text-sm text-[#877faf]">Connected GitHub account</p>
          </div>
        </div>
      </div>

      <Button
        type="button"
        onClick={onStart}
        className="mt-10 h-14 rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] text-lg text-white hover:opacity-95"
      >
        Start
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

function IdentityStep({
  displayName,
  selectedLevel,
  onNameChange,
  onSelectLevel,
}: {
  displayName: string;
  selectedLevel: Level | "";
  onNameChange: (value: string) => void;
  onSelectLevel: (value: Level) => void;
}) {
  return (
    <div className="flex min-h-[620px] flex-col">
      <StepHeader
        eyebrow="Step 2"
        title="Who are you?"
        description="Choose your current level so we can place you in the right project environment."
      />

      <div className="mt-8">
        <label className="mb-3 block text-sm font-medium text-[#4f496e]">
          Display name
        </label>
        <input
          value={displayName}
          onChange={(event) => onNameChange(event.target.value)}
          className="h-14 w-full rounded-[1.2rem] border border-[#e8e2f7] bg-[#fcfbff] px-4 text-lg text-[#1f1c38] outline-none transition placeholder:text-[#a9a3c2] focus:border-[#7b61ff]/45"
          placeholder="Your name"
        />
      </div>

      <div className="mt-8 grid gap-3">
        {levelOptions.map((option) => (
          <SelectableCard
            key={option.value}
            selected={selectedLevel === option.value}
            onClick={() => onSelectLevel(option.value)}
            title={option.label}
            description={option.description}
          />
        ))}
      </div>
    </div>
  );
}

function SkillsStep({
  selectedSkills,
  limitMessage,
  showMoreTechnologies,
  onToggleSkill,
  onToggleMore,
  onContinue,
}: {
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
    <div className="flex min-h-[620px] flex-col">
      <StepHeader
        eyebrow="Step 3"
        title="Your technical stack"
        description="Choose up to 8 technologies you want to use in your next project."
      />

      <div className="mt-8 space-y-6">
        {primaryGroups.map((group) => (
          <TechnologyGroup
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
          className="text-sm font-medium text-[#7650ff] transition hover:text-[#5b45d9]"
        >
          {showMoreTechnologies ? "− Show fewer technologies" : "+ See more technologies"}
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
        <p className="text-[#7d76a2]">
          {selectedSkills.length} / {maxSelectedSkills} selected
        </p>
        <AnimatePresence>
          {limitMessage ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="text-[#8f84bc]"
            >
              {limitMessage}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-4 rounded-[1.6rem] bg-[#f8f4ff] p-4">
        <p className="text-sm uppercase tracking-[0.16em] text-[#9086b5]">
          Selected technologies
        </p>
        <div className="mt-3 flex min-h-[56px] flex-wrap gap-2">
          {selectedSkills.length > 0 ? (
            selectedSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-[#5b45d9]"
              >
                <Check className="size-3" />
                {skill}
              </span>
            ))
          ) : (
            <span className="text-sm text-[#9188b3]">
              Select at least one technology to continue.
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto pt-8">
        <AnimatePresence>
          {selectedSkills.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <Button
                type="button"
                onClick={onContinue}
                className="h-14 w-full rounded-full bg-[linear-gradient(90deg,#7650ff_0%,#947cff_100%)] text-lg text-white hover:opacity-95"
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TechnologyGroup({
  label,
  technologies,
  selectedSkills,
  onToggleSkill,
}: {
  label: string;
  technologies: readonly string[];
  selectedSkills: string[];
  onToggleSkill: (skill: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-[#6a6683]">{label}</p>
      <div className="flex flex-wrap gap-3">
        {technologies.map((tech) => {
          const selected = selectedSkills.includes(tech);

          return (
            <motion.button
              key={tech}
              type="button"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onToggleSkill(tech)}
              className={`rounded-full border px-4 py-3 text-sm font-medium transition ${
                selected
                  ? "border-[#8d78ff] bg-[#efe9ff] text-[#5b45d9] shadow-[0_14px_32px_rgba(123,97,255,0.10)]"
                  : "border-[#e8e2f7] bg-white text-[#5f587f] hover:bg-[#faf8ff]"
              }`}
            >
              {tech}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function GoalStep({
  selectedGoal,
  onSelectGoal,
}: {
  selectedGoal: Goal | "";
  onSelectGoal: (value: Goal) => void;
}) {
  return (
    <div className="flex min-h-[620px] flex-col">
      <StepHeader
        eyebrow="Step 4"
        title="Your technical goal"
        description="Tell us which role you want to play inside the team."
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {goalOptions.map((option) => {
          const Icon = option.icon;
          return (
            <SelectableCard
              key={option.value}
              selected={selectedGoal === option.value}
              onClick={() => onSelectGoal(option.value)}
              title={option.label}
              description={option.description}
              icon={<Icon className="size-5" />}
            />
          );
        })}
      </div>
    </div>
  );
}

function AvailabilityStep({
  selectedValue,
  onSelectAvailability,
}: {
  selectedValue: 5 | 10 | 15 | null;
  onSelectAvailability: (value: 5 | 10 | 15) => void;
}) {
  return (
    <div className="flex min-h-[620px] flex-col">
      <StepHeader
        eyebrow="Step 5"
        title="Your availability"
        description="Choose the pace you can realistically sustain every week."
      />

      <div className="mt-8 grid gap-3">
        {availabilityOptions.map((option) => (
          <SelectableCard
            key={option.value}
            selected={selectedValue === option.value}
            onClick={() => onSelectAvailability(option.value)}
            title={option.label}
            description={option.note}
          />
        ))}
      </div>
    </div>
  );
}

function LanguageStep({
  selectedLanguage,
  timezone,
  onSelectLanguage,
}: {
  selectedLanguage: Language | "";
  timezone: string;
  onSelectLanguage: (value: Language) => void;
}) {
  return (
    <div className="flex min-h-[620px] flex-col">
      <StepHeader
        eyebrow="Step 6"
        title="Collaboration language"
        description="Choose how you want to communicate with your future team."
      />

      <div className="mt-8 grid gap-3">
        {languageOptions.map((option) => (
          <SelectableCard
            key={option.value}
            selected={selectedLanguage === option.value}
            onClick={() => onSelectLanguage(option.value)}
            title={option.label}
            description={option.description}
          />
        ))}
      </div>

      <div className="mt-6 rounded-[1.5rem] bg-[#f8f4ff] p-4 text-sm text-[#5f587f]">
        Timezone defaults to{" "}
        <span className="font-medium text-[#1f1c38]">{timezone || "America/Toronto"}</span>
      </div>
    </div>
  );
}

function ProjectTypeStep({
  selectedProjectType,
  onSelectProjectType,
}: {
  selectedProjectType: ProjectType | "";
  onSelectProjectType: (value: ProjectType) => void;
}) {
  return (
    <div className="flex min-h-[620px] flex-col">
      <StepHeader
        eyebrow="Step 7"
        title="Desired project type"
        description="Choose the type of product you would like to build with your team."
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {projectCards.map((option) => (
          <SelectableCard
            key={option.value}
            selected={selectedProjectType === option.value}
            onClick={() => onSelectProjectType(option.value)}
            title={option.label}
            description={option.description}
            icon={<Code2 className="size-5" />}
          />
        ))}
      </div>
    </div>
  );
}

function SummaryStep({
  formData,
  submitError,
  submitState,
  onSubmit,
}: {
  formData: FormData;
  submitError: string | null;
  submitState: "idle" | "saving" | "done" | "error";
  onSubmit: () => void | Promise<void>;
}) {
  const summaryItems = [
    { label: "Display name", value: formData.display_name },
    { label: "Level", value: formData.level || "Not selected" },
    { label: "Skills", value: formData.skills.join(", ") || "Not selected" },
    { label: "Goal", value: formData.goal || "Not selected" },
    {
      label: "Availability",
      value: formData.availability_per_week ? `${formData.availability_per_week}h / week` : "Not selected",
    },
    { label: "Language", value: formData.language || "Not selected" },
    { label: "Timezone", value: formData.timezone || "America/Toronto" },
    { label: "Project type", value: formData.project_type || "Not selected" },
  ];

  return (
    <div className="flex min-h-[620px] flex-col">
      <StepHeader
        eyebrow="Step 8"
        title="Final summary"
        description="Here’s the profile we will use to match you with the right team and project."
      />

      <div className="mt-8 grid gap-3">
        {summaryItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.045 }}
            className="rounded-[1.45rem] border border-[#ece8f8] bg-[#fcfbff] px-5 py-4"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[#8f84bc]">
              {item.label}
            </p>
            <p className="mt-2 text-lg font-medium text-[#1f1c38]">{item.value}</p>
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
              Saving profile...
            </>
          ) : (
            <>
              Join matchmaking
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
              className="mt-4 rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {submitError}
            </motion.p>
          ) : null}

          {submitState === "done" ? (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="mt-4 rounded-[1.2rem] border border-[#d8cff8] bg-[#f3eeff] px-4 py-3 text-sm text-[#5b45d9]"
            >
              Profile saved successfully. Redirecting to your dashboard...
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
      <div className="inline-flex rounded-full bg-[#f3eeff] px-4 py-2 text-sm uppercase tracking-[0.18em] text-[#7c67ec]">
        {eyebrow}
      </div>
      <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#1f1c38] sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 max-w-[430px] text-base leading-8 text-[#6a6683] sm:text-lg">
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
          ? "border-[#8d78ff] bg-[#f1ebff] shadow-[0_18px_42px_rgba(123,97,255,0.10)]"
          : "border-[#ece8f8] bg-[#fcfbff] hover:bg-[#faf8ff]"
      }`}
    >
      <div className="flex items-start gap-4">
        {icon ? (
          <div
            className={`rounded-xl p-2 ${
              selected ? "bg-[#7650ff] text-white" : "bg-[#f0ecff] text-[#7650ff]"
            }`}
          >
            {icon}
          </div>
        ) : null}
        <div className="flex-1">
          <p className="text-xl font-medium text-[#1f1c38]">{title}</p>
          <p className="mt-2 text-sm leading-7 text-[#6a6683]">{description}</p>
        </div>
      </div>
    </motion.button>
  );
}
