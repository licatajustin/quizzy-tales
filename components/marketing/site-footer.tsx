import Link from "next/link"

import { Separator } from "@/components/ui/separator"
import { LOGIN_PATH, marketingNavLinks } from "@/components/marketing/content"
import { PRIVACY_PATH, TERMS_PATH } from "@/lib/seo/site"

const footerLinks = marketingNavLinks.filter((link) => link.href !== "#how-it-works")

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xl">QuizzyTales</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Personality quizzes for authors who care about craft.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <Link href={LOGIN_PATH} className="hover:text-foreground">
            Sign in
          </Link>
          <Link href={PRIVACY_PATH} className="hover:text-foreground">
            Privacy
          </Link>
          <Link href={TERMS_PATH} className="hover:text-foreground">
            Terms
          </Link>
        </div>
      </div>
      <Separator />
      <p className="px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} QuizzyTales. All rights reserved.
      </p>
    </footer>
  )
}
