grant select, insert, update, delete on table public.match_analyses to bewerbungswebsite_app;

create policy match_analyses_server_access
on public.match_analyses
for all
to bewerbungswebsite_app
using (true)
with check (true);
