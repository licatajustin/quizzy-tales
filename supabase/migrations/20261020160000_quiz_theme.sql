-- Per-quiz public design. An empty object keeps today's quiz look.
-- Readers see a saved theme after the author updates the live quiz.
--
-- Shape (every key optional):
--   accent:            #rrggbb
--   background:        light | dark | parchment | night | custom
--   background_color:  #rrggbb, used when background is custom
--   font:              default | serif | story | modern
--   corners:           rounded | sharp
--   logo_url:          http(s) image URL, 1–2000 characters

alter table public.quizzes
  add column if not exists theme jsonb not null default '{}'::jsonb;

alter table public.quizzes
  drop constraint if exists quizzes_theme_shape;

alter table public.quizzes
  add constraint quizzes_theme_shape
  check (
    jsonb_typeof(theme) = 'object'
    and (
      theme
      - 'accent'
      - 'background'
      - 'background_color'
      - 'font'
      - 'corners'
      - 'logo_url'
    ) = '{}'::jsonb
    and (
      not (theme ? 'accent')
      or (
        jsonb_typeof(theme -> 'accent') = 'string'
        and (theme ->> 'accent') ~ '^#[0-9A-Fa-f]{6}$'
      )
    )
    and (
      not (theme ? 'background')
      or (theme ->> 'background') in (
        'light',
        'dark',
        'parchment',
        'night',
        'custom'
      )
    )
    and (
      not (theme ? 'background_color')
      or (
        jsonb_typeof(theme -> 'background_color') = 'string'
        and (theme ->> 'background_color') ~ '^#[0-9A-Fa-f]{6}$'
      )
    )
    and (
      not (theme ? 'font')
      or (theme ->> 'font') in ('default', 'serif', 'story', 'modern')
    )
    and (
      not (theme ? 'corners')
      or (theme ->> 'corners') in ('rounded', 'sharp')
    )
    and (
      not (theme ? 'logo_url')
      or (
        jsonb_typeof(theme -> 'logo_url') = 'string'
        and char_length(theme ->> 'logo_url') between 1 and 2000
        and (theme ->> 'logo_url') ~ '^https?://[^[:space:]]+$'
      )
    )
  );
