import { db } from "@/src/db";
import { groceryListItems, recipes } from "@/src/db/schema";
import type { Ingredient } from "@/src/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";

const DEFAULT_PAGE_SIZE = 20;

export async function getGroceryItems({
  sessionId,
  limit = DEFAULT_PAGE_SIZE,
  offset = 0,
}: {
  sessionId: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const data = await db
      .select({
        id: groceryListItems.id,
        sessionId: groceryListItems.sessionId,
        recipeId: groceryListItems.recipeId,
        item: groceryListItems.item,
        amount: groceryListItems.amount,
        unit: groceryListItems.unit,
        checked: groceryListItems.checked,
        createdAt: groceryListItems.createdAt,
        recipeTitle: recipes.title,
      })
      .from(groceryListItems)
      .leftJoin(recipes, eq(groceryListItems.recipeId, recipes.id))
      .where(and(eq(groceryListItems.sessionId, sessionId), isNull(groceryListItems.deletedAt)))
      .orderBy(desc(groceryListItems.createdAt))
      .limit(limit)
      .offset(offset);

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to fetch grocery items:", error);
    return {
      success: false as const,
      error: "שגיאה בטעינת רשימת הקניות",
    };
  }
}

export async function getGroceryItemsByRecipe({
  sessionId,
  recipeId,
}: {
  sessionId: string;
  recipeId: number;
}) {
  try {
    const data = await db
      .select()
      .from(groceryListItems)
      .where(
        and(
          eq(groceryListItems.sessionId, sessionId),
          eq(groceryListItems.recipeId, recipeId),
          isNull(groceryListItems.deletedAt)
        )
      )
      .orderBy(desc(groceryListItems.createdAt));

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to fetch grocery items for recipe:", error);
    return {
      success: false as const,
      error: "שגיאה בטעינת פריטי הקניות למתכון",
    };
  }
}

// --- Mutation Helpers ---

export async function insertGroceryItems(
  rows: {
    sessionId: string;
    recipeId: number;
    item: string;
    amount: string | null;
    unit: string | null;
  }[]
) {
  await db.insert(groceryListItems).values(rows);
}

export async function getGroceryItemById(id: number) {
  const [item] = await db
    .select()
    .from(groceryListItems)
    .where(and(eq(groceryListItems.id, id), isNull(groceryListItems.deletedAt)))
    .limit(1);
  return item ?? null;
}

export async function updateGroceryItemChecked(id: number, checked: number) {
  const [updated] = await db
    .update(groceryListItems)
    .set({ checked })
    .where(eq(groceryListItems.id, id))
    .returning();
  return updated ?? null;
}

export async function softDeleteGroceryItem(id: number) {
  const [updated] = await db
    .update(groceryListItems)
    .set({ deletedAt: new Date() })
    .where(eq(groceryListItems.id, id))
    .returning({ id: groceryListItems.id });
  return updated ?? null;
}

export async function softDeleteGroceryListBySession(sessionId: string) {
  await db
    .update(groceryListItems)
    .set({ deletedAt: new Date() })
    .where(and(eq(groceryListItems.sessionId, sessionId), isNull(groceryListItems.deletedAt)));
}
