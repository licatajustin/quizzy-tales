export const PRODUCT_IDS = {
  liveQuizMonthly: "quizzytales-live-quiz-monthly",
} as const

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS]

export type BillingProduct = {
  id: ProductId
  name: string
  description: string
  priceLabel: string
  intervalLabel: string
  priceId: string
}

const DEFAULT_STRIPE_PRODUCT_ID = "prod_UaK7KZdxjlfuTh"
const DEFAULT_LIVE_QUIZ_PRICE_ID = "price_1TqixT7DQ1k5ZRpllxahm2bm"

export const LIVE_QUIZ_PRICE_LABEL = "$15"

export function getStripeProductId() {
  return process.env.STRIPE_PRODUCT_ID ?? DEFAULT_STRIPE_PRODUCT_ID
}

export function getLiveQuizPriceId() {
  return (
    process.env.STRIPE_PRICE_LIVE_QUIZ_MONTHLY ??
    process.env.STRIPE_PRICE_MONTHLY ??
    DEFAULT_LIVE_QUIZ_PRICE_ID
  )
}

export function getBillingProducts(): BillingProduct[] {
  return [
    {
      id: PRODUCT_IDS.liveQuizMonthly,
      name: "Author plan",
      description: "$15/month includes 1 live quiz slot and full AI access.",
      priceLabel: LIVE_QUIZ_PRICE_LABEL,
      intervalLabel: "/month",
      priceId: getLiveQuizPriceId(),
    },
  ]
}

export function getBillingProduct(productId: ProductId) {
  const product = getBillingProducts().find((entry) => entry.id === productId)

  if (!product) {
    throw new Error(`Unknown product: ${productId}`)
  }

  return product
}
