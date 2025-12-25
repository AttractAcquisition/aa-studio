-- Create one_pagers_v2 table for the new One-Pager Library
CREATE TABLE public.one_pagers_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  source_script_id UUID NULL,
  layout_json JSONB NOT NULL,
  template_id TEXT NULL,
  export_png_url TEXT NULL,
  tags TEXT[] DEFAULT '{}'::TEXT[]
);

-- Enable RLS
ALTER TABLE public.one_pagers_v2 ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "one_pagers_v2_select_own"
ON public.one_pagers_v2
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "one_pagers_v2_insert_own"
ON public.one_pagers_v2
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "one_pagers_v2_update_own"
ON public.one_pagers_v2
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "one_pagers_v2_delete_own"
ON public.one_pagers_v2
FOR DELETE
USING (user_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_one_pagers_v2_updated_at
BEFORE UPDATE ON public.one_pagers_v2
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create brand_presets table for Brand Kit presets
CREATE TABLE public.brand_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  logo_url TEXT NULL,
  logo_secondary_url TEXT NULL,
  font_primary TEXT NULL,
  font_secondary TEXT NULL,
  preset_json JSONB DEFAULT '{}'::JSONB,
  prompt_rules TEXT NULL
);

-- Enable RLS
ALTER TABLE public.brand_presets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "brand_presets_own"
ON public.brand_presets
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_brand_presets_updated_at
BEFORE UPDATE ON public.brand_presets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create storage bucket for template previews
INSERT INTO storage.buckets (id, name, public) VALUES ('template-previews', 'template-previews', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for template previews
CREATE POLICY "template_previews_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'template-previews');

CREATE POLICY "template_previews_auth_upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'template-previews' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "template_previews_auth_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'template-previews' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "template_previews_auth_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'template-previews' AND auth.uid()::text = (storage.foldername(name))[1]);