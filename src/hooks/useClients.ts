import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StudioClient = {
  id: string;
  name: string;
  trade_sector: string;
  city: string;
  conversion_objective: string | null;
  status: string | null;
  service_radius_km: number | null;
  avg_job_value_zar: number | null;
};

export function useClients() {
  const query = useQuery({
    queryKey: ["clients", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, trade_sector, city, conversion_objective, status, service_radius_km, avg_job_value_zar")
        .eq("status", "active")
        .order("name", { ascending: true });

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
