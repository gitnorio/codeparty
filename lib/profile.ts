import type { Database } from "@/lib/supabase/database.types";

export type AppProfile = Database["public"]["Tables"]["profiles"]["Row"];
