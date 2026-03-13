import { db } from "@/src/db";
import { groceryListItems, recipes } from "@/src/db/schema";
import { eq, and, desc } from "drizzle-orm";

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
      .where(eq(groceryListItems.sessionId, sessionId))
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
          eq(groceryListItems.recipeId, recipeId)
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
