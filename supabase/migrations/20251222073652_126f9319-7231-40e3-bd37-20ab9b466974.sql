-- BRAND SETTINGS
create table if not exists public.brand_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  naming_convention text default 'AA_[Series]_[Title]_[Format]_[Date]',
  palette jsonb not null default '{}'::jsonb,
  typography jsonb not null default '{}'::jsonb,
  rules jsonb not null default '{}'::jsonb,
  brand_assets jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TEMPLATES
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  is_system boolean default false,
  key text not null,
  name text not null,
  category text,
  description text,
  formats text[] default '{}',
  config_schema jsonb default '{}'::jsonb,
  preview_asset_path text,
  created_at timestamptz default now()
);

-- ASSETS (metadata for Storage objects)
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  path text not null,
  kind text default 'image',
  title text,
  tags text[] default '{}',
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- CONTENT ITEMS (the "thing" created in Content Factory)
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_type text not null,
  series text,
  title text,
  hook text,
  target_audience text,
  status text default 'draft',
  on_brand_score int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz
);

create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  text text not null,
  word_count int,
  est_seconds int,
  created_at timestamptz default now()
);

create table if not exists public.one_pagers (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  markdown text,
  blocks jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  template_id uuid references public.templates(id),
  format text,
  design_json jsonb default '{}'::jsonb,
  rendered_asset_id uuid references public.assets(id),
  created_at timestamptz default now()
);

-- PROOFS
create table if not exists public.proofs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  industry text,
  headline text not null,
  metric text,
  happened_at date,
  score int,
  screenshot_asset_id uuid references public.assets(id),
  is_blurred boolean default false,
  created_at timestamptz default now()
);

-- DM KEYWORDS
create table if not exists public.dm_keywords (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  match_type text default 'contains',
  response_template text,
  active boolean default true,
  trigger_count int default 0,
  last_triggered_at timestamptz,
  created_at timestamptz default now()
);

-- AUDITS
create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text default 'pending',
  requester_handle text,
  input_url text,
  notes text,
  output_content_item_id uuid references public.content_items(id),
  created_at timestamptz default now()
);

-- SCHEDULED POSTS
create table if not exists public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid references public.content_items(id),
  title text,
  post_type text not null,
  platform text default 'instagram',
  scheduled_for timestamptz not null,
  status text default 'scheduled',
  notes text,
  created_at timestamptz default now()
);

-- EXPORTS
create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid references public.content_items(id),
  kind text not null,
  format text not null,
  asset_id uuid references public.assets(id),
  filename text,
  created_at timestamptz default now()
);

-- RLS
alter table public.brand_settings enable row level security;
alter table public.templates enable row level security;
alter table public.assets enable row level security;
alter table public.content_items enable row level security;
alter table public.scripts enable row level security;
alter table public.one_pagers enable row level security;
alter table public.designs enable row level security;
alter table public.proofs enable row level security;
alter table public.dm_keywords enable row level security;
alter table public.audits enable row level security;
alter table public.scheduled_posts enable row level security;
alter table public.exports enable row level security;

-- brand_settings
create policy "brand_settings_own" on public.brand_settings
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- templates (system readable by all authed; user templates only by owner)
create policy "templates_read" on public.templates
for select using (is_system = true or user_id = auth.uid());

create policy "templates_write_own" on public.templates
for insert with check (user_id = auth.uid() and is_system = false);

create policy "templates_update_own" on public.templates
for update using (user_id = auth.uid() and is_system = false)
with check (user_id = auth.uid() and is_system = false);

create policy "templates_delete_own" on public.templates
for delete using (user_id = auth.uid() and is_system = false);

-- assets
create policy "assets_own" on public.assets
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- content_items
create policy "content_items_own" on public.content_items
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- scripts / one_pagers / designs tied to content_items owner
create policy "scripts_by_owner" on public.scripts
for all using (
  exists (select 1 from public.content_items ci where ci.id = content_item_id and ci.user_id = auth.uid())
) with check (
  exists (select 1 from public.content_items ci where ci.id = content_item_id and ci.user_id = auth.uid())
);

create policy "onepagers_by_owner" on public.one_pagers
for all using (
  exists (select 1 from public.content_items ci where ci.id = content_item_id and ci.user_id = auth.uid())
) with check (
  exists (select 1 from public.content_items ci where ci.id = content_item_id and ci.user_id = auth.uid())
);

