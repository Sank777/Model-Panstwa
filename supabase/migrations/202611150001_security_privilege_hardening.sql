-- Security hardening, stage 1.
-- Non-destructive: no user rows, auth accounts, buckets, or existing policies are deleted.
-- Run only after reviewing the compatibility checklist in docs/SECURITY-HARDENING-PLAN.md.

begin;

-- RLS does not protect against table-level TRUNCATE/REFERENCES/TRIGGER privileges.
-- Remove only these bypass/administrative privileges from client roles; preserve normal
-- SELECT/INSERT/UPDATE/DELETE grants so existing RLS policies continue to decide access.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- Apply the same restriction to future tables created by the migration owner.
alter default privileges in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;

-- No client role should create objects in application schemas.
revoke create on schema public from public, anon, authenticated;
grant usage on schema public to anon, authenticated;

-- Keep the internal case records inaccessible to browser roles even if a broad grant
-- is accidentally introduced later. Existing service_role access is preserved.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'admin_private') then
    revoke all on schema admin_private from public, anon, authenticated;
    grant usage on schema admin_private to service_role;
    revoke all on all tables in schema admin_private from public, anon, authenticated;
    alter default privileges in schema admin_private
      revoke all on tables from public, anon, authenticated;
  end if;
end
$$;

commit;
