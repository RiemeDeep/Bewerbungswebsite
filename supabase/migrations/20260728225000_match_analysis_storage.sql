create type public.match_analysis_status as enum ('active', 'expired', 'deleted');

create table public.match_analyses (
  id uuid primary key,
  access_token_hash text not null unique,
  job_context jsonb not null,
  match_analysis jsonb not null,
  consent_scope text not null default 'single_match_result',
  robots_directive text not null default 'noindex,nofollow',
  status public.match_analysis_status not null default 'active',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  deleted_at timestamptz,
  check (access_token_hash ~ '^[a-f0-9]{64}$'),
  check (jsonb_typeof(job_context) = 'object'),
  check (jsonb_typeof(match_analysis) = 'object'),
  check (consent_scope = 'single_match_result'),
  check (robots_directive = 'noindex,nofollow'),
  check (expires_at > created_at),
  check ((status = 'deleted') = (deleted_at is not null))
);

create index match_analyses_cleanup_idx on public.match_analyses (status, expires_at);

alter table public.match_analyses enable row level security;

revoke all on table public.match_analyses from anon, authenticated;

comment on table public.match_analyses is
  'Short-lived match results. Server-side access only; public tokens are stored exclusively as SHA-256 hashes.';
comment on column public.match_analyses.access_token_hash is
  'Lowercase SHA-256 hex digest. Never store or log the cleartext bearer token.';
comment on column public.match_analyses.job_context is
  'Normalized and application-validated JobContext JSON. Raw crawl or pasted text is not stored here.';
