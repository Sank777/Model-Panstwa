-- Stage 3 read-only verification. Run after applying migration in a test project.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('admin_audit_log','storage_cleanup_queue')
order by c.relname;

select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('admin_audit_log','storage_cleanup_queue')
order by tablename, policyname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('admin_audit_log','storage_cleanup_queue')
  and grantee in ('anon','authenticated','service_role')
order by table_name, grantee, privilege_type;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'report_events'
order by indexname;

-- Expected after the migration:
-- * RLS enabled for both new tables.
-- * No client-role grants or policies.
-- * service_role has required CRUD grants.
-- * report_events_report_created_idx already exists.
