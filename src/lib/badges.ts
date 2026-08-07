import { supabase } from "@/integrations/supabase/client";

export interface BadgeDef {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface UnlockedBadge extends BadgeDef {
  awarded_at: string | null;
}

/** The badge tables are optional infrastructure — a missing table must never break a profile. */
type LooseClient = {
  from: (table: string) => {
    select: (cols: string) => {
      order: (col: string, opts: { ascending: boolean }) => Promise<{ data: unknown }>;
      eq: (col: string, value: string) => Promise<{ data: unknown }>;
    };
  };
};

const loose = () => supabase as unknown as LooseClient;

export async function fetchBadgeCatalogue(): Promise<BadgeDef[]> {
  try {
    const { data } = await loose().from("badges").select("*").order("sort_order", {
      ascending: true,
    });
    return Array.isArray(data) ? (data as BadgeDef[]) : [];
  } catch {
    return [];
  }
}

/** Badges a specific user has unlocked, newest grant first in the catalogue order. */
export async function fetchUserBadges(userId: string): Promise<UnlockedBadge[]> {
  try {
    const { data } = await loose()
      .from("user_badges")
      .select("awarded_at, badges(id, slug, name, description, icon, color, sort_order)")
      .eq("user_id", userId);
    if (!Array.isArray(data)) return [];
    return (data as { awarded_at: string | null; badges: BadgeDef | null }[])
      .filter((r) => r.badges)
      .map((r) => ({ ...(r.badges as BadgeDef), awarded_at: r.awarded_at }))
      .sort((a, b) => a.sort_order - b.sort_order);
  } catch {
    return [];
  }
}
