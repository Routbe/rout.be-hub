import { useEffect, useState } from "react";
import { Copy, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** username@rout.be forwarding configuration — Pro / verified members only. */
export function EmailForwardingPanel() {
  const { user } = useAuth();
  const [handle, setHandle] = useState("");
  const [eligible, setEligible] = useState(false);
  const [forwardTo, setForwardTo] = useState("");
  const [publicly, setPublicly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, verified, is_early_believer, is_paid, forwarding_email, show_email_publicly")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setHandle(data?.username ?? "");
      setEligible(Boolean(data?.verified || data?.is_early_believer || data?.is_paid));
      setForwardTo(data?.forwarding_email ?? user.email ?? "");
      setPublicly(Boolean(data?.show_email_publicly));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || !eligible) return null;

  const alias = `${handle || "handle"}@rout.be`;

  const save = async () => {
    const value = forwardTo.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("Enter a valid destination e-mail address.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ forwarding_email: value, show_email_publicly: publicly })
      .eq("id", user!.id);
    setSaving(false);
    if (error) toast.error("Could not save the forwarding settings.");
    else toast.success("Forwarding settings saved.");
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-lg font-medium">
        <Mail className="h-4 w-4" aria-hidden /> Email forwarding
      </h2>
      <p className="text-xs text-muted-foreground">
        Mail sent to your ROUT alias is forwarded to the inbox you choose below.
      </p>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-sm">{alias}</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-lg"
          onClick={() => {
            void navigator.clipboard.writeText(alias);
            toast.success("Alias copied!");
          }}
        >
          <Copy className="mr-1 h-3 w-3" /> Copy
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="forward-to" className="text-xs font-semibold">
          Forward to
        </Label>
        <Input
          id="forward-to"
          type="email"
          value={forwardTo}
          onChange={(e) => setForwardTo(e.target.value)}
          placeholder="you@example.com"
          className="input-field h-10 rounded-xl"
        />
      </div>

      <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
        <span className="text-xs">
          <span className="block font-medium">Show alias on my public profile</span>
          <span className="block text-muted-foreground">
            Adds a “Contact via {alias}” button to your link hub.
          </span>
        </span>
        <Switch checked={publicly} onCheckedChange={setPublicly} />
      </label>

      <Button type="button" className="h-10 rounded-xl" disabled={saving} onClick={save}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save forwarding settings
      </Button>
    </section>
  );
}
