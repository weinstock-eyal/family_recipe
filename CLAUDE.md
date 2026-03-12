# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Family Recipe ("מתכונים משפחתיים") — a private, Hebrew-language (RTL) web app for sharing family recipes. Core design principle: **zero-friction input** for older users (snap a photo, add a title, save). Recipes can be image-only or fully structured with ingredients.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npx drizzle-kit push # Push schema changes to Supabase PostgreSQL
npx tsx src/db/seed.ts # Seed database with example data
```

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Database**: PostgreSQL (Supabase-hosted) + Drizzle ORM
- **Styling**: Tailwind CSS 4 + shadcn/ui (base-nova style, `@base-ui/react`)
- **Auth**: JWT via `jose`, httpOnly cookie (`family_session`), shared family code
- **Icons**: lucide-react

## Architecture

### Database (`src/db/`)
- `schema.ts` — Three tables: `recipes`, `familyNotes`, `groceryListItems`. Ingredients/instructions/tags stored as JSONB arrays. `Ingredient` type exported here.
- `index.ts` — Singleton `db` instance using `drizzle(DATABASE_URL, { schema })`.
- `seed.ts` — Populates tables with 5 Hebrew example recipes and notes.

### Auth (`src/lib/auth.ts` + `middleware.ts`)
- `createSession(displayName)` / `verifySession()` / `getDisplayName()` / `destroySession()` — JWT-based session in httpOnly cookie.
- `validateFamilyCode(code)` — Checks against `FAMILY_CODE` env var.
- `middleware.ts` — Protects all routes except `/login` and `/api/auth/login`. Redirects unauthenticated users.
- Login endpoint: `app/api/auth/login/route.ts` (POST).

### Conditional UI Logic (Critical)
- If `recipe.ingredients?.length > 0` → show quantity multiplier (x0.5, x1, x2) and "Add to Grocery List" button.
- If no structured ingredients → hide multiplier/grocery features, show only media + title + social. Show "Extract Ingredients with AI" placeholder button.

### Path Alias
`@/*` maps to project root (e.g., `import { db } from "@/src/db"`).

## Environment Variables (`.env`)

```
DATABASE_URL     # Supabase PostgreSQL connection string (?sslmode=require required)
FAMILY_CODE      # Shared family login code
SESSION_SECRET   # JWT signing secret
```

## Conventions

- **Language**: All UI text, labels, placeholders, and error messages in Hebrew.
- **RTL**: Root `<html lang="he" dir="rtl">` with Heebo font. Tailwind handles most RTL automatically.
- **Data mutations**: Use Next.js Server Actions (`src/actions/`). API Routes only for auth and file uploads.
- **Component library**: shadcn/ui components in `components/ui/`. Use `cn()` from `src/lib/utils.ts` for class merging.
- **`uploaded_by` field**: A display name string (e.g., "אמא", "יעל"), not a numeric user ID.
