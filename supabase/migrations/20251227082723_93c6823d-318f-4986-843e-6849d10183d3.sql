-- Create aa_scripts table
CREATE TABLE public.aa_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  script text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on aa_scripts
ALTER TABLE public.aa_scripts ENABLE ROW LEVEL SECURITY;

-- RLS policies for aa_scripts
CREATE POLICY "aa_scripts_select_own" ON public.aa_scripts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "aa_scripts_insert_own" ON public.aa_scripts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "aa_scripts_update_own" ON public.aa_scripts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "aa_scripts_delete_own" ON public.aa_scripts
  FOR DELETE USING (user_id = auth.uid());

-- Create aa_scene_plans table
CREATE TABLE public.aa_scene_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  script_id uuid NOT NULL REFERENCES public.aa_scripts(id) ON DELETE CASCADE,
  plan_json jsonb NOT NULL,
  duration_sec int,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on aa_scene_plans
ALTER TABLE public.aa_scene_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for aa_scene_plans
CREATE POLICY "aa_scene_plans_select_own" ON public.aa_scene_plans
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "aa_scene_plans_insert_own" ON public.aa_scene_plans
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "aa_scene_plans_update_own" ON public.aa_scene_plans
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "aa_scene_plans_delete_own" ON public.aa_scene_plans
  FOR DELETE USING (user_id = auth.uid());

-- Create aa_video_renders table
CREATE TABLE public.aa_video_renders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  script_id uuid NOT NULL REFERENCES public.aa_scripts(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.aa_scene_plans(id) ON DELETE CASCADE,
  status text CHECK (status IN ('queued', 'rendering', 'done', 'failed')) DEFAULT 'queued',
  video_url text,
  renderer_job_id text,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on aa_video_renders
ALTER TABLE public.aa_video_renders ENABLE ROW LEVEL SECURITY;

-- RLS policies for aa_video_renders
CREATE POLICY "aa_video_renders_select_own" ON public.aa_video_renders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "aa_video_renders_insert_own" ON public.aa_video_renders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "aa_video_renders_update_own" ON public.aa_video_renders
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "aa_video_renders_delete_own" ON public.aa_video_renders
  FOR DELETE USING (user_id = auth.uid());

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Add updated_at triggers
CREATE TRIGGER set_aa_scene_plans_updated_at
  BEFORE UPDATE ON public.aa_scene_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_aa_video_renders_updated_at
  BEFORE UPDATE ON public.aa_video_renders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Create aa-videos storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('aa-videos', 'aa-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for aa-videos bucket
CREATE POLICY "aa_videos_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'aa-videos');

CREATE POLICY "aa_videos_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'aa-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "aa_videos_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'aa-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "aa_videos_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'aa-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );