# Data Fetching Standards (Reads Only)

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

## 2. Performance & Optimization

### Pagination & Limits

Never fetch unbounded lists from the database. Always use `.limit()` and implement pagination.

- Default page size: **20 items**.
- Every data helper that returns a list must accept `limit` and `offset` (or cursor-based) parameters.
- Pages and Server Components must pass pagination parameters down to data helpers.

### Prevent N+1 Query Problem

When fetching lists with related data, use Drizzle's **relational queries** (`db.query.*.findMany({ with: { ... } })`) or explicit **JOINs** to fetch everything in a single database round-trip.

- **DO NOT** loop over a list and execute a query per item.
- Prefer `with: { ... }` for straightforward relations and `innerJoin`/`leftJoin` for complex filtering.

