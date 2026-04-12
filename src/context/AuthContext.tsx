import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type StudioUser = {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
};

type AuthContextValue = {
  user: StudioUser | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const STORAGE_KEY = "aa-studio-auth";
const AuthContext = createContext<AuthContextValue | null>(null);

function createUser(email: string): StudioUser {
  const clean = email.trim().toLowerCase();
  const name = clean.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, char => char.toUpperCase());
  return {
    id: `demo-${clean}`,
    email: clean,
    name: name || "AA User",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StudioUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StudioUser;
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const session = useMemo<StudioSession | null>(() => (user ? { user } : null), [user]);

  const signIn = async (email: string) => {
    const nextUser = createUser(email);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
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
