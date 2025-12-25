import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { OnePagerLayout } from "@/types/one-pager-layout";

export interface OnePager {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  title: string;
  source_script_id: string | null;
  layout_json: OnePagerLayout;
  template_id: string | null;
  export_png_url: string | null;
  tags: string[];
}

export interface CreateOnePagerParams {
  title: string;
  layout_json: OnePagerLayout;
  source_script_id?: string;
  template_id?: string;
  tags?: string[];
}

export interface UpdateOnePagerParams {
  id: string;
  title?: string;
  layout_json?: OnePagerLayout;
  template_id?: string;
  tags?: string[];
  export_png_url?: string;
}

export function useOnePagers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["one_pagers_v2", user?.id];

  const { data: onePagers = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Use raw query since types aren't updated yet
      const { data, error } = await supabase
        .from("one_pagers_v2" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        layout_json: item.layout_json as OnePagerLayout,
        tags: item.tags || [],
      })) as OnePager[];
    },
    enabled: !!user?.id,
  });

  const createOnePager = useMutation({
    mutationFn: async (params: CreateOnePagerParams) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("one_pagers_v2" as any)
        .insert({
          user_id: user.id,
          title: params.title,
          layout_json: params.layout_json,
          source_script_id: params.source_script_id || null,
          template_id: params.template_id || null,
          tags: params.tags || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateOnePager = useMutation({
    mutationFn: async (params: UpdateOnePagerParams) => {
      if (!user?.id) throw new Error("Not authenticated");

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (params.title !== undefined) updates.title = params.title;
      if (params.layout_json !== undefined) updates.layout_json = params.layout_json;
      if (params.template_id !== undefined) updates.template_id = params.template_id;
      if (params.tags !== undefined) updates.tags = params.tags;
      if (params.export_png_url !== undefined) updates.export_png_url = params.export_png_url;

      const { data, error } = await supabase
        .from("one_pagers_v2" as any)
        .update(updates)
        .eq("id", params.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteOnePager = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("one_pagers_v2" as any)
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const duplicateOnePager = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const original = onePagers.find((op) => op.id === id);
      if (!original) throw new Error("One-pager not found");

      const { data, error } = await supabase
        .from("one_pagers_v2" as any)
        .insert({
          user_id: user.id,
          title: `${original.title} (Copy)`,
          layout_json: original.layout_json,
          source_script_id: original.source_script_id,
          template_id: original.template_id,
          tags: original.tags,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const stats = {
    total: onePagers.length,
    draft: onePagers.filter((op) => op.tags.includes("draft")).length,
    ready: onePagers.filter((op) => op.tags.includes("ready")).length,
    recentlyUpdated: onePagers.slice(0, 5).length,
  };

  return {
    onePagers,
    isLoading,
    error,
    stats,
    createOnePager,
    updateOnePager,
    deleteOnePager,
    duplicateOnePager,
  };
}
