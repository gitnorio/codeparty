import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type AppSupabaseClient = SupabaseClient<Database>;

export async function requestPartyCompletion(
  supabase: AppSupabaseClient,
  userId: string,
  teamId: string
) {
  const { data: membership, error: membershipError } = await supabase
    .from("team_members")
    .select("id, team_id, user_id, member_status")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .eq("member_status", "active")
    .maybeSingle();

  if (membershipError) {
    return {
      team: null,
      error: membershipError,
    };
  }

  if (!membership) {
    return {
      team: null,
      error: new Error("Only active party members can request completion."),
    };
  }

  const { data: team, error: teamLookupError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("status", "active")
    .single();

  if (teamLookupError) {
    return {
      team: null,
      error: teamLookupError,
    };
  }

  if (team.completion_requested_at) {
    return {
      team: null,
      error: new Error("A completion request is already pending for this party."),
    };
  }

  const { data: updatedTeam, error: updateError } = await supabase
    .from("teams")
    .update({
      completion_requested_at: new Date().toISOString(),
      completion_requested_by: userId,
    })
    .eq("id", teamId)
    .eq("status", "active")
    .is("completion_requested_at", null)
    .select("*")
    .single();

  return {
    team: updatedTeam ?? null,
    error: updateError,
  };
}
