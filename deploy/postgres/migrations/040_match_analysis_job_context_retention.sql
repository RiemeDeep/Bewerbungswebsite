alter table public.match_analyses
  add constraint match_analyses_job_context_without_source_sections
  check (
    case
      when job_context ? 'sourceSections'
        and jsonb_typeof(job_context -> 'sourceSections') = 'array'
      then jsonb_array_length(job_context -> 'sourceSections') = 0
      else false
    end
  ) not valid;

update public.match_analyses
set job_context = jsonb_set(job_context, '{sourceSections}', '[]'::jsonb, true)
where case
  when job_context ? 'sourceSections'
    and jsonb_typeof(job_context -> 'sourceSections') = 'array'
  then jsonb_array_length(job_context -> 'sourceSections') > 0
  else true
end;

alter table public.match_analyses
  validate constraint match_analyses_job_context_without_source_sections;

comment on column public.match_analyses.job_context is
  'Validated, normalized JobContext without sourceSections. Raw crawl text, pasted text and source excerpts are not persisted.';
