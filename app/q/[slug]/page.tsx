import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { JsonLd } from "@/components/seo/json-ld"
import { QuizIntroHero } from "@/components/quiz/quiz-intro-hero"
import { QuizPlayer } from "@/components/quiz/quiz-player"
import { QuizPublicFooter } from "@/components/quiz/quiz-public-footer"
import { QuizSeoContent } from "@/components/quiz/quiz-seo-content"
import { buildQuizPageSchema } from "@/lib/seo/json-ld"
import { getPublicQuizBySlug } from "@/lib/quiz/public-quiz"
import type { PublishedQuizSnapshot } from "@/lib/quiz/types"

type PublicQuizPageProps = {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

function buildQuizMetadata(snapshot: PublishedQuizSnapshot, slug: string): Metadata {
  const title = `${snapshot.quiz_title} — ${snapshot.book_title}`
  const description = `Which character from "${snapshot.book_title}" are you? Take the ${snapshot.quiz_title} quiz.`
  const url = `/q/${slug}`
  const coverImageUrl = snapshot.cover_image_url

  return {
    title: {
      absolute: title,
    },
    description,
    openGraph: {
      title: snapshot.quiz_title,
      description,
      url,
      type: "website",
      ...(coverImageUrl
        ? {
            images: [
              {
                url: coverImageUrl,
                width: 1200,
                height: 900,
                alt: `Cover for ${snapshot.quiz_title}`,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: coverImageUrl ? "summary_large_image" : "summary",
      title: snapshot.quiz_title,
      description,
      ...(coverImageUrl ? { images: [coverImageUrl] } : {}),
    },
    alternates: {
      canonical: url,
    },
  }
}

export async function generateMetadata({
  params,
}: PublicQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  const quiz = await getPublicQuizBySlug(slug)
  const snapshot = quiz?.published_snapshot as PublishedQuizSnapshot | null

  if (!snapshot) {
    return { title: "Quiz not found" }
  }

  return buildQuizMetadata(snapshot, slug)
}

export default async function PublicQuizPage({ params }: PublicQuizPageProps) {
  const { slug } = await params
  const quiz = await getPublicQuizBySlug(slug)
  const snapshot = quiz?.published_snapshot as PublishedQuizSnapshot | null

  if (!quiz || !snapshot) {
    notFound()
  }

  const questionCount = snapshot.questions.length
  const outcomeCount = snapshot.outcomes.length
  const description = `Which character from "${snapshot.book_title}" are you? Take the ${snapshot.quiz_title} quiz.`
  const outcomeNames = snapshot.outcomes.map((outcome) => outcome.name)

  return (
    <div className="min-h-svh bg-background">
      <JsonLd
        data={buildQuizPageSchema({
          slug,
          quizTitle: snapshot.quiz_title,
          bookTitle: snapshot.book_title,
          description,
          outcomeNames,
        })}
      />
      <QuizPlayer quizId={quiz.id} snapshot={snapshot}>
        <QuizIntroHero
          snapshot={snapshot}
          questionCount={questionCount}
          outcomeCount={outcomeCount}
        />
      </QuizPlayer>
      <QuizSeoContent snapshot={snapshot} />
      <QuizPublicFooter />
    </div>
  )
}
