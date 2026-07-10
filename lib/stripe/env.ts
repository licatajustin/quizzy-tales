function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

export function getStripeSecretKey() {
  return requireEnv("STRIPE_SECRET_KEY")
}

export function getStripePublishableKey() {
  const value =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    process.env.STRIPE_PUBLISHABLE_KEY

  if (!value) {
    throw new Error(
      "Missing Stripe publishable key. Set STRIPE_PUBLISHABLE_KEY or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local"
    )
  }

  return value
}

export function getStripeWebhookSecret() {
  return requireEnv("STRIPE_WEBHOOK_SECRET")
}

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  try {
    const url = new URL(raw)

    if (url.hostname === "quizzytales.com") {
      url.hostname = "www.quizzytales.com"
    }

    return url.origin
  } catch {
    return raw
  }
}
