-- Optional hook line shown on the quiz intro and used as the link
-- description. Null keeps the standard "Which character" line.

alter table public.quizzes
  add column if not exists intro_text text;
