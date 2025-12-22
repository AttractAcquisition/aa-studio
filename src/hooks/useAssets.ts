import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { uploadToBucket, createAssetRow, getAssetPublicUrl } from "@/lib/supabase-helpers";

export function useAssets(tag?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assets, isLoading } = useQuery({
    queryKey: ["assets", user?.id, tag],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("assets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (tag && tag !== "All") {
        query = query.contains("tags", [tag]);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Add public URLs
      return data.map((asset: any) => ({
        ...asset,
        publicUrl: getAssetPublicUrl(asset.bucket, asset.path),
      }));
    },
    enabled: !!user,
  });

  const uploadAsset = useMutation({
    mutationFn: async ({
      file,
      tags,
      title,
    }: {
      file: File;
      tags: string[];
      title?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const uploaded = await uploadToBucket("aa-assets", file, user.id);
      if (!uploaded) throw new Error("Failed to upload file");

      const asset = await createAssetRow(
        user.id,
        "aa-assets",
        uploaded.path,
        file.type.startsWith("image") ? "image" : "file",
        tags,
        title || file.name
      );

      if (!asset) throw new Error("Failed to create asset record");

      return { ...asset, publicUrl: uploaded.publicUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", user?.id] });
    },
  });

  const deleteAsset = useMutation({
    mutationFn: async (assetId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Get asset to get path
      const { data: asset } = await supabase
        .from("assets")
        .select("*")
        .eq("id", assetId)
        .single();

      if (asset) {
        // Delete from storage
        await supabase.storage.from(asset.bucket).remove([asset.path]);
      }

      // Delete from DB
      const { error } = await supabase
        .from("assets")
        .delete()
        .eq("id", assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", user?.id] });
    },
  });

  return {
    assets: assets || [],
    isLoading,
    uploadAsset: uploadAsset.mutate,
    isUploading: uploadAsset.isPending,
    deleteAsset: deleteAsset.mutate,
    isDeleting: deleteAsset.isPending,
  };
}