create policy "designs_by_owner" on public.designs
for all using (
  exists (select 1 from public.content_items ci where ci.id = content_item_id and ci.user_id = auth.uid())
) with check (
  exists (select 1 from public.content_items ci where ci.id = content_item_id and ci.user_id = auth.uid())
);

-- proofs, dm_keywords, audits, scheduled_posts, exports
create policy "proofs_own" on public.proofs
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "dm_keywords_own" on public.dm_keywords
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "audits_own" on public.audits
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "scheduled_posts_own" on public.scheduled_posts
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "exports_own" on public.exports
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values ('aa-assets', 'aa-assets', true);
insert into storage.buckets (id, name, public) values ('aa-designs', 'aa-designs', true);
insert into storage.buckets (id, name, public) values ('aa-onepagers', 'aa-onepagers', true);
insert into storage.buckets (id, name, public) values ('aa-exports', 'aa-exports', true);
insert into storage.buckets (id, name, public) values ('aa-brand', 'aa-brand', true);

-- Storage policies for all buckets
create policy "Users can upload own files aa-assets"
on storage.objects for insert
with check (bucket_id = 'aa-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own files aa-assets"
on storage.objects for select
using (bucket_id = 'aa-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own files aa-assets"
on storage.objects for update
using (bucket_id = 'aa-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own files aa-assets"
on storage.objects for delete
using (bucket_id = 'aa-assets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload own files aa-designs"
on storage.objects for insert
with check (bucket_id = 'aa-designs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own files aa-designs"
on storage.objects for select
using (bucket_id = 'aa-designs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own files aa-designs"
on storage.objects for update
using (bucket_id = 'aa-designs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own files aa-designs"
on storage.objects for delete
using (bucket_id = 'aa-designs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload own files aa-onepagers"
on storage.objects for insert
with check (bucket_id = 'aa-onepagers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own files aa-onepagers"
on storage.objects for select
using (bucket_id = 'aa-onepagers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own files aa-onepagers"
on storage.objects for update
using (bucket_id = 'aa-onepagers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own files aa-onepagers"
on storage.objects for delete
using (bucket_id = 'aa-onepagers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload own files aa-exports"
on storage.objects for insert
with check (bucket_id = 'aa-exports' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own files aa-exports"
on storage.objects for select
using (bucket_id = 'aa-exports' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own files aa-exports"
on storage.objects for update
using (bucket_id = 'aa-exports' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own files aa-exports"
on storage.objects for delete
using (bucket_id = 'aa-exports' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload own files aa-brand"
on storage.objects for insert
with check (bucket_id = 'aa-brand' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own files aa-brand"
on storage.objects for select
using (bucket_id = 'aa-brand' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own files aa-brand"
on storage.objects for update
using (bucket_id = 'aa-brand' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own files aa-brand"
on storage.objects for delete
using (bucket_id = 'aa-brand' and auth.uid()::text = (storage.foldername(name))[1]);

-- SEED SYSTEM TEMPLATES
insert into public.templates (id, user_id, is_system, key, name, category, description, formats, config_schema) values
  ('00000000-0000-0000-0000-000000000001', null, true, 'reel-cover', 'Reel Cover', 'attraction', 'Bold headline for reel covers with grid-safe layout', array['9:16'], '{"fields": ["categoryTag", "title", "subtitle", "showAALogo"]}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', null, true, 'bold-text', 'Bold Text Card', 'framework', 'Large text statement card', array['4:5', '1:1'], '{"fields": ["tag", "headline", "subline"]}'::jsonb),
  ('00000000-0000-0000-0000-000000000003', null, true, 'carousel', 'Carousel Framework', 'framework', 'Multi-slide carousel for frameworks', array['4:5'], '{"fields": ["title", "subtitle", "sections", "cta"]}'::jsonb),
  ('00000000-0000-0000-0000-000000000004', null, true, 'one-pager', 'One-Pager Scroll', 'framework', 'Scrollable one-pager with beat panels', array['9:16', '4:5'], '{"fields": ["title", "subtitle", "beats", "cta"]}'::jsonb),
  ('00000000-0000-0000-0000-000000000005', null, true, 'audit-overlay', 'Audit Overlay', 'audit', 'Before/after audit with callouts', array['9:16'], '{"fields": ["screenshot", "problemLabel", "fixLabel", "resultLabel", "score"]}'::jsonb),
  ('00000000-0000-0000-0000-000000000006', null, true, 'proof-card', 'Proof Card', 'proof', 'Results showcase with metrics', array['9:16'], '{"fields": ["headline", "screenshot", "changes", "whyWorked", "score", "cta"]}'::jsonb);