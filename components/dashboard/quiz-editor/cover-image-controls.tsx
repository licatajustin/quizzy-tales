"use client"

import { useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ImagePlus, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

type CoverImageControlsProps = {
  quizId: string
  imageUrl: string | null
  onImageChange: (imageUrl: string | null) => void
}

export function CoverImageControls({
  quizId,
  imageUrl,
  onImageChange,
}: CoverImageControlsProps) {
  const router = useRouter()
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

      const response = await fetch("/api/cover-images/upload", {
        method: "POST",
        body: formData,
      })

      const payload = (await response.json()) as {
        image_url?: string
        error?: string
      }

      if (!response.ok || !payload.image_url) {
        toast.error(payload.error ?? "Upload failed.")
        return
      }

      onImageChange(payload.image_url)
      toast.success("Cover image uploaded")
      router.refresh()
    })

    event.target.value = ""
  }

  function handleRemove() {
    startRemove(async () => {
      const response = await fetch("/api/cover-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_id: quizId }),
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        toast.error(payload.error ?? "Could not remove cover image.")
        return
      }

      onImageChange(null)
      toast.success("Cover image removed")
      router.refresh()
    })
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Cover image</p>
          <p className="text-xs text-muted-foreground">
            Optional. Upload your book cover for the quiz intro page.
          </p>
        </div>
        {imageUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove cover image"
            disabled={isRemoving}
            onClick={handleRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>

      {imageUrl ? (
        <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-lg border border-border/60">
          <Image
            src={imageUrl}
            alt="Quiz cover"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 28rem"
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
        {imageUrl ? "Replace cover" : "Upload cover"}
      </Button>
    </div>
  )
}
