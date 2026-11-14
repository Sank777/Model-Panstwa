-- Centrum Jawności Państwa — publiczny rejestr instytucjonalny
-- Migration: 2026-11-14
-- Cel: publiczny odczyt opublikowanych danych urzędowych bez kont obywateli.
-- Zapis do nowych rejestrów wyłącznie przez kontrolowany backend (service_role).

begin;

create table if not exists public.public_registry_projects (
  id uuid primary key default gen_random_uuid(),
  official_source text not null check (char_length(official_source) between 2 and 180),
  source_record_id text,
  title text not null check (char_length(title) between 5 and 240),
  public_body text not null check (char_length(public_body) between 2 and 240),
  location text,
  description text not null default '' check (char_length(description) <= 10000),
  project_stage text not null default 'unknown'
    check (project_stage in ('planning','preparation','procurement','in_progress','completed','suspended','cancelled','unknown')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft','published','archived')),
  source_document_title text not null check (char_length(source_document_title) between 3 and 300),
  source_url text not null check (source_url ~ '^https?://'),
  source_document_date date,
  data_as_of timestamptz not null default now(),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists public_registry_projects_source_record_uq
  on public.public_registry_projects(official_source, source_record_id)
  where source_record_id is not null;
create index if not exists public_registry_projects_public_idx
  on public.public_registry_projects(publication_status, updated_at desc);

create table if not exists public.public_registry_budget_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.public_registry_projects(id) on delete cascade,
  version_no integer not null check (version_no > 0),
  budget_kind text not null check (budget_kind in ('estimate','approved','contract','amendment','actual','paid')),
  amount numeric(20,2) not null check (amount >= 0),
  currency char(3) not null default 'PLN',
  scope_note text not null check (char_length(scope_note) between 10 and 5000),
  source_title text not null check (char_length(source_title) between 3 and 300),
  source_url text not null check (source_url ~ '^https?://'),
  source_date date,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','disputed','rejected')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft','published','archived')),
  data_as_of timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(project_id, version_no)
);
create index if not exists public_registry_budget_public_idx
  on public.public_registry_budget_versions(project_id, publication_status, verification_status, version_no);

create table if not exists public.public_registry_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.public_registry_projects(id) on delete cascade,
  event_date date not null,
  event_type text not null check (event_type in ('decision','funding','procurement','contract','amendment','payment','milestone','acceptance','audit','appeal','correction','other')),
  title text not null check (char_length(title) between 3 and 300),
  description text not null check (char_length(description) between 10 and 10000),
  institution text,
  official_person_name text,
  official_role text,
  source_document_title text not null check (char_length(source_document_title) between 3 and 300),
  source_url text not null check (source_url ~ '^https?://'),
  source_date date,
  publication_status text not null default 'draft'
    check (publication_status in ('draft','published','archived')),
  data_as_of timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists public_registry_events_public_idx
  on public.public_registry_events(project_id, publication_status, event_date, created_at);

create table if not exists public.public_registry_controls (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.public_registry_projects(id) on delete cascade,
  control_date date not null,
  control_body text not null,
  control_type text not null check (control_type in ('audit','inspection','administrative','judicial','other')),
  finding text not null check (char_length(finding) between 10 and 10000),
  recommendation text,
  outcome text not null check (outcome in ('no_irregularity','irregularity_found','partly_confirmed','insufficient_data','proceeding_pending','other')),
  consequence_status text not null default 'not_established'
    check (consequence_status in ('applied','partly_applied','not_applied','not_established','not_applicable','pending')),
  consequence_description text,
  source_document_title text not null check (char_length(source_document_title) between 3 and 300),
  source_url text not null check (source_url ~ '^https?://'),
  source_date date,
  publication_status text not null default 'draft'
    check (publication_status in ('draft','published','archived')),
  data_as_of timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists public_registry_controls_public_idx
  on public.public_registry_controls(project_id, publication_status, control_date);

alter table public.public_registry_projects enable row level security;
alter table public.public_registry_budget_versions enable row level security;
alter table public.public_registry_events enable row level security;
alter table public.public_registry_controls enable row level security;

revoke all on table public.public_registry_projects, public.public_registry_budget_versions,
  public.public_registry_events, public.public_registry_controls from anon, authenticated;
grant select on table public.public_registry_projects, public.public_registry_budget_versions,
  public.public_registry_events, public.public_registry_controls to anon, authenticated;
grant select, insert, update, delete on table public.public_registry_projects,
  public.public_registry_budget_versions, public.public_registry_events,
  public.public_registry_controls to service_role;

drop policy if exists public_registry_projects_read_published on public.public_registry_projects;
create policy public_registry_projects_read_published on public.public_registry_projects
  for select to anon, authenticated using (publication_status = 'published');
drop policy if exists public_registry_budget_read_published on public.public_registry_budget_versions;
create policy public_registry_budget_read_published on public.public_registry_budget_versions
  for select to anon, authenticated using (
    publication_status = 'published' and verification_status = 'verified'
    and exists (select 1 from public.public_registry_projects p
      where p.id = project_id and p.publication_status = 'published')
  );
drop policy if exists public_registry_events_read_published on public.public_registry_events;
create policy public_registry_events_read_published on public.public_registry_events
  for select to anon, authenticated using (
    publication_status = 'published'
    and exists (select 1 from public.public_registry_projects p
      where p.id = project_id and p.publication_status = 'published')
  );
drop policy if exists public_registry_controls_read_published on public.public_registry_controls;
create policy public_registry_controls_read_published on public.public_registry_controls
  for select to anon, authenticated using (
    publication_status = 'published'
    and exists (select 1 from public.public_registry_projects p
      where p.id = project_id and p.publication_status = 'published')
  );

-- Wyłączenie obywatelskiego zapisu do starego, kontowego modelu inwestycji.
revoke all on table public.investment_projects, public.investment_budget_versions,
  public.investment_reviews, public.investment_audit_events from anon, authenticated;
grant select on table public.investment_projects, public.investment_budget_versions,
  public.investment_reviews to anon, authenticated;

drop policy if exists investment_projects_insert_own on public.investment_projects;
drop policy if exists investment_projects_owner_update_draft on public.investment_projects;
drop policy if exists investment_projects_admin_update on public.investment_projects;
drop policy if exists investment_budget_insert_own on public.investment_budget_versions;
drop policy if exists investment_budget_admin_update on public.investment_budget_versions;
drop policy if exists investment_reviews_insert_own on public.investment_reviews;
drop policy if exists investment_reviews_admin_update on public.investment_reviews;

drop policy if exists investment_projects_read_published_or_owner on public.investment_projects;
create policy investment_projects_read_published_only on public.investment_projects
  for select to anon, authenticated using (publication_status = 'published');
drop policy if exists investment_budget_read_published_or_owner on public.investment_budget_versions;
create policy investment_budget_read_verified_only on public.investment_budget_versions
  for select to anon, authenticated using (
    verification_status = 'verified'
    and exists (select 1 from public.investment_projects p
      where p.id = project_id and p.publication_status = 'published')
  );
drop policy if exists investment_reviews_read_public_or_owner on public.investment_reviews;
create policy investment_reviews_read_public_only on public.investment_reviews
  for select to anon, authenticated using (
    result <> 'open'
    and exists (select 1 from public.investment_projects p
      where p.id = project_id and p.publication_status = 'published')
  );
drop policy if exists investment_audit_admin_read on public.investment_audit_events;
revoke select on table public.investment_audit_events from anon, authenticated;

commit;
