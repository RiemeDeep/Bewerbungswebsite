begin;

insert into public.profile_entities (
  id,
  entity_type,
  canonical_name,
  visibility,
  publication_status
)
values
  (
    '00000000-0000-4000-8000-000000009200',
    'synthetic_profile_context_entity',
    'Synthetische Kontextfreigabe-Entitaet',
    'internal',
    'published'
  ),
  (
    '00000000-0000-4000-8000-000000009201',
    'synthetic_private_context_entity',
    'Private synthetische Kontextfreigabe-Entitaet',
    'private',
    'published'
  );

insert into public.source_documents (
  id,
  title,
  document_type,
  storage_path,
  visibility,
  publication_status,
  ingestion_status
)
values
  (
    '00000000-0000-4000-8000-000000009202',
    'Privater synthetischer Kontextfreigabe-Quelltitel',
    'synthetic_context_release_source',
    'private/synthetic-context-release-source.pdf',
    'private',
    'published',
    'metadata_only'
  );

insert into public.profile_claims (
  id,
  entity_id,
  claim_type,
  statement,
  subject_review_status,
  visibility,
  publication_status,
  allowed_contexts,
  reviewed_at,
  withdrawn_at
)
values
  (
    '00000000-0000-4000-8000-000000009210',
    '00000000-0000-4000-8000-000000009200',
    'capability',
    'Dieser synthetische Claim ist fuer den Kontextfreigabe-Dry-Run zulaessig.',
    'subject_verified',
    'internal',
    'published',
    array['public_profile']::public.profile_usage_context[],
    '2026-08-08T00:00:00Z',
    null
  ),
  (
    '00000000-0000-4000-8000-000000009211',
    '00000000-0000-4000-8000-000000009200',
    'capability',
    'Dieser synthetische Claim prueft idempotente Kontextfreigabe.',
    'subject_verified',
    'internal',
    'published',
    array['public_profile', 'profile_assistant']::public.profile_usage_context[],
    '2026-08-08T00:00:00Z',
    null
  ),
  (
    '00000000-0000-4000-8000-000000009212',
    '00000000-0000-4000-8000-000000009200',
    'capability',
    'Dieser synthetische Draft-Claim darf nicht technisch freigegeben werden.',
    'unreviewed',
    'internal',
    'draft',
    array['public_profile']::public.profile_usage_context[],
    null,
    null
  ),
  (
    '00000000-0000-4000-8000-000000009213',
    '00000000-0000-4000-8000-000000009200',
    'capability',
    'Dieser synthetische private Claim darf nicht technisch freigegeben werden.',
    'subject_verified',
    'private',
    'published',
    array['public_profile']::public.profile_usage_context[],
    '2026-08-08T00:00:00Z',
    null
  ),
  (
    '00000000-0000-4000-8000-000000009214',
    '00000000-0000-4000-8000-000000009201',
    'capability',
    'Dieser synthetische Claim an privater Entitaet darf nicht technisch freigegeben werden.',
    'subject_verified',
    'internal',
    'published',
    array['public_profile']::public.profile_usage_context[],
    '2026-08-08T00:00:00Z',
    null
  ),
  (
    '00000000-0000-4000-8000-000000009215',
    '00000000-0000-4000-8000-000000009200',
    'capability',
    'Dieser synthetische zurueckgezogene Claim darf nicht technisch freigegeben werden.',
    'subject_verified',
    'internal',
    'withdrawn',
    array['public_profile']::public.profile_usage_context[],
    '2026-08-08T00:00:00Z',
    '2026-08-08T01:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000009216',
    '00000000-0000-4000-8000-000000009200',
    'capability',
    'Dieser synthetische Claim mit interner Evidence darf nicht technisch freigegeben werden.',
    'subject_verified',
    'internal',
    'published',
    array['public_profile']::public.profile_usage_context[],
    '2026-08-08T00:00:00Z',
    null
  );

insert into public.evidence_items (
  id,
  claim_id,
  source_document_id,
  public_label,
  public_excerpt,
  evidence_strength,
  evidence_basis,
  visibility,
  publication_status,
  allowed_contexts
)
values
  (
    '00000000-0000-4000-8000-000000009220',
    '00000000-0000-4000-8000-000000009210',
    '00000000-0000-4000-8000-000000009202',
    'Synthetische Kontextfreigabe-Evidence',
    'Freigegebener synthetischer Kontextfreigabe-Auszug.',
    'direct',
    'subject_attestation',
    'public_excerpt',
    'published',
    array['public_profile']::public.profile_usage_context[]
  ),
  (
    '00000000-0000-4000-8000-000000009221',
    '00000000-0000-4000-8000-000000009211',
    '00000000-0000-4000-8000-000000009202',
    'Synthetische idempotente Kontextfreigabe-Evidence',
    'Freigegebener synthetischer Auszug fuer Idempotenz.',
    'supporting',
    'supporting_document',
    'public_excerpt',
    'published',
    array['public_profile', 'profile_assistant']::public.profile_usage_context[]
  ),
  (
    '00000000-0000-4000-8000-000000009222',
    '00000000-0000-4000-8000-000000009216',
    '00000000-0000-4000-8000-000000009202',
    'Interne synthetische Evidence',
    null,
    'supporting',
    'supporting_document',
    'internal',
    'published',
    array['public_profile']::public.profile_usage_context[]
  );

create temporary table reviewed_context_claims (
  id uuid primary key
) on commit drop;

