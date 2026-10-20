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
        "Refusing to deploy without applying database migrations. Set SUPABASE_DB_URL on the Vercel project for the Production environment only. See docs/vercel-supabase-migrations.md.",
    }
  }

  let parsed
  try {
    parsed = new URL(normalizedUrl)
  } catch {
    return {
      action: "fail",
      reason:
        "SUPABASE_DB_URL is not a valid connection URL. Use the percent-encoded Session pooler URI from the Supabase dashboard.",
    }
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    return {
      action: "fail",
      reason:
        "SUPABASE_DB_URL must start with postgres:// or postgresql://.",
    }
  }

  if (!parsed.hostname || !parsed.username || !parsed.password) {
    return {
      action: "fail",
      reason:
        "SUPABASE_DB_URL must include a username, password, and host. Percent-encode special characters in the password.",
    }
  }

  if (parsed.searchParams.get("sslmode") === "disable") {
    return {
      action: "fail",
      reason: "SUPABASE_DB_URL must not disable TLS. Remove sslmode=disable.",
    }
  }

  const port = parsed.port || "5432"
  if (port === "6543") {
    return {
      action: "fail",
      reason:
        "SUPABASE_DB_URL uses port 6543, the transaction pooler. Migrations need the session pooler or the direct connection, both on port 5432.",
    }
  }

  if (!parsed.searchParams.has("sslmode")) {
    parsed.searchParams.set("sslmode", "require")
  }

  const notes = []
  if (
    parsed.hostname.startsWith("db.") &&
    parsed.hostname.endsWith(".supabase.co")
  ) {
    notes.push(
      "This is the direct database host. On many Supabase projects it is IPv6-only and unreachable from Vercel. If the connection fails, replace SUPABASE_DB_URL with the session pooler URI (port 5432)."
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
