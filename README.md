# QuizzyTales

Production deploys apply pending files in `supabase/migrations` before the Next.js build. Preview deploys do not. Setup, required Vercel environment variables, and baselining an existing database are documented in [docs/vercel-supabase-migrations.md](docs/vercel-supabase-migrations.md).

# Next.js template

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```
