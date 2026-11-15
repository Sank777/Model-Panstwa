-- Restore legacy investment administration without reopening citizen write access.
-- Admin is identified only by trusted app_metadata.role; user_metadata is not trusted.
begin;

grant select, insert, update, delete on table public.investment_projects,
  public.investment_budget_versions, public.investment_reviews to authenticated;
grant select on table public.investment_audit_events to authenticated;

drop policy if exists investment_projects_admin_manage on public.investment_projects;
create policy investment_projects_admin_manage on public.investment_projects
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists investment_budget_admin_manage on public.investment_budget_versions;
create policy investment_budget_admin_manage on public.investment_budget_versions
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists investment_reviews_admin_manage on public.investment_reviews;
create policy investment_reviews_admin_manage on public.investment_reviews
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists investment_audit_admin_read on public.investment_audit_events;
create policy investment_audit_admin_read on public.investment_audit_events
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

commit;