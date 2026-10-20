"use client"

import { useRef, useTransition } from "react"
import Image from "next/image"
import { ImagePlus, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

type ThemeLogoControlsProps = {
  quizId: string
  imageUrl: string | null
  themePayload: () => unknown
  onImageChange: (imageUrl: string | null, theme: Record<string, string>) => void
}

export function ThemeLogoControls({
  quizId,
  imageUrl,
  themePayload,
  onImageChange,
}: ThemeLogoControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, startUpload] = useTransition()
  const [isRemoving, startRemove] = useTransition()

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    startUpload(async () => {
      const formData = new FormData()
      formData.set("quiz_id", quizId)
      formData.set("file", file)
      formData.set("theme", JSON.stringify(themePayload() ?? {}))

      const response = await fetch("/api/theme-logo/upload", {
        method: "POST",
        body: formData,
      })

      const payload = (await response.json()) as {
        logo_url?: string
        theme?: Record<string, string>
        error?: string
      }

      if (!response.ok || !payload.logo_url || !payload.theme) {
        toast.error(payload.error ?? "Upload failed.")
        return
      }

      onImageChange(payload.logo_url, payload.theme)
      toast.success("Logo uploaded")
    })

    event.target.value = ""
  }

  function handleRemove() {
    startRemove(async () => {
      const response = await fetch("/api/theme-logo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_id: quizId,
          theme: themePayload() ?? {},
        }),
      })

      const payload = (await response.json()) as {
        theme?: Record<string, string>
        error?: string
      }

      if (!response.ok || !payload.theme) {
        toast.error(payload.error ?? "Could not remove logo.")
        return
      }

      onImageChange(null, payload.theme)
      toast.success("Logo removed")
    })
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Author logo</p>
          <p className="text-xs text-muted-foreground">
            Optional wordmark on the quiz intro, result, and share image.
          </p>
        </div>
        {imageUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove logo"
            disabled={isRemoving}
            onClick={handleRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>

      {imageUrl ? (
        <div className="flex h-16 items-center justify-center rounded-lg border border-border/60 bg-background px-4">
          <Image
            src={imageUrl}
            alt="Author logo"
            width={240}
            height={64}
            className="h-10 w-auto max-w-full object-contain"
          />
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <ImagePlus data-icon="inline-start" />
        )}
        {imageUrl ? "Replace logo" : "Upload logo"}
      </Button>
    </div>
  )
}
