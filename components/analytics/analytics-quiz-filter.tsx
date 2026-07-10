"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AnalyticsQuizFilterProps = {
  publishedQuizzes: {
    id: string
    quiz_title: string
  }[]
  selectedQuizId: string | null
}

export function AnalyticsQuizFilter({
  publishedQuizzes,
  selectedQuizId,
}: AnalyticsQuizFilterProps) {
  return (
    <form className="w-full sm:w-64">
      <Select
        name="quiz"
        defaultValue={selectedQuizId ?? "all"}
        onValueChange={(value) => {
          const url = new URL(window.location.href)
          if (value === "all") {
            url.searchParams.delete("quiz")
          } else {
            url.searchParams.set("quiz", value)
          }
          window.location.href = url.toString()
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="All quizzes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All quizzes</SelectItem>
          {publishedQuizzes.map((quiz) => (
            <SelectItem key={quiz.id} value={quiz.id}>
              {quiz.quiz_title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  )
}
