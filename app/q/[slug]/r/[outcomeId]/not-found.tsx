import { RouteStatus } from "@/components/route-status"

export default function SharedResultNotFound() {
  return (
    <RouteStatus
      title="Result not found"
      description="This result isn't available. The quiz may be unpublished, or the link may be incorrect."
      primaryHref="/"
      primaryLabel="Back to home"
    />
  )
}
