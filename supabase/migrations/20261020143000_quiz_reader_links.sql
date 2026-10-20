-- Optional reader links for the public result screen.
-- The app accepts only http and https URLs; empty values stay null.

alter table public.quizzes
  add column if not exists book_url text;

alter table public.quizzes
  add column if not exists newsletter_url text;
