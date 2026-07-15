import { NextResponse } from "next/server";

import { requestPartyCompletion } from "@/lib/party-completion";
import {
  getSupabaseServiceRoleClient,
  getUserFromBearerToken,
} from "@/lib/supabase/server-admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  const auth = await getUserFromBearerToken(request.headers.get("authorization"));

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { teamId } = await context.params;

  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId." }, { status: 400 });
  }

  const supabase = getSupabaseServiceRoleClient();
  const result = await requestPartyCompletion(supabase, auth.user.id, teamId);

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ team: result.team });
}
