import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getAssetPublicUrl } from "@/lib/supabase-helpers";

export interface CreateProofCardParams {
  proof_id?: string;
  client_name?: string;
  claim: string;
  metric?: string;
  timeframe?: string;
  proof_type?: string;
  asset_id?: string;
}

export function useProofCards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: proofCards, isLoading } = useQuery({
    queryKey: ["proof_cards", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("proof_cards")
        .select(`
          *,
          asset:assets(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((card: any) => ({
        ...card,
        assetUrl: card.asset
          ? getAssetPublicUrl(card.asset.bucket, card.asset.path)
          : null,
      }));
    },
    enabled: !!user,
  });

  const createProofCard = useMutation({
    mutationFn: async (params: CreateProofCardParams) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("proof_cards")
        .insert({
          user_id: user.id,
          proof_id: params.proof_id,
          client_name: params.client_name,
          claim: params.claim,
          metric: params.metric,
          timeframe: params.timeframe,
          proof_type: params.proof_type || "result",
          asset_id: params.asset_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proof_cards", user?.id] });
    },
  });

  const updateProofCard = useMutation({
    mutationFn: async ({
      id,
      asset_id,
    }: {
      id: string;
      asset_id: string;
    }) => {
      const { data, error } = await supabase
        .from("proof_cards")
        .update({ asset_id })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proof_cards", user?.id] });
    },
  });

  const deleteProofCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("proof_cards")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proof_cards", user?.id] });
    },
  });

  return {
    proofCards: proofCards || [],
    isLoading,
    createProofCard: createProofCard.mutateAsync,
    updateProofCard: updateProofCard.mutate,
    deleteProofCard: deleteProofCard.mutate,
    isCreating: createProofCard.isPending,
  };
}
