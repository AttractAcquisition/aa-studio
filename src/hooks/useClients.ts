import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StudioClient = {
  id: string;
  business_name: string;
  owner_name: string | null;
  tier: string | null;
  status: string | null;
};

export function useClients() {
  const query = useQuery({
    queryKey: ["clients", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, business_name, owner_name, tier, status")
        .eq("status", "active")
        .order("business_name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as StudioClient[];
    },
  });

  return {
    clients: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
