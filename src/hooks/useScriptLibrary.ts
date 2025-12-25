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
  audio_path: string | null;
  audio_duration_sec: number | null;
  audio_updated_at: string | null;
  // Runtime field for signed URL
  audio_url?: string | null;
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
  audio_path?: string | null;
  audio_duration_sec?: number | null;
  audio_updated_at?: string | null;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function getSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("script-audio")
    .createSignedUrl(path, 3600); // 1 hour expiry
  if (error) {
    console.error("Failed to get signed URL:", error);
    return null;
  }
  return data.signedUrl;
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

      // Generate signed URLs for scripts with audio
      const scriptsWithUrls = await Promise.all(
        (data as ScriptLibraryItem[]).map(async (script) => {
          if (script.audio_path) {
            const url = await getSignedUrl(script.audio_path);
            return { ...script, audio_url: url };
          }
          return { ...script, audio_url: null };
        })
      );

      return scriptsWithUrls;
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
      if (params.audio_path !== undefined) updates.audio_path = params.audio_path;
      if (params.audio_duration_sec !== undefined) updates.audio_duration_sec = params.audio_duration_sec;
      if (params.audio_updated_at !== undefined) updates.audio_updated_at = params.audio_updated_at;

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

      // First get the script to check for audio
      const script = scripts.find((s) => s.id === id);
      if (script?.audio_path) {
        // Delete audio file from storage
        await supabase.storage.from("script-audio").remove([script.audio_path]);
      }

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

  const uploadAudio = useMutation({
    mutationFn: async ({ scriptId, blob, duration }: { scriptId: string; blob: Blob; duration: number }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const ext = blob.type.includes("webm") ? "webm" : "m4a";
      const filename = `${Date.now()}.${ext}`;
      const path = `${user.id}/${scriptId}/${filename}`;

      // Get current script to delete old audio if exists
      const script = scripts.find((s) => s.id === scriptId);
      if (script?.audio_path) {
        await supabase.storage.from("script-audio").remove([script.audio_path]);
      }

      // Upload new audio
      const { error: uploadError } = await supabase.storage
        .from("script-audio")
        .upload(path, blob, {
          contentType: blob.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Update script record
      const { error: updateError } = await supabase
        .from("script_library")
        .update({
          audio_path: path,
          audio_duration_sec: duration,
          audio_updated_at: new Date().toISOString(),
        })
        .eq("id", scriptId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      return path;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Audio saved");
    },
    onError: (error) => {
      toast.error(`Failed to save audio: ${error.message}`);
    },
  });

  const deleteAudio = useMutation({
    mutationFn: async (scriptId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const script = scripts.find((s) => s.id === scriptId);
      if (!script?.audio_path) return;

      // Delete from storage
      await supabase.storage.from("script-audio").remove([script.audio_path]);

      // Clear audio fields
      const { error } = await supabase
        .from("script_library")
        .update({
          audio_path: null,
          audio_duration_sec: null,
          audio_updated_at: null,
        })
        .eq("id", scriptId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Audio deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete audio: ${error.message}`);
    },
  });

  const generateTTS = useMutation({
    mutationFn: async ({ scriptId, text, voice }: { scriptId: string; text: string; voice?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Call the edge function to generate TTS
      const response = await fetch(
        `https://dwhmvzooerxejustfqpt.supabase.co/functions/v1/generate-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, voice: voice || 'alloy' }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'TTS generation failed' }));
        throw new Error(errorData.error || 'TTS generation failed');
      }

      // Get audio as blob
      const audioBlob = await response.blob();
      
      // Get audio duration from the audio element
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      const duration = await new Promise<number>((resolve) => {
        audio.onloadedmetadata = () => {
          resolve(Math.ceil(audio.duration));
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(0);
        };
      });

      // Upload to storage
      const filename = `${Date.now()}.mp3`;
      const path = `${user.id}/${scriptId}/${filename}`;

      // Delete old audio if exists
      const script = scripts.find((s) => s.id === scriptId);
      if (script?.audio_path) {
        await supabase.storage.from("script-audio").remove([script.audio_path]);
      }

      // Upload new audio
      const { error: uploadError } = await supabase.storage
        .from("script-audio")
        .upload(path, audioBlob, {
          contentType: 'audio/mpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Update script record
      const { error: updateError } = await supabase
        .from("script_library")
        .update({
          audio_path: path,
          audio_duration_sec: duration,
          audio_updated_at: new Date().toISOString(),
        })
        .eq("id", scriptId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      return path;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("TTS audio generated and saved");
    },
    onError: (error) => {
      toast.error(`Failed to generate TTS: ${error.message}`);
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
    uploadAudio,
    deleteAudio,
    generateTTS,
  };
}
