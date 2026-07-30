create extension if not exists vector;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'bewerbungswebsite_app') then
    create role bewerbungswebsite_app nologin noinherit;
  end if;
end $$;

alter role bewerbungswebsite_app login password :'app_password';

revoke all on database bewerbungswebsite from public;
grant connect on database bewerbungswebsite to bewerbungswebsite_app;

revoke create on schema public from public;
grant usage on schema public to bewerbungswebsite_app;
