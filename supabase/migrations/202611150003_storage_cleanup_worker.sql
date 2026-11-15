-- Stage 4: leased, bounded retries for Storage cleanup.
-- Additive and safe to apply after stage 3; no existing queue rows are deleted.

begin;

alter table public.storage_cleanup_queue
  drop constraint if exists storage_cleanup_queue_status_check;

alter table public.storage_cleanup_queue
  add constraint storage_cleanup_queue_status_check
  check (status in ('pending','processing','done','dead'));

alter table public.storage_cleanup_queue
  add column if not exists last_attempt_at timestamptz,
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists locked_at timestamptz;

create index if not exists storage_cleanup_queue_due_idx
  on public.storage_cleanup_queue (next_attempt_at, created_at)
  where status = 'pending';

create or replace function public.claim_storage_cleanup_jobs(p_limit integer default 10)
returns table (
  id uuid,
  bucket_id text,
  object_path text,
  attempts integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit is null or p_limit < 1 or p_limit > 20 then
    raise exception 'p_limit must be an integer between 1 and 20';
  end if;

  update public.storage_cleanup_queue q
  set status = 'dead', locked_at = null,
      last_error = coalesce(q.last_error, 'Retry limit reached after expired worker lease')
  where q.status = 'processing'
    and q.locked_at < now() - interval '10 minutes'
    and q.attempts >= 8;

  return query
  with candidates as (
    select q.id
    from public.storage_cleanup_queue q
    where (
      (q.status = 'pending' and q.next_attempt_at <= now())
      or
      (q.status = 'processing' and q.locked_at < now() - interval '10 minutes')
    )
      and q.attempts < 8
    order by q.next_attempt_at, q.created_at
    for update skip locked
    limit p_limit
  )
  update public.storage_cleanup_queue q
  set status = 'processing',
      attempts = q.attempts + 1,
      last_attempt_at = now(),
      locked_at = now(),
      last_error = null
  from candidates c
  where q.id = c.id
  returning q.id, q.bucket_id, q.object_path, q.attempts;
end;
$$;

revoke all on function public.claim_storage_cleanup_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_storage_cleanup_jobs(integer) to service_role;

-- Any previously exhausted pending rows are parked instead of retried forever.
update public.storage_cleanup_queue
set status = 'dead', locked_at = null,
    last_error = coalesce(last_error, 'Retry limit reached before stage 4')
where status = 'pending' and attempts >= 8;

commit;
