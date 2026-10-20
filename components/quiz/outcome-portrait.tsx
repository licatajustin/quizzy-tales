import Image from "next/image"
import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

export const outcomeCastFrameClass =
  "group overflow-hidden rounded-2xl border border-border/70 bg-card text-left shadow-sm outline-none transition-[border-color,box-shadow,transform] duration-200 hover:border-primary/50 hover:shadow-md focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-safe:hover:-translate-y-1 motion-safe:focus-visible:-translate-y-1 motion-reduce:transition-none"

export function outcomeInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return "?"
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

export function portraitHue(seed: string) {
  const source = seed.trim() || "?"
  let hash = 0

  for (let index = 0; index < source.length; index += 1) {
    hash = (Math.imul(hash, 31) + source.charCodeAt(index)) >>> 0
  }

  return hash % 360
}

type OutcomePortraitProps = {
  name: string
  imageUrl: string | null
  alt?: string
  sizes?: string
  priority?: boolean
  className?: string
  initialsClassName?: string
}

export function OutcomePortrait({
  name,
  imageUrl,
  alt = "",
  sizes,
  priority = false,
  className,
  initialsClassName,
}: OutcomePortraitProps) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-cover", className)}
        unoptimized={imageUrl.startsWith("data:")}
      />
    )
  }

  const hue = portraitHue(name)

  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        className
      )}
    >
      <div
        className="absolute inset-0 dark:brightness-[0.62]"
        style={{
          backgroundImage: `linear-gradient(145deg, oklch(0.92 0.05 ${hue}), oklch(0.74 0.09 ${(hue + 48) % 360}))`,
        }}
      />
      <span className="absolute size-2/3 rounded-full bg-white/40 blur-2xl dark:bg-white/10" />
      <span
        className={cn(
          "relative text-4xl font-semibold tracking-tight text-foreground/80",
          initialsClassName
        )}
      >
        {outcomeInitials(name)}
      </span>
    </div>
  )
}

const portraitMotionClass =
  "motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-105 motion-safe:group-focus-visible:scale-105 motion-reduce:transition-none"

type OutcomeCastCardProps = {
  name: string
  tagline: string
  imageUrl: string | null
  nameId?: string
  taglineId?: string
  nameTag?: "h4" | "p"
  className?: string
}

export function OutcomeCastCard({
  name,
  tagline,
  imageUrl,
  nameId,
  taglineId,
  nameTag = "p",
  className,
}: OutcomeCastCardProps) {
  const NameTag = nameTag

  return (
    <div className={cn("flex h-full w-full min-w-0 flex-col", className)}>
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        <OutcomePortrait
          name={name}
          imageUrl={imageUrl}
          alt=""
          sizes="(max-width: 640px) 46vw, 18rem"
          className={portraitMotionClass}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3 py-3">
        <NameTag
          id={nameId}
          className="line-clamp-2 text-base leading-snug font-semibold tracking-tight text-foreground"
        >
          {name}
        </NameTag>
        {tagline ? (
          <p
            id={taglineId}
            className="line-clamp-3 text-sm leading-snug text-pretty text-muted-foreground"
          >
            {tagline}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function visibleOutcomeLine(value: unknown) {
  if (typeof value !== "string") {
    return ""
  }

  return value.replace(/\u00a0/g, " ").trim()
}

export function castCardColumns(count: number) {
  if (count <= 1) {
    return "mx-auto w-full max-w-xs grid-cols-1"
  }

  if (count === 2 || count === 4) {
    return "grid-cols-2"
  }

  return "grid-cols-2 sm:grid-cols-3"
}

export function CastCardGrid({
  count,
  children,
  className,
  ...props
}: {
  count: number
  children: ReactNode
  className?: string
} & Omit<ComponentProps<"ul">, "children" | "className">) {
  return (
    <ul
      className={cn(
        "m-0 grid list-none gap-3 p-0",
        castCardColumns(count),
        className
      )}
      {...props}
    >
      {children}
    </ul>
  )
}
