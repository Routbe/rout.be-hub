import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SANDBOX_MODE_MESSAGE } from "@/lib/api-secrets";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** False when the backend is unconfigured — the app runs in sandbox mode. */
  available: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  available: true,
  signOut: async () => {},
});

let sandboxWarned = false;

/** True once the backend turned out to be unconfigured — read by dev/admin panels. */
export let sandboxMode = false;

/**
 * A missing backend key must degrade to sandbox mode, never crash the route —
 * and never interrupt normal use with a toast. Sandbox status is surfaced
 * silently inside the developer/admin tabs instead.
 */
function warnSandbox() {
  sandboxMode = true;
  if (sandboxWarned) return;
  sandboxWarned = true;
  if (import.meta.env.DEV) console.info(SANDBOX_MODE_MESSAGE);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        setSession(s);
        setLoading(false);
      });
      unsubscribe = () => sub.subscription.unsubscribe();
      supabase.auth
        .getSession()
        .then(({ data }) => {
          setSession(data.session);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } catch {
      setAvailable(false);
      setLoading(false);
      warnSandbox();
    }
    return () => unsubscribe?.();
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        available,
        signOut: async () => {
          try {
            await supabase.auth.signOut();
          } catch {
            warnSandbox();
          }
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
