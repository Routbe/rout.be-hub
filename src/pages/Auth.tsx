import { useState, useEffect, useRef } from "react";
import { useSearch } from "@tanstack/react-router";
import { Link, useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, Fingerprint, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { MaskedIcon } from "@/components/MaskedIcon";
import { PasswordField, isPasswordCompliant } from "@/components/PasswordField";
import { BRAND_MARKS } from "@/lib/brand-marks";
import {
  getBootstrapState,
  checkHandleAvailability,
  suggestHandleForName,
  createTestSuperAdmin,
} from "@/lib/bootstrap.functions";
import { amIAdmin } from "@/lib/admin.functions";
import { handleLengthMessage } from "@/lib/handle-rules";

/** Monochrome provider marks — no single brand is allowed to dominate. */
const MARKS: Record<string, string> = {
  github:
    "M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z",
  gitlab:
    "M12 21.4l3.7-11.4H8.3L12 21.4zM3 10l2-6 3.3 6H3zm18 0h-5.3L19 4l2 6zM3 10l9 11.4L6.7 10H3zm18 0h-3.7L12 21.4 21 10z",
  apple:
    "M16.4 12.9c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.9-3.1-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.9-2.3.9-1.3 1.3-2.5 1.3-2.6 0 0-2.4-.9-2.4-3.6zM14.3 5.6c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z",
  google:
    "M12 11v3.2h5.3c-.2 1.4-1.6 4-5.3 4a5.7 5.7 0 010-11.4c1.7 0 2.9.7 3.6 1.4l2.5-2.4A9.1 9.1 0 0012 3a9 9 0 100 18c5.2 0 8.7-3.7 8.7-8.8 0-.6-.1-1-.2-1.4H12z",
  oidc: "M12 2l8 4v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-4zm0 2.2L6 7v5c0 3.8 2.5 6.7 6 7.8 3.5-1.1 6-4 6-7.8V7l-6-2.8zM12 8a3 3 0 110 6 3 3 0 010-6z",
};

type ProviderKey = "google" | "apple" | "github" | "gitlab" | "oidc";

/**
 * Auth tiles. `mark` is an inline path, `remote` an official asset that is CSS
 * masked so every logo renders in the single theme text colour.
 */
const TILES: {
  id: string;
  label: string;
  provider: ProviderKey;
  mark?: string;
  remote?: string;
}[] = [
  { id: "github", label: "GitHub", provider: "github", mark: MARKS.github },
  { id: "apple", label: "Apple", provider: "apple", mark: MARKS.apple },
  { id: "google", label: "Google", provider: "google", mark: MARKS.google },
  {
    id: "mastodon",
    label: "Mastodon / Fediverse",
    provider: "gitlab",
    remote: BRAND_MARKS.mastodon,
  },
  {
    id: "keycloak",
    label: "Keycloak / Custom OIDC",
    provider: "oidc",
    remote: BRAND_MARKS.keycloak,
  },
  { id: "gitlab", label: "GitLab", provider: "gitlab", mark: MARKS.gitlab },
];

const PROVIDER_LABELS: Record<string, string> = {
  github: "GitHub",
  apple: "Apple",
  google: "Google",
  gitlab: "Mastodon / Fediverse",
  oidc: "Keycloak / Custom OIDC",
};

export default function Auth() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { mode, redirect } = useSearch({ from: "/auth" });
  const [tab, setTab] = useState<"signin" | "signup">(mode === "signup" ? "signup" : "signin");
  /** Magic link is the primary sign-in method; password is the fallback. */
  const [method, setMethod] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleTouched, setHandleTouched] = useState(false);
  const [handleState, setHandleState] = useState<{
    checking: boolean;
    ok: boolean | null;
    reason?: string;
  }>({ checking: false, ok: null });
  const [loading, setLoading] = useState(false);
  const [needsFirstAdmin, setNeedsFirstAdmin] = useState(false);
  const suggestTimer = useRef<number | undefined>(undefined);
  const checkTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let active = true;
    getBootstrapState()
      .then((s) => active && setNeedsFirstAdmin(s.needsFirstAdmin))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setTab(mode === "signup" ? "signup" : "signin");
  }, [mode]);

  /**
   * Where to land after authentication: an explicit `?redirect=` wins, then the
   * admin portal for administrators (the first account is auto-promoted),
   * otherwise the normal dashboard.
   */
  const resolveDestination = async () => {
    if (redirect) return redirect;
    try {
      const res = await amIAdmin({});
      if (res.isAdmin) return "/admin";
    } catch {
      /* not an admin, or the probe failed — fall through */
    }
    return "/dashboard";
  };

  useEffect(() => {
    if (!user) return;
    let active = true;
    void resolveDestination().then((to) => active && nav(to, { replace: true }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, nav, redirect]);

  /** Full legal name → suggested free handle (debounced, server-side dedup). */
  const onNameChange = (value: string) => {
    setName(value);
    if (handleTouched) return;
    window.clearTimeout(suggestTimer.current);
    if (value.trim().length < 3) return;
    suggestTimer.current = window.setTimeout(async () => {
      try {
        const res = await suggestHandleForName({ data: { fullName: value } });
        setHandle(res.handle);
        setHandleState({ checking: false, ok: true });
      } catch {
        /* suggestion is best-effort */
      }
    }, 400);
  };

  /**
   * Length rules are enforced instantly on the client so the message can never
   * contradict a slower server answer; only 5+ character handles are probed for
   * availability (debounced by 300 ms).
   */
  const onHandleChange = (value: string) => {
    setHandle(value);
    setHandleTouched(true);
    window.clearTimeout(checkTimer.current);

    if (!value.trim()) {
      setHandleState({ checking: false, ok: null });
      return;
    }

    const lengthIssue = handleLengthMessage(value);
    if (lengthIssue) {
      setHandleState({ checking: false, ok: false, reason: lengthIssue });
      return;
    }

    setHandleState({ checking: true, ok: null });
    checkTimer.current = window.setTimeout(async () => {
      try {
        const res = await checkHandleAvailability({ data: { handle: value } });
        setHandleState({ checking: false, ok: res.ok, reason: res.reason });
      } catch {
        setHandleState({ checking: false, ok: null, reason: "Check failed." });
      }
    }, 300);
  };

  const createDevAdmin = async () => {
    setLoading(true);
    try {
      const res = await createTestSuperAdmin({});
      if (!res.ok) {
        toast.error(res.reason ?? "Could not create the test admin.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: res.email,
        password: res.password,
      });
      if (error) return toast.error(error.message);
      toast.success(`Test super admin ready — ${res.email}`);
      nav("/admin", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    nav("/dashboard");
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, handle: handle.trim().replace(/^@/, "").toLowerCase() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — check your email if confirmation is required.");
  };

  const magicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Magic link sent — check your inbox.");
  };

  const resetPassword = async () => {
    if (!email) return toast.error("Enter your e-mail address first.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent — check your inbox.");
  };

  const oauth = async (provider: "google" | "apple" | "github" | "gitlab" | "oidc") => {
    if (provider === "github" || provider === "gitlab" || provider === "oidc") {
      toast.info(
        `${PROVIDER_LABELS[provider]} login is not available yet on this backend — use a passkey, Apple or e-mail.`,
      );
      return;
    }
    setLoading(true);
    const r = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (r.error) {
      setLoading(false);
      toast.error(r.error.message || "Sign-in failed");
      return;
    }
    if (r.redirected) return;
    nav("/dashboard");
  };

  const passkey = async () => {
    if (typeof window === "undefined" || !("PublicKeyCredential" in window)) {
      return toast.error("This device or browser does not support passkeys.");
    }
    toast.info("Passkeys are rolling out — sign in with a magic link for now.");
    setMethod("magic");
  };

  const emailField = (
    <div className="space-y-1">
      <Label htmlFor="auth-email" className="text-sm">
        Email
      </Label>
      <Input
        id="auth-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@domain.com"
        className="h-10 rounded-lg"
        required
      />
    </div>
  );

  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
        {needsFirstAdmin && (
          <div className="mb-3 w-full max-w-md border border-foreground bg-muted p-3">
            <p className="text-xs font-semibold uppercase tracking-wide">Setup mode</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No administrator exists yet. The <strong>first account created here</strong> is
              automatically promoted to Super Admin and gets access to <code>/admin</code>.
            </p>
          </div>
        )}
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-7">
          <div className="mb-4">
            <h1 className="mb-1 font-display text-2xl text-foreground">
              {tab === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Sovereign authentication: biometric passkeys, passwordless magic links or open
              protocols.
            </p>
          </div>

          {/* Primary sovereign action */}
          <button
            type="button"
            onClick={passkey}
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Fingerprint className="h-4 w-4" aria-hidden />
            Sign in with Passkey
          </button>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            Fingerprint, face or hardware key — nothing leaves your device.
          </p>

          {/* Secondary connectors — equal weight, all masked to one colour */}
          <div data-testid="auth-provider-tiles" className="mt-3.5 grid grid-cols-6 gap-2">
            {TILES.map((tile) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => oauth(tile.provider)}
                disabled={loading}
                aria-label={`Continue with ${tile.label}`}
                title={`Continue with ${tile.label}`}
                className="flex h-10 items-center justify-center rounded-xl border border-border/50 p-2 text-foreground transition-colors hover:bg-muted/50 disabled:opacity-60"
              >
                {tile.remote ? (
                  <MaskedIcon src={tile.remote} className="h-4 w-4" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d={tile.mark} />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden /> Mastodon and Keycloak cover the
            Fediverse and self-hosted SSO (Authentik, Keycloak, Authelia).
          </p>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              or use email
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <div className="mt-3.5 min-h-[220px] transition-opacity duration-150">
              <TabsContent value="signin" className="mt-0">
                {method === "magic" ? (
                  <form onSubmit={magicLink} className="space-y-3.5">
                    {emailField}
                    <Button
                      type="submit"
                      className="h-11 w-full rounded-lg font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" /> ✉️ Send Magic Link
                        </>
                      )}
                    </Button>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Passwordless: we mail you a one-time sign-in link.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMethod("password")}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                      <KeyRound className="h-3.5 w-3.5" aria-hidden /> Sign in with password instead
                    </button>
                  </form>
                ) : (
                  <form onSubmit={signIn} className="space-y-3.5">
                    {emailField}
                    <div className="space-y-1">
                      <Label htmlFor="auth-password" className="text-sm">
                        Password
                      </Label>
                      <Input
                        id="auth-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 rounded-lg"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={resetPassword}
                        className="text-[11px] text-muted-foreground mt-1 underline underline-offset-4 hover:text-foreground"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Button
                      type="submit"
                      className="h-11 w-full rounded-lg font-medium"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setMethod("magic")}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                      <Mail className="h-3.5 w-3.5" aria-hidden /> Use a magic link instead
                    </button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={signUp} className="space-y-3.5">
                  <div className="space-y-1">
                    <Label htmlFor="signup-name" className="text-sm">
                      Full name
                    </Label>
                    <Input
                      id="signup-name"
                      value={name}
                      onChange={(e) => onNameChange(e.target.value)}
                      className="h-10 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="signup-handle" className="text-sm">
                      Your handle
                    </Label>
                    <Input
                      id="signup-handle"
                      value={handle}
                      onChange={(e) => onHandleChange(e.target.value)}
                      placeholder="jane.doe"
                      className="h-10 rounded-lg"
                      aria-invalid={handleState.ok === false}
                      aria-describedby="signup-handle-msg"
                    />
                    <p
                      id="signup-handle-msg"
                      aria-live="polite"
                      className={`text-[11px] ${
                        handleState.ok === false ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      {handleState.checking
                        ? "Checking availability…"
                        : handleState.ok === true
                          ? `rout.be/@${handle} is available`
                          : (handleState.reason ?? `rout.be/@${handle || "your.handle"}`)}
                    </p>
                  </div>
                  {emailField}

                  <PasswordField value={password} onChange={setPassword} required minLength={8} />

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-lg font-medium"
                    disabled={
                      loading ||
                      !isPasswordCompliant(password) ||
                      handleState.ok !== true ||
                      handleLengthMessage(handle) !== null
                    }
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    By creating an account you agree to our{" "}
                    <Link to="/terms" className="underline underline-offset-4">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="underline underline-offset-4">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
                {import.meta.env.DEV ? (
                  <button
                    type="button"
                    onClick={createDevAdmin}
                    disabled={loading}
                    data-testid="dev-admin-login"
                    className="mt-3 w-full text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Dev Admin Quick Login
                  </button>
                ) : null}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
