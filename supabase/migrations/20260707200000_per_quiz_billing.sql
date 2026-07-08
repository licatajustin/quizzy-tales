-- Per-quiz billing: subscription quantity, grace period, AI trial + usage tracking.

alter table public.authors
  add column if not exists subscription_quantity integer not null default 0,
  add column if not exists subscription_grace_ends_at timestamptz,
  add column if not exists ai_trial_generate_used boolean not null default false,
  add column if not exists ai_trial_builder_messages integer not null default 0;

create table if not exists public.ai_usage (
  author_id uuid not null references public.authors (id) on delete cascade,
  usage_month text not null,
  text_requests integer not null default 0,
  image_requests integer not null default 0,
  primary key (author_id, usage_month)
);

alter table public.ai_usage enable row level security;

create policy "ai_usage_select_own"
on public.ai_usage for select
to authenticated
using (author_id = (select auth.uid()));

create policy "ai_usage_insert_own"
on public.ai_usage for insert
to authenticated
with check (author_id = (select auth.uid()));

create policy "ai_usage_update_own"
on public.ai_usage for update
to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));
