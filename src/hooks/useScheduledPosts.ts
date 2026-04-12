import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useScheduledPosts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: scheduledPosts, isLoading } = useQuery({
    queryKey: ["scheduled_posts", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("scheduled_posts")
        .select(`
          *,
          content_item:content_runs(*)
        `)
        .eq("user_id", user.id)
        .order("scheduled_for", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createScheduledPost = useMutation({
    mutationFn: async ({
      title,
      post_type,
      scheduled_for,
      platform,
      content_item_id,
      proof_card_id,
      notes,
    }: {
      title: string;
      post_type: string;
      scheduled_for: string;
      platform?: string;
      content_item_id?: string;
      proof_card_id?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: user.id,
          title,
          post_type,
          scheduled_for,
          platform: platform || "instagram",
          content_item_id,
          proof_card_id,
          notes,
          status: "scheduled",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled_posts", user?.id] });
    },
  });

  const updateScheduledPost = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      post_type?: string;
      scheduled_for?: string;
      status?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled_posts", user?.id] });
    },
  });

  const deleteScheduledPost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled_posts", user?.id] });
    },
  });

  return {
    scheduledPosts: scheduledPosts || [],
    isLoading,
    createScheduledPost: createScheduledPost.mutateAsync,
    updateScheduledPost: updateScheduledPost.mutate,
    deleteScheduledPost: deleteScheduledPost.mutate,
    isCreating: createScheduledPost.isPending,
  };
}
