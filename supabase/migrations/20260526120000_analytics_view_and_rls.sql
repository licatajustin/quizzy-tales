-- Extend quiz event types and allow authors to read their analytics.

alter table public.quiz_events
  drop constraint if exists quiz_events_event_type_check;

alter table public.quiz_events
  add constraint quiz_events_event_type_check
  check (event_type in ('view', 'start', 'complete', 'share', 'cta_click'));

create policy "quiz_events_select_own"
on public.quiz_events for select
to authenticated
using (
  exists (
    select 1
    from public.quizzes q
    where q.id = quiz_id
      and q.author_id = (select auth.uid())
  )
);

create policy "reader_sessions_select_own"
on public.reader_sessions for select
to authenticated
using (
  exists (
    select 1
    from public.quizzes q
    where q.id = quiz_id
      and q.author_id = (select auth.uid())
  )
);

create policy "reader_answers_select_own"
on public.reader_answers for select
to authenticated
using (
  exists (
    select 1
    from public.reader_sessions rs
    join public.quizzes q on q.id = rs.quiz_id
    where rs.id = session_id
      and q.author_id = (select auth.uid())
  )
);
