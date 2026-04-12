import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getTemplateById = async (id: string) => {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  };

  const createTemplate = useMutation({
    mutationFn: async (template: {
      key: string;
      name: string;
      category?: string;
      description?: string;
      formats?: string[];
      config_schema?: Record<string, unknown>;
      preview_asset_path?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("templates")
        .insert([{
          ...template,
          config_schema: template.config_schema as any,
          user_id: user.id,
          is_system: false,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", user?.id] });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      category?: string;
      description?: string;
      formats?: string[];
      config_schema?: Record<string, unknown>;
      preview_asset_path?: string;
    }) => {
      const { data, error } = await supabase
        .from("templates")
        .update({ ...updates, config_schema: updates.config_schema as any })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", user?.id] });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", user?.id] });
    },
  });

  return {
    templates: templates || [],
    isLoading,
    getTemplateById,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    isCreating: createTemplate.isPending,
    isUpdating: updateTemplate.isPending,
  };
}
