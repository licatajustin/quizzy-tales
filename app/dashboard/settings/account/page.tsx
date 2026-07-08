import { getAccountDeletionInfo } from "@/app/actions/account"
import { DeleteAccountSection } from "@/components/settings/delete-account-section"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: author } = await supabase
    .from("authors")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle()

  const deletionInfo = await getAccountDeletionInfo()

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
