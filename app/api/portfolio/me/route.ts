import { NextResponse } from "next/server";

import { getPortfolioByProfile, getPortfolioByProfileId } from "@/lib/portfolio";
import {
  profileProjectTypeOptions,
  profileTimezoneOptions,
  type ProfileLanguageValue,
  type ProfileProjectTypeValue,
} from "@/lib/profile-options";
import { getUserFromBearerToken, getSupabaseServiceRoleClient } from "@/lib/supabase/server-admin";
import { maxSelectedSkills, technologyGroups } from "@/lib/technology-options";

const allowedLanguages = new Set<string>(["en", "fr", "fr_en"]);
const allowedProjectTypes = new Set<string>(
  profileProjectTypeOptions.map((option) => option.value)
);
const allowedTimezones = new Set<string>(profileTimezoneOptions.map((option) => option.value));
const allowedSkills = new Set<string>(technologyGroups.flatMap((group) => [...group.technologies]));

export async function GET(request: Request) {
  const auth = await getUserFromBearerToken(request.headers.get("authorization"));

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await getPortfolioByProfileId(auth.user.id);

  if (!result.data) {
    return NextResponse.json(
      { error: result.error ?? "Portfolio not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: result.data });
}

export async function PATCH(request: Request) {
  const auth = await getUserFromBearerToken(request.headers.get("authorization"));

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as Partial<{
    bio: string;
    location: string;
    language: ProfileLanguageValue;
    resume_path: string | null;
    timezone: string;
    show_location_on_portfolio: boolean;
    show_timezone_on_portfolio: boolean;
    skills: string[];
    project_type: ProfileProjectTypeValue[];
  }>;

  const bio = typeof body.bio === "string" ? body.bio.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const language = body.language;
  const resumePath = typeof body.resume_path === "string" ? body.resume_path.trim() : null;
  const timezone = typeof body.timezone === "string" ? body.timezone : "";
  const showLocationOnPortfolio = body.show_location_on_portfolio !== false;
  const showTimezoneOnPortfolio = body.show_timezone_on_portfolio !== false;
  const skills = Array.isArray(body.skills) ? [...new Set(body.skills)] : [];
  const projectTypes = Array.isArray(body.project_type) ? [...new Set(body.project_type)] : [];

  if (!allowedLanguages.has(language as ProfileLanguageValue)) {
    return NextResponse.json({ error: "Select at least one language." }, { status: 400 });
  }

  if (!timezone || !allowedTimezones.has(timezone)) {
    return NextResponse.json({ error: "Select a valid timezone." }, { status: 400 });
  }

  if (!location) {
    return NextResponse.json({ error: "Location is required." }, { status: 400 });
  }

  if (bio.length > 500) {
    return NextResponse.json({ error: "Bio must stay under 500 characters." }, { status: 400 });
  }

  if (location.length > 120) {
    return NextResponse.json({ error: "Location must stay under 120 characters." }, { status: 400 });
  }

  if (resumePath && !resumePath.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Resume must be a PDF file." }, { status: 400 });
  }

  if (skills.length > maxSelectedSkills) {
    return NextResponse.json(
      { error: `Select up to ${maxSelectedSkills} technologies.` },
      { status: 400 }
    );
  }

  if (skills.some((skill) => !allowedSkills.has(skill))) {
    return NextResponse.json({ error: "Choose technologies from the predefined list." }, { status: 400 });
  }

  if (projectTypes.some((type) => !allowedProjectTypes.has(type))) {
    return NextResponse.json({ error: "Select valid project types." }, { status: 400 });
  }

  const supabase = getSupabaseServiceRoleClient();
  const { data: profile, error: updateError } = await supabase
    .from("profiles")
    .update({
      bio: bio || null,
      location,
      resume_path: resumePath || null,
      show_location_on_portfolio: showLocationOnPortfolio,
      show_timezone_on_portfolio: showTimezoneOnPortfolio,
      language,
      timezone,
      skills,
      project_type: projectTypes,
    })
    .eq("id", auth.user.id)
    .select("*")
    .single();

  if (updateError || !profile) {
    return NextResponse.json(
      { error: updateError?.message ?? "Unable to update portfolio." },
      { status: 400 }
    );
  }

  const portfolio = await getPortfolioByProfile(profile);

  if (!portfolio.data) {
    return NextResponse.json(
      { error: portfolio.error ?? "Unable to refresh portfolio." },
      { status: 400 }
    );
  }

  return NextResponse.json({ data: portfolio.data });
}
