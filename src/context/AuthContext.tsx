import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type StudioUser = {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  client_id?: string | null;
  [key: string]: any;
};

type AuthContextValue = {
  user: StudioUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(user: User): Promise<StudioUser> {
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const meta = user.user_metadata ?? {};
  const fullName = data?.full_name || meta.full_name || meta.name || user.email?.split("@")[0] || "AA User";
  return {
    id: user.id,
    email: user.email ?? "",
    name: fullName,
    role: data?.role ?? meta.role ?? null,
    client_id: data?.client_id ?? meta.client_id ?? null,
    ...(data ?? {}),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StudioUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      if (data.session?.user) setUser(await loadProfile(data.session.user));
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        setUser(await loadProfile(nextSession.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password = "") => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo<AuthContextValue>(() => ({ user, session, loading, signIn, signOut }), [user, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
