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

  if (body.name.trim().length > 80) {
    return NextResponse.json(
      { error: "Project name must be 80 characters or fewer." },
      { status: 400 }
    );
  }

  if ((body.description?.trim().length ?? 0) > 300) {
    return NextResponse.json(
      { error: "Project description must be 300 characters or fewer." },
      { status: 400 }
    );
  }

  if (body.githubRepoUrl.trim().length > 255) {
    return NextResponse.json(
      { error: "GitHub repository URL must be 255 characters or fewer." },
      { status: 400 }
    );
  }

  if ((body.stack?.length ?? 0) > 8) {
    return NextResponse.json(
      { error: "Project stack must contain 8 technologies or fewer." },
      { status: 400 }
    );
  }

  if ((body.stack ?? []).some((item) => item.trim().length > 40)) {
    return NextResponse.json(
      { error: "Each stack item must be 40 characters or fewer." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceRoleClient();
  const result = await createTeamProjectForMember(supabase, auth.user.id, {
    name: body.name.trim(),
    description: body.description?.trim() || null,
    stack: (body.stack ?? []).map((value) => value.trim()).filter(Boolean),
    githubRepoUrl: body.githubRepoUrl.trim(),
  });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ project: result.project });
}
