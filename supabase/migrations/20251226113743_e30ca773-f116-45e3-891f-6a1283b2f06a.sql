-- Add has_audio column to videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS has_audio boolean DEFAULT true;