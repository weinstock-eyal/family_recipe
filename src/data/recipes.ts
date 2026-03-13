import { db } from "@/src/db";
import { recipes } from "@/src/db/schema";
import { eq, desc, ilike, sql } from "drizzle-orm";

const DEFAULT_PAGE_SIZE = 20;

export async function getRecipes({
  limit = DEFAULT_PAGE_SIZE,
  offset = 0,
}: { limit?: number; offset?: number } = {}) {
  try {
    const data = await db.query.recipes.findMany({
      orderBy: [desc(recipes.createdAt)],
      limit,
      offset,
    });
    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to fetch recipes:", error);
    return { success: false as const, error: "שגיאה בטעינת המתכונים" };
  }
}

export async function getRecipeById(id: number) {
  try {
    const data = await db.query.recipes.findFirst({
      where: eq(recipes.id, id),
      with: {
        familyNotes: {
          orderBy: (notes, { desc }) => [desc(notes.createdAt)],
        },
      },
    });

    if (!data) {
      return { success: false as const, error: "המתכון לא נמצא" };
    }

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to fetch recipe:", error);
    return { success: false as const, error: "שגיאה בטעינת המתכון" };
  }
}

export async function searchRecipes({
  query,
  limit = DEFAULT_PAGE_SIZE,
  offset = 0,
}: {
  query: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const data = await db
      .select()
      .from(recipes)
      .where(ilike(recipes.title, `%${query}%`))
      .orderBy(desc(recipes.createdAt))
      .limit(limit)
      .offset(offset);

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to search recipes:", error);
    return { success: false as const, error: "שגיאה בחיפוש מתכונים" };
  }
}

export async function getRecipesCount() {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(recipes);

    return { success: true as const, data: result.count };
  } catch (error) {
    console.error("Failed to count recipes:", error);
    return { success: false as const, error: "שגיאה בספירת המתכונים" };
  }
}
