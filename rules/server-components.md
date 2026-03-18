# Next.js 15+ Server Components Standards

---

## 1. Next.js 15 Async APIs (CRITICAL)

### Awaiting Params & SearchParams

This is a Next.js 15+ project. The `params` and `searchParams` props in Pages, Layouts, and Route Handlers are **asynchronous (Promises)**. You MUST ALWAYS `await` them before destructuring or accessing their properties.

```tsx
// ✅ Correct
export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}

// ❌ Wrong — will cause runtime errors
export default async function RecipePage({ params }: { params: { id: string } }) {
  const { id } = params; // NOT awaited
}
```

- This applies to **all** `page.tsx`, `layout.tsx`, `route.ts`, and `generateMetadata` functions.
- Always type params as `Promise<{ ... }>`.

### Awaiting Dynamic Functions

The `cookies()`, `headers()`, and `draftMode()` functions from `next/headers` are **asynchronous**. You MUST `await` them before using their methods.

```ts
import { cookies } from "next/headers";

// ✅ Correct
const cookieStore = await cookies();
const session = cookieStore.get("family_session");

// ❌ Wrong
const session = cookies().get("family_session");
```

### Async `generateMetadata`

The `generateMetadata` function receives async `params` as well. Always await them.

```tsx
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  return { title: recipe?.title ?? "מתכון" };
}
```

---

## 2. Default Caching Behavior

### Uncached by Default

In Next.js 15+, `fetch` requests, `GET` Route Handlers, and client navigations are **UNCACHED by default**. This is a breaking change from Next.js 14.

- Do not assume any response is cached unless you explicitly opted in.
- If a component requires caching for performance, explicitly opt-in using:
  - React's `cache()` function for deduplicating repeated calls within a single render pass.
  - `unstable_cache` / `cacheLife` / `cacheTag` for cross-request caching.
  - `export const revalidate = N` for time-based page-level revalidation.
- When using `revalidatePath` or `revalidateTag` in Server Actions, remember you are invalidating cache that was **explicitly** set — there is no implicit cache to invalidate.

---

## 3. Server-First & Client Boundaries

### Server Components by Default

All components are Server Components unless explicitly marked otherwise. **DO NOT** use the following in Server Components:

- React hooks: `useState`, `useEffect`, `useRef`, `useReducer`, `useCallback`, `useMemo`, etc.
- Browser APIs: `window`, `document`, `localStorage`, `navigator`, etc.
- Event handlers: `onClick`, `onChange`, `onSubmit`, etc.

### Push "use client" to the Leaves

Keep the `"use client"` directive as **low in the component tree as possible**. Do not make an entire page a Client Component just because one button needs interactivity.

```tsx
// ✅ Correct — page is a Server Component, only the interactive button is a Client Component
// app/recipes/[id]/page.tsx (Server Component)
export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  return (
    <div>
      <h1>{recipe.title}</h1>
      <LikeButton recipeId={id} />  {/* small Client Component */}
    </div>
  );
}

// ❌ Wrong — entire page is a Client Component
"use client";
export default function RecipePage() { ... }
```

### Composition Pattern: Server Children in Client Parents

When a Client Component needs to wrap Server Component content, pass the server content as `children` instead of importing it inside the Client Component.

```tsx
// ✅ Correct — Server Component passed as children
// layout.tsx (Server Component)
<InteractiveDrawer>
  <ServerRenderedContent />
</InteractiveDrawer>

// ❌ Wrong — importing Server Component inside Client Component
"use client";
import { ServerRenderedContent } from "./server-content";
export function InteractiveDrawer() {
  return <div><ServerRenderedContent /></div>; // Will be forced to client!
}
```

---

## 4. Passing Data (Serialization)

### Plain Objects Only

When passing data (props) from a Server Component to a Client Component, the data **MUST be serializable**. The Next.js serialization boundary only supports:

- Primitives: `string`, `number`, `boolean`, `null`, `undefined`
- Plain objects and arrays (no class instances)
- `Date` objects (serialized as ISO strings)
- `Map`, `Set` (supported in React 19)
- Server Actions (functions marked with `"use server"`)

**DO NOT pass:**

- Class instances or Drizzle ORM result objects with methods
- Functions (except Server Actions)
- Symbols, `RegExp`, or `Error` objects

```tsx
// ✅ Correct — pass a plain object
const recipe = await getRecipeById(id);
<RecipeForm initialData={{ title: recipe.title, ingredients: recipe.ingredients }} />

// ❌ Wrong — passing raw ORM result that may contain non-serializable fields
<RecipeForm initialData={recipe} />
```

---

## 5. Protecting Server-Only Code

### Use the `server-only` Package

Files that contain sensitive logic (database queries, secrets, auth helpers) MUST import the `server-only` package to prevent accidental inclusion in client bundles.

```ts
// src/data/recipes.ts
import "server-only";
import { db } from "@/src/db";

export async function getRecipeById(id: string) { ... }
```

- If a Client Component accidentally imports a `server-only` file, the build will fail with a clear error — this is the desired behavior.
- All files in `src/data/` and `src/lib/auth.ts` should include this import.

---

## 6. Streaming & Suspense

### Use Suspense for Slow Data

Wrap slow-loading Server Components in `<Suspense>` boundaries to enable streaming and show a fallback UI while data loads.

```tsx
import { Suspense } from "react";

export default function RecipesPage() {
  return (
    <div>
      <h1>מתכונים</h1>
      <Suspense fallback={<RecipeListSkeleton />}>
        <RecipeList />  {/* async Server Component */}
      </Suspense>
    </div>
  );
}
```

- Place `<Suspense>` boundaries strategically — each boundary creates a streaming chunk.
- Use skeleton components (shadcn/ui `Skeleton`) as fallbacks for a polished loading experience.
- Avoid wrapping every component — only wrap those with meaningful data-fetching delays.

### loading.tsx & error.tsx

- `loading.tsx` — provides an automatic `<Suspense>` boundary for the entire route segment. Use it for page-level loading states.
- `error.tsx` — must be a **Client Component** (`"use client"`). It catches errors thrown during rendering of the route segment.

```tsx
// app/recipes/error.tsx
"use client";

export default function RecipesError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="text-center p-8">
      <p className="text-destructive">שגיאה בטעינת המתכונים</p>
      <Button onClick={reset}>נסה שנית</Button>
    </div>
  );
}
```

---

## 7. Dynamic vs. Static Rendering

### Understand What Triggers Dynamic Rendering

A route becomes **dynamically rendered** (no static generation) when it uses:

- `cookies()`, `headers()`, or `draftMode()`
- `searchParams` prop
- `await` on uncached data fetches

Since this project uses auth via cookies on most pages, most routes will be dynamic. This is expected — do not fight it.

### Force Static When Possible

For public, non-auth pages (if any), you can force static rendering:

```ts
export const dynamic = "force-static";
```

- Do not use `force-static` on pages that read cookies or session data — it will break auth.

---

## 8. Forbidden Patterns

| Pattern | Why It's Forbidden |
|---------|-------------------|
| `"use client"` on a page or layout | Kills SSR benefits. Isolate interactivity into child components. |
| `useEffect` for data fetching | Violates server-first architecture. See `rules/data-fetching.md`. |
| Importing `server-only` files in Client Components | Exposes server secrets to the browser. |
| Passing non-serializable props across the server/client boundary | Causes hydration errors or runtime crashes. |
| Accessing `params` or `searchParams` without `await` | Next.js 15 breaking change — will throw at runtime. |
| Calling `cookies()`/`headers()` without `await` | Next.js 15 breaking change — will throw at runtime. |
