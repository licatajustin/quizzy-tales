"use client"

import { Suspense, useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { syncCheckoutSession } from "@/app/actions/stripe"

type CheckoutReturnHandlerProps = {
  successMessage?: string
}

export function CheckoutReturnHandler({
  successMessage = "Checkout complete. Your plan is active.",
}: CheckoutReturnHandlerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) {
      return
    }

    const billing = searchParams.get("billing")
    const sessionId = searchParams.get("session_id")

    if (billing !== "success" || !sessionId) {
      return
    }

    handledRef.current = true

    void (async () => {
      const result = await syncCheckoutSession(sessionId)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(successMessage)
      }

      router.replace(pathname)
      router.refresh()
    })()
  }, [pathname, router, searchParams, successMessage])

  return null
}

export function BillingCheckoutReturn() {
  return (
    <Suspense fallback={null}>
      <CheckoutReturnHandler successMessage="Author plan active. Builder credits are unlocked and you can publish when ready." />
    </Suspense>
  )
}
