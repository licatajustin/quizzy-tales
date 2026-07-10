import { ImageResponse } from "next/og"

export const alt = "QuizzyTales — Personality quizzes for authors"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(145deg, #f7f3ee 0%, #efe8df 45%, #e8dcc8 100%)",
          color: "#2c2419",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 28,
            letterSpacing: "-0.02em",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#d4a853",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            Q
          </div>
          QuizzyTales
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: 900,
            }}
          >
            Personality quizzes for authors
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.4,
              color: "#5c4f3d",
              maxWidth: 820,
            }}
          >
            Create book-themed &ldquo;Which character are you?&rdquo; quizzes
            your readers will share.
          </div>
        </div>

        <div style={{ fontSize: 22, color: "#7a6a55" }}>
          quizzytales.com
        </div>
      </div>
    ),
    { ...size }
  )
}
