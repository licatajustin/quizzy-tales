# Supabase migrations on Vercel

Production builds apply every pending file in `supabase/migrations` before `next build`. If that step fails, the Vercel build fails and the previous production deployment stays live.

Preview deployments, `vercel dev`, and local `pnpm build` do not connect to the database. A preview build cannot migrate production, even though the Vercel Supabase integration also sets `POSTGRES_URL_NON_POOLING` on Preview.

This repo has no GitHub Actions workflow. Vercel’s Git integration starts a deployment as soon as a commit lands, in parallel with any check on GitHub, so a workflow cannot stop that deployment unless the project’s Git integration is turned off. Running the migration inside the production build is the gate.

Promoting a preview deployment to production does not rebuild, so it does not run migrations. Ship schema changes by deploying the production branch.

## Database URL

Production builds read `POSTGRES_URL_NON_POOLING`. The Vercel Supabase integration already sets that variable (Sensitive) for Production and Preview. Do not add a separate database URL.

The integration appends `?sslmode=require&supa=base-pooler.x`. `supabase db push --db-url` honors `sslmode`. It forwards `supa` as `options=-c supa=...`, which Postgres rejects, so the script removes `supa` and passes the rest through.

Port 6543 is the transaction pooler. The build fails if the URL uses it.

The build log prints only the host and port. The script strips the URL, username, and password from CLI output before writing the log.

If the host is `db.PROJECT_REF.supabase.co`, the build log warns and the connection may fail. That direct host is IPv6-only unless the Supabase project has the IPv4 add-on, and Vercel build machines often cannot reach it. The integration's non-pooling URL is the session pooler on port 5432, which is reachable over IPv4.

### Build command

Leave the Vercel build command on the framework default so it runs `pnpm build`. That script is:

```text
node scripts/apply-supabase-migrations.mjs && next build
```

If the project settings override the build command with `next build` alone, migrations will not run. Change it back to `pnpm build`, or to the command above.

## First deploy onto a database that already has tables

`supabase db push` records applied files in `supabase_migrations.schema_migrations`. If those tables were created by running SQL in the dashboard, and that history table is empty, the first push tries to recreate them and fails with “already exists”. The build stops.

Baseline only the versions that are already present, from a trusted machine, using `POSTGRES_URL_NON_POOLING`:

```bash
export POSTGRES_URL_NON_POOLING='postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres'

pnpm exec supabase migration repair --status applied \
  20260526001200 \
  20260526120000 \
  20260526200000 \
  20260707200000 \
  --db-url "$POSTGRES_URL_NON_POOLING" \
  --yes
```

`migration repair` passes `--db-url` straight to the CLI, so remove `&supa=base-pooler.x` from that URL first. `pnpm db:push` removes it.

Do **not** mark `20261020120000` applied unless `quizzes.random_question_subset` already exists. The next production deploy applies the remaining files, including that column.

To apply migrations yourself without a Vercel deploy:

```bash
POSTGRES_URL_NON_POOLING='postgresql://...' pnpm db:push
```

## What a production build does

1. Confirms `VERCEL_ENV=production`.
2. Refuses to continue when `POSTGRES_URL_NON_POOLING` is missing or is a transaction-pooler URL.
3. Runs `supabase db push --include-all --skip-vault --yes` against that database.
4. Runs `next build` only after the push exits 0.

Pending means a file in `supabase/migrations` whose version is not in `supabase_migrations.schema_migrations`. Already-applied files are skipped, so a rebuild is safe. Vault secrets in `config.toml` are not pushed.
