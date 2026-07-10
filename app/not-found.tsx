import { RouteStatus } from "@/components/route-status"

export default function NotFound() {
  return (
    <RouteStatus
      title="Page not found"
      description="The page you're looking for doesn't exist or may have moved."
      primaryHref="/"
      primaryLabel="Back to home"
      secondaryHref="/dashboard"
      secondaryLabel="Go to dashboard"
    />
  )
}
