do $$
begin
  if exists (select 1 from public.profile_claims)
    or exists (select 1 from public.evidence_items) then
    raise exception 'profile provenance migration requires empty profile_claims and evidence_items tables';
  end if;
end $$;

create type public.profile_subject_review_status as enum (
  'unreviewed',
  'subject_verified',
  'subject_disputed'
);

create type public.profile_evidence_basis as enum (
  'direct_document',
  'documented_plan',
  'subject_attestation',
  'supporting_document',
  'uncertain'
);

alter table public.profile_claims
add column subject_review_status public.profile_subject_review_status not null default 'unreviewed';

alter table public.profile_claims
drop column confidence;

drop type public.profile_claim_confidence;

alter table public.profile_claims
add constraint profile_claims_published_subject_verified_check
check (publication_status <> 'published' or subject_review_status = 'subject_verified');

alter table public.evidence_items
add column evidence_basis public.profile_evidence_basis not null default 'uncertain';

alter table public.evidence_items
add constraint evidence_items_published_basis_check
check (publication_status <> 'published' or evidence_basis <> 'uncertain');

create index profile_claims_review_status_idx
on public.profile_claims (subject_review_status, publication_status);

create index evidence_items_basis_idx
on public.evidence_items (evidence_basis, publication_status);

comment on column public.profile_claims.subject_review_status is
  'Records Michael''s factual review separately from publication and evidence provenance.';

comment on column public.evidence_items.evidence_basis is
  'Describes whether evidence is an independent document, documented plan, subject attestation, supporting document or unresolved.';
