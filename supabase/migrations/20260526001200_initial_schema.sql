-- QuizzyTales initial schema

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table public.authors (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  stripe_customer_id text,
  subscription_id text,
  subscription_status text not null default 'inactive'
    check (subscription_status in ('active', 'inactive', 'past_due', 'canceled', 'trialing')),
  subscription_end_date timestamptz,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors (id) on delete cascade,
  slug text not null,
  book_title text not null,
  quiz_title text not null,
  cover_image_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  published_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (author_id, slug)
);

create index quizzes_author_id_idx on public.quizzes (author_id);
create index quizzes_status_idx on public.quizzes (status);

create or replace function public.is_quiz_owner(target_quiz_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.quizzes q
    where q.id = target_quiz_id
      and q.author_id = (select auth.uid())
  );
$$;

create or replace function public.is_published_quiz(target_quiz_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.quizzes q
    where q.id = target_quiz_id
      and q.status = 'published'
  );
$$;

create table public.outcomes (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  name text not null,
  description text not null default '',
  image_url text,
  sort_order integer not null default 0
);

create index outcomes_quiz_id_idx on public.outcomes (quiz_id);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  question_text text not null,
  allow_multiple boolean not null default false,
  sort_order integer not null default 0
);

create index questions_quiz_id_idx on public.questions (quiz_id);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  answer_text text not null,
  weights jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0
);

create index answers_question_id_idx on public.answers (question_id);

-- ---------------------------------------------------------------------------
-- Analytics tables
-- ---------------------------------------------------------------------------

create table public.quiz_events (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  event_type text not null
    check (event_type in ('start', 'complete', 'share', 'cta_click')),
  outcome_id uuid references public.outcomes (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index quiz_events_quiz_id_idx on public.quiz_events (quiz_id);
create index quiz_events_created_at_idx on public.quiz_events (created_at desc);

create table public.reader_sessions (
  id uuid primary key,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  anonymous_id text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  result_id text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device_type text
);

create index reader_sessions_quiz_id_idx on public.reader_sessions (quiz_id);

create table public.reader_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.reader_sessions (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  answer_id uuid not null references public.answers (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index reader_answers_session_id_idx on public.reader_answers (session_id);

create table public.quiz_ai_messages (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  user_id uuid not null references public.authors (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  message text not null,
  structured_patch jsonb,
  created_at timestamptz not null default now()
);

create index quiz_ai_messages_quiz_id_idx on public.quiz_ai_messages (quiz_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger authors_set_updated_at
before update on public.authors
for each row execute function public.set_updated_at();

create trigger quizzes_set_updated_at
before update on public.quizzes
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Author bootstrap on signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author_name text;
begin
  author_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.authors (id, display_name)
  values (new.id, author_name);

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to service_role;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.authors enable row level security;
alter table public.quizzes enable row level security;
alter table public.outcomes enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.quiz_events enable row level security;
alter table public.reader_sessions enable row level security;
alter table public.reader_answers enable row level security;
alter table public.quiz_ai_messages enable row level security;

-- authors
create policy "authors_select_own"
on public.authors for select
to authenticated
using ((select auth.uid()) = id);

create policy "authors_update_own"
on public.authors for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- quizzes
create policy "quizzes_select_own"
on public.quizzes for select
to authenticated
using ((select auth.uid()) = author_id);

create policy "quizzes_select_published"
on public.quizzes for select
to anon, authenticated
using (status = 'published');

create policy "quizzes_insert_own"
on public.quizzes for insert
to authenticated
with check ((select auth.uid()) = author_id);

create policy "quizzes_update_own"
on public.quizzes for update
to authenticated
using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

create policy "quizzes_delete_own"
on public.quizzes for delete
to authenticated
using ((select auth.uid()) = author_id);

-- outcomes
create policy "outcomes_select_own"
on public.outcomes for select
to authenticated
using (public.is_quiz_owner(quiz_id));

create policy "outcomes_select_published"
on public.outcomes for select
to anon, authenticated
using (public.is_published_quiz(quiz_id));

create policy "outcomes_insert_own"
on public.outcomes for insert
to authenticated
with check (public.is_quiz_owner(quiz_id));

create policy "outcomes_update_own"
on public.outcomes for update
to authenticated
using (public.is_quiz_owner(quiz_id))
with check (public.is_quiz_owner(quiz_id));

create policy "outcomes_delete_own"
on public.outcomes for delete
to authenticated
using (public.is_quiz_owner(quiz_id));

-- questions
create policy "questions_select_own"
on public.questions for select
to authenticated
using (public.is_quiz_owner(quiz_id));

create policy "questions_select_published"
on public.questions for select
to anon, authenticated
using (public.is_published_quiz(quiz_id));

create policy "questions_insert_own"
on public.questions for insert
to authenticated
with check (public.is_quiz_owner(quiz_id));

create policy "questions_update_own"
on public.questions for update
to authenticated
using (public.is_quiz_owner(quiz_id))
with check (public.is_quiz_owner(quiz_id));

create policy "questions_delete_own"
on public.questions for delete
to authenticated
using (public.is_quiz_owner(quiz_id));

-- answers
create policy "answers_select_own"
on public.answers for select
to authenticated
using (
  exists (
    select 1
    from public.questions q
    where q.id = question_id
      and public.is_quiz_owner(q.quiz_id)
  )
);

create policy "answers_select_published"
on public.answers for select
to anon, authenticated
using (
  exists (
    select 1
    from public.questions q
    where q.id = question_id
      and public.is_published_quiz(q.quiz_id)
  )
);

create policy "answers_insert_own"
on public.answers for insert
to authenticated
with check (
  exists (
    select 1
    from public.questions q
    where q.id = question_id
      and public.is_quiz_owner(q.quiz_id)
  )
);

create policy "answers_update_own"
on public.answers for update
to authenticated
using (
  exists (
    select 1
    from public.questions q
    where q.id = question_id
      and public.is_quiz_owner(q.quiz_id)
  )
)
with check (
  exists (
    select 1
    from public.questions q
    where q.id = question_id
      and public.is_quiz_owner(q.quiz_id)
  )
);

create policy "answers_delete_own"
on public.answers for delete
to authenticated
using (
  exists (
    select 1
    from public.questions q
    where q.id = question_id
      and public.is_quiz_owner(q.quiz_id)
  )
);

-- quiz_ai_messages
create policy "quiz_ai_messages_select_own"
on public.quiz_ai_messages for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "quiz_ai_messages_insert_own"
on public.quiz_ai_messages for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- analytics: no direct client access; service role via API routes
-- (tables remain locked down by default with RLS enabled and no policies)

-- ---------------------------------------------------------------------------
-- Storage: outcome-images bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'outcome-images',
  'outcome-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "outcome_images_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'outcome-images');

create policy "outcome_images_author_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'outcome-images'
  and (storage.foldername(name))[1] = 'authors'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
);

create policy "outcome_images_author_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'outcome-images'
  and (storage.foldername(name))[1] = 'authors'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
)
with check (
  bucket_id = 'outcome-images'
  and (storage.foldername(name))[1] = 'authors'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
);

create policy "outcome_images_author_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'outcome-images'
  and (storage.foldername(name))[1] = 'authors'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
);
