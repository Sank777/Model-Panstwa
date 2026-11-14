-- Final pre-merge hardening: explicit deny policies on private tables and cached JWT checks.
begin;
drop policy if exists case_participants_deny_client on admin_private.case_participants;
create policy case_participants_deny_client on admin_private.case_participants
 for all to anon, authenticated using (false) with check (false);
drop policy if exists case_history_deny_client on admin_private.case_history;
create policy case_history_deny_client on admin_private.case_history
 for all to anon, authenticated using (false) with check (false);
drop policy if exists case_evidence_deny_client on admin_private.case_evidence;
create policy case_evidence_deny_client on admin_private.case_evidence
 for all to anon, authenticated using (false) with check (false);
drop policy if exists investment_projects_admin_manage on public.investment_projects;
create policy investment_projects_admin_manage on public.investment_projects
 for all to authenticated
 using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
 with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists investment_budget_admin_manage on public.investment_budget_versions;
create policy investment_budget_admin_manage on public.investment_budget_versions
 for all to authenticated
 using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
 with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists investment_reviews_admin_manage on public.investment_reviews;
create policy investment_reviews_admin_manage on public.investment_reviews
 for all to authenticated
 using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
 with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists investment_audit_admin_read on public.investment_audit_events;
create policy investment_audit_admin_read on public.investment_audit_events
 for select to authenticated
 using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
commit;