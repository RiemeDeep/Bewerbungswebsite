insert into public.profile_entities (
  id,
  entity_type,
  canonical_name,
  slug,
  summary,
  visibility,
  publication_status
)
values (
  '00000000-0000-4000-8000-000000000001',
  'synthetic_person',
  'Alex Beispiel',
  'alex-beispiel',
  'Klar synthetische Person fuer lokale RLS- und Retrieval-Tests.',
  'internal',
  'published'
);

insert into public.source_documents (
  id,
  title,
  document_type,
  storage_path,
  visibility,
  publication_status,
  ingestion_status,
  version
)
values (
  '00000000-0000-4000-8000-000000000101',
  'Synthetischer Arbeitsnachweis ohne Datei',
  'synthetic_note',
  null,
  'internal',
  'published',
  'metadata_only',
  1
);

insert into public.profile_claims (
  id,
  entity_id,
  claim_type,
  statement,
  confidence,
  visibility,
  publication_status,
  allowed_contexts,
  reviewed_at,
  withdrawn_at
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000001',
    'capability',
    'Die fiktive Person dokumentierte und verbesserte einen technischen Wartungsprozess.',
    'verified',
    'internal',
    'published',
    array['profile_assistant']::public.profile_usage_context[],
    '2026-07-28T00:00:00Z',
    null
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '00000000-0000-4000-8000-000000000001',
    'capability',
    'Dieser synthetische Entwurf darf nicht in Antworten gelangen.',
    'uncertain',
    'internal',
    'draft',
    array['profile_assistant']::public.profile_usage_context[],
    null,
    null
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '00000000-0000-4000-8000-000000000001',
    'capability',
    'Dieser synthetische Claim ist nur fuer eine Stellenanalyse vorgesehen.',
    'supported',
    'internal',
    'published',
    array['job_analysis']::public.profile_usage_context[],
    '2026-07-28T00:00:00Z',
    null
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '00000000-0000-4000-8000-000000000001',
    'capability',
    'Dieser synthetische Claim besitzt nur einen privaten Beleg.',
    'supported',
    'internal',
    'published',
    array['profile_assistant']::public.profile_usage_context[],
    '2026-07-28T00:00:00Z',
    null
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    '00000000-0000-4000-8000-000000000001',
    'capability',
    'Dieser synthetische Claim wurde zurueckgezogen.',
    'supported',
    'internal',
    'withdrawn',
    array['profile_assistant']::public.profile_usage_context[],
    null,
    '2026-07-28T00:00:00Z'
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    '00000000-0000-4000-8000-000000000001',
    'capability',
    'Dieser synthetische Claim ist privat.',
    'supported',
    'private',
    'published',
    array['profile_assistant']::public.profile_usage_context[],
    '2026-07-28T00:00:00Z',
    null
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    '00000000-0000-4000-8000-000000000001',
    'capability',
    'Dieser synthetische Claim hat nur einen Evidence-Entwurf.',
    'supported',
    'internal',
    'published',
    array['profile_assistant']::public.profile_usage_context[],
    '2026-07-28T00:00:00Z',
    null
  ),
  (
    '88888888-8888-4888-8888-888888888888',
    '00000000-0000-4000-8000-000000000001',
    'capability',
    'Dieser synthetische Claim hat Evidence fuer einen anderen Nutzungskontext.',
    'supported',
    'internal',
    'published',
    array['profile_assistant']::public.profile_usage_context[],
    '2026-07-28T00:00:00Z',
    null
  ),
  (
    '99999999-9999-4999-8999-999999999998',
    '00000000-0000-4000-8000-000000000001',
    'capability',
    'Dieser synthetische Claim hat nur interne Evidence.',
    'supported',
    'internal',
    'published',
    array['profile_assistant']::public.profile_usage_context[],
    '2026-07-28T00:00:00Z',
    null
  );

