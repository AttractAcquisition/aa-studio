import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { uploadToBucket, createAssetRow, getAssetPublicUrl } from "@/lib/supabase-helpers";

export function useProofs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: proofs, isLoading } = useQuery({
    queryKey: ["proofs", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("proofs")
        .select(`
          *,
          screenshot_asset:assets!proofs_screenshot_asset_id_fkey(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return data.map((proof: any) => ({
        ...proof,
        screenshotUrl: proof.screenshot_asset 
          ? getAssetPublicUrl(proof.screenshot_asset.bucket, proof.screenshot_asset.path)
          : null,
      }));
    },
    enabled: !!user,
  });

  const createProof = useMutation({
    mutationFn: async ({
      industry,
      headline,
      metric,
      happenedAt,
      score,
      screenshotFile,
    }: {
      industry: string;
      headline: string;
      metric?: string;
      happenedAt?: string;
      score?: number;
      screenshotFile?: File;
    }) => {
      if (!user) throw new Error("Not authenticated");

      let screenshotAssetId: string | undefined;

      if (screenshotFile) {
        const uploaded = await uploadToBucket("aa-assets", screenshotFile, user.id, "proofs");
        if (uploaded) {
          const asset = await createAssetRow(
            user.id,
            "aa-assets",
            uploaded.path,
            "image",
            ["proof"],
            `Proof: ${headline}`
          );
          if (asset) {
            screenshotAssetId = asset.id;
          }
        }
      }

      const { data, error } = await supabase
        .from("proofs")
        .insert({
          user_id: user.id,
          industry,
          headline,
          metric,
          happened_at: happenedAt,
          score,
          screenshot_asset_id: screenshotAssetId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proofs", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["assets", user?.id] });
    },
  });

  const updateProof = useMutation({
    mutationFn: async ({
      id,
      is_blurred,
    }: {
      id: string;
      is_blurred: boolean;
    }) => {
      const { data, error } = await supabase
        .from("proofs")
        .update({ is_blurred })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proofs", user?.id] });
    },
  });

  const deleteProof = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("proofs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proofs", user?.id] });
    },
  });

  // Stats
  const stats = {
    totalProofs: proofs?.length || 0,
    avgScore: proofs?.length 
      ? Math.round(proofs.reduce((acc: number, p: any) => acc + (p.score || 0), 0) / proofs.length)
      : 0,
    dmScreenshots: proofs?.filter((p: any) => p.screenshot_asset).length || 0,
  };

  return {
    proofs: proofs || [],
    stats,
    isLoading,
    createProof: createProof.mutateAsync,
    updateProof: updateProof.mutate,
    deleteProof: deleteProof.mutate,
    isCreating: createProof.isPending,
  };
}
