"use client"

import { Suspense, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

type CheckoutSyncedToastProps = {
  message?: string
}

function CheckoutSyncedToastInner({
  message = "Checkout complete. Your plan is active.",
}: CheckoutSyncedToastProps) {
  const searchParams = useSearchParams()
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current || searchParams.get("billing") !== "synced") {
      return
    }

    handledRef.current = true
    toast.success(message)
  }, [message, searchParams])

  return null
}

export function CheckoutSyncedToast(props: CheckoutSyncedToastProps) {
  return (
    <Suspense fallback={null}>
      <CheckoutSyncedToastInner {...props} />
    </Suspense>
  )
}
