"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  LogIn,
  MessageSquareMore,
  Play,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

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
  const supabase = getSupabaseBrowserClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(Boolean(session));
      setIsLoading(false);
    }

    void loadSession();
  }, [supabase]);

  async function handleGitHubLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaff] px-4 py-4 text-[#1f1c38] md:px-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.25rem] border border-[#ece8f8] bg-white shadow-[0_30px_100px_rgba(113,87,255,0.08)]">
        <header className="flex items-center justify-between px-6 py-4 md:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#7650ff] text-lg font-bold text-white">
                C
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">CodeParty</p>
              </div>
            </div>
            <nav className="hidden items-center gap-8 text-[15px] text-[#3f3a5b] md:flex">
              <span>Solutions</span>
              <span>Product</span>
              <span>Resources</span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dev-login" className="hidden text-[15px] font-medium md:inline-flex">
              Log in
            </Link>
            <Button
              type="button"
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className="h-11 rounded-full bg-[#7650ff] px-6 text-white hover:bg-[#6744f0]"
            >
              {isAuthenticated ? "Open dashboard" : "Book a demo"}
            </Button>
          </div>
        </header>

        <section className="grid gap-10 bg-[#fffefe] px-6 pb-16 pt-10 md:px-8 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:gap-16 lg:px-12 lg:pt-16">
          <div className="max-w-[620px]">
            <h1 className="text-[4rem] leading-[0.93] font-semibold tracking-[-0.06em] text-[#201d39] md:text-[6.6rem]">
              Build every
              <br />
              collaboration
              <br />
              <span className="inline-block rounded-[1.1rem] bg-[#dcd1ff] px-3 pb-1 pt-0.5">
                into proof
              </span>
            </h1>

            <p className="mt-8 max-w-[540px] text-[1.15rem] leading-8 text-[#66617f]">
              Join a serious junior dev team, ship a real GitHub project, and
              turn that work into portfolio proof for your CV.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                type="button"
                onClick={handleGitHubLogin}
                disabled={isLoading}
                className="h-16 rounded-full bg-[#7650ff] px-10 text-xl text-white hover:bg-[#6744f0]"
              >
                <LogIn className="size-5" />
                {isAuthenticated ? "Go to dashboard" : "Try for free"}
              </Button>

              <Link
                href={isAuthenticated ? "/dashboard" : "/onboarding"}
                className="inline-flex items-center gap-2 text-[17px] font-medium text-[#1f1c38]"
              >
                Learn more
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-5 flex items-center gap-3 text-[15px] font-medium text-[#1f1c38]">
              <div className="flex size-5 items-center justify-center rounded-md border border-[#7650ff]/25 text-[#7650ff]">
                <Check className="size-3" />
              </div>
              No credit card required
            </div>

            {errorMessage ? (
              <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
            ) : null}
          </div>

          <div className="rounded-[2rem] bg-[#f6f4fb] p-6 lg:p-9">
            <div className="mx-auto max-w-[360px] rounded-[1.4rem] bg-[#7650ff] p-4 text-white shadow-[0_30px_80px_rgba(118,80,255,0.35)]">
              <p className="text-[15px] leading-6 text-white/95">
                Hey! Your team just opened a frontend slot for the portfolio sprint.
              </p>
              <div className="mt-4 overflow-hidden rounded-[1.4rem] bg-[#f6f2ff] p-5">
                <div className="rounded-[1.2rem] bg-[#e9e0ff] p-5 text-[#1f1c38]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#6c5aa5]">Project sprint</p>
                      <p className="mt-1 text-2xl font-semibold">GitHub Team Build</p>
                    </div>
                    <Badge className="rounded-full bg-white text-[#7650ff] hover:bg-white">
                      Live
                    </Badge>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <MiniInfo label="Stack" value="Next.js • Supabase • PR reviews" />
                    <MiniInfo label="Goal" value="Build a real shipped project with 3 juniors" />
                    <MiniInfo label="Output" value="Portfolio page + GitHub proof" />
                  </div>
                </div>

                <button className="mt-4 flex h-15 w-full items-center justify-center rounded-[1rem] bg-white text-lg font-medium text-[#7650ff]">
                  Join now
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="rounded-full border border-[#ddd7f0] bg-white p-3 text-[#6d63a2]">
                <Play className="size-4 fill-current" />
              </div>
              <div className="flex gap-3 text-right">
                <StatBubble value="3-5" label="members" />
                <StatBubble value="1" label="project" />
                <StatBubble value="CV" label="proof" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f4edff] px-6 py-10 md:px-8 lg:px-12">
          <div className="rounded-[2rem] bg-[linear-gradient(135deg,#6f44ff_0%,#8c67ff_100%)] p-6 text-white md:p-8">
            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr_0.9fr_0.9fr]">
              <Card className="border border-white/12 bg-white/6 text-white shadow-none ring-0">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
                      EG
                    </div>
                    <div>
                      <CardTitle className="text-xl">Emmanuel Guillo</CardTitle>
                      <CardDescription className="text-white/80">
                        Head of E-business
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-2xl leading-10 font-medium text-white">
                  “Since we started using Blabla, our ads generate 30% more conversions simply because every comment now gets an instant reply.”
                </CardContent>
              </Card>

              <HighlightStat value="11%" label="Revenue growth" sublabel="in the first month" />
              <HighlightStat value="19%" label="More followers" sublabel="after one month" />
              <HighlightStat value="823" label="Negative comments" sublabel="deleted in one month" />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-white/95">
              <span className="text-[18px]">Used by top</span>
              <span className="rounded-full bg-[#ffdf94] px-4 py-1 text-[18px] text-[#8a4d00]">
                creators
              </span>
              <span className="text-[18px]">daily</span>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-14 md:px-8 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-3">
            <FeatureHeading
              title={
                <>
                  Boost sales
                  <br />
                  on autopilot
                </>
              }
            />
            <FeatureHeading
              title={
                <>
                  Skyrocket
                  <br />
                  your growth
                </>
              }
              accent
            />
            <FeatureHeading
              title={
                <>
                  Protect
                  <br />
                  your brand
                </>
              }
            />
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <SoftFeatureCard
              icon={Sparkles}
              title="Track your performance"
              description="See how a comment, click, or message can turn into a concrete collaboration signal."
            />
            <SoftFeatureCard
              icon={Users}
              title="Find the teammates that matter"
              description="Filter by skills, availability, timezone and role to build stronger teams."
            />
            <SoftFeatureCard
              icon={MessageSquareMore}
              title="Show real project proof"
              description="Create a portfolio story around real GitHub work, not just isolated solo demos."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#8d7eb6]">{label}</p>
      <p className="mt-1 text-[15px] leading-6 text-[#282548]">{value}</p>
    </div>
  );
}

