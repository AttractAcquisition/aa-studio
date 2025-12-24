-- Fix function search path security warning
ALTER FUNCTION public.set_updated_at() SET search_path = public;