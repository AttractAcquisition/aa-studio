import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useContentItems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: contentItems, isLoading } = useQuery({
    queryKey: ["content_items", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("content_items")
        .select(`
          *,
          scripts(*),
          one_pagers(*),
          designs(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createContentItem = useMutation({
    mutationFn: async (item: {
      content_type: string;
      series?: string;
      title?: string;
      hook?: string;
      target_audience?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("content_items")
        .insert({
          ...item,
          user_id: user.id,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_items", user?.id] });
    },
  });

  const updateContentItem = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      status?: string;
      title?: string;
      on_brand_score?: number;
      published_at?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("content_items")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_items", user?.id] });
    },
  });

  const saveScript = useMutation({
    mutationFn: async ({
      contentItemId,
      text,
      wordCount,
      estSeconds,
    }: {
      contentItemId: string;
      text: string;
      wordCount: number;
      estSeconds: number;
    }) => {
      // Check if script exists
      const { data: existing } = await supabase
        .from("scripts")
        .select("id")
        .eq("content_item_id", contentItemId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("scripts")
          .update({ text, word_count: wordCount, est_seconds: estSeconds })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("scripts")
          .insert({
            content_item_id: contentItemId,
            text,
            word_count: wordCount,
            est_seconds: estSeconds,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_items", user?.id] });
    },
  });

  const saveOnePager = useMutation({
    mutationFn: async ({
      contentItemId,
      markdown,
      blocks,
    }: {
      contentItemId: string;
      markdown: string;
      blocks: any;
    }) => {
      // Check if one pager exists
      const { data: existing } = await supabase
        .from("one_pagers")
        .select("id")
        .eq("content_item_id", contentItemId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("one_pagers")
          .update({ markdown, blocks })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("one_pagers")
          .insert({
            content_item_id: contentItemId,
            markdown,
            blocks,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_items", user?.id] });
    },
  });

  const saveDesign = useMutation({
    mutationFn: async ({
      contentItemId,
      templateId,
      format,
      designJson,
      renderedAssetId,
    }: {
      contentItemId: string;
      templateId?: string;
      format: string;
      designJson: any;
      renderedAssetId?: string;
    }) => {
      const { data, error } = await supabase
        .from("designs")
        .insert({
          content_item_id: contentItemId,
          template_id: templateId,
          format,
          design_json: designJson,
          rendered_asset_id: renderedAssetId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_items", user?.id] });
    },
  });

  return {
    contentItems: contentItems || [],
    isLoading,
    createContentItem: createContentItem.mutateAsync,
    updateContentItem: updateContentItem.mutate,
    saveScript: saveScript.mutateAsync,
    saveOnePager: saveOnePager.mutateAsync,
    saveDesign: saveDesign.mutateAsync,
    isCreating: createContentItem.isPending,
  };
}
