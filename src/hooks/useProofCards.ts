import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getAssetPublicUrl, uploadBlobToBucket, createAssetRow } from "@/lib/supabase-helpers";

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

      // Create initial proof card row
      const { data: proofCard, error: insertError } = await supabase
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

      if (insertError) throw insertError;

      // Try to generate AI image via content factory endpoint
      try {
        const response = await fetch("/api/content-factory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generate_design",
            kind: "proof-card",
            ratio: "1:1",
            mode: "clean",
            inputs: {
              accent: "#6A00F4",
              client_name: params.client_name || "Client",
              claim: params.claim,
              metric: params.metric || "",
              timeframe: params.timeframe || "",
              brand: "Attract Acquisition",
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          
          let imageBlob: Blob | null = null;
          let mime = "image/png";

          // Handle image_b64 first (preferred)
          if (result.image_b64) {
            const base64Data = result.image_b64.replace(/^data:image\/\w+;base64,/, "");
            mime = result.mime || "image/png";
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            imageBlob = new Blob([byteArray], { type: mime });
          }
          // Fallback to images[0].url
          else if (result.images?.[0]?.url) {
            const imageResponse = await fetch(result.images[0].url);
            imageBlob = await imageResponse.blob();
            mime = imageBlob.type || "image/png";
          }

          if (imageBlob) {
            const ext = mime.split("/")[1] || "png";
            const filename = `proof_card_${proofCard.id}_${Date.now()}.${ext}`;
            
            const uploadResult = await uploadBlobToBucket(
              "aa-designs",
              imageBlob,
              user.id,
              filename
            );

            if (uploadResult) {
              const asset = await createAssetRow(
                user.id,
                "aa-designs",
                uploadResult.path,
                "proof_card",
                ["proof", "generated"],
                params.claim
              );

              if (asset) {
                // Update proof card with asset_id
                await supabase
                  .from("proof_cards")
                  .update({ asset_id: asset.id })
                  .eq("id", proofCard.id);
                  
                return { ...proofCard, asset_id: asset.id };
              }
            }
          }
        }
      } catch (aiError) {
        console.error("AI generation failed, proof card created without image:", aiError);
      }

      return proofCard;
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
