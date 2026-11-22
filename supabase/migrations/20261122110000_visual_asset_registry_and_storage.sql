-- Leon Visual Assets: central private drafts + public approved library.
create table if not exists public.visual_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  pillar_id smallint not null check (pillar_id between 1 and 10),
  title text not null check (char_length(title) between 1 and 240),
  status text not null default 'draft'
    check (status in ('draft','approved','published','rejected','archived')),
  source_bucket text not null default 'visual-drafts' check (source_bucket = 'visual-drafts'),
  source_path text not null unique check (source_path like 'drafts/pillar-%/%'),
  public_bucket text check (public_bucket is null or public_bucket = 'visual-assets'),
  public_path text unique,
  mime_type text not null default 'image/webp' check (mime_type = 'image/webp'),
  byte_size bigint check (byte_size is null or byte_size between 1 and 8388608),
  width integer check (width is null or width between 1 and 8192),
  height integer check (height is null or height between 1 and 8192),
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  prompt_version text,
  model text,
  scene_detail text,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 1000),
  github_commit text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status not in ('approved','published')) or (approved_at is not null and approved_by is not null)),
  check ((status <> 'published') or (published_at is not null and public_bucket = 'visual-assets' and public_path is not null))
);
create index if not exists visual_assets_status_created_idx on public.visual_assets(status, created_at desc);
create index if not exists visual_assets_pillar_status_idx on public.visual_assets(pillar_id, status, created_at desc);
alter table public.visual_assets enable row level security;
drop policy if exists visual_assets_public_published_read on public.visual_assets;
create policy visual_assets_public_published_read on public.visual_assets
  for select to anon, authenticated
  using (status = 'published' and published_at is not null);
drop policy if exists visual_assets_admin_read on public.visual_assets;
create policy visual_assets_admin_read on public.visual_assets
  for select to authenticated
  using (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role','') = 'admin'
    or (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role','') = 'site_admin'
      and coalesce(auth.jwt() -> 'app_metadata' -> 'admin_modules','[]'::jsonb) ? 'visual-assets'
    )
  );
-- Storage is intentionally split: private drafts are never publicly addressable;
-- only the approved production bucket is public-read. Writes use the Edge Function service role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('visual-drafts', 'visual-drafts', false, 8388608, array['image/webp']),
  ('visual-assets', 'visual-assets', true, 8388608, array['image/webp'])
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
