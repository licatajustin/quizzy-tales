import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { describe, it } from "node:test"

import {
  planSupabaseMigration,
  redactSecrets,
} from "./supabase-migration-plan.mjs"

const sessionUrl =
  "postgresql://postgres.example:s3cret%21@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

describe("planSupabaseMigration", () => {
  it("skips preview builds even when the production URL is present", () => {
    const plan = planSupabaseMigration({
      vercelEnv: "preview",
      dbUrl: sessionUrl,
    })
    assert.equal(plan.action, "skip")
    assert.match(plan.reason, /preview/)
  })

  it("skips local builds", () => {
    const plan = planSupabaseMigration({ dbUrl: sessionUrl })
    assert.equal(plan.action, "skip")
  })

  it("fails a production build that has no database URL", () => {
    const plan = planSupabaseMigration({
      vercelEnv: "production",
      dbUrl: "  ",
    })
    assert.equal(plan.action, "fail")
    assert.match(plan.reason, /SUPABASE_DB_URL/)
  })

  it("migrates production with a session-pooler URL and requires TLS", () => {
    const plan = planSupabaseMigration({
      vercelEnv: "production",
      dbUrl: sessionUrl,
    })
    assert.equal(plan.action, "migrate")
    assert.equal(plan.host, "aws-0-us-east-1.pooler.supabase.com")
    assert.equal(plan.port, "5432")
    assert.match(plan.connectionString, /sslmode=require/)
    assert.match(plan.connectionString, /s3cret%21/)
  })

  it("rejects the transaction pooler and disabled TLS", () => {
    const pooled = planSupabaseMigration({
      vercelEnv: "production",
      dbUrl: sessionUrl.replace(":5432", ":6543"),
    })
    assert.equal(pooled.action, "fail")
    assert.match(pooled.reason, /6543/)

    const insecure = planSupabaseMigration({
      vercelEnv: "production",
      dbUrl: `${sessionUrl}?sslmode=disable`,
    })
    assert.equal(insecure.action, "fail")
    assert.match(insecure.reason, /TLS/)
  })

  it("warns when the direct IPv6 host is used", () => {
    const plan = planSupabaseMigration({
      vercelEnv: "production",
      dbUrl:
        "postgresql://postgres:s3cret@db.example.supabase.co:5432/postgres",
    })
    assert.equal(plan.action, "migrate")
    assert.match(plan.notes.join(" "), /IPv6/)
  })

  it("lets an explicit local push run outside production", () => {
    const plan = planSupabaseMigration({
      vercelEnv: "preview",
      dbUrl: `"${sessionUrl}"`,
      force: true,
    })
    assert.equal(plan.action, "migrate")
  })
})

describe("redactSecrets", () => {
  it("removes the connection string, user, and password from CLI output", () => {
    const noisy = `failed to connect to ${sessionUrl} as postgres.example with password s3cret!`
    const redacted = redactSecrets(noisy, sessionUrl)
    assert.doesNotMatch(redacted, /s3cret/)
    assert.doesNotMatch(redacted, /postgres\.example/)
    assert.match(redacted, /\[redacted\]/)
  })
})

describe("apply-supabase-migrations script", () => {
  it("skips a preview build without contacting the database", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/apply-supabase-migrations.mjs"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          VERCEL_ENV: "preview",
          SUPABASE_DB_URL: sessionUrl,
        },
      }
    )

    assert.equal(result.status, 0)
    assert.match(result.stdout, /preview/)
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /s3cret/)
  })

  it("fails a production build when SUPABASE_DB_URL is missing", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/apply-supabase-migrations.mjs"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          VERCEL_ENV: "production",
          SUPABASE_DB_URL: "",
        },
      }
    )

    assert.equal(result.status, 1)
    assert.match(`${result.stdout}${result.stderr}`, /SUPABASE_DB_URL/)
  })
})
