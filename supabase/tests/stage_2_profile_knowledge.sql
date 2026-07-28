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
end $$;

do $$
declare
  eligible_claims integer;
begin
  select count(distinct c.id)
  into eligible_claims
  from public.profile_claims c
  join public.evidence_items e on e.claim_id = c.id
  where c.publication_status = 'published'
    and c.visibility <> 'private'
    and 'profile_assistant' = any(c.allowed_contexts)
    and e.publication_status = 'published'
    and e.visibility in ('public_excerpt', 'public')
    and 'profile_assistant' = any(e.allowed_contexts);

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
    confidence,
    publication_status,
    allowed_contexts
  )
  values (
    '00000000-0000-4000-8000-000000009001',
    '00000000-0000-4000-8000-000000000001',
    'capability',
    'Dieser synthetische Claim verletzt die Published-Review-Invariante.',
    'verified',
    'published',
    array['profile_assistant']::public.profile_usage_context[]
  );

  raise exception 'published claims without reviewed_at must be rejected';
exception
  when check_violation then
    null;
end $$;

rollback;
