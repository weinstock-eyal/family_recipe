# Data Mutations (Create, Update, Delete) Standards

---

## 1. Server Actions & Architecture

### Colocated Actions

ALL data mutations MUST be implemented as **Server Actions** (`"use server"`).

- Place actions in a file named **`actions.ts`** colocated with the UI component that calls them (e.g., `app/recipes/[id]/actions.ts` next to `page.tsx`).
- **DO NOT** place mutation logic inside Route Handlers, Client Components, `useEffect`, or inline server functions.

### Helper Functions in `src/data`

Server Actions MUST NOT interact with the database directly. They must call **helper functions** located in the **`src/data`** directory (e.g., `src/data/recipes.ts`).

```
app/recipes/[id]/actions.ts   →   src/data/recipes.ts   →   db
        (validation + auth)          (Drizzle query)
```

- One helper file per domain entity or closely related group.
- Helpers accept explicit, typed parameters and return typed results.

### Drizzle ORM Only

Helper functions in `src/data` MUST use **Drizzle ORM** for all database operations.

- **ABSOLUTELY DO NOT** use raw SQL strings, `sql`-tagged templates for full queries, or any other ORM/query builder.
- Use Drizzle's mutation API: `db.insert()`, `db.update()`, `db.delete()`.

---

## 2. Type Safety & Validation

### No FormData

Server Action parameters MUST be **strongly typed**. DO NOT use the native `FormData` type as an argument.

```ts
// ✅ Correct
async function createRecipe(input: CreateRecipeInput) { ... }

// ❌ Wrong
async function createRecipe(formData: FormData) { ... }
```

### Zod Validation

ALL Server Actions MUST validate their arguments using **Zod** before executing any database call.

```ts
import { z } from "zod";

const CreateRecipeSchema = z.object({
  title: z.string().min(1, "שם המתכון נדרש"),
  imageUrl: z.string().url().optional(),
  ingredients: z.array(IngredientSchema).optional(),
});

export async function createRecipe(input: z.infer<typeof CreateRecipeSchema>) {
  "use server";

  const parsed = CreateRecipeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // ... proceed with parsed.data
}
```

- Define Zod schemas alongside the action that uses them, or in a shared `schemas.ts` file when reused across multiple actions.
- Use Hebrew error messages in Zod schemas for user-facing validation.

---

## 3. Authorization & Ownership

For full authorization rules see **`rules/authorization.md`**. In summary: every mutating Server Action must call `getDisplayName()` and verify resource ownership before update/delete operations.

---

## 4. Database Integrity & Preservation

### Database Transactions

When a mutation writes to **multiple tables**, it MUST be wrapped in a Drizzle **`db.transaction()`** call to ensure all-or-nothing atomicity.

```ts
await db.transaction(async (tx) => {
  const [recipe] = await tx.insert(recipes).values(recipeData).returning();
  await tx.insert(ingredients).values(
    ingredientRows.map((row) => ({ ...row, recipeId: recipe.id }))
  );
});
```

- If any step inside the transaction throws, the entire operation rolls back automatically.
- Pass `tx` (not `db`) to all queries within the transaction scope.

### Soft Deletes

**DO NOT** hard-delete records using `DELETE` statements. Implement soft deletes instead.

- Every deletable table must have a `deletedAt` column (`timestamp`, nullable, default `null`).
- "Delete" operations set `deletedAt` to the current timestamp.
- All read queries must filter out soft-deleted records (`WHERE deletedAt IS NULL`).

```ts
// ✅ Soft delete
await db
  .update(recipes)
  .set({ deletedAt: new Date() })
  .where(eq(recipes.id, recipeId));

// ❌ Hard delete — DO NOT use
await db.delete(recipes).where(eq(recipes.id, recipeId));
```

---

## 5. UX & State Management

### Pending States

Client Components that trigger Server Actions MUST handle pending/loading states.

- Use **`useActionState`** (React 19) or **`useFormStatus`** to track pending state.
- Disable submit buttons while the mutation is in flight to prevent duplicate submissions.

```tsx
"use client";

import { useActionState } from "react";

function RecipeForm() {
  const [state, action, isPending] = useActionState(createRecipe, null);

  return (
    <form action={action}>
      {/* ... fields ... */}
      <Button type="submit" disabled={isPending}>
        {isPending ? "שומר..." : "שמירה"}
      </Button>
    </form>
  );
}
```

### Cache Revalidation

After any successful mutation, you MUST call **`revalidatePath`** to clear the Next.js cache and ensure the UI reflects the latest state.

```ts
import { revalidatePath } from "next/cache";

// After successful mutation:
revalidatePath("/recipes");
```

- Use `revalidatePath` for path-based invalidation.
- Use `revalidateTag` when more granular cache control is needed.

### Optimistic UI

For small, frequent user interactions (toggling a status, liking, adding to grocery list), implement **optimistic updates** using React's `useOptimistic` hook.

- Update the UI immediately before awaiting the Server Action response.
- Roll back the optimistic state if the action returns an error.

### Return Updated Data

Upon a successful mutation, the Server Action SHOULD return the newly created or updated object. This allows the client to update the UI immediately without a subsequent read query.

```ts
const [newRecipe] = await tx.insert(recipes).values(data).returning();
revalidatePath("/recipes");
return { success: true, data: newRecipe };
```

---

## 6. Error Handling

### Standardized Response Object

All Server Actions MUST return a **standardized result object**:

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### Try/Catch Blocks

All Server Actions MUST be wrapped in `try/catch` blocks. They must **never** crash the application or let unhandled errors propagate to the client.

```ts
export async function createRecipe(
  input: CreateRecipeInput
): Promise<ActionResult<Recipe>> {
  "use server";

  try {
    const parsed = CreateRecipeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const currentUser = await getDisplayName();

    const newRecipe = await insertRecipe({ ...parsed.data, uploadedBy: currentUser });

    revalidatePath("/recipes");
    return { success: true, data: newRecipe };
  } catch (error) {
    console.error("createRecipe failed:", error);
    return { success: false, error: "שגיאה בשמירת המתכון" };
  }
}
```

- On success: return `{ success: true, data: ... }`.
- On failure: log the error server-side and return `{ success: false, error: "הודעה בעברית" }` with a Hebrew user-facing message.
