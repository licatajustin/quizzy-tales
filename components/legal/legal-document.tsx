import Link from "next/link"

import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { LOGIN_PATH } from "@/components/marketing/content"

type LegalDocumentProps = {
  title: string
  description: string
  lastUpdated: string
  children: React.ReactNode
}

export function LegalDocument({
  title,
  description,
  lastUpdated,
  children,
}: LegalDocumentProps) {
  return (
    <div className="relative min-h-svh overflow-x-hidden">
      <div className="sticky top-0 z-50 px-4 pt-4 pb-2 md:px-6 md:pt-6 md:pb-4">
        <SiteHeader />
      </div>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Last updated {lastUpdated}</p>
          <h1 className="text-4xl tracking-tight">{title}</h1>
          <p className="text-lg text-muted-foreground">{description}</p>
        </div>

        <div className="prose prose-neutral mt-10 max-w-none space-y-8 text-foreground [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:text-muted-foreground">
          {children}
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Questions?{" "}
          <Link href={LOGIN_PATH} className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>{" "}
          to manage your account, or contact us through your dashboard settings.
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}
