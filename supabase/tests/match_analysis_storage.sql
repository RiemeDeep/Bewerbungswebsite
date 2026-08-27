begin;

do $$
begin
  if has_table_privilege('anon', 'public.match_analyses', 'select') then
    raise exception 'anon must not have direct select privileges on match_analyses';
  end if;

  if has_table_privilege('authenticated', 'public.match_analyses', 'select') then
    raise exception 'authenticated must not have direct select privileges on match_analyses';
  end if;

  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'match_analyses'
      and c.relrowsecurity
  ) then
    raise exception 'row level security must be active on match_analyses';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'match_analyses'
      and column_name in ('access_token', 'access_path')
  ) then
    raise exception 'match_analyses must not persist cleartext access tokens or access paths';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'match_analyses'
      and column_name = 'access_token_hash'
  ) then
    raise exception 'match_analyses must persist an access_token_hash';
  end if;
end $$;

insert into public.match_analyses (
  id,
  access_token_hash,
  job_context,
  match_analysis,
  created_at,
  expires_at
)
values (
  '00000000-0000-4000-8000-00000000a001',
  repeat('a', 64),
  '{"synthetic":true,"sourceSections":[]}'::jsonb,
  '{"synthetic":true}'::jsonb,
  '2026-07-28T12:00:00.000Z',
  '2026-07-31T12:00:00.000Z'
);

do $$
begin
  insert into public.match_analyses (
    id,
    access_token_hash,
    job_context,
    match_analysis,
    created_at,
    expires_at
  )
  values (
    '00000000-0000-4000-8000-00000000a002',
    'cleartext-token-must-not-be-stored',
    '{"synthetic":true,"sourceSections":[]}'::jsonb,
    '{"synthetic":true,"sourceSections":[]}'::jsonb,
    '2026-07-28T12:00:00.000Z',
    '2026-07-31T12:00:00.000Z'
  );

  raise exception 'invalid token hashes must be rejected';
exception
  when check_violation then
    null;
end $$;

do $$
begin
  insert into public.match_analyses (
    id,
    access_token_hash,
    job_context,
    match_analysis,
    created_at,
    expires_at
  )
  values (
    '00000000-0000-4000-8000-00000000a003',
    repeat('b', 64),
    '{"synthetic":true}'::jsonb,
    '{"synthetic":true}'::jsonb,
    '2026-07-31T12:00:00.000Z',
    '2026-07-28T12:00:00.000Z'
  );

  raise exception 'expires_at before created_at must be rejected';
exception
  when check_violation then
    null;
end $$;

do $$
begin
  insert into public.match_analyses (
    id,
    access_token_hash,
    job_context,
    match_analysis,
    created_at,
    expires_at
  )
  values (
    '00000000-0000-4000-8000-00000000a004',
    repeat('c', 64),
    '{"synthetic":true,"sourceSections":[{"label":"raw","excerpt":"must not persist"}]}'::jsonb,
    '{"synthetic":true}'::jsonb,
    '2026-07-28T12:00:00.000Z',
    '2026-07-31T12:00:00.000Z'
  );

  raise exception 'persisted job context source excerpts must be rejected';
exception
  when check_violation then
    null;
end $$;

do $$
begin
  insert into public.match_analyses (
    id,
    access_token_hash,
    job_context,
    match_analysis,
    created_at,
    expires_at
  )
  values (
    '00000000-0000-4000-8000-00000000a005',
    repeat('d', 64),
    '{"synthetic":true,"sourceSections":{"unexpected":"object"}}'::jsonb,
    '{"synthetic":true}'::jsonb,
    '2026-07-28T12:00:00.000Z',
    '2026-07-31T12:00:00.000Z'
  );

  raise exception 'non-array sourceSections must be rejected safely';
exception
  when check_violation then
    null;
end $$;

rollback;
