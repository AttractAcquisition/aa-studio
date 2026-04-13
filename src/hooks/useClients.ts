import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type ClientRow = {
  id: string;
  business_name: string;
  owner_name: string;
  tier: string | null;
  status: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  monthly_retainer: number | null;
  monthly_ad_spend: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
};

export function useClients() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["clients", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("clients" as any)
        .select("*")
        .eq("status", "active")
        .order("business_name", { ascending: true });

      if (error) throw error;
      return (data || []) as ClientRow[];
    },
    enabled: !!user,
  });

  return {
    clients: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
