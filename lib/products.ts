export const PRODUCT_IDS = {
  monthly: "quizzytales-monthly",
  yearly: "quizzytales-yearly",
} as const

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS]

export type BillingProduct = {
  id: ProductId
  name: string
  description: string
  priceLabel: string
  intervalLabel: string
  priceId: string
  savingsLabel?: string
}

const DEFAULT_STRIPE_PRODUCT_ID = "prod_UaK7KZdxjlfuTh"
const DEFAULT_MONTHLY_PRICE_ID = "price_1Tb9Tg7DQ1k5ZRplqOGL9yZ7"
const DEFAULT_YEARLY_PRICE_ID = "price_1Tb9Tg7DQ1k5ZRplhiKBxkts"

export function getStripeProductId() {
  return process.env.STRIPE_PRODUCT_ID ?? DEFAULT_STRIPE_PRODUCT_ID
}

export function getBillingProducts(): BillingProduct[] {
  return [
    {
      id: PRODUCT_IDS.monthly,
      name: "QuizzyTales Pro",
      description: "Billed monthly. Cancel anytime.",
      priceLabel: "$20",
      intervalLabel: "/month",
      priceId: process.env.STRIPE_PRICE_MONTHLY ?? DEFAULT_MONTHLY_PRICE_ID,
    },
    {
      id: PRODUCT_IDS.yearly,
      name: "QuizzyTales Pro",
      description: "Billed annually. Two months free.",
      priceLabel: "$192",
      intervalLabel: "/year",
      priceId: process.env.STRIPE_PRICE_YEARLY ?? DEFAULT_YEARLY_PRICE_ID,
      savingsLabel: "Save $48",
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
