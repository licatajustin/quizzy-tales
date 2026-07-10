import { getAccountDeletionInfo } from "@/lib/account/deletion-info"
import { DeleteAccountSection } from "@/components/settings/delete-account-section"
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

  const [authorResult, deletionInfo] = await Promise.all([
    supabase
      .from("authors")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
    getAccountDeletionInfo(supabase, user),
  ])

  const author = authorResult.data

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
            <span className="font-medium">{author?.display_name ?? "Author"}</span>
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
