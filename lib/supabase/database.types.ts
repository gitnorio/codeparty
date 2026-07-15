export type Database = {
  public: {
    Tables: {
      matchmaking_queue: {
        Row: {
          id: string;
          user_id: string;
          status: "waiting" | "matched" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: "waiting" | "matched" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          status?: "waiting" | "matched" | "cancelled";
          updated_at?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          member_status: "active" | "completed" | "left" | "removed";
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          member_status?: "active" | "completed" | "left" | "removed";
          joined_at?: string;
          updated_at?: string;
        };
        Update: {
          team_id?: string;
          user_id?: string;
          member_status?: "active" | "completed" | "left" | "removed";
          updated_at?: string;
        };
        Relationships: [];
      };
      team_messages: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          team_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          party_id: string;
          status: "active" | "completed" | "cancelled";
          created_by: string;
          completion_requested_at: string | null;
          completion_requested_by: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          party_id: string;
          status?: "active" | "completed" | "cancelled";
          created_by: string;
          completion_requested_at?: string | null;
          completion_requested_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          party_id?: string;
          status?: "active" | "completed" | "cancelled";
          created_by?: string;
          completion_requested_at?: string | null;
          completion_requested_by?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          description: string | null;
          stack: string[];
          github_repo_url: string | null;
          status: "planning" | "active" | "completed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          description?: string | null;
          stack?: string[];
          github_repo_url?: string | null;
          status?: "planning" | "active" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          team_id?: string;
          name?: string;
          description?: string | null;
          stack?: string[];
          github_repo_url?: string | null;
          status?: "planning" | "active" | "completed" | "cancelled";
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          location: string | null;
          resume_path: string | null;
          show_location_on_portfolio: boolean;
          show_timezone_on_portfolio: boolean;
          skills: string[];
          language: "fr" | "en" | "fr_en";
          timezone: string;
          project_type: ("web_app" | "mobile_app" | "api" | "ai_app")[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          resume_path?: string | null;
          show_location_on_portfolio?: boolean;
          show_timezone_on_portfolio?: boolean;
          skills?: string[];
          language: "fr" | "en" | "fr_en";
          timezone?: string;
          project_type?: ("web_app" | "mobile_app" | "api" | "ai_app")[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          resume_path?: string | null;
          show_location_on_portfolio?: boolean;
          show_timezone_on_portfolio?: boolean;
          skills?: string[];
          language?: "fr" | "en" | "fr_en";
          timezone?: string;
          project_type?: ("web_app" | "mobile_app" | "api" | "ai_app")[];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
