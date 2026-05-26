import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SignUpSuccessPage() {
  return (
    <Card className="border-border/70 bg-card/90 shadow-lg backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-semibold">Check your email</CardTitle>
        <CardDescription>
          We sent a confirmation link to finish setting up your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Once confirmed, sign in and start building your first quiz.
        </p>
        <Button asChild className="rounded-full">
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
