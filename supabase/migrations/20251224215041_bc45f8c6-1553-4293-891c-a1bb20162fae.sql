-- Create videos table for video storage
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  platform text DEFAULT 'instagram',
  bucket text NOT NULL DEFAULT 'aa-videos',
  path text NOT NULL,
  mime text,
  bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- RLS policies for videos
CREATE POLICY "videos_select_own" ON public.videos
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "videos_insert_own" ON public.videos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "videos_update_own" ON public.videos
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "videos_delete_own" ON public.videos
  FOR DELETE USING (user_id = auth.uid());

-- Create private storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('aa-videos', 'aa-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for aa-videos bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "videos_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aa-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to read their own files
CREATE POLICY "videos_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'aa-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own files
CREATE POLICY "videos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'aa-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_videos_user_created ON public.videos(user_id, created_at DESC);