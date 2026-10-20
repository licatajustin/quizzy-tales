import Image from "next/image"

import { readThemeLogoUrl } from "@/lib/quiz/theme"

type QuizAuthorLogoProps = {
  logoUrl: string | null | undefined
  alt: string
  className?: string
}

export function QuizAuthorLogo({
  logoUrl,
  alt,
  className,
}: QuizAuthorLogoProps) {
  const src = readThemeLogoUrl(logoUrl)
  if (!src) {
    return null
  }

  return (
    <div className={className ?? "flex justify-center"}>
      <Image
        src={src}
        alt={alt}
        width={280}
        height={72}
        className="h-12 w-auto max-w-[14rem] object-contain"
        unoptimized={src.startsWith("data:") || src.includes(".svg")}
      />
    </div>
  )
}
