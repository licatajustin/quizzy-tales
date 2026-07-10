"use client"

import Link from "next/link"
import type { ComponentProps } from "react"
import {
  BookOpen,
  LayoutDashboard,
  LineChart,
  Plus,
} from "lucide-react"

import { NavMain } from "@/components/dashboard/nav-main"
import { NavUser } from "@/components/dashboard/nav-user"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Quizzes", url: "/dashboard/quizzes", icon: BookOpen },
  { title: "Analytics", url: "/dashboard/analytics", icon: LineChart },
]

type AppSidebarProps = ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <BookOpen className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">QuizzyTales</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Author dashboard
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />

        <SidebarGroup>
          <SidebarGroupContent className="px-2">
            <Button asChild className="w-full rounded-full">
              <Link href="/dashboard/quizzes/new">
                <Plus data-icon="inline-start" />
                New quiz
              </Link>
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
