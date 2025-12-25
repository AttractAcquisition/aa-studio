import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getAssetPublicUrl, uploadBlobToBucket, createAssetRow } from "@/lib/supabase-helpers";
import { buildProofCardPrompt } from "@/lib/proof-card-prompt";

export interface CreateProofCardParams {
  proof_id?: string;
  client_name?: string;
  claim: string;
  metric?: string;
  timeframe?: string;
  proof_type?: string;
  asset_id?: string;
  industry?: string;
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

      // Fetch brand presets for this user (if any)
      let brandPreset = null;
      try {
        const { data: presetData } = await supabase
          .from("brand_presets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        brandPreset = presetData;
      } catch (e) {
        console.log("No brand presets found, using defaults");
      }

      // Build on-brand prompt using AA brand rules
      const prompt = buildProofCardPrompt(
        {
          headline: params.claim,
          metric: params.metric,
          timeframe: params.timeframe,
          clientName: params.client_name,
          industry: params.industry,
        },
        brandPreset
      );

      // Generate image via Supabase edge function
      try {
        console.log("Generating proof card image with prompt:", prompt.slice(0, 200) + "...");
        
        const { data: imageData, error: fnError } = await supabase.functions.invoke(
          "generate-design-image",
          {
            body: {
              prompt,
              kind: "proof_card",
            },
          }
        );

        if (fnError) {
          console.error("Edge function error:", fnError);
          throw fnError;
        }

        if (imageData?.image_data_url) {
          // Convert data URL to blob
          const base64Data = imageData.image_data_url.replace(/^data:image\/\w+;base64,/, "");
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const imageBlob = new Blob([byteArray], { type: "image/png" });

          const filename = `proof_card_${proofCard.id}_${Date.now()}.png`;
          
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
      } catch (aiError) {
        console.error("AI image generation failed:", aiError);
        // Continue without image - card is still created
      }

      return proofCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proof_cards", user?.id] });
    },
  });

  const regenerateProofCardImage = useMutation({
    mutationFn: async (cardId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Get the existing proof card
      const { data: card, error: fetchError } = await supabase
        .from("proof_cards")
        .select("*")
        .eq("id", cardId)
        .single();

      if (fetchError || !card) throw new Error("Proof card not found");

      // Fetch brand presets
      let brandPreset = null;
      try {
        const { data: presetData } = await supabase
          .from("brand_presets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        brandPreset = presetData;
      } catch (e) {
        console.log("No brand presets found, using defaults");
      }

      // Build on-brand prompt
      const prompt = buildProofCardPrompt(
        {
          headline: card.claim,
          metric: card.metric,
          timeframe: card.timeframe,
          clientName: card.client_name,
        },
        brandPreset
      );

      // Generate new image
      const { data: imageData, error: fnError } = await supabase.functions.invoke(
        "generate-design-image",
        {
          body: {
            prompt,
            kind: "proof_card",
          },
        }
      );

      if (fnError) throw fnError;

      if (imageData?.image_data_url) {
        const base64Data = imageData.image_data_url.replace(/^data:image\/\w+;base64,/, "");
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const imageBlob = new Blob([byteArray], { type: "image/png" });

        const filename = `proof_card_${cardId}_${Date.now()}.png`;
        
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
            ["proof", "generated", "regenerated"],
            card.claim
          );

          if (asset) {
            await supabase
              .from("proof_cards")
              .update({ asset_id: asset.id })
              .eq("id", cardId);
              
            return { ...card, asset_id: asset.id };
          }
        }
      }

      throw new Error("Failed to generate image");
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
    regenerateProofCardImage: regenerateProofCardImage.mutateAsync,
    updateProofCard: updateProofCard.mutate,
    deleteProofCard: deleteProofCard.mutate,
    isCreating: createProofCard.isPending,
    isRegenerating: regenerateProofCardImage.isPending,
  };
}
