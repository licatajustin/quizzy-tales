-- Rich result profiles. tagline is the short epithet under the name.
-- details is an ordered list of sections:
--   { "label": text, "kind": "text" | "bullets" | "chips", "value": text | text[] }
-- Existing rows stay valid: empty tagline and an empty section list.

alter table public.outcomes
  add column if not exists tagline text not null default '';

alter table public.outcomes
  add column if not exists details jsonb not null default '[]'::jsonb;

alter table public.outcomes
  drop constraint if exists outcomes_details_is_array;

alter table public.outcomes
  add constraint outcomes_details_is_array
  check (jsonb_typeof(details) = 'array');
