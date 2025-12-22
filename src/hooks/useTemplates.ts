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

  const createTemplate = useMutation({
    mutationFn: async (template: {
      key: string;
      name: string;
      category?: string;
      description?: string;
      formats?: string[];
      config_schema?: Record<string, any>;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("templates")
        .insert({
          ...template,
          user_id: user.id,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", user?.id] });
    },
  });

  return {
    templates: templates || [],
    isLoading,
    createTemplate: createTemplate.mutate,
    isCreating: createTemplate.isPending,
  };
}
