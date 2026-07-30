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
    '00000000-0000-4000-8000-000000009100',
    'synthetic_project',
    'Synthetisches Runtime-Projekt',
    'internal',
    'published'
  ),
  (
    '00000000-0000-4000-8000-000000009102',
    'synthetic_private_project',
    'Privates synthetisches Runtime-Projekt',
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
    '00000000-0000-4000-8000-000000009101',
    'Privater synthetischer Quelltitel',
    'synthetic_subject_attestation',
    'private/synthetic-source.pdf',
    'private',
    'published',
    'metadata_only'
  ),
  (
    '00000000-0000-4000-8000-000000009103',
    'Zurueckgezogener synthetischer Quelltitel',
    'synthetic_withdrawn_source',
    'private/synthetic-withdrawn-source.pdf',
    'private',
    'withdrawn',
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
  reviewed_at
)
values
  (
    '00000000-0000-4000-8000-000000009110',
    '00000000-0000-4000-8000-000000009100',
    'project_fact',
    'Die synthetische Person bestaetigt einen freigegebenen Projektfakt.',
    'subject_verified',
    'internal',
    'published',
    array['job_analysis']::public.profile_usage_context[],
    '2026-07-30T00:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000009111',
    '00000000-0000-4000-8000-000000009100',
    'project_fact',
    'Dieser synthetische Entwurf darf nicht sichtbar sein.',
    'unreviewed',
    'internal',
    'in_review',
    array['job_analysis']::public.profile_usage_context[],
    null
  ),
  (
    '00000000-0000-4000-8000-000000009112',
    '00000000-0000-4000-8000-000000009100',
    'project_fact',
    'Dieser synthetische private Claim darf nicht sichtbar sein.',
    'subject_verified',
    'private',
    'published',
    array['job_analysis']::public.profile_usage_context[],
    '2026-07-30T00:00:00Z'
  ),
  (
    '00000000-0000-4000-8000-000000009113',
    '00000000-0000-4000-8000-000000009102',
    'project_fact',
    'Dieser Claim gehoert zu einer privaten Entitaet und darf nicht sichtbar sein.',
    'subject_verified',
    'internal',
    'published',
    array['job_analysis']::public.profile_usage_context[],
    '2026-07-30T00:00:00Z'
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
    '00000000-0000-4000-8000-000000009120',
    '00000000-0000-4000-8000-000000009110',
    '00000000-0000-4000-8000-000000009101',
    'Synthetische persoenliche Bestaetigung',
    'Freigegebener synthetischer Auszug.',
    'direct',
    'subject_attestation',
    'public_excerpt',
    'published',
    array['job_analysis']::public.profile_usage_context[]
  ),
  (
    '00000000-0000-4000-8000-000000009121',
    '00000000-0000-4000-8000-000000009112',
    '00000000-0000-4000-8000-000000009101',
    'Evidence fuer privaten Claim',
    'Dieser Auszug darf wegen des privaten Claims nicht sichtbar sein.',
    'direct',
    'subject_attestation',
    'public_excerpt',
    'published',
    array['job_analysis']::public.profile_usage_context[]
  ),
  (
    '00000000-0000-4000-8000-000000009122',
    '00000000-0000-4000-8000-000000009113',
    '00000000-0000-4000-8000-000000009101',
    'Evidence fuer private Entitaet',
    'Dieser Auszug darf wegen der privaten Entitaet nicht sichtbar sein.',
    'direct',
    'subject_attestation',
    'public_excerpt',
    'published',
    array['job_analysis']::public.profile_usage_context[]
  ),
  (
    '00000000-0000-4000-8000-000000009123',
    '00000000-0000-4000-8000-000000009110',
    '00000000-0000-4000-8000-000000009103',
    'Evidence fuer zurueckgezogene Source',
    'Dieser Auszug darf wegen der zurueckgezogenen Source nicht sichtbar sein.',
    'direct',
    'direct_document',
    'public_excerpt',
    'published',
    array['job_analysis']::public.profile_usage_context[]
  );

do $$
begin
  if exists (
    select 1
    from unnest(array[
      'profile_entities',
      'source_documents',
      'profile_claims',
      'evidence_items',
      'document_chunks'
    ]) as runtime_table(table_name)
    where has_table_privilege(
      'bewerbungswebsite_app',
      'public.' || runtime_table.table_name,
      'insert'
    )
      or has_table_privilege(
        'bewerbungswebsite_app',
        'public.' || runtime_table.table_name,
        'update'
      )
      or has_table_privilege(
        'bewerbungswebsite_app',
        'public.' || runtime_table.table_name,
        'delete'
      )
      or has_table_privilege(
        'bewerbungswebsite_app',
        'public.' || runtime_table.table_name,
        'truncate'
      )
      or has_any_column_privilege(
        'bewerbungswebsite_app',
        'public.' || runtime_table.table_name,
        'insert'
      )
      or has_any_column_privilege(
        'bewerbungswebsite_app',
        'public.' || runtime_table.table_name,
        'update'
      )
  ) then
    raise exception 'runtime role must not write profile tables';
  end if;

  if has_table_privilege('bewerbungswebsite_app', 'public.document_chunks', 'select')
    or has_any_column_privilege(
      'bewerbungswebsite_app',
      'public.document_chunks',
      'select'
    ) then
    raise exception 'runtime role must not read document_chunks';
  end if;

  if has_column_privilege(
    'bewerbungswebsite_app',
    'public.source_documents',
    'storage_path',
    'select'
  ) then
    raise exception 'runtime role must not read private storage paths';
  end if;

  if has_column_privilege(
    'bewerbungswebsite_app',
    'public.source_documents',
    'title',
    'select'
  ) then
    raise exception 'runtime role must not read private source titles';
  end if;
end $$;

set local role bewerbungswebsite_app;

do $$
declare
  visible_entities integer;
  visible_claims integer;
  visible_evidence integer;
begin
  select count(*)
  into visible_entities
  from public.profile_entities
  where id in (
    '00000000-0000-4000-8000-000000009100',
    '00000000-0000-4000-8000-000000009102'
  );
  if visible_entities <> 1 then
    raise exception 'runtime role should see exactly one eligible entity, got %', visible_entities;
  end if;

  select count(*)
  into visible_claims
  from public.profile_claims
  where id in (
    '00000000-0000-4000-8000-000000009110',
    '00000000-0000-4000-8000-000000009111',
    '00000000-0000-4000-8000-000000009112',
    '00000000-0000-4000-8000-000000009113'
  );
  if visible_claims <> 1 then
    raise exception 'runtime role should see exactly one eligible claim, got %', visible_claims;
  end if;

  select count(*)
  into visible_evidence
  from public.evidence_items
  where id in (
    '00000000-0000-4000-8000-000000009120',
    '00000000-0000-4000-8000-000000009121',
    '00000000-0000-4000-8000-000000009122',
    '00000000-0000-4000-8000-000000009123'
  );
  if visible_evidence <> 1 then
    raise exception 'runtime role should see exactly one eligible evidence item, got %', visible_evidence;
  end if;
end $$;

reset role;

rollback;
