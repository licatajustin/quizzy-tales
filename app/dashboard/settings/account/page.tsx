import { getAccountDeletionInfo } from "@/lib/account/deletion-info"
import { DeleteAccountSection } from "@/components/settings/delete-account-section"
import { getAuthorDisplayName } from "@/lib/auth/author"
import { getDashboardSession } from "@/lib/auth/dashboard-session"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function AccountSettingsPage() {
  const { supabase, user } = await getDashboardSession()

  const [displayName, deletionInfo] = await Promise.all([
    getAuthorDisplayName(supabase, user.id),
    getAccountDeletionInfo(supabase, user),
  ])

  if ("error" in deletionInfo) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
          <p className="mt-2 text-muted-foreground">{deletionInfo.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile and account settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Display name</span>
            <span className="font-medium">{displayName ?? "Author"}</span>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
        </CardContent>
      </Card>

      <DeleteAccountSection
        canDelete={deletionInfo.canDelete}
        requiresSubscriptionCancellation={
          deletionInfo.requiresSubscriptionCancellation
        }
        quizCount={deletionInfo.quizCount}
        publishedQuizCount={deletionInfo.publishedQuizCount}
        isCancelingAtPeriodEnd={deletionInfo.isCancelingAtPeriodEnd}
        subscriptionEndDate={deletionInfo.subscriptionEndDate}
      />
    </div>
  )
}
