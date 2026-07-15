import { NextResponse } from "next/server";

import { createTeamProjectForMember } from "@/lib/team-projects";
import {
  getSupabaseServiceRoleClient,
  getUserFromBearerToken,
} from "@/lib/supabase/server-admin";

export async function POST(request: Request) {
  const auth = await getUserFromBearerToken(request.headers.get("authorization"));

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string | null;
    stack?: string[];
    githubRepoUrl?: string;
    startDate?: string | null;
    endDate?: string | null;
    assignments?: Array<{
      userId: string;
      projectRole:
        | "frontend"
        | "backend"
        | "fullstack"
        | "mobile"
        | "designer"
        | "lead";
      contributionSummary?: string | null;
    }>;
  };

  if (
    !body.name?.trim() ||
    !body.githubRepoUrl?.trim()
  ) {
    return NextResponse.json(
      { error: "Missing required project fields." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceRoleClient();
  const result = await createTeamProjectForMember(supabase, auth.user.id, {
    name: body.name.trim(),
    description: body.description?.trim() || null,
    stack: (body.stack ?? []).map((value) => value.trim()).filter(Boolean),
    githubRepoUrl: body.githubRepoUrl.trim(),
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    assignments: body.assignments?.map((assignment) => ({
      userId: assignment.userId,
      projectRole: assignment.projectRole,
      contributionSummary: assignment.contributionSummary?.trim() || null,
    })),
  });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ project: result.project });
}
