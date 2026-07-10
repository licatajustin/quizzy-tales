import type { Metadata } from "next"

import { LegalDocument } from "@/components/legal/legal-document"
import { PRIVACY_PATH } from "@/lib/seo/site"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How QuizzyTales collects, uses, and protects your data when you create book quizzes or take them as a reader.",
  alternates: {
    canonical: PRIVACY_PATH,
  },
}

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="How we handle your information when you use QuizzyTales."
      lastUpdated="July 9, 2026"
    >
      <section>
        <h2>Overview</h2>
        <p>
          QuizzyTales (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
          provides tools for authors to create and publish book-themed personality
          quizzes. This policy explains what information we collect, how we use it,
          and the choices you have.
        </p>
      </section>

      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Author accounts:</strong> email address, display name, and
            authentication data when you sign up or sign in.
          </li>
          <li>
            <strong>Quiz content:</strong> book titles, synopses, quiz questions,
            outcomes, images, and publishing settings you provide.
          </li>
          <li>
            <strong>Reader activity:</strong> anonymous quiz starts, completions,
            shares, and outcome selections. Readers do not need accounts.
          </li>
          <li>
            <strong>Billing:</strong> subscription and payment details processed
            by Stripe. We do not store full payment card numbers on our servers.
          </li>
          <li>
            <strong>Technical data:</strong> browser type, device information, IP
            address, and usage logs needed to operate and secure the service.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use information</h2>
        <ul>
          <li>Provide, maintain, and improve the QuizzyTales platform.</li>
          <li>Authenticate authors and manage subscriptions.</li>
          <li>Generate quiz drafts and revisions when you use AI features.</li>
          <li>Show authors analytics about quiz engagement.</li>
          <li>Respond to support requests and enforce our terms.</li>
          <li>Protect against fraud, abuse, and security incidents.</li>
        </ul>
      </section>

      <section>
        <h2>Third-party services</h2>
        <p>
          We use trusted providers to run QuizzyTales, including Supabase (hosting,
          database, and authentication), Stripe (payments), and Vercel (application
          hosting). These providers process data according to their own privacy
          policies and our agreements with them.
        </p>
      </section>

      <section>
        <h2>Cookies and local storage</h2>
        <p>
          We use cookies and similar technologies for authentication, preferences,
          and anonymous reader identifiers used in quiz analytics. You can control
          cookies through your browser settings, though some features may not work
          without them.
        </p>
      </section>

      <section>
        <h2>Data retention</h2>
        <p>
          We retain account and quiz data while your account is active. If you
          delete your account, we remove or anonymize associated personal data
          within a reasonable period, except where retention is required for
          legal, billing, or security purposes.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          Depending on where you live, you may have rights to access, correct,
          delete, or export your personal data. Authors can update account details
          in dashboard settings and request account deletion from the account
          settings page.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          QuizzyTales is intended for authors aged 18 and older. Published quizzes
          may be taken by readers of any age, but we do not knowingly collect
          personal information from children under 13.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update this policy from time to time. We will post the revised
          version on this page and update the &ldquo;Last updated&rdquo; date
          above.
        </p>
      </section>
    </LegalDocument>
  )
}
