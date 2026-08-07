import { useEffect, useState } from "react";
import { Award, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchBadgeCatalogue, fetchUserBadges, type BadgeDef } from "@/lib/badges";
import { cn } from "@/lib/utils";

/** "Unlocked Badges" grid in the Profile Hub — locked entries stay visible as goals. */
export function BadgesPanel() {
  const { user } = useAuth();
  const [catalogue, setCatalogue] = useState<BadgeDef[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void Promise.all([fetchBadgeCatalogue(), fetchUserBadges(user.id)]).then(([all, mine]) => {
      if (cancelled) return;
      setCatalogue(all);
      setUnlocked(new Set(mine.map((b) => b.slug)));
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (catalogue.length === 0) return null;

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-medium">Unlocked Badges</h2>
        <span className="text-xs text-muted-foreground">
          {unlocked.size} / {catalogue.length}
        </span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {catalogue.map((b) => {
          const has = unlocked.has(b.slug);
          return (
            <li
              key={b.id}
              className={cn(
                "flex items-start gap-2 rounded-xl border p-3",
                has ? "border-foreground/30 bg-background" : "border-border opacity-60",
              )}
            >
              {has ? (
                <Award className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-medium">{b.name}</span>
                <span className="block text-[11px] text-muted-foreground">{b.description}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
