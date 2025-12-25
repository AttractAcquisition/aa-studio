import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type ScriptPlatform = "instagram" | "tiktok" | "youtube" | "threads";
export type ScriptStatus = "draft" | "ready" | "used";

export interface ScriptLibraryItem {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  title: string;
  platform: ScriptPlatform;
  hook: string | null;
  body: string;
  tags: string[];
  status: ScriptStatus;
  word_count: number;
  last_used_at: string | null;
}

export interface CreateScriptParams {
  title: string;
  platform?: ScriptPlatform;
  hook?: string;
  body: string;
  tags?: string[];
  status?: ScriptStatus;
}

export interface UpdateScriptParams {
  id: string;
  title?: string;
  platform?: ScriptPlatform;
  hook?: string;
  body?: string;
  tags?: string[];
  status?: ScriptStatus;
  last_used_at?: string;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function useScriptLibrary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["script_library", user?.id];

  const { data: scripts = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("script_library")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ScriptLibraryItem[];
    },
    enabled: !!user?.id,
  });

  const createScript = useMutation({
    mutationFn: async (params: CreateScriptParams) => {
      if (!user?.id) throw new Error("Not authenticated");

      const word_count = countWords(params.body);

      const { data, error } = await supabase
        .from("script_library")
        .insert({
          user_id: user.id,
          title: params.title,
          platform: params.platform || "instagram",
          hook: params.hook || null,
          body: params.body,
          tags: params.tags || [],
          status: params.status || "draft",
          word_count,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Script created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create script: ${error.message}`);
    },
  });

  const updateScript = useMutation({
    mutationFn: async (params: UpdateScriptParams) => {
      if (!user?.id) throw new Error("Not authenticated");

      const updates: Record<string, unknown> = {};
      if (params.title !== undefined) updates.title = params.title;
      if (params.platform !== undefined) updates.platform = params.platform;
      if (params.hook !== undefined) updates.hook = params.hook;
      if (params.body !== undefined) {
        updates.body = params.body;
        updates.word_count = countWords(params.body);
      }
      if (params.tags !== undefined) updates.tags = params.tags;
      if (params.status !== undefined) updates.status = params.status;
      if (params.last_used_at !== undefined) updates.last_used_at = params.last_used_at;

      const { data, error } = await supabase
        .from("script_library")
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
      toast.success("Script updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update script: ${error.message}`);
    },
  });

  const deleteScript = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("script_library")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Script deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete script: ${error.message}`);
    },
  });

  const markAsUsed = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("script_library")
        .update({
          status: "used",
          last_used_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Script marked as used");
    },
    onError: (error) => {
      toast.error(`Failed to mark script as used: ${error.message}`);
    },
  });

  // Computed stats
  const stats = {
    total: scripts.length,
    draft: scripts.filter((s) => s.status === "draft").length,
    ready: scripts.filter((s) => s.status === "ready").length,
    used: scripts.filter((s) => s.status === "used").length,
  };

  return {
    scripts,
    isLoading,
    error,
    stats,
    createScript,
    updateScript,
    deleteScript,
    markAsUsed,
  };
}
