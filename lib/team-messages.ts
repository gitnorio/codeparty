import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppProfile } from "@/lib/profile";
import type { Database } from "@/lib/supabase/database.types";

type AppSupabaseClient = SupabaseClient<Database>;
type TeamMessageRow = Database["public"]["Tables"]["team_messages"]["Row"];
type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];

export type TeamMessageWithProfile = {
  message: TeamMessageRow;
  profile: Pick<AppProfile, "id" | "display_name">;
};

export async function getActiveTeamMembership(
  supabase: AppSupabaseClient,
  userId: string,
  teamId: string
) {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .eq("member_status", "active")
    .maybeSingle<TeamMemberRow>();

  return {
    data,
    error,
  };
}

export async function getReadableTeamMembership(
  supabase: AppSupabaseClient,
  userId: string,
  teamId: string
) {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .in("member_status", ["active", "completed"])
    .maybeSingle<TeamMemberRow>();

  return {
    data,
    error,
  };
}

export async function getRecentTeamMessages(
  supabase: AppSupabaseClient,
  teamId: string,
  limit = 50
) {
  const { data: messages, error: messagesError } = await supabase
    .from("team_messages")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (messagesError) {
    return {
      data: [] as TeamMessageWithProfile[],
      error: messagesError,
    };
  }

  const messageRows = messages ?? [];

  if (messageRows.length === 0) {
    return {
      data: [] as TeamMessageWithProfile[],
      error: null,
    };
  }

  const userIds = [...new Set(messageRows.map((message) => message.user_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  if (profilesError) {
    return {
      data: [] as TeamMessageWithProfile[],
      error: profilesError,
    };
  }

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile] as const)
  );

  const orderedMessages = [...messageRows].reverse();

  return {
    data: orderedMessages
      .map((message) => {
        const profile = profilesById.get(message.user_id);
        if (!profile) return null;
        return { message, profile };
      })
      .filter((item): item is TeamMessageWithProfile => Boolean(item)),
    error: null,
  };
}

export async function createTeamMessage(
  supabase: AppSupabaseClient,
  input: {
    teamId: string;
    userId: string;
    content: string;
  }
) {
  const { data, error } = await supabase
    .from("team_messages")
    .insert({
      team_id: input.teamId,
      user_id: input.userId,
      content: input.content,
    })
    .select("*")
    .single<TeamMessageRow>();

  return {
    data,
    error,
  };
}
