-- Add audio_path and audio_mime columns to videos table for caption generation
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS audio_path text,
ADD COLUMN IF NOT EXISTS audio_mime text;