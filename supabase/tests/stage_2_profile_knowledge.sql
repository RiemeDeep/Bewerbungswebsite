begin;

do $$
begin
  if has_table_privilege('anon', 'public.profile_claims', 'select') then
    raise exception 'anon must not have direct select privileges on profile_claims';
  end if;

  if has_table_privilege('authenticated', 'public.profile_claims', 'select') then
    raise exception 'authenticated must not have direct select privileges on profile_claims';
  end if;

  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'profile_claims'
      and c.relrowsecurity
  ) then
    raise exception 'row level security must be active on profile_claims';
  end if;

  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'evidence_items'
      and c.relrowsecurity
  ) then
    raise exception 'row level security must be active on evidence_items';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile_claims'
      and column_name = 'subject_review_status'
  ) then
    raise exception 'profile_claims must store subject_review_status';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profile_claims'
      and column_name = 'confidence'
  ) then
    raise exception 'ambiguous profile_claims confidence column must be removed';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'evidence_items'
      and column_name = 'evidence_basis'
  ) then
    raise exception 'evidence_items must store evidence_basis';
  end if;
end $$;

do $$
declare
  eligible_claims integer;
begin
  select count(distinct c.id)
  into eligible_claims
  from public.profile_claims c
  join public.profile_entities pe on pe.id = c.entity_id
  join public.evidence_items e on e.claim_id = c.id
  join public.source_documents sd on sd.id = e.source_document_id
  where pe.publication_status = 'published'
    and pe.visibility <> 'private'
    and c.publication_status = 'published'
    and c.subject_review_status = 'subject_verified'
    and c.visibility <> 'private'
    and 'profile_assistant' = any(c.allowed_contexts)
    and e.publication_status = 'published'
    and e.visibility in ('public_excerpt', 'public')
    and e.evidence_basis <> 'uncertain'
    and 'profile_assistant' = any(e.allowed_contexts)
    and sd.publication_status = 'published';

  if eligible_claims <> 1 then
    raise exception 'synthetic profile_assistant retrieval should expose exactly one claim, got %', eligible_claims;
  end if;
end $$;

do $$
begin
  insert into public.profile_claims (
    id,
    entity_id,
    claim_type,
    statement,
    subject_review_status,
    publication_status,
    allowed_contexts
  )
  values (
    '00000000-0000-4000-8000-000000009001',
    '00000000-0000-4000-8000-000000000001',
    'capability',
    'Dieser synthetische Claim verletzt die Published-Review-Invariante.',
    'subject_verified',
    'published',
    array['profile_assistant']::public.profile_usage_context[]
  );

  raise exception 'published claims without reviewed_at must be rejected';
exception
  when check_violation then
    null;
end $$;

do $$
begin
  insert into public.profile_claims (
    id,
    entity_id,
    claim_type,
    statement,
    subject_review_status,
    publication_status,
    allowed_contexts,
    reviewed_at
  )
  values (
    '00000000-0000-4000-8000-000000009002',
    '00000000-0000-4000-8000-000000000001',
    'capability',
    'Dieser synthetische Claim verletzt die Subject-Review-Invariante.',
    'unreviewed',
    'published',
    array['profile_assistant']::public.profile_usage_context[],
    '2026-07-30T00:00:00Z'
  );

  raise exception 'published claims without subject verification must be rejected';
exception
  when check_violation then
    null;
end $$;

rollback;
