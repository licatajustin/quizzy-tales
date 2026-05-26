"use client"

import { useMemo } from "react"
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

type EmbeddedCheckoutFormProps = {
  clientSecret: string
  publishableKey: string
}

export function EmbeddedCheckoutForm({
  clientSecret,
  publishableKey,
}: EmbeddedCheckoutFormProps) {
  const stripePromise = useMemo(
    () => loadStripe(publishableKey),
    [publishableKey]
  )

  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{ clientSecret }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  )
}
