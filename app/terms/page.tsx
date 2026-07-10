import type { Metadata } from "next"

import { LegalDocument } from "@/components/legal/legal-document"
import { TERMS_PATH } from "@/lib/seo/site"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing your use of QuizzyTales, including accounts, subscriptions, quiz publishing, and acceptable use.",
  alternates: {
    canonical: TERMS_PATH,
  },
}

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      description="The rules for using QuizzyTales as an author or reader."
      lastUpdated="July 9, 2026"
    >
      <section>
        <h2>Agreement</h2>
        <p>
          By accessing or using QuizzyTales, you agree to these Terms of Service.
          If you do not agree, do not use the service.
        </p>
      </section>

      <section>
        <h2>The service</h2>
        <p>
          QuizzyTales lets authors create, edit, preview, and publish
          book-themed personality quizzes. Readers may take published quizzes
          without creating an account. Features and pricing may change as the
          product evolves.
        </p>
      </section>

      <section>
        <h2>Accounts</h2>
        <ul>
          <li>You must provide accurate account information and keep it current.</li>
          <li>You are responsible for activity under your account.</li>
          <li>
            You must be at least 18 years old to create an author account.
          </li>
        </ul>
      </section>

      <section>
        <h2>Subscriptions and billing</h2>
        <ul>
          <li>
            Paid plans are billed through Stripe on a recurring basis unless
            canceled.
          </li>
          <li>
            Drafting features may be available for free; publishing live quizzes
            requires an active subscription as described on our pricing page.
          </li>
          <li>
            Fees are generally non-refundable except where required by law or
            explicitly stated otherwise.
          </li>
        </ul>
      </section>

      <section>
        <h2>Your content</h2>
        <ul>
          <li>You retain ownership of the quizzes, text, and images you upload.</li>
          <li>
            You grant QuizzyTales a limited license to host, display, and process
            your content solely to operate the service.
          </li>
          <li>
            You represent that you have the rights needed to publish your quiz
            content, including any book-related material and images.
          </li>
        </ul>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the service for unlawful, infringing, or harmful content.</li>
          <li>Attempt to access other users&apos; accounts or private data.</li>
          <li>Interfere with the platform&apos;s security or performance.</li>
          <li>Scrape, resell, or misrepresent QuizzyTales without permission.</li>
        </ul>
      </section>

      <section>
        <h2>AI-generated content</h2>
        <p>
          Quiz drafts and revisions may be generated with AI assistance. You are
          responsible for reviewing, editing, and publishing content before readers
          see it. We do not guarantee that generated content is accurate or
          suitable for every audience.
        </p>
      </section>

      <section>
        <h2>Termination</h2>
        <p>
          You may stop using QuizzyTales at any time and may delete your account
          from dashboard settings. We may suspend or terminate access if you violate
          these terms or if necessary to protect the service or other users.
        </p>
      </section>

      <section>
        <h2>Disclaimers</h2>
        <p>
          QuizzyTales is provided &ldquo;as is&rdquo; without warranties of any
          kind. We do not guarantee uninterrupted availability, specific
          engagement results, or that the service will meet every publishing need.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, QuizzyTales will not be liable
          for indirect, incidental, special, consequential, or punitive damages,
          or for lost profits or data arising from your use of the service.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these terms from time to time. Continued use after changes
          become effective constitutes acceptance of the revised terms.
        </p>
      </section>
    </LegalDocument>
  )
}
