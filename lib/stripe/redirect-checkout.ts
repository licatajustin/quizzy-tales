import type { StripeActionResult } from "@/app/actions/stripe"
import { toast } from "sonner"

export async function redirectToStripeCheckout(
  getCheckout: () => Promise<StripeActionResult>
) {
  const result = await getCheckout()

  if (result.error) {
    toast.error(result.error)
    return false
  }

  if (!result.url) {
    toast.error("Could not start checkout.")
    return false
  }

  window.location.assign(result.url)
  return true
}
