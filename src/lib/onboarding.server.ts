/**
 * Server-only onboarding helpers: handle normalisation, availability checks,
 * name → handle suggestion and the dev-only super-admin bootstrap.
 */

const HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;
const RESERVED = new Set([
  "admin",
  "api",
  "auth",
  "dashboard",
  "free",
  "rout",
  "settings",
  "studio",
  "support",
  "hub",
  "go",
  "docs",
]);

export function normalizeHandle(raw: string) {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

/** Coarse per-handle throttle (memory-local): at most one probe per 300 ms. */
const lastSeen = new Map<string, number>();
export function throttle(key: string, windowMs = 300) {
  const now = Date.now();
  const prev = lastSeen.get(key);
  if (prev && now - prev < windowMs) return false;
  lastSeen.set(key, now);
  if (lastSeen.size > 5000) lastSeen.clear();
  return true;
}

export type HandleAvailability = { ok: boolean; normalized: string; reason?: string };

export async function isHandleFree(normalized: string): Promise<HandleAvailability> {
  if (!normalized) return { ok: false, normalized, reason: "Pick a handle." };
  if (normalized.length < 3) return { ok: false, normalized, reason: "At least 3 characters." };
  if (normalized.length > 120) return { ok: false, normalized, reason: "Maximum 120 characters." };
  if (!HANDLE_PATTERN.test(normalized)) {
    return {
      ok: false,
      normalized,
      reason: "Use a–z, 0–9, dot, dash or underscore; start and end alphanumeric.",
    };
  }
  if (RESERVED.has(normalized)) {
    return { ok: false, normalized, reason: "This handle is reserved by the platform." };
  }
  // 3- and 4-character handles are a scarce resource: admin VIP grant only.
  const { needsVipGrant, SHORT_HANDLE_MESSAGE } = await import("./handle-rules");
  if (needsVipGrant(normalized)) {
    return { ok: false, normalized, reason: SHORT_HANDLE_MESSAGE };
  }


  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .ilike("username", normalized)
    .limit(1);

  if ((data ?? []).length > 0) return { ok: false, normalized, reason: "Already taken." };
  return { ok: true, normalized };
}

/** "Jona De Vries" → "jona.devries", then "jona.devries2" … until free. */
export async function suggestFreeHandle(fullName: string) {
  const base =
    normalizeHandle(fullName)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 40) || "rout.user";

  for (let i = 0; i < 25; i += 1) {
    const candidate = i === 0 ? base : `${base}${i + 1}`;
    // eslint-disable-next-line no-await-in-loop
    const res = await isHandleFree(candidate);
    if (res.ok) return candidate;
  }
  return `${base}${Date.now().toString(36).slice(-4)}`;
}

/** Dev-only: create a confirmed account and grant it the admin role. */
export async function mintTestSuperAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const email = "admin@rout.be";
  const password = "DevAdmin!2024";

  // Idempotent: reuse the fixed dev super admin when it already exists so the
  // quick-login button keeps working across restarts.
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Dev Super Admin" },
  });

  let userId = created?.user?.id ?? null;
  if (!userId) {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = (list?.users ?? []).find((u) => u.email?.toLowerCase() === email);
    if (!existing) {
      return { ok: false as const, reason: error?.message ?? "Could not create the test account." };
    }
    userId = existing.id;
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      ban_duration: "none",
    });
  }

  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

  return { ok: true as const, email, password };
}
