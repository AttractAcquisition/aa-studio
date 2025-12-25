-- Create leads table for enquiry system
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  name text,
  email text,
  phone text,
  message text,
  source text DEFAULT 'website',
  status text DEFAULT 'new',
  notes text,
  api_key text
);

-- Enable RLS on leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS policies for leads
CREATE POLICY "leads_select_own" ON public.leads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "leads_insert_own" ON public.leads FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "leads_update_own" ON public.leads FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "leads_delete_own" ON public.leads FOR DELETE USING (user_id = auth.uid());

-- Add new columns to scheduled_posts for auto-publishing
ALTER TABLE public.scheduled_posts 
ADD COLUMN IF NOT EXISTS caption text,
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS platform_post_id text,
ADD COLUMN IF NOT EXISTS error text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add trigger for updated_at on scheduled_posts
DROP TRIGGER IF EXISTS update_scheduled_posts_updated_at ON public.scheduled_posts;
CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Create user_settings table for storing Calendly links and other settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  calendly_link text,
  calendly_embed_type text DEFAULT 'inline',
  lead_webhook_key text DEFAULT gen_random_uuid()::text
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_settings
CREATE POLICY "user_settings_select_own" ON public.user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_settings_insert_own" ON public.user_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_settings_update_own" ON public.user_settings FOR UPDATE USING (user_id = auth.uid());

-- Add trigger for updated_at on user_settings
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();