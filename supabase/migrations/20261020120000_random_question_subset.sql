-- Optional per-quiz random subset. Off by default so existing quizzes
-- keep showing every question.

alter table public.quizzes
  add column if not exists random_question_subset boolean not null default false;

alter table public.quizzes
  add column if not exists questions_per_attempt integer;

alter table public.quizzes
  drop constraint if exists quizzes_questions_per_attempt_positive;

alter table public.quizzes
  add constraint quizzes_questions_per_attempt_positive
  check (questions_per_attempt is null or questions_per_attempt >= 1);
