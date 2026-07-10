import type { Metadata } from "next"

import { SignUpForm } from "@/components/auth/sign-up-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
}

export default function SignUpPage() {
  return (
    <Card className="border-border/70 bg-card/90 shadow-lg backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-semibold">
          Create your account
        </CardTitle>
        <CardDescription>
          Start building personality quizzes for your readers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
    </Card>
  )
}
