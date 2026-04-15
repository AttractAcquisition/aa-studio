import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StudioContextValue = {
  clientId: string | null;
  aiContext: Record<string, any> | null;
  activeCycle: Record<string, any> | null;
  loading: boolean;
  refreshContext: () => Promise<void>;
};

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ clientId, children }: { clientId: string | null; children: ReactNode }) {
  const [aiContext, setAiContext] = useState<Record<string, any> | null>(null);
  const [activeCycle, setActiveCycle] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshContext = async () => {
    if (!clientId) {
      setAiContext(null);
      setActiveCycle(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [{ data: contextRow }, { data: cycleRows }] = await Promise.all([
      supabase.from("client_ai_context").select("*").eq("client_id", clientId).maybeSingle(),
      supabase.from("cycles").select("*").eq("client_id", clientId).eq("status", "active").order("cycle_number", { ascending: false }).limit(1),
    ]);

    setAiContext(contextRow?.context_json ?? null);
    setActiveCycle(cycleRows?.[0] ?? null);
    setLoading(false);
  };

  useEffect(() => {
    void refreshContext();
  }, [clientId]);

  const value = useMemo<StudioContextValue>(() => ({ clientId, aiContext, activeCycle, loading, refreshContext }), [clientId, aiContext, activeCycle, loading]);

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error("useStudio must be used within StudioProvider");
  return context;
}
