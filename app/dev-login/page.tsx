"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Terminal, 
  ArrowRight, 
  Laptop, 
  Server, 
  Layers, 
  Braces, 
  Smartphone, 
  ShieldAlert,
  Loader2
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

const testUsers = [
  {
    label: "Alex Frontend",
    role: "Frontend Developer",
    email: "user1@test.com",
    password: "Password123!",
    skills: ["React", "TypeScript", "TailwindCSS"],
    icon: Laptop,
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    label: "Sam Backend",
    role: "Backend Developer",
    email: "user2@test.com",
    password: "Password123!",
    skills: ["NodeJS", "Supabase", "PostgreSQL"],
    icon: Server,
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    label: "Chris Fullstack",
    role: "Fullstack Developer",
    email: "user3@test.com",
    password: "Password123!",
    skills: ["Next.js", "Supabase", "TypeScript"],
    icon: Layers,
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    label: "Mina Busy",
    role: "Part-time Coder",
    email: "user4@test.com",
    password: "Password123!",
    skills: ["React", "CSS Grid", "GraphQL"],
    icon: Braces,
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    label: "Leo Mobile",
    role: "Mobile Developer",
    email: "user5@test.com",
    password: "Password123!",
    skills: ["SwiftUI", "Flutter", "Firebase"],
    icon: Smartphone,
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
];

export default function DevLoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loginAs(email: string, password: string, label: string) {
    setLoadingUser(label);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoadingUser(null);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-4xl flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-fit flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-400 text-xs font-semibold tracking-wider uppercase animate-pulse">
            <Terminal className="size-3.5" />
            Test environment (Sandbox)
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-orange-400 bg-clip-text text-transparent font-sans">
            Developer Login
          </h1>
          <p className="max-w-xl mx-auto text-sm md:text-base text-slate-400">
            Choose a test profile below to instantly verify the redirect flow: onboarding or dashboard.
          </p>
        </div>

        {/* Profiles Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testUsers.map((user) => {
            const Icon = user.icon;
            const isThisLoading = loadingUser === user.label;
            
            return (
              <Card 
                key={user.email}
                className="group relative border-white/5 bg-slate-900/60 backdrop-blur-md hover:border-orange-500/30 hover:bg-slate-900/90 transition-all duration-300 shadow-xl overflow-hidden"
              >
                {/* Visual hover border glow effect */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 group-hover:text-orange-400 group-hover:border-orange-500/30 transition-colors">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-100 group-hover:text-white">
                          {user.label}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-400 mt-0.5">
                          {user.role}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {user.skills.map((skill) => (
                      <Badge 
                        key={skill} 
                        variant="outline" 
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${user.badgeColor}`}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    onClick={() => loginAs(user.email, user.password, user.label)}
                    disabled={loadingUser !== null}
                    className="w-full h-10 rounded-lg bg-slate-800 hover:bg-orange-500 text-slate-100 hover:text-slate-950 font-medium transition-all duration-300 border border-slate-700 hover:border-orange-400/20"
                  >
                    {isThisLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        Open dashboard
                        <ArrowRight className="size-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
            <ShieldAlert className="size-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Footer info */}
        <div className="flex justify-between items-center text-xs text-slate-500 border-t border-white/5 pt-4">
          <p>CodeParty Dev Environment</p>
          <Link href="/" className="hover:text-orange-400 transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
