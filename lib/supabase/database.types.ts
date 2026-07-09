export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          level: "beginner" | "junior" | "intermediate";
          skills: string[];
          goal: "frontend" | "backend" | "fullstack" | "mobile";
          availability_per_week: number;
          language: "fr" | "en" | "fr_en";
          timezone: string;
          project_type: "web_app" | "mobile_app" | "api" | "ai_app";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          level: "beginner" | "junior" | "intermediate";
          skills?: string[];
          goal: "frontend" | "backend" | "fullstack" | "mobile";
          availability_per_week: number;
          language: "fr" | "en" | "fr_en";
          timezone?: string;
          project_type: "web_app" | "mobile_app" | "api" | "ai_app";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          level?: "beginner" | "junior" | "intermediate";
          skills?: string[];
          goal?: "frontend" | "backend" | "fullstack" | "mobile";
          availability_per_week?: number;
          language?: "fr" | "en" | "fr_en";
          timezone?: string;
          project_type?: "web_app" | "mobile_app" | "api" | "ai_app";
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
