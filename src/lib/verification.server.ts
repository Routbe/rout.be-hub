/** Server-only helpers for the paid Early Believer verification flow.
 *  One-time €3.99 lifetime verification, optionally combined with a recurring
 *  "Keep ROUT Alive" donation (€1/month or €5/year). */

export type Tier = "early_believer";
export type DonationPlan = "none" | "monthly" | "yearly";

/** One-time lifetime verification fee, in cents. Price-locked for life. */
export const EARLY_BELIEVER_CENTS = 399;

export const TIER_AMOUNTS: Record<Tier, number> = {
  early_believer: EARLY_BELIEVER_CENTS,
};

/** Recurring donation add-ons. `none` keeps the checkout a single one-off charge. */
export const DONATION_PLAN_CENTS: Record<DonationPlan, number> = {
  none: 0,
  monthly: 100,
  yearly: 500,
};

export const DONATION_PLAN_INTERVAL: Record<DonationPlan, "month" | "year" | null> = {
  none: null,
  monthly: "month",
  yearly: "year",
};

export const TIER_LABELS: Record<Tier, string> = {
  early_believer: "ROUT Early Believer Lifetime Verification",
};

export function stripeKey(): string | null {
  return process.env["STRIPE_SECRET_KEY"] ?? null;
}

/** Optional one-off pay-what-you-want top-up (max €1000). */
export const MAX_DONATION_CENTS = 100_000;

export function clampDonation(cents: number | undefined | null): number {
  if (!Number.isFinite(cents ?? NaN)) return 0;
  return Math.min(Math.max(Math.round(cents as number), 0), MAX_DONATION_CENTS);
}

export function normalizeDonationPlan(plan: string | undefined | null): DonationPlan {
  return plan === "monthly" || plan === "yearly" ? plan : "none";
}

/**
 * Creates a Stripe Checkout session with the REST API (no SDK, Worker-safe).
 * With a recurring add-on the session switches to `subscription` mode, where the
 * €3.99 lifetime fee rides along as a one-off line item.
 */
export async function createCheckoutSession(opts: {
  tier: Tier;
  paymentId: string;
  userId: string;
  email?: string | null;
  origin: string;
  donationPlan?: DonationPlan;
}): Promise<string> {
  const key = stripeKey();
  if (!key) throw new Error("stripe_not_configured");

  const plan = normalizeDonationPlan(opts.donationPlan);
  const interval = DONATION_PLAN_INTERVAL[plan];

  const body = new URLSearchParams({
    mode: interval ? "subscription" : "payment",
    success_url: `${opts.origin}/dashboard?verification=success`,
    cancel_url: `${opts.origin}/dashboard?verification=cancelled`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(TIER_AMOUNTS[opts.tier]),
    "line_items[0][price_data][product_data][name]": TIER_LABELS[opts.tier],
    "metadata[payment_id]": opts.paymentId,
    "metadata[user_id]": opts.userId,
    "metadata[tier]": opts.tier,
    "metadata[donation_plan]": plan,
  });

  if (interval) {
    body.set("line_items[1][quantity]", "1");
    body.set("line_items[1][price_data][currency]", "eur");
    body.set("line_items[1][price_data][unit_amount]", String(DONATION_PLAN_CENTS[plan]));
    body.set("line_items[1][price_data][recurring][interval]", interval);
    body.set("line_items[1][price_data][product_data][name]", "Keep ROUT Alive donation");
    body.set("subscription_data[metadata][payment_id]", opts.paymentId);
  }

  if (opts.email) body.set("customer_email", opts.email);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok || !json.url) throw new Error(json.error?.message ?? "stripe_checkout_failed");
  return json.url;
}

/** Marks a payment paid, flips the profile to Early Believer and provisions the alias. */
export async function activateVerification(paymentId: string, providerRef: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: payment } = await supabaseAdmin
    .from("verification_payments")
    .select("id, user_id, tier, status")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) return false;
  if (payment.status === "paid") return true;

  await supabaseAdmin
    .from("verification_payments")
    .update({ status: "paid", provider_ref: providerRef })
    .eq("id", payment.id);

  await supabaseAdmin
    .from("profiles")
    .update({
      tier: payment.tier,
      verified: true,
      is_early_believer: true,
      status: "active",
      verified_at: new Date().toISOString(),
    })
    .eq("id", payment.user_id);

  await supabaseAdmin.from("security_events").insert({
    user_id: payment.user_id,
    kind: "verification_activated",
    severity: "info",
    message: `Early Believer verification activated (${payment.tier}).`,
    details: { payment_id: payment.id },
  });

  // Best effort: the @rout.be alias must never block activation.
  try {
    const { provisionAliasForUser } = await import("./alias.server");
    await provisionAliasForUser(payment.user_id);
  } catch (error) {
    console.error("alias provisioning failed", error);
  }

  return true;
}
