# Data Fetching & Mutation Standards

## 1. Data Fetching (Reads)

### Server Components ONLY

ALL data fetching must be performed inside **Server Components**. This is the single most important architectural rule in this project.

- **DO NOT** fetch data via Route Handlers (`app/api/`), Client Components (`"use client"`), `useEffect`, or any client-side library (SWR, React Query, etc.).
- Server Components call centralized data helpers (see below) and pass the results as props to Client Components when interactivity is needed.

### Centralized Helper Functions

All database queries must live in dedicated helper functions inside the **`/data`** directory (e.g., `src/data/recipes.ts`, `src/data/notes.ts`).

- **DO NOT** write database queries directly inside Server Components, layouts, or pages.
- Each helper function should accept explicit parameters (filters, pagination) and return typed results.
- Group helpers by domain entity — one file per entity or closely related group.

### Drizzle ORM ONLY

Always use **Drizzle ORM** to query the database.

- **ABSOLUTELY DO NOT** use raw SQL strings, `sql`-tagged templates for full queries, or any other ORM/query builder.
- Use Drizzle's query builder API (`db.select()`, `db.query.*`) for all reads.

## 2. Data Mutations (Writes)

### Server Actions

All data mutations (create, update, delete) must be handled exclusively via **Server Actions** (`"use server"`) placed in the **`/actions`** directory (e.g., `src/actions/recipes.ts`).

- **DO NOT** mutate data via Route Handlers, client-side fetches, or inline server functions.
- Server Actions must validate input before writing to the database.

### Cache Revalidation

After any successful Server Action that mutates data, you **MUST** call `revalidatePath` (or `revalidateTag` where appropriate) to clear the cache and ensure the UI reflects the latest state.

```ts
import { revalidatePath } from "next/cache";

// After a successful mutation:
revalidatePath("/recipes");
```

## 3. Performance & Optimization

### Pagination & Limits

Never fetch unbounded lists from the database. Always use `.limit()` and implement pagination.

- Default page size: **20 items**.
- Every data helper that returns a list must accept `limit` and `offset` (or cursor-based) parameters.
- Pages and Server Components must pass pagination parameters down to data helpers.

### Prevent N+1 Query Problem

When fetching lists with related data, use Drizzle's **relational queries** (`db.query.*.findMany({ with: { ... } })`) or explicit **JOINs** to fetch everything in a single database round-trip.

- **DO NOT** loop over a list and execute a query per item.
- Prefer `with: { ... }` for straightforward relations and `innerJoin`/`leftJoin` for complex filtering.

### Optimistic UI

For small, frequent user interactions (toggling a status, liking, adding to grocery list), implement **optimistic updates** using React's `useOptimistic` hook.

- Update the UI immediately before awaiting the Server Action response.
- Roll back the optimistic state if the action returns an error.

## 4. Stability & Reliability

### Database Transactions

When a mutation writes to **multiple tables**, it **MUST** be wrapped in a Drizzle `db.transaction()` call to ensure all-or-nothing atomicity.

```ts
await db.transaction(async (tx) => {
  await tx.insert(recipes).values(recipeData);
  await tx.insert(ingredients).values(ingredientRows);
});
```

- If any step inside the transaction throws, the entire operation rolls back automatically.

### Strict Error Handling

All data helpers and Server Actions must be wrapped in `try/catch` blocks and return a **standardized result object**.

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

- On success: return `{ success: true, data: ... }`.
- On failure: catch the error, log it server-side, and return `{ success: false, error: "הודעת שגיאה למשתמש" }`.
- **DO NOT** let unhandled database errors propagate to the client or crash the application.
