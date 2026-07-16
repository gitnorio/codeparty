import { formatLanguageValue, formatTimezoneValue } from "@/lib/profile-options";
import type { AppProfile } from "@/lib/profile";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server-admin";
import type { Database } from "@/lib/supabase/database.types";

type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
const PORTFOLIO_RESUME_BUCKET = "portfolio-resumes";

export type PortfolioProjectCard = {
  teamId: string;
  partyId: string;
  projectName: string;
  description: string | null;
  stack: string[];
  githubRepoUrl: string | null;
  completedAt: string | null;
  teamSize: number;
};

export type PublicPortfolioProfile = Pick<
  AppProfile,
  "display_name" | "avatar_url" | "language"
>;

export type PortfolioPageData = {
  profile: PublicPortfolioProfile;
  bio: string;
  githubProfileUrl: string;
  location: string | null;
  showLocation: boolean;
  languageLabel: string;
  resumeUrl: string | null;
  timezoneLabel: string | null;
  showTimezone: boolean;
  skills: string[];
  availableForOpportunities: boolean;
  completedProjectsCount: number;
  collaboratorsCount: number;
  completedProjects: PortfolioProjectCard[];
  publicUrlPath: string;
};

export type PortfolioOwnerPageData = PortfolioPageData & {
  ownerProfile: AppProfile;
};

export async function getPortfolioByUsername(username: string) {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return {
      data: null,
      error: "Missing portfolio username.",
    };
  }

  const supabase = getSupabaseServiceRoleClient();
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .ilike("display_name", normalizedUsername)
    .limit(2);

  if (profileError) {
    return {
      data: null,
      error: profileError.message,
    };
  }

  if (!profiles || profiles.length === 0) {
    return {
      data: null,
      error: "Portfolio not found.",
    };
  }

  const profile = profiles[0];
  return getPortfolioByProfile(profile);
}

export async function getPortfolioByProfileId(profileId: string) {
  const supabase = getSupabaseServiceRoleClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error || !profile) {
    return {
      data: null,
      error: error?.message ?? "Profile not found.",
    };
  }

  return getOwnerPortfolioByProfile(profile);
}

export async function getOwnerPortfolioByProfile(profile: AppProfile) {
  const result = await getPortfolioByProfile(profile);

  if (!result.data) {
    return result;
  }

  return {
    data: {
      ...result.data,
      ownerProfile: profile,
    } satisfies PortfolioOwnerPageData,
    error: null,
  };
}

export async function getPortfolioByProfile(profile: AppProfile) {
  const supabase = getSupabaseServiceRoleClient();

  const { data: memberships, error: membershipsError } = await supabase
    .from("team_members")
    .select("*")
    .eq("user_id", profile.id)
    .in("member_status", ["active", "completed"]);

  if (membershipsError) {
    return {
      data: null,
      error: membershipsError.message,
    };
  }

  const teamIds = [...new Set((memberships ?? []).map((membership) => membership.team_id))];
  const { data: teams, error: teamsError } =
    teamIds.length > 0
      ? await supabase.from("teams").select("*").in("id", teamIds)
      : { data: [] as TeamRow[], error: null };

  if (teamsError) {
    return {
      data: null,
      error: teamsError.message,
    };
  }

  const activeMembership = (memberships ?? []).some((membership) => {
    const team = (teams ?? []).find((item) => item.id === membership.team_id);
    return membership.member_status === "active" && team?.status === "active";
  });

  const completedTeams = (teams ?? []).filter((team) => team.status === "completed");
  const completedTeamIds = completedTeams.map((team) => team.id);

  const { data: projects, error: projectsError } =
    completedTeamIds.length > 0
      ? await supabase.from("projects").select("*").in("team_id", completedTeamIds)
      : { data: [] as ProjectRow[], error: null };

  if (projectsError) {
    return {
      data: null,
      error: projectsError.message,
    };
  }

  const { data: completedTeamMembers, error: teamMembersError } =
    completedTeamIds.length > 0
      ? await supabase
          .from("team_members")
          .select("*")
          .in("team_id", completedTeamIds)
          .in("member_status", ["active", "completed"])
      : { data: [] as TeamMemberRow[], error: null };

  if (teamMembersError) {
    return {
      data: null,
      error: teamMembersError.message,
    };
  }

  const teamMembersByTeamId = new Map<string, TeamMemberRow[]>();

  for (const member of completedTeamMembers ?? []) {
    const list = teamMembersByTeamId.get(member.team_id) ?? [];
    list.push(member);
    teamMembersByTeamId.set(member.team_id, list);
  }

  const collaboratorIds = new Set<string>();
  for (const member of completedTeamMembers ?? []) {
    if (member.user_id !== profile.id) {
      collaboratorIds.add(member.user_id);
    }
  }

  const projectsByTeamId = new Map((projects ?? []).map((project) => [project.team_id, project] as const));

  const completedProjects: PortfolioProjectCard[] = [];

  for (const team of completedTeams) {
    const project = projectsByTeamId.get(team.id);

    if (!project) {
      continue;
    }

    completedProjects.push({
      teamId: team.id,
      partyId: team.party_id,
      projectName: project.name,
      description: project.description,
      stack: project.stack,
      githubRepoUrl: project.github_repo_url,
      completedAt: team.completed_at ?? team.updated_at,
      teamSize: teamMembersByTeamId.get(team.id)?.length ?? 0,
    });
  }

  completedProjects.sort((firstProject, secondProject) => {
    return new Date(secondProject.completedAt ?? 0).getTime() - new Date(firstProject.completedAt ?? 0).getTime();
  });

  return {
    data: {
      profile: {
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        language: profile.language,
      },
      bio:
        profile.bio?.trim() ||
        "I love building clean, scalable web applications and working with motivated developers to ship real projects.",
      githubProfileUrl: `https://github.com/${profile.display_name}`,
      location: profile.show_location_on_portfolio
        ? profile.location?.trim() || null
        : null,
      showLocation: profile.show_location_on_portfolio,
      languageLabel: formatLanguageValue(profile.language),
      resumeUrl: buildResumeUrl(profile.resume_path),
      timezoneLabel:
        profile.show_timezone_on_portfolio && profile.timezone
          ? formatTimezoneValue(profile.timezone)
          : null,
      showTimezone: profile.show_timezone_on_portfolio,
      skills: profile.skills,
      availableForOpportunities: !activeMembership,
      completedProjectsCount: completedProjects.length,
      collaboratorsCount: collaboratorIds.size,
      completedProjects,
      publicUrlPath: `/p/${profile.display_name}`,
    } satisfies PortfolioPageData,
    error: null,
  };
}

function buildResumeUrl(resumePath: string | null) {
  if (!resumePath || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PORTFOLIO_RESUME_BUCKET}/${resumePath}`;
}
