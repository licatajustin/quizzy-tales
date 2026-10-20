/**
 * Decide whether this process should apply supabase/migrations.
 * Preview and local builds never connect, so they cannot migrate production.
 */

export function planSupabaseMigration({
  vercelEnv,
  dbUrl,
  force = false,
} = {}) {
  const production = vercelEnv === "production"
  const normalizedUrl = normalizeDbUrl(dbUrl)

  if (!production && !force) {
    const where = vercelEnv
      ? `VERCEL_ENV=${vercelEnv}`
      : "a non-Vercel build"
    return {
      action: "skip",
      reason: `Skipping Supabase migrations during ${where}. Only Vercel production builds apply supabase/migrations.`,
    }
  }

  if (!normalizedUrl) {
    return {
      action: "fail",
      reason:
        "Refusing to deploy without applying database migrations. POSTGRES_URL_NON_POOLING is not set. The Vercel Supabase integration provides it. See docs/vercel-supabase-migrations.md.",
    }
  }

  let parsed
  try {
    parsed = new URL(normalizedUrl)
  } catch {
    return {
      action: "fail",
      reason:
        "POSTGRES_URL_NON_POOLING is not a valid connection URL.",
    }
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    return {
      action: "fail",
      reason:
        "POSTGRES_URL_NON_POOLING must start with postgres:// or postgresql://.",
    }
  }

  if (!parsed.hostname || !parsed.username || !parsed.password) {
    return {
      action: "fail",
      reason:
        "POSTGRES_URL_NON_POOLING must include a username, password, and host.",
    }
  }

  if (parsed.searchParams.get("sslmode") === "disable") {
    return {
      action: "fail",
      reason: "POSTGRES_URL_NON_POOLING must not disable TLS.",
    }
  }

  const port = parsed.port || "5432"
  if (port === "6543") {
    return {
      action: "fail",
      reason:
        "POSTGRES_URL_NON_POOLING uses port 6543, the transaction pooler. Migrations need port 5432.",
    }
  }

  // CLI 2.121 forwards unknown query params as `options=-c supa=...`, and
  // Postgres rejects that setting. sslmode is a real client setting and stays.
  parsed.searchParams.delete("supa")

  if (!parsed.searchParams.has("sslmode")) {
    parsed.searchParams.set("sslmode", "require")
  }

  const notes = []
  if (
    parsed.hostname.startsWith("db.") &&
    parsed.hostname.endsWith(".supabase.co")
  ) {
    notes.push(
      "POSTGRES_URL_NON_POOLING uses the direct host db.*.supabase.co. That host is IPv6-only unless the project has the IPv4 add-on, so the Vercel build may be unable to connect."
    )
  }

  return {
    action: "migrate",
    connectionString: parsed.toString(),
    host: parsed.hostname,
    port,
    notes,
  }
}

export function redactSecrets(text, dbUrl) {
  const secrets = new Set()
  const normalized = normalizeDbUrl(dbUrl)

  if (normalized) {
    secrets.add(normalized)
    try {
      const parsed = new URL(normalized)
      if (parsed.password) {
        secrets.add(parsed.password)
        secrets.add(decodeURIComponent(parsed.password))
      }
      if (parsed.username) {
        secrets.add(parsed.username)
      }
    } catch {
      // The raw value is still removed below when it was a string.
    }
  }

  if (typeof dbUrl === "string" && dbUrl.trim()) {
    secrets.add(dbUrl.trim())
  }

  let redacted = text
  for (const secret of secrets) {
    if (!secret) continue
    redacted = redacted.split(secret).join("[redacted]")
  }
  return redacted
}

function normalizeDbUrl(dbUrl) {
  if (typeof dbUrl !== "string") return ""
  let value = dbUrl.trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim()
  }
  return value
}
