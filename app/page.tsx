"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ExternalLink,
  FolderGit2,
  LogIn,
  Moon,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";

import { LanguageToggleButton } from "@/components/app/language-toggle-button";
import { useLanguage } from "@/components/app/language-provider";
import { Mascot } from "@/components/app/mascot";
import { useTheme } from "@/components/app/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const showDevLogin =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_DEV_LOGIN_ENABLED === "true";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveEntryRoute() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (!session?.user) {
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle<{ id: string }>();

      if (cancelled) {
        return;
      }

      if (profileError) {
        setErrorMessage(profileError.message);
        return;
      }

      router.replace(profile ? "/dashboard" : "/onboarding");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled || !session?.user) {
        return;
      }

      window.setTimeout(() => {
        if (!cancelled) {
          void resolveEntryRoute();
        }
      }, 0);
    });

    void resolveEntryRoute();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  async function handleGitHubLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    }
  }

  const copy = language === "fr" ? frenchCopy : englishCopy;

  return (
    <main className="landing-theme min-h-screen bg-background px-3 py-3 text-foreground sm:px-5 sm:py-5">
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[1.75rem] border bg-card shadow-[0_32px_100px_rgba(87,63,180,0.10)] sm:rounded-[2.25rem]">
        <header className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="CodeParty home">
              <Mascot pose="icon" size="sm" className="rounded-xl bg-primary p-1" />
              <span className="truncate text-xl font-bold tracking-[-0.04em] sm:text-2xl">
                CodeParty
              </span>
            </Link>
            <Badge variant="secondary">
              <span className="sm:hidden">{language === "fr" ? "Bêta" : "Beta"}</span>
              <span className="hidden sm:inline">
                {language === "fr" ? "Bêta ouverte" : "Open beta"}
              </span>
            </Badge>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {showDevLogin ? (
              <Link
                href="/dev-login"
                className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:inline-flex"
              >
                {language === "fr" ? "Connexion dev" : "Dev Login"}
              </Link>
            ) : null}
            <LanguageToggleButton />
            <Button
              type="button"
              variant="outline"
              size="icon-xl"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? copy.lightMode : copy.darkMode}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
            <Button
              type="button"
              size="xl"
              onClick={handleGitHubLogin}
              className="hidden sm:inline-flex"
            >
              <LogIn data-icon="inline-start" />
              Login with GitHub
            </Button>
          </div>
        </header>

        <section className="landing-grid relative border-t bg-background px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
          <div className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
            <div className="max-w-3xl">
              <h1 className="text-[clamp(3.15rem,7vw,6.5rem)] leading-[0.91] font-semibold tracking-[-0.065em]">
                {copy.heroLineOne}
                <br />
                <span className="text-primary">{copy.heroLineTwo}</span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                {copy.heroDescriptionPrefix}{" "}
                <strong className="font-semibold text-foreground">
                  {copy.heroDescriptionEmphasis}
                </strong>
              </p>

              <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Button type="button" size="xl" onClick={handleGitHubLogin}>
                  <LogIn data-icon="inline-start" />
                  Login with GitHub
                </Button>
                <Link
                  href="#how-it-works"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-medium transition-colors hover:bg-muted"
                >
                  {copy.seeHow}
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              {errorMessage ? (
                <p className="mt-4 text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              ) : null}
            </div>

            <ProductPreview />
          </div>
        </section>

        <section className="border-t bg-card px-5 py-8 sm:px-8 lg:px-12">
          <div className="grid gap-3 sm:grid-cols-3">
            <Signal icon={Users} title={copy.signalTeam} detail={copy.signalTeamDetail} />
            <Signal icon={FolderGit2} title={copy.signalRepo} detail={copy.signalRepoDetail} />
            <Signal icon={ExternalLink} title={copy.signalProof} detail={copy.signalProofDetail} />
          </div>
        </section>

        <section id="how-it-works" className="border-t bg-brand-quiet px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-4xl leading-[0.98] font-semibold tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              {copy.processTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {copy.processDescription}
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            <StepCard
              number="01"
              image="/landing/match-party.png"
              imageAlt={copy.stepOneImageAlt}
              title={copy.stepOneTitle}
              description={copy.stepOneDescription}
            />
            <StepCard
              number="02"
              image="/landing/shared-workspace.png"
              imageAlt={copy.stepTwoImageAlt}
              title={copy.stepTwoTitle}
              description={copy.stepTwoDescription}
            />
            <StepCard
              number="03"
              image="/landing/portfolio-proof.png"
              imageAlt={copy.stepThreeImageAlt}
              title={copy.stepThreeTitle}
              description={copy.stepThreeDescription}
            />
          </div>
        </section>

        <section className="border-t bg-card px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-primary px-6 py-10 text-primary-foreground sm:px-10 lg:px-14 lg:py-12">
            <div className="pointer-events-none absolute -right-14 -top-20 size-72 rounded-full border-[44px] border-primary-foreground/10" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary-foreground/70">
                  {copy.finalLabel}
                </p>
                <h2 className="mt-3 max-w-3xl text-4xl leading-[0.98] font-semibold tracking-[-0.055em] sm:text-5xl">
                  {copy.finalTitle}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-primary-foreground/75 sm:text-lg">
                  {copy.finalDescription}
                </p>
              </div>
              <Button type="button" variant="secondary" size="xl" onClick={handleGitHubLogin}>
                <LogIn data-icon="inline-start" />
                Login with GitHub
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="rounded-[1.75rem] bg-primary/10 p-2.5 sm:p-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem] border bg-card shadow-lg">
          <Image
            src="/landing/portfolio-product-preview.png"
            alt="CodeParty public portfolio showing completed collaborative projects"
            fill
            priority
            sizes="(min-width: 1024px) 42vw, 92vw"
            className="object-cover object-top"
          />
        </div>
      </div>
    </div>
  );
}

