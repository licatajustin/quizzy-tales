import Link from "next/link"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type UpgradePromptProps = {
  title: string
  description: string
}

export function UpgradePrompt({ title, description }: UpgradePromptProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="rounded-full">
          <Link href="/dashboard/settings/billing">Upgrade to Pro</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
