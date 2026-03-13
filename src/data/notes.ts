import { db } from "@/src/db";
import { familyNotes } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";

const DEFAULT_PAGE_SIZE = 20;

export async function getNotesByRecipeId({
  recipeId,
  limit = DEFAULT_PAGE_SIZE,
  offset = 0,
}: {
  recipeId: number;
  limit?: number;
  offset?: number;
}) {
  try {
    const data = await db
      .select()
      .from(familyNotes)
      .where(eq(familyNotes.recipeId, recipeId))
      .orderBy(desc(familyNotes.createdAt))
      .limit(limit)
      .offset(offset);

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return { success: false as const, error: "שגיאה בטעינת ההערות" };
  }
}
