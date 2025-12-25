-- Add audio fields to script_library table
ALTER TABLE public.script_library
ADD COLUMN IF NOT EXISTS audio_path text NULL,
ADD COLUMN IF NOT EXISTS audio_duration_sec integer NULL,
ADD COLUMN IF NOT EXISTS audio_updated_at timestamp with time zone NULL;

-- Create storage bucket for script audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('script-audio', 'script-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for script-audio bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own script audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'script-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own script audio
CREATE POLICY "Users can read their own script audio"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'script-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own script audio
CREATE POLICY "Users can update their own script audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'script-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own script audio
CREATE POLICY "Users can delete their own script audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'script-audio' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);