# QuizzyTales — Full Product & Technical Specification

Use this document to rebuild **QuizzyTales** from scratch. It describes what the product is, who it serves, how it behaves, and how it is implemented in the current codebase.

---

## 1. Executive Summary

**QuizzyTales** is a SaaS platform for authors and storytellers to create, edit, publish, and share **"Which character are you?"** personality quizzes tied to their books.

Authors work in a dashboard: draft outcomes, write questions and answers, tune weighted scoring, preview results, and publish shareable quizzes at public URLs. Readers take quizzes anonymously; authors see analytics on starts, completions, shares, and outcome distribution.

**Core value proposition:** Turn readers into superfans through viral, book-themed personality quizzes — without needing to understand quiz mechanics.

**Business model:** Freemium with Stripe subscriptions. Free tier is limited; paid tier unlocks AI generation, publishing, and unlimited quizzes.

---

## 2. Target Users


| Persona                  | Goal                                                                           |
| ------------------------ | ------------------------------------------------------------------------------ |
| **Author / storyteller** | Create a polished quiz from book synopsis → publish → share → track engagement |
| **Reader (anonymous)**   | Take quiz at `/q/[slug]`, get character result, share on social                |


Authors are the only authenticated users. Readers never sign up.

---

## 3. Product Principles (from `PRODUCT.md`)

- **Brand:** Premium, editorial, polished — literary publishing tool, not a toy quiz maker
- **Avoid:** Generic SaaS dashboards, gamified UI, spreadsheet-heavy admin, AI visual clichés
- **Design principles:**
  - Make scoring understandable before making it dense
  - Keep author in a writing flow (answers ↔ outcomes stay connected)
  - Polish in service of confidence, not ornament
  - Guided control over exposed machinery
  - Mobile-first editing, not collapsed desktop tables
- **Accessibility:** WCAG AA target; keyboard-friendly editor; color-blind safe; reduced-motion respect

---

## 4. Tech Stack


| Layer            | Choice                                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework        | **Next.js 16** (App Router, Turbopack dev)                                                                                                     |
| Language         | **TypeScript 5.7**                                                                                                                             |
| UI               | **React 19**, **Tailwind CSS 4**, **shadcn/ui** (`radix-luma` style, taupe base)                                                               |
| Icons            | **lucide-react**                                                                                                                               |
| Fonts            | **Instrument Serif** (headlines), **Inter** (body) via `next/font/google`                                                                      |
| Auth & DB        | **Supabase** (Auth, Postgres, RLS, Storage)                                                                                                    |
| Payments         | **Stripe** (embedded checkout, billing portal, webhooks)                                                                                       |
| AI               | **Vercel AI SDK** (`ai` package) with `generateText` + structured output; models: `openai/gpt-5-mini` (text), `openai/gpt-image-1` (portraits) |
| Validation       | **Zod**                                                                                                                                        |
| Toasts           | **sonner**                                                                                                                                     |
| Theming          | **next-themes** (light / dark / system)                                                                                                        |
| Analytics (prod) | **@vercel/analytics**                                                                                                                          |
| Lint/format      | **Biome**                                                                                                                                      |
| Package manager  | **pnpm**                                                                                                                                       |


---

