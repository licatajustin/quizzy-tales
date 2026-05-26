import { cn } from "@/lib/utils"

type MarketingSectionProps = {
  id?: string
  className?: string
  containerClassName?: string
  children: React.ReactNode
}

export function MarketingSection({
  id,
  className,
  containerClassName,
  children,
}: MarketingSectionProps) {
  return (
    <section id={id} className={className}>
      <div
        className={cn("mx-auto max-w-6xl px-6", containerClassName)}
      >
        {children}
      </div>
    </section>
  )
}
