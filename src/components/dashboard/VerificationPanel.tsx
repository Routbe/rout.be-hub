import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Copy, CreditCard, Landmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  DONATION_PLANS,
  EARLY_BELIEVER_CENTS,
  SEPA_DETAILS,
  euro,
  type DonationPlan,
} from "@/lib/profile";
import { startSepaVerification, startVerification } from "@/lib/verification.functions";

type PaymentMethod = "stripe" | "sepa";

function copy(value: string, what: string) {
  void navigator.clipboard.writeText(value);
  toast.success(`Copied · ${what}`);
}

const PERKS = [
  "Verified “Early Believer” badge on your public profile",
  "Your own username@rout.be forwarding address",
  "Custom domain mapping (e.g. jona.be → your ROUT profile)",
  "Price locked for life — never billed again",
];

/**
 * Early Believer checkout — one-time €3.99 lifetime verification with an
 * optional recurring “Keep ROUT Alive” donation. Flat UI: solid colours,
 * crisp borders, no gradients.
 */
export function VerificationPanel() {
  const { user } = useAuth();
  const start = useServerFn(startVerification);
  const startSepa = useServerFn(startSepaVerification);
  const [state, setState] = useState<{
    tier: string;
    verified: boolean;
    isEarlyBeliever: boolean;
    isPaid: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showSepa, setShowSepa] = useState(false);
  const [sepaRef, setSepaRef] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [did, setDid] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("stripe");
  const [plan, setPlan] = useState<DonationPlan>("none");

  const planCents = DONATION_PLANS.find((p) => p.id === plan)?.cents ?? 0;
  const planInterval = DONATION_PLANS.find((p) => p.id === plan)?.interval ?? null;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("tier, verified, status, username, is_early_believer, is_paid")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setHandle(data?.username ?? "");
      setState({
        tier: data?.tier ?? "free",
        verified: Boolean(data?.verified),
        isEarlyBeliever: Boolean(data?.is_early_believer),
        isPaid: Boolean(data?.is_paid),
      });
    };

    void load();

    // A manual admin approval must flip this panel without a page refresh.
    const channel = supabase
      .channel(`profile-status-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const active = Boolean(state?.isEarlyBeliever || state?.isPaid);

  const upgrade = async () => {
    setBusy(true);
    try {
      const res = await start({
        data: { origin: window.location.origin, donationPlan: plan },
      });
      if (res.ok) {
        window.location.href = res.url;
        return;
      }
      if (res.reason === "email_unconfirmed")
        toast.error("Please confirm your e-mail address first — check your inbox.");
      else if (res.reason === "stripe_not_configured")
        toast.warning("Card payment is not configured yet — use the bank transfer for now.");
      else toast.error("Could not start payment. Please try again.");
    } catch {
      toast.error("Could not start payment. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const wellKnownUrl =
    typeof window === "undefined"
      ? `https://rout.be/.well-known/atproto-did/${handle || "handle"}`
      : `${window.location.origin}/.well-known/atproto-did/${handle || "handle"}`;

  return (
    <section className="space-y-4 rounded-none border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {active ? "Early Believer — active" : "Become an Early Believer"}
        </h2>
        {active && (
          <span className="inline-flex items-center gap-1.5 border border-primary bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
            <BadgeCheck className="h-3.5 w-3.5" /> Early Believer
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Verified profiles live at{" "}
        <strong className="font-mono">rout.be/@{handle || "handle"}</strong>. Free profiles stay at{" "}
        <strong className="font-mono">rout.be/free/@{handle || "handle"}</strong>. Verification only
        becomes active once your payment is confirmed.
      </p>

      {!active && (
        <div className="border border-border">
          {/* Line item */}
          <div className="flex items-baseline justify-between gap-3 border-b border-border p-4">
            <div>
              <p className="text-sm font-semibold">Early Believer Lifetime Verification</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                One-time · price lock for life
              </p>
            </div>
            <span className="text-2xl font-bold tabular-nums">{euro(EARLY_BELIEVER_CENTS)}</span>
          </div>

          <ul className="space-y-1 border-b border-border p-4 text-[11px] text-muted-foreground">
            {PERKS.map((p) => (
              <li key={p} className="flex gap-2">
                <span aria-hidden>·</span>
                {p}
              </li>
            ))}
          </ul>

          {/* Donation selector */}
          <fieldset className="border-b border-border p-4">
            <legend className="sr-only">Keep ROUT Alive donation</legend>
            <p className="mb-2 text-xs font-semibold">Keep ROUT Alive (optional)</p>
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Donation">
              {DONATION_PLANS.map((p) => {
                const selected = plan === p.id;
                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-start gap-2 border p-3 text-[11px] transition-colors ${
                      selected
                        ? "border-foreground bg-muted"
                        : "border-border hover:border-foreground/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="donation-plan"
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      checked={selected}
                      onChange={() => setPlan(p.id)}
                    />
                    <span>
                      <span className="block font-semibold text-foreground">{p.label}</span>
                      <span className="block text-muted-foreground">{p.note}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Payment method */}
          <div
            className="grid gap-2 border-b border-border p-4 sm:grid-cols-2"
            role="radiogroup"
            aria-label="Payment method"
          >
            {[
              {
                id: "stripe" as const,
                icon: CreditCard,
                label: "Card / Apple Pay",
                note: "Instant activation",
              },
              {
                id: "sepa" as const,
                icon: Landmark,
                label: "Bank transfer (SEPA)",
                note: "Manual match, 1–2 weeks",
              },
            ].map(({ id, icon: Icon, label, note }) => {
              const selected = method === id;
              return (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-2 border p-3 text-[11px] transition-colors ${
                    selected
                      ? "border-foreground bg-muted"
                      : "border-border hover:border-foreground/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    className="h-3.5 w-3.5"
                    checked={selected}
                    onChange={() => setMethod(id)}
                  />
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    <span className="block font-semibold text-foreground">{label}</span>
                    <span className="block text-muted-foreground">{note}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {/* Summary + CTA */}
          <div className="space-y-3 p-4">
            <dl className="space-y-1 text-xs">
              <div className="flex justify-between">
                <dt>Lifetime verification (one-time)</dt>
                <dd className="tabular-nums">{euro(EARLY_BELIEVER_CENTS)}</dd>
              </div>
              {planCents > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <dt>Donation ({planInterval === "month" ? "monthly" : "yearly"})</dt>
                  <dd className="tabular-nums">
                    {euro(planCents)} / {planInterval}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1 text-sm font-bold">
                <dt>Total today</dt>
                <dd className="tabular-nums">{euro(EARLY_BELIEVER_CENTS + planCents)}</dd>
              </div>
            </dl>

            {method === "stripe" ? (
              <Button
                className="h-11 w-full rounded-none text-sm font-semibold"
                disabled={busy}
                onClick={upgrade}
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pay {euro(EARLY_BELIEVER_CENTS + planCents)} — become an Early Believer
              </Button>
            ) : (
              <Button
                variant="outline"
                className="h-11 w-full rounded-none text-sm font-semibold"
                onClick={async () => {
                  if (showSepa) {
                    setShowSepa(false);
                    return;
                  }
                  setShowSepa(true);
                  try {
                    const res = await startSepa({ data: { donationPlan: plan } });
                    if (res.ok) setSepaRef(res.reference);
                  } catch {
                    /* falls back to the handle-based reference */
                  }
                }}
              >
                {showSepa
                  ? "Hide transfer details"
                  : `Request via SEPA — ${euro(EARLY_BELIEVER_CENTS)}`}
              </Button>
            )}

            {method === "sepa" && showSepa && (
              <div className="space-y-2 border border-border bg-muted p-3 text-[11px]">
                <p>
                  Beneficiary: <strong>{SEPA_DETAILS.beneficiary}</strong>
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono" data-testid="sepa-iban">
                    IBAN: {SEPA_DETAILS.iban}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-none px-2"
                    onClick={() => copy(SEPA_DETAILS.iban.replace(/\s/g, ""), "IBAN")}
                  >
                    <Copy className="mr-1 h-3 w-3" /> Copy IBAN
                  </Button>
                </div>
                <p className="font-mono">BIC / Swift: {SEPA_DETAILS.bic}</p>
                <p>
                  Bank: <strong>{SEPA_DETAILS.bank}</strong> — {SEPA_DETAILS.bankAddress}
                </p>
                <p>
                  Country: <strong>{SEPA_DETAILS.country}</strong>
                </p>
                <p>
                  Amount: <strong>{euro(EARLY_BELIEVER_CENTS)}</strong>
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p>
                    Reference:{" "}
                    <strong className="font-mono" data-testid="sepa-reference">
                      {sepaRef ?? `@${handle || "handle"}`}
                    </strong>
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-none px-2"
                    onClick={() => copy(sepaRef ?? `@${handle || "handle"}`, "Reference")}
                  >
                    <Copy className="mr-1 h-3 w-3" /> Copy Reference
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  Use the reference exactly as shown — payments are matched automatically.
                  Recurring donations are only available on the card route.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2 border border-border p-4">
        <Label htmlFor="bsky-did" className="text-xs font-semibold">
          Bluesky DID
        </Label>
        <Input
          id="bsky-did"
          value={did}
          onChange={(e) => setDid(e.target.value)}
          placeholder="did:plc:123..."
          className="rounded-none"
        />
        <p className="text-[11px] text-muted-foreground">
          Enter your Bluesky DID for handle resolution.
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          .well-known endpoint
        </p>
        <div className="flex items-start gap-1.5">
          <code className="min-w-0 flex-1 break-all border border-border bg-muted p-2 font-mono text-xs">
            {wellKnownUrl}
          </code>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label="Copy .well-known endpoint"
            onClick={() => copy(wellKnownUrl, ".well-known endpoint")}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
