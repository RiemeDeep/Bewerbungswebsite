create type public.profile_visibility as enum ('private', 'internal', 'public_excerpt', 'public');
create type public.profile_publication_status as enum (
  'draft',
  'in_review',
  'published',
  'withdrawn',
  'archived'
);
create type public.profile_usage_context as enum (
  'public_profile',
  'profile_assistant',
  'job_analysis',
  'admin_review'
);
create type public.profile_claim_type as enum (
  'career_fact',
  'project_fact',
  'qualification',
  'capability',
  'limitation'
);
create type public.profile_claim_confidence as enum (
  'verified',
  'supported',
  'self_reported',
  'uncertain'
);
create type public.profile_evidence_strength as enum ('direct', 'supporting', 'weak');

create table public.profile_entities (
  id uuid primary key,
  entity_type text not null check (length(trim(entity_type)) > 0),
  canonical_name text not null check (length(trim(canonical_name)) > 0),
  slug text unique check (slug is null or length(trim(slug)) > 0),
  summary text,
  visibility public.profile_visibility not null default 'private',
  publication_status public.profile_publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.source_documents (
  id uuid primary key,
  title text not null check (length(trim(title)) > 0),
  document_type text not null check (length(trim(document_type)) > 0),
  storage_path text,
  checksum text,
  mime_type text,
  visibility public.profile_visibility not null default 'private',
  publication_status public.profile_publication_status not null default 'draft',
  ingestion_status text not null default 'not_ingested' check (length(trim(ingestion_status)) > 0),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (storage_path is null or length(trim(storage_path)) > 0)
);

create table public.profile_claims (
  id uuid primary key,
  entity_id uuid not null references public.profile_entities (id) on delete restrict,
  claim_type public.profile_claim_type not null,
  statement text not null check (length(trim(statement)) > 0),
  valid_from date,
  valid_to date,
  confidence public.profile_claim_confidence not null,
  visibility public.profile_visibility not null default 'internal',
  publication_status public.profile_publication_status not null default 'draft',
  allowed_contexts public.profile_usage_context[] not null,
  reviewed_at timestamptz,
  reviewed_by uuid,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(allowed_contexts) > 0),
  check (valid_to is null or valid_from is null or valid_to >= valid_from),
  check (publication_status <> 'published' or reviewed_at is not null),
  check (publication_status <> 'withdrawn' or withdrawn_at is not null)
);

create table public.evidence_items (
  id uuid primary key,
  claim_id uuid not null references public.profile_claims (id) on delete restrict,
  source_document_id uuid not null references public.source_documents (id) on delete restrict,
  source_locator text,
  public_label text not null check (length(trim(public_label)) > 0),
  public_excerpt text,
  evidence_strength public.profile_evidence_strength not null,
  visibility public.profile_visibility not null default 'internal',
  publication_status public.profile_publication_status not null default 'draft',
  allowed_contexts public.profile_usage_context[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_locator is null or length(trim(source_locator)) > 0),
  check (cardinality(allowed_contexts) > 0),
  check (public_excerpt is null or visibility in ('public_excerpt', 'public'))
);

create table public.document_chunks (
  id uuid primary key,
  source_document_id uuid not null references public.source_documents (id) on delete restrict,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null check (length(trim(content)) > 0),
  token_count integer check (token_count is null or token_count > 0),
  metadata jsonb not null default '{}'::jsonb,
  publication_status public.profile_publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  unique (source_document_id, chunk_index)
);

create index profile_entities_publication_idx on public.profile_entities (publication_status, visibility);
create index source_documents_publication_idx on public.source_documents (publication_status, visibility);
create index profile_claims_retrieval_idx on public.profile_claims (publication_status, visibility);
create index profile_claims_allowed_contexts_idx on public.profile_claims using gin (allowed_contexts);
create index profile_claims_entity_idx on public.profile_claims (entity_id);
create index evidence_items_retrieval_idx on public.evidence_items (publication_status, visibility);
create index evidence_items_allowed_contexts_idx on public.evidence_items using gin (allowed_contexts);
create index evidence_items_claim_idx on public.evidence_items (claim_id);
create index evidence_items_source_document_idx on public.evidence_items (source_document_id);
create index document_chunks_source_document_idx on public.document_chunks (source_document_id);
create index document_chunks_publication_idx on public.document_chunks (publication_status);

alter table public.profile_entities enable row level security;
alter table public.source_documents enable row level security;
alter table public.profile_claims enable row level security;
alter table public.evidence_items enable row level security;
alter table public.document_chunks enable row level security;

revoke all on table public.profile_entities from anon, authenticated;
revoke all on table public.source_documents from anon, authenticated;
revoke all on table public.profile_claims from anon, authenticated;
revoke all on table public.evidence_items from anon, authenticated;
revoke all on table public.document_chunks from anon, authenticated;

comment on table public.profile_claims is
  'Stage-2 local feasibility table. Public use must go through server-side retrieval filters; no direct anon access.';
comment on table public.evidence_items is
  'Stage-2 local feasibility table. Evidence chips require published public_excerpt/public evidence in the requested usage context.';
comment on column public.profile_claims.allowed_contexts is
  'Separates product usage from technical visibility; do not model analysis_only as visibility.';
