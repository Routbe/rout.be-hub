/**
 * Inbound e-mail webhook — automated SEPA payment listener.
 *
 * ImprovMX forwards `payments@rout.be` here as a raw JSON payload. The body of
 * the bank notification (Wise / Bunq) is scanned for a `ROUT-XXXX` reference;
 * a match flips the matching profile to paid + Early Believer, writes an
 * `AUTO_PAYMENT_VERIFIED` audit entry and lets the DB trigger queue the
 * @rout.be alias, which is drained immediately.
 *
 * The ImprovMX API key and the webhook token are read from the server
 * environment only — never from client code.
 */
import { createFileRoute } from "@tanstack/react-router";
import { missingSecretResponse } from "@/lib/api-secrets";

const REFERENCE_RE = /ROUT-\d{4}/i;

/** Pulls every plausible text field out of an unknown inbound-mail payload. */
function collectText(payload: unknown, depth = 0): string {
  if (depth > 6) return "";
  if (typeof payload === "string") return ` ${payload}`;
  if (Array.isArray(payload)) return payload.map((v) => collectText(v, depth + 1)).join(" ");
  if (payload && typeof payload === "object") {
    return Object.values(payload as Record<string, unknown>)
      .map((v) => collectText(v, depth + 1))
      .join(" ");
  }
  return "";
}

export const Route = createFileRoute("/api/public/payments/inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["INBOUND_EMAIL_TOKEN"];
        if (!token) return missingSecretResponse();

        const url = new URL(request.url);
        const provided =
          url.searchParams.get("token") ?? request.headers.get("x-inbound-token") ?? "";
        if (provided !== token) return new Response("Unauthorized", { status: 401 });

        const raw = await request.text();
        if (raw.trim().length === 0) {
          return new Response("Bad Request", { status: 400 });
        }

        let parsed: unknown = raw;
        const contentType = request.headers.get("content-type") ?? "";
        try {
          parsed = JSON.parse(raw);
        } catch {
          // ImprovMX may post form-encoded or raw MIME — the text scan covers those.
          // A payload that *claims* to be JSON but is not, is malformed.
          if (contentType.includes("json")) {
            return new Response("Bad Request", { status: 400 });
          }
        }

        const haystack = `${raw} ${collectText(parsed)}`;
        const match = haystack.match(REFERENCE_RE);
        if (!match) return Response.json({ ok: true, matched: false, reason: "no_reference" });

        const reference = match[0].toUpperCase();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency: the same reference is only ever activated once.
        const { error: dupe } = await supabaseAdmin
          .from("webhook_events")
          .insert({ id: `inbound:${reference}`, source: "improvmx", kind: "payment_email" });
        if (dupe) {
          if (dupe.code === "23505") {
            return Response.json({ ok: true, matched: true, reference, duplicate: true });
          }
          return new Response("Server error", { status: 500 });
        }

        const { data: payment } = await supabaseAdmin
          .from("verification_payments")
          .select("id, user_id, tier, status")
          .eq("reference_code", reference)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!payment) {
          // Release the marker so a later delivery (once the payment row
          // exists) can still activate this reference exactly once.
          await supabaseAdmin.from("webhook_events").delete().eq("id", `inbound:${reference}`);
          return Response.json({ ok: true, matched: true, reference, reason: "unknown_reference" });
        }

        // Already activated by an earlier delivery: no second audit entry and no
        // second alias provisioning job.
        if (payment.status === "paid") {
          return Response.json({ ok: true, matched: true, reference, duplicate: true });
        }

        await supabaseAdmin
          .from("verification_payments")
          .update({ status: "paid", provider_ref: reference })
          .eq("id", payment.id);

        await supabaseAdmin
          .from("profiles")
          .update({
            is_paid: true,
            is_early_believer: true,
            payment_method: "bank_transfer_automatic",
            tier: payment.tier,
            verified: true,
            status: "active",
            verified_at: new Date().toISOString(),
          })
          .eq("id", payment.user_id);

        await supabaseAdmin.from("admin_audit_log").insert({
          admin_id: payment.user_id,
          admin_email: "system@rout.be",
          action: "AUTO_PAYMENT_VERIFIED",
          target_user_id: payment.user_id,
          target_label: reference,
          notes: `Reference: ${reference} — automatic bank transfer match.`,
        });

        await supabaseAdmin.from("security_events").insert({
          user_id: payment.user_id,
          kind: "verification_activated",
          severity: "info",
          message: `Payment auto-verified from bank e-mail (${reference}).`,
          details: { payment_id: payment.id, reference },
        });

        // The is_paid trigger queues the alias job — drain it right away so the
        // @rout.be address is live without any admin intervention.
        let alias: unknown = null;
        try {
          const { drainAliasSyncQueue } = await import("@/lib/alias-sync.server");
          alias = await drainAliasSyncQueue(5);
        } catch (error) {
          console.error("alias drain after auto payment failed", error);
        }

        return Response.json({ ok: true, matched: true, reference, alias });
      },
    },
  },
});
