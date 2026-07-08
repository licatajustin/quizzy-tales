"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ImagePlus, Loader2, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { showAiLimitToast } from "@/lib/ai/show-ai-limit-toast"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { OUTCOME_IMAGE_STYLES } from "@/lib/ai/outcome-image-styles"

type OutcomePortraitControlsProps = {
  quizId: string
  outcomeId: string
  imageUrl: string | null
  canUseAI: boolean
  onImageChange: (imageUrl: string | null) => void
  onUpgrade?: () => void
}

export function OutcomePortraitControls({
  quizId,
  outcomeId,
  imageUrl,
  canUseAI,
  onImageChange,
  onUpgrade,
}: OutcomePortraitControlsProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [styleId, setStyleId] = useState<
    (typeof OUTCOME_IMAGE_STYLES)[number]["id"]
  >("editorial-portrait")
  const [artDirection, setArtDirection] = useState("")
  const [isUploading, startUpload] = useTransition()
  const [isGenerating, startGenerate] = useTransition()
  const [isRemoving, startRemove] = useTransition()

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    startUpload(async () => {
      const formData = new FormData()
      formData.set("quiz_id", quizId)
      formData.set("outcome_id", outcomeId)
      formData.set("file", file)

      const response = await fetch("/api/outcome-images/upload", {
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
      toast.success("Portrait uploaded")
      router.refresh()
    })
  }

  function handleGenerate() {
    if (!canUseAI) {
      showAiLimitToast({
        description: "Start the author plan to generate AI portraits.",
        onUpgrade,
      })
      return
    }

    startGenerate(async () => {
      const response = await fetch("/api/generate-outcome-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_id: quizId,
          outcome_id: outcomeId,
          style_id: styleId,
          art_direction: artDirection.trim() || undefined,
        }),
      })

      const payload = (await response.json()) as {
        image_url?: string
        error?: string
      }

      if (!response.ok || !payload.image_url) {
        if (
          payload.error === "SUBSCRIPTION_REQUIRED" ||
          payload.error === "AI_LIMIT_REACHED"
        ) {
          showAiLimitToast({
            description: "Start the author plan to unlock AI portraits.",
            onUpgrade,
          })
          return
        }

        toast.error(payload.error ?? "Could not generate portrait.")
        return
      }

      onImageChange(payload.image_url)
      toast.success("Portrait generated")
      router.refresh()
    })
  }

  function handleRemove() {
    startRemove(async () => {
      const response = await fetch("/api/outcome-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome_id: outcomeId }),
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        toast.error(payload.error ?? "Could not remove portrait.")
        return
      }

      onImageChange(null)
      toast.success("Portrait removed")
      router.refresh()
    })
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Portrait</p>
          <p className="text-xs text-muted-foreground">
            Upload an image or generate one with AI.
          </p>
        </div>
        {imageUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove portrait"
            disabled={isRemoving}
            onClick={handleRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>

      {imageUrl ? (
        <div className="relative aspect-square w-full max-w-40 overflow-hidden rounded-lg border border-border/60">
          <Image
            src={imageUrl}
            alt="Outcome portrait"
            fill
            className="object-cover"
            unoptimized
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

      <div className="flex flex-wrap gap-2">
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
          Upload
        </Button>
      </div>

      {canUseAI ? (
        <div className="space-y-3 border-t border-border/60 pt-4">
          <Field>
            <FieldLabel htmlFor={`style-${outcomeId}`}>AI art style</FieldLabel>
            <select
              id={`style-${outcomeId}`}
              value={styleId}
              onChange={(event) =>
                setStyleId(
                  event.target.value as (typeof OUTCOME_IMAGE_STYLES)[number]["id"]
                )
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {OUTCOME_IMAGE_STYLES.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.label}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`direction-${outcomeId}`}>
              Art direction (optional)
            </FieldLabel>
            <FieldDescription>
              Extra details for the portrait, e.g. &ldquo;wearing a red cloak&rdquo;.
            </FieldDescription>
            <Input
              id={`direction-${outcomeId}`}
              value={artDirection}
              onChange={(event) => setArtDirection(event.target.value)}
              placeholder="Optional visual details..."
            />
          </Field>
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            disabled={isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Sparkles data-icon="inline-start" />
            )}
            {isGenerating ? "Generating..." : "Generate portrait"}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