function StatBubble({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[#e4dff1] bg-white px-4 py-3 text-center">
      <p className="text-2xl font-semibold text-[#1f1c38]">{value}</p>
      <p className="text-xs uppercase tracking-[0.15em] text-[#7a7493]">{label}</p>
    </div>
  );
}

function HighlightStat({
  value,
  label,
  sublabel,
}: {
  value: string;
  label: string;
  sublabel: string;
}) {
  return (
    <Card className="border border-white/12 bg-white/6 text-white shadow-none ring-0">
      <CardContent className="pt-8">
        <p className="text-7xl font-semibold tracking-[-0.06em] text-[#ffe07c]">{value}</p>
        <p className="mt-3 text-2xl font-medium">{label}</p>
        <p className="mt-1 text-xl text-white/80">{sublabel}</p>
      </CardContent>
    </Card>
  );
}

function FeatureHeading({
  title,
  accent = false,
}: {
  title: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <h2 className="text-[3.7rem] leading-[0.95] font-semibold tracking-[-0.06em] text-[#1f1c38]">
      <span className={accent ? "text-[#7650ff]" : "text-[#7650ff]"}>{title}</span>
    </h2>
  );
}

function SoftFeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-[1.8rem] border border-[#ece8f8] bg-[#fcfbff] shadow-none ring-0">
      <CardContent className="pt-8">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e8ddff] text-[#7650ff]">
          <Icon className="size-5" />
        </div>
        <p className="mt-6 text-3xl font-semibold tracking-[-0.05em] text-[#1f1c38]">{title}</p>
        <p className="mt-4 text-[18px] leading-8 text-[#6b6784]">{description}</p>
      </CardContent>
    </Card>
  );
}