## 5. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App                              │
├──────────────┬──────────────────────┬───────────────────────────┤
│ Marketing    │ Author Dashboard     │ Public Quiz Player        │
│ /            │ /dashboard/*         │ /q/[slug]                 │
│ /auth/*      │ (auth required)      │ (no auth)                 │
├──────────────┴──────────────────────┴───────────────────────────┤
│ API Routes: /api/generate-quiz, /api/revise-quiz,               │
│             /api/generate-outcome-portrait, /api/outcome-images,│
│             /api/track, /api/webhooks/stripe                    │
│ Server Actions: startCheckoutSession, createCustomerPortal      │
├─────────────────────────────────────────────────────────────────┤
│ Supabase: Auth + Postgres (RLS) + Storage (outcome-images)      │
│ Stripe: Subscriptions + Webhooks                                │
│ AI Gateway: OpenAI via Vercel AI SDK                            │
└─────────────────────────────────────────────────────────────────┘
```

**Draft vs. published model:**

- **Draft** lives in normalized tables: `quizzes`, `outcomes`, `questions`, `answers`
- **Published** content is frozen in `quizzes.published_snapshot` (JSONB)
- Public quiz page reads **only** the snapshot, not live draft rows
- Authors can edit draft while published; "Publish changes" updates snapshot

---

## 6. Data Model

### 6.1 Core Tables

#### `authors`

Linked 1:1 to `auth.users`.


| Column                     | Type        | Notes                                                                                                |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `id`                       | UUID PK     | FK → `auth.users(id)` ON DELETE CASCADE                                                              |
| `display_name`             | TEXT        |                                                                                                      |
| `stripe_customer_id`       | TEXT        |                                                                                                      |
| `subscription_id`          | TEXT        | Stripe subscription ID (note: some migrations also mention `stripe_subscription_id` — pick one name) |
| `subscription_status`      | TEXT        | `'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing'`                                       |
| `subscription_end_date`    | TIMESTAMPTZ | optional                                                                                             |
| `onboarding_completed`     | BOOLEAN     | default `false`                                                                                      |
| `created_at`, `updated_at` | TIMESTAMPTZ |                                                                                                      |


**Trigger:** `on_auth_user_created` — auto-inserts author row on signup with `display_name` from user metadata or email.

#### `quizzes`


| Column                                     | Type              | Notes                                 |
| ------------------------------------------ | ----------------- | ------------------------------------- |
| `id`                                       | UUID PK           |                                       |
| `author_id`                                | UUID FK → authors |                                       |
| `slug`                                     | TEXT              | unique per author `(author_id, slug)` |
| `book_title`                               | TEXT              |                                       |
| `quiz_title`                               | TEXT              |                                       |
| `cover_image_url`                          | TEXT              | nullable                              |
| `status`                                   | TEXT              | `'draft' | 'published'`               |
| `published_snapshot`                       | JSONB             | frozen publish payload                |
| `published_version_id`, `draft_version_id` | UUID              | optional; from versioning migration   |
| `created_at`, `updated_at`                 | TIMESTAMPTZ       |                                       |


#### `outcomes` (character results)


| Column        | Type          |
| ------------- | ------------- |
| `id`          | UUID PK       |
| `quiz_id`     | UUID FK       |
| `name`        | TEXT          |
| `description` | TEXT          |
| `image_url`   | TEXT nullable |
| `sort_order`  | INTEGER       |


#### `questions`


| Column           | Type                    |
| ---------------- | ----------------------- |
| `id`             | UUID PK                 |
| `quiz_id`        | UUID FK                 |
| `question_text`  | TEXT                    |
| `allow_multiple` | BOOLEAN default `false` |
| `sort_order`     | INTEGER                 |


#### `answers`


| Column        | Type    |
| ------------- | ------- |
| `id`          | UUID PK |
| `question_id` | UUID FK |
| `answer_text` | TEXT    |
| `weights`     | JSONB   |
| `sort_order`  | INTEGER |


### 6.2 Analytics Tables

#### `quiz_events`


| Column       | Type                                           |
| ------------ | ---------------------------------------------- |
| `id`         | UUID PK                                        |
| `quiz_id`    | UUID FK                                        |
| `event_type` | `'start' | 'complete' | 'share' | 'cta_click'` |
| `outcome_id` | UUID nullable (on complete)                    |
| `metadata`   | JSONB                                          |
| `created_at` | TIMESTAMPTZ                                    |


#### `reader_sessions`


| Column                             | Type                                  |
| ---------------------------------- | ------------------------------------- |
| `id`                               | UUID PK (client-generated session ID) |
| `quiz_id`                          | UUID FK                               |
| `anonymous_id`                     | TEXT                                  |
| `started_at`, `completed_at`       | TIMESTAMPTZ                           |
| `result_id`                        | TEXT                                  |
| `referrer`, `utm_`*, `device_type` | TEXT                                  |


#### `reader_answers`

Per-answer tracking for funnel analysis.

#### `quiz_ai_messages`

Conversation history for AI revision feature.


| Column               | Type                              |
| -------------------- | --------------------------------- |
| `quiz_id`, `user_id` | UUID                              |
| `role`               | `'user' | 'assistant' | 'system'` |
| `message`            | TEXT                              |
| `structured_patch`   | JSONB                             |


#### `quiz_versions` (optional advanced)

JSONB content snapshots with `published_at` — partially implemented in migrations but primary publish path uses `published_snapshot` on `quizzes`.

### 6.3 Published Snapshot Schema

```typescript
interface PublishedQuizSnapshot {
  quiz_title: string
  book_title: string
  cover_image_url: string | null
  outcomes: {
    id: string
    name: string
    description: string
    image_url: string | null
    sort_order: number
  }[]
  questions: {
    id: string
    question_text: string
    allow_multiple: boolean
    sort_order: number
    answers: {
      id: string
      answer_text: string
      weights: Record<string, number>
      sort_order: number
    }[]
  }[]
  published_at: string // ISO timestamp
}
```

### 6.4 Row Level Security

- **Authors:** CRUD only their own rows (via `auth.uid() = author_id` or nested quiz ownership)
- **Public read:** `quizzes`, `outcomes`, `questions`, `answers` where `status = 'published'`
- **Anonymous insert:** `quiz_events`, `reader_sessions`, `reader_answers`
- **Storage bucket `outcome-images`:** public read; authors write only under `authors/{userId}/...`

### 6.5 Storage

**Bucket:** `outcome-images`

- Public, 8 MB max
- MIME: JPEG, PNG, WebP
- Path pattern: `authors/{authorId}/quizzes/{quizId}/outcomes/{outcomeId}/{uuid}.{ext}`

---

## 7. Subscription Tiers

Defined in `lib/subscription.ts`:


| Tier      | maxQuizzes | canUseAI | canPublish |
| --------- | ---------- | -------- | ---------- |
| **free**  | 1          | false    | false      |
| **basic** | 10         | true     | true       |
| **pro**   | ∞          | true     | true       |


**Tier detection:** `subscription_status === 'active'` → paid. Pro vs basic can be distinguished by Stripe price ID env vars (optional).

**Products** (`lib/products.ts`):


| ID                    | Name                     | Price   | Interval |
| --------------------- | ------------------------ | ------- | -------- |
| `quizzytales-monthly` | QuizzyTales Pro          | $20/mo  | month    |
| `quizzytales-yearly`  | QuizzyTales Pro (Annual) | $192/yr | year     |


**Gating:**

- Middleware redirects `/dashboard/quizzes/new` → billing if not subscribed
- Publish button disabled if `!subscription.canPublish`
- AI routes return 403 `SUBSCRIPTION_REQUIRED` if `!canUseAI`
- Upgrade prompts shown in editor when blocked

---

## 8. Authentication

**Provider:** Supabase Auth (email/password)

**Routes:**

- `/auth/login` — sign in
- `/auth/sign-up` — register with display name
- `/auth/sign-up-success` — post-signup confirmation
- `/auth/callback` — OAuth/email confirm code exchange
- `/auth/error` — auth failure

**Middleware** (`middleware.ts` → `lib/supabase/proxy.ts`):

1. Refresh session on every request
2. Protect `/dashboard/`* — redirect to login if unauthenticated
3. Redirect logged-in users away from login/signup → dashboard
4. Redirect to `/dashboard/onboarding` if `onboarding_completed === false`
5. Redirect to billing for premium paths without active subscription

**Author profile:** Auto-created via DB trigger on signup.

---

## 9. Routes & Pages

### 9.1 Public


| Route                       | Purpose                                                  |
| --------------------------- | -------------------------------------------------------- |
| `/`                         | Marketing landing: hero, features, pricing ($20/mo), CTA |
| `/q/[slug]`                 | Public quiz player (reads `published_snapshot`)          |
| `/q/[slug]/opengraph-image` | Dynamic OG image (edge runtime)                          |


### 9.2 Auth

See §8.

### 9.3 Dashboard (authenticated)


| Route                                 | Purpose                                    |
| ------------------------------------- | ------------------------------------------ |
| `/dashboard`                          | Home: stats cards, recent quizzes list     |
| `/dashboard/onboarding`               | 5-step wizard for first-time setup         |
| `/dashboard/quizzes`                  | Quiz grid with status badges               |
| `/dashboard/quizzes/new`              | Manual quiz creation form                  |
| `/dashboard/quizzes/new/ai`           | AI generation workbench                    |
| `/dashboard/quizzes/[id]`             | **Quiz editor** (main product surface)     |
| `/dashboard/quizzes/[id]/preview`     | Author-only draft preview via `QuizPlayer` |
| `/dashboard/analytics`                | Engagement charts & outcome breakdown      |
| `/dashboard/settings`                 | Account settings                           |
| `/dashboard/settings/billing`         | Plan selection + Stripe embedded checkout  |
| `/dashboard/settings/billing/success` | Post-checkout confirmation                 |


**Layout:** Sidebar (`AppSidebar`) with nav: Dashboard, Quizzes, Analytics; "New Quiz" CTA; user menu (Settings, theme toggle, sign out).

---

## 10. Core User Flows

### 10.1 Sign Up → Onboarding → First Quiz

1. User signs up at `/auth/sign-up`
2. Middleware sends them to `/dashboard/onboarding`
3. **Onboarding wizard** (5 steps):
  - **Profile:** display name (min 2 chars)
  - **Book:** title + synopsis (min 20 chars)
  - **Style:** tone (playful/thoughtful/dramatic/whimsical), question style (scenario/preference/mixed)
  - **Results:** character count (default 4), include descriptions toggle
  - **Generate:** calls `/api/generate-quiz`, previews output
4. On complete: creates quiz + outcomes + questions + answers in DB; sets `onboarding_completed = true`; redirects to editor
5. **Skip:** marks onboarding complete, goes to dashboard

### 10.2 Manual Quiz Creation

1. `/dashboard/quizzes/new` — enter book title, quiz title, slug
2. Auto-generates slug from book title
3. Creates draft quiz → redirects to editor

### 10.3 AI Quiz Generation

1. `/dashboard/quizzes/new/ai` or onboarding step 5
2. Input: book title, synopsis, character count (3–6 slider)
3. POST `/api/generate-quiz` → structured AI output
4. Preview outcomes + questions
5. Save: insert normalized DB rows with weight ID mapping

### 10.4 Quiz Editing

**Editor tabs:** Details | Outcomes | Questions | AI Assist

**Details tab:**

- Book title, quiz title, slug, cover image URL
- Auto-save draft metadata (700ms debounce)

**Outcomes tab:**

- CRUD character outcomes (name, description)
- Outcome portrait images:
  - Upload via `/api/outcome-images/upload` (multipart)
  - AI generate via `/api/generate-outcome-portrait` (style picker + optional art direction)
  - Remove via DELETE `/api/outcome-images`
- 6 AI art styles: editorial portrait, painterly book-cover, cinematic fantasy, soft watercolor, graphic novel, photoreal character study
- Daily AI image limit: 12 per user (in-memory rate limit)

**Questions tab:**

- CRUD questions and answers
- **Weighted scoring UI:** score chips (0–10) per outcome per answer, color-coded by intensity
- Toggle `allow_multiple` per question
- Minimum publish requirements: ≥2 outcomes, ≥3 questions, each question ≥2 answers

**AI Assist tab:**

- Natural language revision instructions
- Quick commands: "Make it darker", "Add 2 more questions", "Rebalance scoring", etc.
- POST `/api/revise-quiz` → structured patch
- Author accepts/rejects patch before applying

**Publish flow:**

1. Validate content requirements
2. Check `subscription.canPublish`
3. Build snapshot via `createPublishedSnapshot(quiz)`
4. Update `status = 'published'`, save `published_snapshot`
5. Public URL: `/q/{slug}`

**Unpublish:** set `status = 'draft'` (snapshot retained)

### 10.5 Reader Quiz Experience (`QuizPlayer`)

**States:** `intro` → `playing` → `result`

**Intro:** cover image, book badge, question count, "Start the quiz"

**Playing:**

- Progress bar
- Single-select answers (default) OR multi-select + submit when `allow_multiple`
- On each answer: accumulate weights per outcome ID

**Scoring algorithm:**

```typescript
// For each selected answer, sum weights[outcomeId]
// Winner = outcome with highest total score
// Tie-breaker: first highest (implicit in reduce)
```

**Result screen:**

- Outcome name, description, portrait image
- Share: Twitter, Facebook, copy link
- "Read the book" CTA (tracks `cta_click`)
- Retake quiz

**Analytics tracking** (fire-and-forget POST `/api/track`):


| Event            | When                                    |
| ---------------- | --------------------------------------- |
| `view`           | Page load                               |
| `start`          | Quiz started                            |
| `answer`         | Each answer (with questionId, answerId) |
| `complete`       | Result shown (with resultId)            |
| `share`          | Social share (with platform)            |
| `book_cta_click` | Book CTA clicked                        |


Session ID: `crypto.randomUUID()` per visit. Anonymous ID: persisted in `localStorage` key `quizzy_anon_id`.

### 10.6 Subscription Checkout

1. `/dashboard/settings/billing` — pick monthly or yearly plan
2. Embedded Stripe Checkout (`ui_mode: "embedded_page"`)
3. Webhook `checkout.session.completed` → update author subscription fields
4. Redirect to success page

**Customer portal:** manage/cancel subscription via Stripe billing portal.

---

## 11. API Routes


| Method | Route                            | Auth                | Purpose                              |
| ------ | -------------------------------- | ------------------- | ------------------------------------ |
| POST   | `/api/generate-quiz`             | User + paid         | AI quiz generation                   |
| POST   | `/api/revise-quiz`               | User + paid         | AI structured revision patch         |
| POST   | `/api/generate-outcome-portrait` | User + paid         | AI image generation + storage upload |
| POST   | `/api/outcome-images/upload`     | User                | Manual image upload                  |
| DELETE | `/api/outcome-images`            | User                | Remove outcome image                 |
| POST   | `/api/track`                     | None (admin client) | Analytics ingestion                  |
| POST   | `/api/webhooks/stripe`           | Stripe signature    | Subscription lifecycle               |


**Server Actions** (`app/actions/stripe.ts`):

- `startCheckoutSession(productId)` → Stripe client secret
- `createCustomerPortalSession()` → redirect to portal
- `getSubscriptionStatus()` → author subscription fields

---

## 12. Quiz Content Schema (AI / Validation Layer)

Separate from DB normalization — used for AI revision and validation (`lib/quiz/schema.ts`):

```typescript
QuizContent = {
  metadata: { title, subtitle, bookTitle, authorDisplayName, tone, language, ... }
  results: Result[]      // 2–10 items
  questions: Question[]  // 3–20 items, 2–6 answers each
  scoring: { strategy: "weighted_sum", tieBreaker }
  theme: { primaryColor, backgroundColor, textColor, typography, buttonStyle }
  leadCapture?: { enabled }
  seo?: { title, description, socialImageText }
}
```

**Validation helpers:**

- `validateQuizForPublish()` — schema + reachability + min questions
- `validateResultReachability()` — every outcome reachable via weights > 0
- `validateScoringBalance()` — warn if one outcome gets >50% total weight

Note: The live editor uses the **normalized DB model**, not `QuizContent` directly. AI revision converts between them.

---

## 13. Design System

### Typography

- **Headlines:** `font-serif` (Instrument Serif)
- **Body/UI:** `font-sans` (Inter)
- Large hero type: `text-6xl md:text-8xl`

### Colors (light mode, from `globals.css`)

- Background: warm off-white (`oklch(1 0 0)` / `#faf7f2` in OG images)
- Foreground: near-black warm (`#1a1510`)
- Primary accent: terracotta `#e07a5f` (used in OG, quiz player CTAs)
- Muted foreground for secondary text

### Components

- shadcn/ui with `radix-luma` preset, taupe base color
- Buttons: often `rounded-full` for primary actions
- Cards: `rounded-xl` or `rounded-2xl`, subtle borders
- Badges: `rounded-full` for status (success/warning variants)
- Sidebar: inset variant with logo wordmark

### Logo

- `Wordmark` and `Logo` components in `components/ui/logo.tsx`
- SVG wordmark used in header, auth pages, OG images

---

## 14. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth redirect (local dev)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_MONTHLY_PRICE_ID=   # optional, for tier mapping
STRIPE_PRO_YEARLY_PRICE_ID=

# AI (via Vercel AI Gateway or direct provider keys)
# Configured through Vercel AI SDK — typically AI_GATEWAY_API_KEY or provider-specific
```

---

## 15. Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Start Supabase local (includes Studio at http://127.0.0.1:54323)
supabase start

# 3. Apply database schema
# Run scripts/setup-database.sql in Supabase SQL editor or via migration
# Then run scripts/migrations/*.sql in order

# 4. Configure .env.local with local Supabase keys from `supabase start` output

# 5. Start Next.js
pnpm dev
# → http://localhost:3000
```

**Stripe local testing:** Use Stripe CLI to forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 16. Deployment

- **Platform:** Vercel (linked to v0 project; auto-deploy on merge to `main`)
- **Database:** Supabase hosted project
- **Storage:** Supabase Storage bucket `outcome-images`
- **Images:** `next.config.mjs` sets `images.unoptimized: true`
- **Analytics:** Vercel Analytics in production only

---

## 17. File Structure (Target Layout)

```
app/
  page.tsx                          # Landing
  layout.tsx                        # Root layout, fonts, theme
  globals.css                       # Design tokens
  middleware.ts                     # Auth/session routing
  auth/                             # login, sign-up, callback, error
  dashboard/                        # All author-facing pages
  q/[slug]/                         # Public quiz + OG image
  api/                              # All API routes
  actions/stripe.ts                 # Server actions
components/
  ui/                               # shadcn components
  dashboard/                        # sidebar, page-header, quiz-card-menu
  quiz/                             # quiz-editor, quiz-player, ai-revision-panel
  onboarding/                       # wizard + step components
  analytics/                        # activity-chart
  subscription/                     # upgrade-prompt
  settings/                         # account-form, subscription-card
  checkout.tsx                      # Stripe embedded checkout
lib/
  supabase/                         # client, server, admin, proxy
  quiz/                             # schema, published-snapshot, outcome-image-*
  subscription.ts, products.ts, stripe.ts, utils.ts
  onboarding/types.ts
scripts/
  setup-database.sql
  migrations/001-*.sql, 002-*.sql, 003-*.sql
```

---

## 18. Recommended Build Order for AI Agent

### Phase 1 — Foundation

1. Next.js 16 + TypeScript + Tailwind 4 + shadcn init (`radix-luma`, taupe)
2. Fonts, theme provider, root layout, landing page
3. Supabase project + full schema + RLS + storage bucket
4. Auth pages + middleware + author trigger

### Phase 2 — Quiz CRUD

1. Dashboard layout + sidebar
2. Quiz list page
3. New quiz form (manual creation)
4. Quiz editor: Details, Outcomes, Questions tabs
5. Weighted scoring UI (score chips)
6. Draft auto-save + publish/unpublish + snapshot logic
7. Quiz preview page (author-only)
8. Public quiz player at `/q/[slug]`

### Phase 3 — Analytics

1. `/api/track` route + reader session/answer tables
2. Analytics dashboard page with charts

### Phase 4 — Monetization

1. Stripe products + embedded checkout + webhooks
2. Subscription gating in middleware + editor
3. Billing settings page + customer portal

### Phase 5 — AI Features

1. `/api/generate-quiz` + AI quiz workbench
2. Onboarding wizard with AI generation
3. `/api/revise-quiz` + AI revision panel in editor
4. Outcome image upload + AI portrait generation

### Phase 6 — Polish

1. OG image generation
2. Empty states, loading skeletons, error pages
3. Mobile responsiveness pass on editor
4. Accessibility audit (keyboard, ARIA, contrast)

---

## 19. Key Implementation Details

### Slug generation

```typescript
title.toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "")
  .substring(0, 50)
```

### Weight mapping (AI → DB)

AI returns weights as array `[{ outcome_id, value }]`. On save, map AI outcome IDs to DB UUIDs and store as JSON object `{ [dbOutcomeId]: value }`.

### Publish snapshot comparison

Editor detects unpublished changes by JSON.stringify comparison of current draft vs snapshot content.

### Admin client usage

Use service role client only in:

- Stripe webhooks
- `/api/track` (anonymous inserts bypass RLS)
- Storage uploads (optional; can use user client with RLS policies)

---

## 20. Known Inconsistencies to Resolve During Rebuild

1. **Subscription column naming:** Code references both `subscription_id` (webhook) and `stripe_subscription_id` (migration). Standardize on one.
2. **Dual content models:** `QuizContent` Zod schema (rich metadata/theme) vs normalized DB tables (simpler). Editor uses DB model; AI revision expects `QuizContent`. Rebuild should either unify or maintain a clear adapter layer.
3. `**quiz_versions` table:** Migrated but not used in primary publish flow. Either implement version history or omit.
4. **Free tier quiz limit:** `TIER_LIMITS.free.maxQuizzes = 1` defined but not enforced in middleware (only new quiz path checks subscription, not count).
5. **Dashboard home stats:** Hardcoded zeros for starts/completions/shares — analytics page has real data.
6. **Middleware deprecation warning:** Next.js 16 prefers `proxy.ts` over `middleware.ts` convention.
7. **TypeScript:** `ignoreBuildErrors: true` in next.config — should be removed for production quality.

---

## 21. Acceptance Criteria (MVP Complete)

An author can:

- Sign up, complete onboarding (or skip)
- Create a quiz manually or via AI from book synopsis
- Edit outcomes, questions, answers, and scoring weights
- Upload or AI-generate outcome portraits (paid)
- Preview draft quiz
- Subscribe via Stripe and publish quiz
- Share public URL `/q/[slug]`
- View analytics (starts, completions, shares, outcome breakdown)

A reader can:

- Take published quiz without signing in
- See character result with share buttons
- Share result on social media

The system:

- Enforces RLS so authors only see their data
- Serves published content from immutable snapshot
- Tracks anonymous quiz events
- Handles Stripe subscription lifecycle via webhooks

---

This spec reflects the current **quizzy-tales** codebase. An agent rebuilding from scratch should treat §18 (build order) and §20 (inconsistencies) as guidance for producing a cleaner, production-ready v1 rather than copying every wart verbatim.