import { redirect } from "next/navigation"

import { syncAuthorSubscriptionFromCheckoutSession } from "@/lib/billing"

type CheckoutSearchParams = {
  billing?: string
  session_id?: string
}

export async function syncCheckoutReturnIfNeeded(
  userId: string,
  searchParams: CheckoutSearchParams,
  redirectPath: string
) {
  if (searchParams.billing !== "success" || !searchParams.session_id) {
    return
  }

  await syncAuthorSubscriptionFromCheckoutSession(userId, searchParams.session_id)
  redirect(`${redirectPath}?billing=synced`)
}
