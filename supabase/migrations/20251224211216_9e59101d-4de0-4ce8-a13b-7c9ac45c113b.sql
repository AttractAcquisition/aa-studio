-- Create events table for tracking enquiries, booked calls, audit requests, conversions
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'enquiry' | 'booked_call' | 'audit_request' | 'conversion'
  post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE SET NULL,
  keyword TEXT,
  platform TEXT DEFAULT 'instagram',
  value NUMERIC,
  notes TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS policy for events - users can only access their own events
CREATE POLICY "events_own" ON public.events FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create proof_cards table for AI-generated proof cards
CREATE TABLE public.proof_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  proof_id UUID REFERENCES public.proofs(id) ON DELETE SET NULL,
  client_name TEXT,
  claim TEXT NOT NULL,
  metric TEXT,
  timeframe TEXT,
  proof_type TEXT DEFAULT 'result',
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on proof_cards
ALTER TABLE public.proof_cards ENABLE ROW LEVEL SECURITY;

-- RLS policy for proof_cards
CREATE POLICY "proof_cards_own" ON public.proof_cards FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add missing columns to scheduled_posts for better integration
ALTER TABLE public.scheduled_posts 
  ADD COLUMN IF NOT EXISTS proof_card_id UUID REFERENCES public.proof_cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS asset_ids UUID[] DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_user_type ON public.events(user_id, type);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON public.events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_proof_cards_user ON public.proof_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON public.scheduled_posts(scheduled_for);