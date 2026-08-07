import { createFileRoute } from "@tanstack/react-router";
import { missingSecretResponse } from "@/lib/api-secrets";

/** Stripe webhook: only a confirmed payment activates a verified profile. */
export const Route = createFileRoute("/api/public/verify/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!secret) return missingSecretResponse();

        const signature = request.headers.get("stripe-signature") ?? "";
        const body = await request.text();
        if (!(await verifyStripeSignature(body, signature, secret))) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
        try {
          event = JSON.parse(body);
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        if (event.type !== "checkout.session.completed") return new Response("ok");
        if (!event.id) return new Response("Bad request", { status: 400 });

        // Idempotency: record the Stripe event id first; a replay is a no-op.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error: dupe } = await supabaseAdmin
          .from("webhook_events")
          .insert({ id: event.id, source: "stripe", kind: event.type });
        if (dupe) {
          if (dupe.code === "23505") return new Response("ok (duplicate)");
          return new Response("Server error", { status: 500 });
        }

        const session = event.data?.object ?? {};
        const metadata = (session.metadata ?? {}) as Record<string, string>;
        const paymentId = metadata.payment_id;
        if (!paymentId) return new Response("ok");

        const { activateVerification } = await import("@/lib/verification.server");
        await activateVerification(paymentId, (session.id as string | undefined) ?? null);
        return new Response("ok");
      },
    },
  },
});

async function verifyStripeSignature(body: string, header: string, secret: string) {
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, ...v] = p.split("=");
      return [k.trim(), v.join("=")];
    }),
  ) as { t?: string; v1?: string };
  if (!parts.t || !parts.v1) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${parts.t}.${body}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== parts.v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  return diff === 0;
}
