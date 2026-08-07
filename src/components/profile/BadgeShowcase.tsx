import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import { fetchUserBadges, type UnlockedBadge } from "@/lib/badges";

/** Public "Badges" strip under the profile header. Renders nothing when empty. */
export function BadgeShowcase({
  userId,
  theme,
}: {
  userId: string;
  theme: { text: string; muted: string; border: string; card: string };
}) {
  const [badges, setBadges] = useState<UnlockedBadge[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchUserBadges(userId).then((b) => !cancelled && setBadges(b));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (badges.length === 0) return null;

  return (
    <section className="mt-6 w-full" aria-label="Badges">
      <p
        className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: theme.muted }}
      >
        Badges
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {badges.map((b) => (
          <li key={b.id}>
            <span
              title={b.description}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium"
              style={{ border: `1px solid ${theme.border}`, background: theme.card, color: theme.text }}
            >
              <Award className="h-3 w-3" aria-hidden />
              {b.name}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
