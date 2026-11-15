-- Stage 3: durable administrative audit and Storage cleanup queue.
-- Additive only: does not alter existing rows, users, buckets, or administrator metadata.

begin;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 1 and 60),
  target_type text not null check (char_length(target_type) between 1 and 60),
  target_id text not null check (char_length(target_id) between 1 and 160),
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_target_created_idx
  on public.admin_audit_log (target_type, target_id, created_at desc);

create index if not exists admin_audit_log_actor_created_idx
  on public.admin_audit_log (actor_user_id, created_at desc);

create table if not exists public.storage_cleanup_queue (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null check (char_length(bucket_id) between 1 and 100),
  object_path text not null check (char_length(object_path) between 1 and 1024),
  status text not null default 'pending' check (status in ('pending','processing','done')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text check (last_error is null or char_length(last_error) <= 1000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (bucket_id, object_path)
);

create index if not exists storage_cleanup_queue_pending_idx
  on public.storage_cleanup_queue (created_at)
  where status = 'pending';

-- Cover the actor FK on the existing report_events table (the report_id FK
-- already has report_events_report_created_idx).
create index if not exists report_events_actor_created_idx
  on public.report_events (actor_user_id, created_at desc);

alter table public.admin_audit_log enable row level security;
alter table public.storage_cleanup_queue enable row level security;

revoke all on table public.admin_audit_log from public, anon, authenticated;
revoke all on table public.storage_cleanup_queue from public, anon, authenticated;
grant select, insert, update, delete on table public.admin_audit_log to service_role;
grant select, insert, update, delete on table public.storage_cleanup_queue to service_role;

commit;