function Signal({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function StepCard({
  number,
  image,
  imageAlt,
  title,
  description,
}: {
  number: string;
  image: string;
  imageAlt: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="h-full">
      <CardContent>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-brand-soft">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 70vw, 92vw"
            className="object-cover"
          />
          <div className="absolute left-3 top-3">
            <Badge variant="secondary">{number}</Badge>
          </div>
        </div>
      </CardContent>
      <CardHeader className="flex-1">
        <CardTitle className="text-2xl tracking-[-0.035em]">{title}</CardTitle>
        <CardDescription className="text-base leading-7">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

const englishCopy = {
  heroLineOne: "Find your people",
  heroLineTwo: "Ship something real",
  heroDescriptionPrefix:
    "CodeParty puts you on a team with other junior developers, gives you a shared workspace, and turns every completed project into",
  heroDescriptionEmphasis:
    "concrete proof for your portfolio, ready to show future employers",
  seeHow: "See how it works",
  lightMode: "Switch to light mode",
  darkMode: "Switch to dark mode",
  signalTeam: "3–4 teammates",
  signalTeamDetail: "Small enough to stay accountable",
  signalRepo: "One shared repo",
  signalRepoDetail: "A real project, not another tutorial",
  signalProof: "Automated portfolio proof",
  signalProofDetail: "Completed projects added automatically",
  processTitle: "A real sequence not a social feed",
  processDescription:
    "Every screen exists to move your party from a compatible match to a finished project you can explain with confidence",
  stepOneTitle: "Match around how you build",
  stepOneImageAlt: "Compatible developer profiles forming one focused party",
  stepOneDescription:
    "Your stack, languages, timezone, availability, and project interests shape a small compatible party",
  stepTwoTitle: "Work from one shared context",
  stepTwoImageAlt: "Shared project workspace connecting chat, tasks, repository, and pull requests",
  stepTwoDescription:
    "Keep the party, project brief, GitHub repository, and team conversation connected in one workspace",
  stepThreeTitle: "Automate your portfolio proof",
  stepThreeImageAlt: "Completed team project becoming a polished public portfolio entry",
  stepThreeDescription:
    "When the party finishes, CodeParty automatically adds the completed project to each member’s public portfolio",
  finalLabel: "Your next project needs a team",
  finalTitle: "Stop collecting tutorials and start building with people",
  finalDescription:
    "Create your profile, join a compatible party, and leave with a project that says more than another certificate",
};

const frenchCopy: typeof englishCopy = {
  heroLineOne: "Trouvez votre équipe",
  heroLineTwo: "Livrez quelque chose de réel",
  heroDescriptionPrefix:
    "CodeParty te met en équipe avec d'autres développeurs juniors, vous donne un espace de travail partagé, et transforme chaque projet terminé en",
  heroDescriptionEmphasis:
    "preuve concrète pour ton portfolio, prête à montrer à tes futurs employeurs",
  seeHow: "Voir comment ça marche",
  lightMode: "Passer en mode clair",
  darkMode: "Passer en mode sombre",
  signalTeam: "3 à 4 coéquipiers",
  signalTeamDetail: "Assez petit pour rester responsable",
  signalRepo: "Un repo partagé",
  signalRepoDetail: "Un vrai projet, pas un autre tutoriel",
  signalProof: "Preuve portfolio automatisée",
  signalProofDetail: "Les projets complétés sont ajoutés automatiquement",
  processTitle: "Une vraie séquence pas un fil social",
  processDescription:
    "Chaque écran aide votre party à passer d’un match compatible à un projet terminé que vous pouvez expliquer avec confiance",
  stepOneTitle: "Un match adapté à votre façon de construire",
  stepOneImageAlt: "Des profils de développeurs compatibles réunis dans un party ciblé",
  stepOneDescription:
    "Votre stack, vos langues, votre fuseau horaire, vos disponibilités et vos intérêts définissent un party compatible",
  stepTwoTitle: "Travaillez dans un contexte partagé",
  stepTwoImageAlt: "Un workspace partagé reliant conversation, tâches, repo et pull requests",
  stepTwoDescription:
    "Gardez le party, le brief, le repo GitHub et la conversation d’équipe réunis dans un seul workspace",
  stepThreeTitle: "Automatisez votre preuve portfolio",
  stepThreeImageAlt: "Un projet d’équipe terminé transformé en entrée portfolio publique",
  stepThreeDescription:
    "Lorsque le party termine, CodeParty ajoute automatiquement le projet au portfolio public de chaque membre",
  finalLabel: "Votre prochain projet a besoin d’une équipe",
  finalTitle: "Arrêtez d’accumuler les tutoriels et construisez avec des gens",
  finalDescription:
    "Créez votre profil, rejoignez un party compatible et repartez avec un projet qui en dit plus qu’un autre certificat",
};
