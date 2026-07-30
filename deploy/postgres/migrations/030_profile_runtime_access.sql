revoke all on table public.profile_entities from bewerbungswebsite_app;
revoke all on table public.source_documents from bewerbungswebsite_app;
revoke all on table public.profile_claims from bewerbungswebsite_app;
revoke all on table public.evidence_items from bewerbungswebsite_app;
revoke all on table public.document_chunks from bewerbungswebsite_app;

grant usage on type public.profile_visibility to bewerbungswebsite_app;
grant usage on type public.profile_publication_status to bewerbungswebsite_app;
grant usage on type public.profile_usage_context to bewerbungswebsite_app;
grant usage on type public.profile_claim_type to bewerbungswebsite_app;
grant usage on type public.profile_evidence_strength to bewerbungswebsite_app;
grant usage on type public.profile_subject_review_status to bewerbungswebsite_app;
grant usage on type public.profile_evidence_basis to bewerbungswebsite_app;

grant select (
  id,
  entity_type,
  canonical_name,
  slug,
  summary,
  visibility,
  publication_status
) on public.profile_entities to bewerbungswebsite_app;

grant select (
  id,
  document_type,
  publication_status
) on public.source_documents to bewerbungswebsite_app;

grant select (
  id,
  entity_id,
  claim_type,
  statement,
  valid_from,
  valid_to,
  subject_review_status,
  visibility,
  publication_status,
  allowed_contexts,
  reviewed_at
) on public.profile_claims to bewerbungswebsite_app;

grant select (
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
) on public.evidence_items to bewerbungswebsite_app;

create policy profile_entities_server_read
on public.profile_entities
for select
to bewerbungswebsite_app
using (publication_status = 'published' and visibility <> 'private');

create policy source_documents_server_metadata_read
on public.source_documents
for select
to bewerbungswebsite_app
using (publication_status = 'published');

create policy profile_claims_server_read
on public.profile_claims
for select
to bewerbungswebsite_app
using (
  publication_status = 'published'
  and visibility <> 'private'
  and subject_review_status = 'subject_verified'
  and exists (
    select 1
    from public.profile_entities pe
    where pe.id = profile_claims.entity_id
  )
);

create policy evidence_items_server_read
on public.evidence_items
for select
to bewerbungswebsite_app
using (
  publication_status = 'published'
  and visibility in ('public_excerpt', 'public')
  and evidence_basis <> 'uncertain'
  and exists (
    select 1
    from public.profile_claims c
    where c.id = evidence_items.claim_id
  )
  and exists (
    select 1
    from public.source_documents sd
    where sd.id = evidence_items.source_document_id
  )
);
