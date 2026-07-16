import { NextResponse } from "next/server";

import { getSupabaseServerAnonClient } from "@/lib/supabase/server-admin";

const allowedDevEmails = new Set([
  "user1@test.com",
  "user2@test.com",
  "user3@test.com",
  "user4@test.com",
  "user5@test.com",
  "user6@test.com",
]);

function isDevLoginEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.DEV_LOGIN_ENABLED === "true"
  );
}

export async function POST(request: Request) {
  if (!isDevLoginEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let body: { email?: string };

  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = process.env.DEV_LOGIN_PASSWORD;

  if (!allowedDevEmails.has(email)) {
    return NextResponse.json({ error: "Unknown test profile." }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json(
      { error: "DEV_LOGIN_PASSWORD is not configured on the server." },
      { status: 503 }
    );
  }

  const supabase = getSupabaseServerAnonClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to create the development session." },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
