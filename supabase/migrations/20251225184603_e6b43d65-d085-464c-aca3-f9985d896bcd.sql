-- Create script_library table for reusable scripts (separate from content_runs scripts)
CREATE TABLE public.script_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  platform text NOT NULL DEFAULT 'instagram',
  hook text,
  body text NOT NULL,
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  word_count int DEFAULT 0,
  last_used_at timestamptz
);

-- Add constraint for platform values
ALTER TABLE public.script_library 
ADD CONSTRAINT script_library_platform_check 
CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'threads'));

-- Add constraint for status values
ALTER TABLE public.script_library 
ADD CONSTRAINT script_library_status_check 
CHECK (status IN ('draft', 'ready', 'used'));

-- Create index for user queries
CREATE INDEX idx_script_library_user_id ON public.script_library(user_id);
CREATE INDEX idx_script_library_status ON public.script_library(status);

-- Enable RLS
ALTER TABLE public.script_library ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "script_library_select_own" ON public.script_library
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "script_library_insert_own" ON public.script_library
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "script_library_update_own" ON public.script_library
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "script_library_delete_own" ON public.script_library
FOR DELETE USING (user_id = auth.uid());

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_script_library_updated_at
BEFORE UPDATE ON public.script_library
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();