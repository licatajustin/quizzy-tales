import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  planSupabaseMigration,
  redactSecrets,
} from "./supabase-migration-plan.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const force = process.argv.includes("--force")
const dbUrl = process.env.SUPABASE_DB_URL
const plan = planSupabaseMigration({
  vercelEnv: process.env.VERCEL_ENV,
  dbUrl,
  force,
})

if (plan.action === "skip") {
  console.log(plan.reason)
  process.exit(0)
}

if (plan.action === "fail") {
  console.error(plan.reason)
  process.exit(1)
}

const cli = path.join(repoRoot, "node_modules", ".bin", "supabase")
console.log(
  `Applying pending Supabase migrations to ${plan.host}:${plan.port}.`
)
for (const note of plan.notes) {
  console.log(note)
}

const child = spawn(
  cli,
  [
    "db",
    "push",
    "--db-url",
    plan.connectionString,
    "--include-all",
    "--skip-vault",
    "--yes",
  ],
  {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: childEnvWithoutDatabaseUrl(),
  }
)

let output = ""
function write(stream, chunk) {
  const text = redactSecrets(chunk.toString(), plan.connectionString)
  output += text
  stream.write(text)
}

child.stdout.on("data", (chunk) => write(process.stdout, chunk))
child.stderr.on("data", (chunk) => write(process.stderr, chunk))

child.on("error", (error) => {
  console.error(
    redactSecrets(
      `Could not start the Supabase CLI: ${error.message}`,
      plan.connectionString
    )
  )
  process.exit(1)
})

child.on("exit", (code) => {
  if (code === 0) {
    console.log("Supabase migrations applied.")
    process.exit(0)
  }

  console.error(`Supabase migrations failed (exit ${code ?? "unknown"}).`)
  if (/already exists/i.test(output)) {
    console.error(
      "The database already has objects from migrations that are not recorded in supabase_migrations.schema_migrations. Baseline those versions, then redeploy. See docs/vercel-supabase-migrations.md."
    )
  }
  console.error("The Vercel build will stop and production will keep the previous deployment.")
  process.exit(code ?? 1)
})

function childEnvWithoutDatabaseUrl() {
  const env = { ...process.env }
  delete env.SUPABASE_DB_URL
  return env
}
