"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { deleteQuiz } from "@/app/actions/quizzes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type QuizListActionsProps = {
  quizId: string
  title: string
}

export function QuizListActions({ quizId, title }: QuizListActionsProps) {
  const router = useRouter()

  async function handleDelete() {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      return
    }

    const result = await deleteQuiz(quizId)
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Quiz deleted")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Quiz actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/quizzes/${quizId}`}>
            <Pencil data-icon="inline-start" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <Trash2 data-icon="inline-start" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
