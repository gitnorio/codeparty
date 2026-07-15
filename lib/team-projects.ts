import type { SupabaseClient } from "@supabase/supabase-js";

import { updateTeamLifecycle } from "@/lib/admin-matchmaking";
import type { Database } from "@/lib/supabase/database.types";

type AppSupabaseClient = SupabaseClient<Database>;
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export const projectRoleOptions = [
  "frontend",
  "backend",
  "fullstack",
  "mobile",
  "designer",
  "lead",
] as const;

export type ProjectRole = (typeof projectRoleOptions)[number];

export type TeamProjectAssignmentInput = {
  userId: string;
  projectRole: ProjectRole;
  contributionSummary?: string | null;
};

export type TeamProjectCreateInput = {
  name: string;
  description: string | null;
  stack: string[];
  githubRepoUrl: string;
  startDate: string | null;
  endDate: string | null;
  assignments?: TeamProjectAssignmentInput[];
};

const githubRepoUrlPattern = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i;

export function formatProjectLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getDefaultProjectRole(): ProjectRole {
  return "fullstack";
}

export function normalizeProjectStack(stackInput: string) {
  return stackInput
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseGitHubRepositoryUrl(githubRepoUrl: string) {
  const trimmed = githubRepoUrl.trim();
  const match = trimmed.match(githubRepoUrlPattern);

  if (!match) {
    return {
      data: null,
      error:
        "Enter a valid public GitHub URL in the format https://github.com/{owner}/{repo}.",
    };
  }

  const [, owner, repo] = match;

  return {
    data: {
      owner,
      repo,
      normalizedUrl: `https://github.com/${owner}/${repo.replace(/\.git$/i, "")}`,
    },
    error: null,
  };
}

export async function verifyPublicGitHubRepository(githubRepoUrl: string) {
  const parsed = parseGitHubRepositoryUrl(githubRepoUrl);

  if (!parsed.data) {
    return parsed;
  }

  const { owner, repo, normalizedUrl } = parsed.data;
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "CodeParty",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return {
      data: null,
      error: "This GitHub repository does not exist or is not public.",
    };
  }

  if (!response.ok) {
    return {
      data: null,
      error: "GitHub validation is temporarily unavailable. Please try again.",
    };
  }

  const payload = (await response.json()) as {
    private?: boolean;
    html_url?: string;
  };

  if (payload.private) {
    return {
      data: null,
      error: "This GitHub repository is private. Please use a public repository URL.",
    };
  }

  return {
    data: {
      normalizedUrl: payload.html_url ?? normalizedUrl,
    },
    error: null,
  };
}

export async function createTeamProjectForMember(
  supabase: AppSupabaseClient,
  userId: string,
  input: TeamProjectCreateInput
) {
  const { data: membership, error: membershipError } = await supabase
    .from("team_members")
    .select("*")
    .eq("user_id", userId)
    .eq("member_status", "active")
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle<TeamMemberRow>();

  if (membershipError) {
    return {
      project: null,
      error: membershipError,
    };
  }

  if (!membership) {
    return {
      project: null,
      error: new Error("You must belong to an active team before creating a project."),
    };
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", membership.team_id)
    .single<TeamRow>();

  if (teamError) {
    return {
      project: null,
      error: teamError,
    };
  }

  if (team.status === "cancelled" || team.status === "completed") {
    return {
      project: null,
      error: new Error("This team can no longer create a new project."),
    };
  }

  const { data: existingProject, error: existingProjectError } = await supabase
    .from("projects")
    .select("id")
    .eq("team_id", team.id)
    .maybeSingle<{ id: string }>();

  if (existingProjectError) {
    return {
      project: null,
      error: existingProjectError,
    };
  }

  if (existingProject) {
    return {
      project: null,
      error: new Error("Your team already has a project. Only one active project is allowed per team."),
    };
  }

  const { data: teamMembers, error: teamMembersError } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", team.id)
    .eq("member_status", "active");

  if (teamMembersError) {
    return {
      project: null,
      error: teamMembersError,
    };
  }

  const activeMembers = teamMembers ?? [];

  if (activeMembers.length === 0) {
    return {
      project: null,
      error: new Error("This team does not have any active members."),
    };
  }

  const normalizedAssignments =
    input.assignments && input.assignments.length > 0
      ? input.assignments
      : activeMembers.map((member) => ({
          userId: member.user_id,
          projectRole: getDefaultProjectRole(),
          contributionSummary: null,
        }));

  const activeMemberIds = new Set(activeMembers.map((member) => member.user_id));
  const invalidAssignment = normalizedAssignments.find(
    (assignment) => !activeMemberIds.has(assignment.userId)
  );

  if (invalidAssignment) {
    return {
      project: null,
      error: new Error("Every assigned role must belong to an active team member."),
    };
  }

  const githubValidation = await verifyPublicGitHubRepository(input.githubRepoUrl);

  if (!githubValidation.data) {
    return {
      project: null,
      error: new Error(githubValidation.error),
    };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      team_id: team.id,
      name: input.name,
      description: input.description,
      stack: input.stack,
      github_repo_url: githubValidation.data.normalizedUrl,
      status: "planning",
      start_date: input.startDate,
      end_date: input.endDate,
    })
    .select("*")
    .single<ProjectRow>();

  if (projectError) {
    return {
      project: null,
      error: projectError,
    };
  }

  const { error: projectMembersError } = await supabase
    .from("project_members")
    .insert(
      normalizedAssignments.map((assignment) => ({
        project_id: project.id,
        user_id: assignment.userId,
        project_role: assignment.projectRole,
        contribution_summary: assignment.contributionSummary?.trim() || null,
      }))
    );

  if (projectMembersError) {
    return {
      project: null,
      error: projectMembersError,
    };
  }

  const lifecycleResult = await updateTeamLifecycle(supabase, {
    teamId: team.id,
    status: "active",
  });

  if (lifecycleResult.error) {
    return {
      project: null,
      error: lifecycleResult.error,
    };
  }

  return {
    project,
    error: null,
  };
}

export async function markTeamProjectAbandoned(
  supabase: AppSupabaseClient,
  teamId: string
) {
  const { data: project, error: projectLookupError } = await supabase
    .from("projects")
    .select("*")
    .eq("team_id", teamId)
    .maybeSingle<ProjectRow>();

  if (projectLookupError) {
    return {
      project: null,
      error: projectLookupError,
    };
  }

  if (project) {
    const { error: projectError } = await supabase
      .from("projects")
      .update({ status: "cancelled" })
      .eq("id", project.id);

    if (projectError) {
      return {
        project: null,
        error: projectError,
      };
    }
  }

  const { error: teamError } = await supabase
    .from("teams")
    .update({ status: "cancelled" })
    .eq("id", teamId);

  if (teamError) {
    return {
      project: null,
      error: teamError,
    };
  }

  return {
    project,
    error: null,
  };
}