insert into public.evidence_items (
  id,
  claim_id,
  source_document_id,
  source_locator,
  public_label,
  public_excerpt,
  evidence_strength,
  visibility,
  publication_status,
  allowed_contexts
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000101',
    'synthetic:section:1',
    'Synthetischer Arbeitsnachweis',
    'Belegt die dokumentierte Verbesserung des fiktiven Wartungsprozesses.',
    'direct',
    'public_excerpt',
    'published',
    array['profile_assistant']::public.profile_usage_context[]
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    '00000000-0000-4000-8000-000000000101',
    'synthetic:section:2',
    'Nicht freigegebener Entwurf',
    'Darf wegen des Claim-Status nicht verwendet werden.',
    'weak',
    'public_excerpt',
    'published',
    array['profile_assistant']::public.profile_usage_context[]
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '33333333-3333-4333-8333-333333333333',
    '00000000-0000-4000-8000-000000000101',
    'synthetic:section:3',
    'Evidence fuer anderen Kontext',
    'Darf nur in einer synthetischen Stellenanalyse verwendet werden.',
    'supporting',
    'public_excerpt',
    'published',
    array['job_analysis']::public.profile_usage_context[]
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '44444444-4444-4444-8444-444444444444',
    '00000000-0000-4000-8000-000000000101',
    'synthetic:section:4',
    'Privater synthetischer Beleg',
    null,
    'supporting',
    'private',
    'published',
    array['profile_assistant']::public.profile_usage_context[]
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    '55555555-5555-4555-8555-555555555555',
    '00000000-0000-4000-8000-000000000101',
    'synthetic:section:5',
    'Beleg zu zurueckgezogenem Claim',
    'Darf wegen des Claim-Status nicht verwendet werden.',
    'supporting',
    'public_excerpt',
    'published',
    array['profile_assistant']::public.profile_usage_context[]
  ),
  (
    'ffffffff-ffff-4fff-8fff-fffffffffff1',
    '66666666-6666-4666-8666-666666666666',
    '00000000-0000-4000-8000-000000000101',
    'synthetic:section:6',
    'Beleg zu privatem Claim',
    'Darf wegen der Claim-Sichtbarkeit nicht verwendet werden.',
    'supporting',
    'public_excerpt',
    'published',
    array['profile_assistant']::public.profile_usage_context[]
  ),
  (
    'ffffffff-ffff-4fff-8fff-fffffffffff2',
    '77777777-7777-4777-8777-777777777777',
    '00000000-0000-4000-8000-000000000101',
    'synthetic:section:7',
    'Nicht veroeffentlichter synthetischer Beleg',
    'Darf wegen des Evidence-Status nicht verwendet werden.',
    'weak',
    'public_excerpt',
    'draft',
    array['profile_assistant']::public.profile_usage_context[]
  ),
  (
    'ffffffff-ffff-4fff-8fff-fffffffffff3',
    '88888888-8888-4888-8888-888888888888',
    '00000000-0000-4000-8000-000000000101',
    'synthetic:section:8',
    'Evidence fuer anderen Nutzungskontext',
    'Darf im Profilassistenten nicht verwendet werden.',
    'supporting',
    'public_excerpt',
    'published',
    array['job_analysis']::public.profile_usage_context[]
  ),
  (
    'ffffffff-ffff-4fff-8fff-fffffffffff4',
    '99999999-9999-4999-8999-999999999998',
    '00000000-0000-4000-8000-000000000101',
    'synthetic:section:9',
    'Interner synthetischer Beleg',
    null,
    'supporting',
    'internal',
    'published',
    array['profile_assistant']::public.profile_usage_context[]
  );

insert into public.document_chunks (
  id,
  source_document_id,
  chunk_index,
  content,
  token_count,
  metadata,
  publication_status
)
values (
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000101',
  0,
  'Synthetischer Chunk fuer lokale Negativtests. Kein echter Profilinhalt.',
  10,
  '{"synthetic": true, "stage": "technical-feasibility-stage-2"}'::jsonb,
  'published'
);