insert into reviewed_context_claims (id)
values
  ('00000000-0000-4000-8000-000000009210'),
  ('00000000-0000-4000-8000-000000009211'),
  ('00000000-0000-4000-8000-000000009212'),
  ('00000000-0000-4000-8000-000000009213'),
  ('00000000-0000-4000-8000-000000009214'),
  ('00000000-0000-4000-8000-000000009215'),
  ('00000000-0000-4000-8000-000000009216');

do $$
begin
  insert into reviewed_context_claims (id)
  values ('00000000-0000-4000-8000-000000009210');

  raise exception 'duplicate reviewed claim IDs must be rejected';
exception
  when unique_violation then
    null;
end $$;

with eligible_reviewed_claims as (
  select c.id
  from public.profile_claims c
  join public.profile_entities pe on pe.id = c.entity_id
  where c.id in (select id from reviewed_context_claims)
    and c.publication_status = 'published'
    and c.visibility <> 'private'
    and c.subject_review_status = 'subject_verified'
    and 'public_profile' = any(c.allowed_contexts)
    and pe.publication_status = 'published'
    and pe.visibility <> 'private'
    and exists (
      select 1
      from public.evidence_items e
      join public.source_documents sd on sd.id = e.source_document_id
      where e.claim_id = c.id
        and e.publication_status = 'published'
        and e.visibility in ('public_excerpt', 'public')
        and e.evidence_basis <> 'uncertain'
        and 'public_profile' = any(e.allowed_contexts)
        and sd.publication_status = 'published'
    )
)
update public.profile_claims c
set allowed_contexts = (
  select array_agg(distinct context_value order by context_value)::public.profile_usage_context[]
  from unnest(c.allowed_contexts || array[
    'profile_assistant'::public.profile_usage_context,
    'job_analysis'::public.profile_usage_context
  ]) as context_value
)
where c.id in (select id from eligible_reviewed_claims)
  and not (
    'profile_assistant' = any(c.allowed_contexts)
    and 'job_analysis' = any(c.allowed_contexts)
  );

with eligible_reviewed_claims as (
  select c.id
  from public.profile_claims c
  join public.profile_entities pe on pe.id = c.entity_id
  where c.id in (select id from reviewed_context_claims)
    and c.publication_status = 'published'
    and c.visibility <> 'private'
    and c.subject_review_status = 'subject_verified'
    and 'public_profile' = any(c.allowed_contexts)
    and pe.publication_status = 'published'
    and pe.visibility <> 'private'
)
update public.evidence_items e
set allowed_contexts = (
  select array_agg(distinct context_value order by context_value)::public.profile_usage_context[]
  from unnest(e.allowed_contexts || array[
    'profile_assistant'::public.profile_usage_context,
    'job_analysis'::public.profile_usage_context
  ]) as context_value
)
where e.claim_id in (select id from eligible_reviewed_claims)
  and e.publication_status = 'published'
  and e.visibility in ('public_excerpt', 'public')
  and e.evidence_basis <> 'uncertain'
  and 'public_profile' = any(e.allowed_contexts)
  and not (
    'profile_assistant' = any(e.allowed_contexts)
    and 'job_analysis' = any(e.allowed_contexts)
  );

do $$
declare
  released_claims integer;
  released_evidence integer;
  wrongly_released_claims integer;
  wrongly_released_evidence integer;
  missing_reviewed_claims integer;
begin
  select count(*)
  into released_claims
  from public.profile_claims
  where id in (
    '00000000-0000-4000-8000-000000009210',
    '00000000-0000-4000-8000-000000009211'
  )
    and 'profile_assistant' = any(allowed_contexts)
    and 'job_analysis' = any(allowed_contexts)
    and cardinality(allowed_contexts) = 3;
  if released_claims <> 2 then
    raise exception 'expected two eligible claims to be released exactly once, got %', released_claims;
  end if;

  select count(*)
  into released_evidence
  from public.evidence_items
  where id in (
    '00000000-0000-4000-8000-000000009220',
    '00000000-0000-4000-8000-000000009221'
  )
    and 'profile_assistant' = any(allowed_contexts)
    and 'job_analysis' = any(allowed_contexts)
    and cardinality(allowed_contexts) = 3;
  if released_evidence <> 2 then
    raise exception 'expected two eligible evidence items to be released exactly once, got %', released_evidence;
  end if;

  select count(*)
  into wrongly_released_claims
  from public.profile_claims
  where id in (
    '00000000-0000-4000-8000-000000009212',
    '00000000-0000-4000-8000-000000009213',
    '00000000-0000-4000-8000-000000009214',
    '00000000-0000-4000-8000-000000009215',
    '00000000-0000-4000-8000-000000009216'
  )
    and (
      'profile_assistant' = any(allowed_contexts)
      or 'job_analysis' = any(allowed_contexts)
    );
  if wrongly_released_claims <> 0 then
    raise exception 'ineligible claims must not be released, got %', wrongly_released_claims;
  end if;

  select count(*)
  into wrongly_released_evidence
  from public.evidence_items
  where id = '00000000-0000-4000-8000-000000009222'
    and (
      'profile_assistant' = any(allowed_contexts)
      or 'job_analysis' = any(allowed_contexts)
    );
  if wrongly_released_evidence <> 0 then
    raise exception 'ineligible evidence must not be released, got %', wrongly_released_evidence;
  end if;

  select count(*)
  into missing_reviewed_claims
  from reviewed_context_claims r
  where not exists (
    select 1
    from public.profile_claims c
    where c.id = r.id
  );
  if missing_reviewed_claims <> 0 then
    raise exception 'reviewed context claims must exist, got % missing', missing_reviewed_claims;
  end if;
end $$;

rollback;
