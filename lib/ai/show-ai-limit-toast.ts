import { toast } from "sonner"

import { LIVE_QUIZ_PRICE_LABEL } from "@/lib/products"

type ShowAiLimitToastOptions = {
  message?: string
  description?: string
  onUpgrade?: () => void
}

export function showAiLimitToast(options?: ShowAiLimitToastOptions) {
  toast.error(options?.message ?? "Builder credits used", {
    description:
      options?.description ??
      `Start the author plan (${LIVE_QUIZ_PRICE_LABEL}/mo) for more included credits — includes 1 live quiz slot.`,
    duration: 12_000,
    action: options?.onUpgrade
      ? {
          label: `Start plan · ${LIVE_QUIZ_PRICE_LABEL}/mo`,
          onClick: options.onUpgrade,
        }
      : {
          label: "View billing",
          onClick: () => {
            window.location.href = "/dashboard/settings/billing"
          },
        },
  })
}
