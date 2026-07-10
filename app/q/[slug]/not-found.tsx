import { RouteStatus } from "@/components/route-status"

export default function QuizNotFound() {
  return (
    <RouteStatus
      title="Quiz not found"
      description="This quiz isn't published or the link may be incorrect."
      primaryHref="/"
      primaryLabel="Back to home"
    />
  )
}
