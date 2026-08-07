/**
 * Handle allocation rules shared by the onboarding form, the public API and the
 * admin portal. Client-safe: no server-only imports.
 *
 * Short handles (3–4 characters) are a scarce resource. They can never be
 * claimed through normal signup — only a super admin can grant one, and only to
 * a verified account ("VIP handle grant").
 */

export const SHORT_HANDLE_MIN = 3;
export const SHORT_HANDLE_MAX = 4;

/** Marker stored in `profiles.handle_grant` when an admin granted a short handle. */
export const VIP_HANDLE_GRANT = "vip";

export const SHORT_HANDLE_MESSAGE =
  "3- and 4-character handles are reserved. Request one from the ROUT team.";

export function normalizeHandleInput(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

/** True for a 3- or 4-character handle, i.e. the protected range. */
export function isShortHandle(handle: string): boolean {
  const len = normalizeHandleInput(handle).length;
  return len >= SHORT_HANDLE_MIN && len <= SHORT_HANDLE_MAX;
}

/** Anything at or below the protected ceiling needs a grant (1–4 characters). */
export function needsVipGrant(handle: string): boolean {
  const len = normalizeHandleInput(handle).length;
  return len > 0 && len <= SHORT_HANDLE_MAX;
}

export const TOO_SHORT_MESSAGE = "Handle must be at least 3 characters long.";

export const RESERVED_LENGTH_MESSAGE =
  "3- and 4-character handles are reserved. Contact support or enter 5+ characters.";

/**
 * The single source of truth for length-based handle errors, shared by the
 * signup form and the admin portal so the copy can never contradict itself.
 * Returns `null` when the length is acceptable (5+ characters).
 */
export function handleLengthMessage(handle: string): string | null {
  const len = normalizeHandleInput(handle).length;
  if (len === 0) return null;
  if (len < SHORT_HANDLE_MIN) return TOO_SHORT_MESSAGE;
  if (len <= SHORT_HANDLE_MAX) return RESERVED_LENGTH_MESSAGE;
  return null;
}
