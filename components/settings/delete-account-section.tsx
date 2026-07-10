"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { deleteAccount } from "@/app/actions/account"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DELETE_ACCOUNT_CONFIRMATION_PHRASE,
  isDeleteAccountConfirmationValid,
} from "@/lib/account/constants"

type DeleteAccountSectionProps = {
  canDelete: boolean
  requiresSubscriptionCancellation: boolean
  quizCount: number
  publishedQuizCount: number
  isCancelingAtPeriodEnd: boolean
  subscriptionEndDate: string | null
}

export function DeleteAccountSection({
  canDelete,
  requiresSubscriptionCancellation,
  quizCount,
  publishedQuizCount,
  isCancelingAtPeriodEnd,
  subscriptionEndDate,
}: DeleteAccountSectionProps) {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [isDeleting, startDelete] = useTransition()

  const confirmationValid = isDeleteAccountConfirmationValid(confirmation)

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteAccount(confirmation)

      if (result?.error) {
        toast.error(result.error)
        return
      }
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      setConfirmation("")
    }
  }

  return (
    <>
      <Card className="border-destructive/30 bg-destructive/5 ring-1 ring-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" />
            Danger zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This cannot
            be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              {quizCount === 0
                ? "All quizzes you have created"
                : `${quizCount} quiz${quizCount === 1 ? "" : "zes"} including drafts and published content`}
            </li>
            {publishedQuizCount > 0 ? (
              <li>
                {publishedQuizCount} live quiz
                {publishedQuizCount === 1 ? "" : "zes"} — public links will stop
                working immediately
              </li>
            ) : null}
            <li>Analytics, reader sessions, and builder usage history</li>
            <li>Uploaded cover images and outcome portraits</li>
            <li>Your author profile and billing records</li>
          </ul>

          {requiresSubscriptionCancellation ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <p className="font-medium text-foreground">
                Cancel your subscription first
              </p>
              <p className="mt-1 text-muted-foreground">
                You have an active subscription. Cancel it from Billing before
                you can delete your account.
              </p>
              <Button asChild variant="outline" className="mt-3 rounded-full">
                <Link href="/dashboard/settings/billing">Go to Billing</Link>
              </Button>
            </div>
          ) : isCancelingAtPeriodEnd ? (
            <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
              <p className="font-medium text-foreground">
                Subscription already cancelled
              </p>
              <p className="mt-1 text-muted-foreground">
                {subscriptionEndDate
                  ? `Your subscription stays active until ${subscriptionEndDate}, but you can delete your account now. Deleting ends live quiz access immediately and cancels any remaining billing.`
                  : "Your subscription is already cancelled. Deleting your account ends live quiz access immediately."}
              </p>
            </div>
          ) : null}

          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            disabled={!canDelete}
            onClick={() => setOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete account
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p>
                  This permanently deletes your account, all quizzes, analytics,
                  and uploaded images. Live quiz links will stop working
                  immediately.
                </p>
                <p>
                  Type{" "}
                  <span className="font-medium text-foreground">
                    {DELETE_ACCOUNT_CONFIRMATION_PHRASE}
                  </span>{" "}
                  below to confirm.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-account-confirmation">Confirmation</Label>
            <Input
              id="delete-account-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={DELETE_ACCOUNT_CONFIRMATION_PHRASE}
              autoComplete="off"
              disabled={isDeleting}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={!confirmationValid || isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete account permanently"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
