import { cn } from "@/lib/utils"

type SectionHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: "left" | "center"
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        align === "center" && "text-center",
        align === "center" && description && "mx-auto max-w-xl",
        align === "left" && "max-w-2xl",
        className
      )}
    >
      {eyebrow ? (
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-3xl tracking-tight md:text-4xl",
          eyebrow && "mt-3"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-muted-foreground",
            align === "center" ? "mt-4" : "mt-5 text-lg leading-relaxed"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
