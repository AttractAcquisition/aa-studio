-- Add missing columns to events table for full event logging
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS contact_handle text;

-- Create index for better query performance on events
CREATE INDEX IF NOT EXISTS idx_events_user_type_occurred ON public.events(user_id, type, occurred_at DESC);