# Supabase migrations on Vercel

Production builds apply every pending file in `supabase/migrations` before `next build`. If that step fails, the Vercel build fails and the previous production deployment stays live.

Preview deployments, `vercel dev`, and local `pnpm build` do not connect to the database. A preview build cannot migrate production, even if `SUPABASE_DB_URL` were copied onto the Preview environment.

This repo has no GitHub Actions workflow. Vercel’s Git integration starts a deployment as soon as a commit lands, in parallel with any check on GitHub, so a workflow cannot stop that deployment unless the project’s Git integration is turned off. Running the migration inside the production build is the gate.

Promoting a preview deployment to production does not rebuild, so it does not run migrations. Ship schema changes by deploying the production branch.

## Vercel environment variable

Add one variable in the Vercel project: **Settings → Environment Variables**.

| Name | Environments | Sensitivity | Value |
| --- | --- | --- | --- |
| `SUPABASE_DB_URL` | **Production only** | **Sensitive** | Session-mode Postgres URI, port **5432** |

Do not add it to Preview or Development. Do not commit it. No GitHub secret is required. A Supabase access token and a separate project ref are not required; the project ref and database password are inside this URI.

### Where to copy the URI

In the Supabase dashboard open the project, choose **Connect**, then the **Session pooler** URI (sometimes labeled session mode). It looks like:

```text
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

Use that string, not these:

- Port **6543** (transaction pooler). Migrations cannot run through it.
- `db.PROJECT_REF.supabase.co` unless this project has the IPv4 add-on. On many projects that host is IPv6-only, and the Vercel build cannot reach it. If a production build reports that the direct host is unreachable, switch to the session pooler URI above.

Percent-encode reserved characters in the database password (`@` → `%40`, `#` → `%23`, `:` → `%3A`, `/` → `%2F`). The password is the database password from **Project Settings → Database**, not the anon key or the service role key.

`sslmode=require` is added when it is missing. Do not set `sslmode=disable`.

The build log prints only the host and port. The script strips the URL, username, and password from CLI output before writing the log.

### Build command

Leave the Vercel build command on the framework default so it runs `pnpm build`. That script is:

```text
node scripts/apply-supabase-migrations.mjs && next build
```

If the project settings override the build command with `next build` alone, migrations will not run. Change it back to `pnpm build`, or to the command above.

## First deploy onto a database that already has tables

`supabase db push` records applied files in `supabase_migrations.schema_migrations`. If those tables were created by running SQL in the dashboard, and that history table is empty, the first push tries to recreate them and fails with “already exists”. The build stops.

Baseline only the versions that are already present, from a trusted machine, with the same URI you stored in Vercel:

```bash
export SUPABASE_DB_URL='postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres'

pnpm exec supabase migration repair --status applied \
  20260526001200 \
  20260526120000 \
  20260526200000 \
  20260707200000 \
  --db-url "$SUPABASE_DB_URL" \
  --yes
```

Do **not** mark `20261020120000` applied unless `quizzes.random_question_subset` already exists. The next production deploy applies the remaining files, including that column.

To apply migrations yourself without a Vercel deploy:

```bash
SUPABASE_DB_URL='postgresql://...' pnpm db:push
```

## What a production build does

1. Confirms `VERCEL_ENV=production`.
2. Refuses to continue when `SUPABASE_DB_URL` is missing or is a transaction-pooler URL.
3. Runs `supabase db push --include-all --skip-vault --yes` against that database.
4. Runs `next build` only after the push exits 0.

Pending means a file in `supabase/migrations` whose version is not in `supabase_migrations.schema_migrations`. Already-applied files are skipped, so a rebuild is safe. Vault secrets in `config.toml` are not pushed.
