-- Create content_bundles table
CREATE TABLE public.content_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled',
  series text,
  content_type text,
  audience text,
  hook text,
  script text,
  caption text,
  cta text,
  one_pager_layout_json jsonb,
  one_pager_export_png_url text,
  design_prompts jsonb DEFAULT '{}'::jsonb,
  design_image_urls jsonb DEFAULT '{}'::jsonb,
  export_urls jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_bundles ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_bundles
CREATE POLICY "content_bundles_select_own" ON public.content_bundles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "content_bundles_insert_own" ON public.content_bundles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "content_bundles_update_own" ON public.content_bundles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "content_bundles_delete_own" ON public.content_bundles
  FOR DELETE USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_content_bundles_updated_at
  BEFORE UPDATE ON public.content_bundles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Create growth_metrics_daily table
CREATE TABLE public.growth_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  followers integer,
  profile_visits integer,
  link_clicks integer,
  inbound_dms integer,
  booked_calls integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Enable RLS
ALTER TABLE public.growth_metrics_daily ENABLE ROW LEVEL SECURITY;

-- RLS policies for growth_metrics_daily
CREATE POLICY "growth_metrics_daily_select_own" ON public.growth_metrics_daily
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "growth_metrics_daily_insert_own" ON public.growth_metrics_daily
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "growth_metrics_daily_update_own" ON public.growth_metrics_daily
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "growth_metrics_daily_delete_own" ON public.growth_metrics_daily
  FOR DELETE USING (user_id = auth.uid());