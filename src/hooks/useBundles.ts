import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Bundle = {
  id: string;
  user_id: string;
  title: string;
  series: string | null;
  content_type: string | null;
  audience: string | null;
  hook: string | null;
  script: string | null;
  caption: string | null;
  cta: string | null;
  one_pager_layout_json: Record<string, any> | null;
  one_pager_export_png_url: string | null;
  design_prompts: Record<string, string> | null;
  design_image_urls: Record<string, string> | null;
  export_urls: Record<string, string> | string[] | null;
  status: "draft" | "scheduled" | "published";
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BundleInsert = Partial<Omit<Bundle, "id" | "created_at" | "updated_at">> & {
  user_id: string;
};

export type BundleUpdate = Partial<Omit<Bundle, "id" | "user_id" | "created_at" | "updated_at">>;

export function useBundles(limit = 10) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["bundles", user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("content_bundles")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as Bundle[];
    },
    enabled: !!user,
  });

  return {
    bundles: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useBundle(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bundle", id],
    queryFn: async () => {
      if (!id || !user) return null;

      const { data, error } = await supabase
        .from("content_bundles")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Bundle | null;
    },
    enabled: !!id && !!user,
  });
}

export function useBundleMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createBundle = useMutation({
    mutationFn: async (data: Omit<BundleInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");

      const { data: bundle, error } = await supabase
        .from("content_bundles")
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return bundle as Bundle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
    },
  });

  const updateBundle = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BundleUpdate }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: bundle, error } = await supabase
        .from("content_bundles")
        .update(data)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return bundle as Bundle;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
      queryClient.invalidateQueries({ queryKey: ["bundle", variables.id] });
    },
  });

  const deleteBundle = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("content_bundles")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
    },
  });

  return { createBundle, updateBundle, deleteBundle };
}
