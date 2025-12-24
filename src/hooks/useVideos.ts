import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useState, useCallback } from "react";

export interface VideoRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  platform: string | null;
  bucket: string;
  path: string;
  mime: string | null;
  bytes: number | null;
  created_at: string;
}

export interface UploadVideoParams {
  file: File;
  title: string;
  description?: string;
  platform?: string;
}

export function useVideos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const { data: videos, isLoading } = useQuery({
    queryKey: ["videos", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as VideoRow[];
    },
    enabled: !!user,
  });

  const uploadVideo = useMutation({
    mutationFn: async ({ file, title, description, platform }: UploadVideoParams) => {
      if (!user) throw new Error("Not authenticated");

      const timestamp = Date.now();
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = `${user.id}/${timestamp}-${sanitizedFilename}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("aa-videos")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Insert record into videos table
      const { data, error: insertError } = await supabase
        .from("videos")
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          platform: platform || "instagram",
          bucket: "aa-videos",
          path,
          mime: file.type,
          bytes: file.size,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos", user?.id] });
    },
  });

  const deleteVideo = useMutation({
    mutationFn: async (video: VideoRow) => {
      if (!user) throw new Error("Not authenticated");

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(video.bucket)
        .remove([video.path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("videos")
        .delete()
        .eq("id", video.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos", user?.id] });
    },
  });

  const getSignedUrl = useCallback(async (video: VideoRow): Promise<string> => {
    // Check cache first
    if (signedUrls[video.id]) {
      return signedUrls[video.id];
    }

    const { data, error } = await supabase.storage
      .from(video.bucket)
      .createSignedUrl(video.path, 3600); // 1 hour expiry

    if (error) throw error;

    // Cache the URL
    setSignedUrls((prev) => ({ ...prev, [video.id]: data.signedUrl }));
    return data.signedUrl;
  }, [signedUrls]);

  const copySignedUrl = useCallback(async (video: VideoRow): Promise<string> => {
    const url = await getSignedUrl(video);
    await navigator.clipboard.writeText(url);
    return url;
  }, [getSignedUrl]);

  return {
    videos: videos || [],
    isLoading,
    uploadVideo: uploadVideo.mutateAsync,
    deleteVideo: deleteVideo.mutateAsync,
    isUploading: uploadVideo.isPending,
    isDeleting: deleteVideo.isPending,
    getSignedUrl,
    copySignedUrl,
    signedUrls,
  };
}
