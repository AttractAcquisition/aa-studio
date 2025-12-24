-- Add RLS policies for designs, one_pagers, scripts tables
-- These reference content_runs via content_item_id, so ownership is via subquery

-- DESIGNS TABLE
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "designs_select_own" ON public.designs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.content_runs 
    WHERE id = designs.content_item_id AND user_id = auth.uid()
  )
);

CREATE POLICY "designs_insert_own" ON public.designs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.content_runs 
    WHERE id = content_item_id AND user_id = auth.uid()
  )
);

CREATE POLICY "designs_update_own" ON public.designs
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.content_runs 
    WHERE id = designs.content_item_id AND user_id = auth.uid()
  )
);

CREATE POLICY "designs_delete_own" ON public.designs
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.content_runs 
    WHERE id = designs.content_item_id AND user_id = auth.uid()
  )
);

-- ONE_PAGERS TABLE
ALTER TABLE public.one_pagers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "one_pagers_select_own" ON public.one_pagers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.content_runs 
    WHERE id = one_pagers.content_item_id AND user_id = auth.uid()
  )
);

CREATE POLICY "one_pagers_insert_own" ON public.one_pagers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.content_runs 
    WHERE id = content_item_id AND user_id = auth.uid()
  )
);

CREATE POLICY "one_pagers_update_own" ON public.one_pagers
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.content_runs 
    WHERE id = one_pagers.content_item_id AND user_id = auth.uid()
  )
);

CREATE POLICY "one_pagers_delete_own" ON public.one_pagers
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.content_runs 
    WHERE id = one_pagers.content_item_id AND user_id = auth.uid()
  )
);

-- SCRIPTS TABLE
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scripts_select_own" ON public.scripts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.content_runs 
    WHERE id = scripts.content_item_id AND user_id = auth.uid()
  )
);

CREATE POLICY "scripts_insert_own" ON public.scripts
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.content_runs 
    WHERE id = content_item_id AND user_id = auth.uid()
  )
);

CREATE POLICY "scripts_update_own" ON public.scripts
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.content_runs 
    WHERE id = scripts.content_item_id AND user_id = auth.uid()
  )
);

CREATE POLICY "scripts_delete_own" ON public.scripts
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.content_runs 
    WHERE id = scripts.content_item_id AND user_id = auth.uid()
  )
);

-- ADD related_event_id TO EVENTS TABLE for funnel tracking
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS related_event_id uuid REFERENCES public.events(id);

-- Create index for funnel queries
CREATE INDEX IF NOT EXISTS idx_events_user_type_occurred ON public.events(user_id, type, occurred_at);