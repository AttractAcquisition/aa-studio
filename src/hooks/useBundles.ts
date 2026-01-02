import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Bundle = {
  id: string;
  user_id: string | null;
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
  design_image_urls: Record<string, any> | null;
  export_urls: Record<string, any> | string[] | null;
  status: "draft" | "scheduled" | "published";
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BundleInsert = Partial<Omit<Bundle, "id" | "created_at" | "updated_at">> & {
  user_id?: string; // allow server/RLS defaults if applicable
};

export type BundleUpdate = Partial<Omit<Bundle, "id" | "user_id" | "created_at" | "updated_at">>;

export function useBundles(limit = 10) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["bundles", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      // IMPORTANT:
      // Do not hard-filter on user_id unless you're 100% sure every row always has it.
      // If some rows were created without user_id, `.eq("user_id", user.id)` returns empty.
      // This query relies on RLS, but also "includes" null user_id rows if your RLS allows it.
      const { data, error } = await supabase
        .from("content_bundles")
        .select("*")
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as Bundle[];
    },
  });

  return {
    bundles: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useBundle(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bundle", id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      if (!id || !user) return null;

      const { data, error } = await supabase
        .from("content_bundles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      // Optional safety: if you want to hide other users' bundles even if RLS is misconfigured
      if (data && data.user_id && data.user_id !== user.id) return null;

      return data as Bundle | null;
    },
  });
}

export function useBundleMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidateBundles = () => {
    // Ensures ALL variants like ["bundles", userId, limit] refresh
    queryClient.invalidateQueries({ queryKey: ["bundles"], exact: false });
    queryClient.invalidateQueries({ queryKey: ["bundle"], exact: false });
  };

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
    onSuccess: invalidateBundles,
  });

  const updateBundle = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BundleUpdate }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: bundle, error } = await supabase
        .from("content_bundles")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Optional safety: if you want to prevent updating bundles that don't belong to the user
      if (bundle?.user_id && bundle.user_id !== user.id) {
        throw new Error("Unauthorized update");
      }

      return bundle as Bundle;
    },
    onSuccess: invalidateBundles,
  });

  const deleteBundle = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("content_bundles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: invalidateBundles,
  });

  return { createBundle, updateBundle, deleteBundle };
}
