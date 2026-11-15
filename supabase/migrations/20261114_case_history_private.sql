-- Prywatne rejestry spraw: tożsamość, potwierdzenia, źródła i historia.
-- Nie są częścią publicznego API; dostęp wyłącznie przez Edge Function po sprawdzeniu roli admin.
begin;
create schema if not exists admin_private;
revoke all on schema admin_private from public, anon, authenticated;
grant usage on schema admin_private to service_role;

create table if not exists admin_private.case_participants (
 id uuid primary key default gen_random_uuid(),
 case_id text not null references public.zgloszenia(id) on delete restrict,
 participant_role text not null check (participant_role in ('reporter','verifier','witness','case_officer','institution_contact')),
 display_name text,
 organization text,
 role_description text,
 contact_reference text,
 auth_user_id uuid,
 verification_status text not null default 'unverified' check (verification_status in ('unverified','identity_checked','authority_checked','source_confirmed','disputed')),
 verification_method text,
 verified_at timestamptz,
 verified_by uuid,
 privacy_basis text,
 visibility text not null default 'private' check (visibility in ('private','restricted')),
 notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (char_length(coalesce(display_name,'')) <= 240),
 check (char_length(coalesce(contact_reference,'')) <= 500),
 check (char_length(coalesce(notes,'')) <= 5000)
);
create index if not exists case_participants_case_idx on admin_private.case_participants(case_id,created_at);

create table if not exists admin_private.case_history (
 id uuid primary key default gen_random_uuid(),
 case_id text not null references public.zgloszenia(id) on delete restrict,
 occurred_at timestamptz not null default now(),
 entry_type text not null check (entry_type in ('report_received','identity_check','verification','document_added','status_change','institution_reply','inspection','decision','correction','publication','other')),
 evidence_class text not null default 'unverified' check (evidence_class in ('confirmed_fact','party_statement','hypothesis','assessment','unverified')),
 title text not null check (char_length(title) between 3 and 240),
 details text not null check (char_length(details) between 3 and 10000),
 source_title text,
 source_url text check (source_url is null or source_url ~ '^https?://'),
 source_date date,
 recorded_by uuid not null,
 verified_by uuid,
 verification_note text,
 previous_status text,
 new_status text,
 public_summary text,
 publication_status text not null default 'private' check (publication_status in ('private','approved_public','archived')),
 created_at timestamptz not null default now()
);
create index if not exists case_history_case_time_idx on admin_private.case_history(case_id,occurred_at desc);

create table if not exists admin_private.case_evidence (
 id uuid primary key default gen_random_uuid(),
 case_id text not null references public.zgloszenia(id) on delete restrict,
 evidence_type text not null check (evidence_type in ('official_document','photo','video','email','letter','recording','web_archive','other')),
 title text not null check (char_length(title) between 3 and 240),
 source_url text check (source_url is null or source_url ~ '^https?://'),
 storage_path text,
 issuer text,
 document_date date,
 evidence_class text not null default 'unverified' check (evidence_class in ('confirmed_fact','party_statement','hypothesis','assessment','unverified')),
 verification_status text not null default 'pending' check (verification_status in ('pending','verified','disputed','rejected')),
 verified_by uuid,
 verified_at timestamptz,
 public_redacted boolean not null default false,
 redaction_note text,
 added_by uuid not null,
 created_at timestamptz not null default now()
);
create index if not exists case_evidence_case_idx on admin_private.case_evidence(case_id,created_at desc);

alter table admin_private.case_participants enable row level security;
alter table admin_private.case_history enable row level security;
alter table admin_private.case_evidence enable row level security;
revoke all on all tables in schema admin_private from public, anon, authenticated;
grant select,insert,update,delete on all tables in schema admin_private to service_role;
alter default privileges in schema admin_private revoke all on tables from public, anon, authenticated;
alter default privileges in schema admin_private grant select,insert,update,delete on tables to service_role;
commit;