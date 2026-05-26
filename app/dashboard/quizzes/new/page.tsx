import { NewQuizForm } from "@/components/dashboard/new-quiz-form"

export default function NewQuizPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">New quiz</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your book details to create a draft quiz.
        </p>
      </div>
      <NewQuizForm />
    </div>
  )
}
