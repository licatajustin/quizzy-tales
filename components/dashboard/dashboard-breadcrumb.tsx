"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  quizzes: "Quizzes",
  new: "New quiz",
  preview: "Preview",
  analytics: "Analytics",
  settings: "Settings",
  billing: "Billing",
  account: "Account",
}

function formatSegmentLabel(segment: string) {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length <= 1) {
    return [{ label: "Dashboard", href: "/dashboard", isCurrent: true }]
  }

  const crumbs: { label: string; href: string; isCurrent: boolean }[] = [
    { label: "Dashboard", href: "/dashboard", isCurrent: false },
  ]

  let path = ""
  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index]
    path += `/${segment}`

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        segment
      )

    const label = isUuid
      ? "Editor"
      : (SEGMENT_LABELS[segment] ?? formatSegmentLabel(segment))

    crumbs.push({
      label,
      href: `/dashboard${path}`,
      isCurrent: index === segments.length - 1,
    })
  }

  crumbs[crumbs.length - 1].isCurrent = true
  return crumbs
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const crumbs = getBreadcrumbs(pathname)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <span key={crumb.href} className="contents">
            {index > 0 ? (
              <BreadcrumbSeparator className="hidden md:block" />
            ) : null}
            <BreadcrumbItem
              className={
                index === 0 && crumbs.length > 1 ? "hidden md:block" : undefined
              }
            >
              {crumb.isCurrent ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
