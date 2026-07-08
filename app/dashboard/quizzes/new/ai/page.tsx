import { redirect } from "next/navigation"

export default function NewAiQuizRedirectPage() {
  redirect("/dashboard/quizzes/new")
}
