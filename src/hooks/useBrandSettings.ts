import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { initializeBrandSettings, defaultBrandSettings } from "@/lib/supabase-helpers";
import { useEffect } from "react";

export function useBrandSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: brandSettings, isLoading, refetch } = useQuery({
    queryKey: ["brand_settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("brand_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Initialize brand settings if they don't exist
  useEffect(() => {
    if (user && !isLoading && !brandSettings) {
      initializeBrandSettings(user.id).then(() => refetch());
    }
  }, [user, isLoading, brandSettings, refetch]);

  const updateBrandSettings = useMutation({
    mutationFn: async (updates: Partial<{
      naming_convention: string;
      palette: Record<string, string>;
      typography: Record<string, string>;
      rules: Record<string, any>;
      brand_assets: Record<string, any>;
    }>) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("brand_settings")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand_settings", user?.id] });
    },
  });

  return {
    brandSettings: brandSettings || {
      ...defaultBrandSettings,
      naming_convention: "AA_[Series]_[Title]_[Format]_[Date]",
    },
    isLoading,
    updateBrandSettings: updateBrandSettings.mutate,
    isUpdating: updateBrandSettings.isPending,
  };
}
