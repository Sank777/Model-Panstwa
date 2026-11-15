-- Read-only post-migration verification. Run with a database role that can inspect catalogs.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind in ('r','p') and n.nspname in ('public','admin_private')
order by 1,2;

-- Must return zero rows for anon/authenticated on public tables.
select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon','authenticated')
  and privilege_type in ('TRUNCATE','REFERENCES','TRIGGER')
order by 1,2,3,4;

-- Storage: verify RLS and enumerate policies and effective table grants.
-- Current audit found RLS enabled, no policies, but broad client grants.
-- Treat any client write grant as a blocker until frontend upload paths are inventoried.
select
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'storage' and c.relname = 'objects';

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'storage'
  and table_name = 'objects'
  and grantee in ('anon', 'authenticated', 'service_role')
order by grantee, privilege_type;

-- Inspect storage exposure; do not change existing bucket visibility until the frontend
-- has been migrated to signed URLs and has been tested end-to-end.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;

-- Confirm administrator account count and role metadata without exposing email addresses.
select
  count(*) as account_count,
  count(*) filter (where raw_app_meta_data->>'role' = 'admin') as main_admin_count
from auth.users;
