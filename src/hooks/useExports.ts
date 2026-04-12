import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { uploadBlobToBucket, createAssetRow, formatFilenameFromConvention, getAssetPublicUrl } from "@/lib/supabase-helpers";
import { useBrandSettings } from "./useBrandSettings";

export function useExports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { brandSettings } = useBrandSettings();

  const { data: exports, isLoading } = useQuery({
    queryKey: ["exports", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("exports")
        .select(`
          *,
          asset:assets!exports_asset_id_fkey(*),
          content_item:content_runs!exports_content_run_id_fkey(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      return data.map((exp: any) => ({
        ...exp,
        downloadUrl: exp.asset 
          ? getAssetPublicUrl(exp.asset.bucket, exp.asset.path)
          : null,
      }));
    },
    enabled: !!user,
  });

  const createExport = useMutation({
    mutationFn: async ({
      contentItemId,
      kind,
      format,
      blob,
      series,
      title,
    }: {
      contentItemId?: string;
      kind: string;
      format: string;
      blob: Blob;
      series?: string;
      title?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const convention = brandSettings?.naming_convention || "AA_[Series]_[Title]_[Format]_[Date]";
      const filename = formatFilenameFromConvention(convention, {
        series,
        title,
        format: format.replace(/[:/]/g, "x"),
      });

      const ext = kind === "script" ? "txt" : kind === "onepager" ? "pdf" : "png";
      const fullFilename = `${filename}.${ext}`;

      const uploaded = await uploadBlobToBucket(
        "aa-exports",
        blob,
        user.id,
        fullFilename
      );

      if (!uploaded) throw new Error("Failed to upload export");

      const asset = await createAssetRow(
        user.id,
        "aa-exports",
        uploaded.path,
        kind,
        [kind, format],
        fullFilename
      );

      if (!asset) throw new Error("Failed to create asset record");

      const { data, error } = await supabase
        .from("exports")
        .insert({
          user_id: user.id,
          content_item_id: contentItemId || null,
          kind,
          format,
          asset_id: asset.id,
          filename: fullFilename,
        })
        .select()
        .single();

      if (error) throw error;
      
      return { ...data, downloadUrl: uploaded.publicUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exports", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["assets", user?.id] });
    },
  });

  return {
    exports: exports || [],
    isLoading,
    createExport: createExport.mutateAsync,
    isCreating: createExport.isPending,
  };
}
