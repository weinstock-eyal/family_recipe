import { db } from "@/src/db";
import { familyNotes } from "@/src/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";

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
      .where(and(eq(familyNotes.recipeId, recipeId), isNull(familyNotes.deletedAt)))
      .orderBy(desc(familyNotes.createdAt))
      .limit(limit)
      .offset(offset);

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return { success: false as const, error: "שגיאה בטעינת ההערות" };
  }
}

// --- Mutation Helpers ---

export async function getNoteById(id: number) {
  const [note] = await db
    .select()
    .from(familyNotes)
    .where(and(eq(familyNotes.id, id), isNull(familyNotes.deletedAt)))
    .limit(1);
  return note ?? null;
}

export async function insertNote(data: {
  recipeId: number;
  author: string;
  note: string;
  noteType: "comment" | "tip" | "change";
}) {
  const [created] = await db
    .insert(familyNotes)
    .values(data)
    .returning();
  return created;
}

export async function softDeleteNote(id: number) {
  const [updated] = await db
    .update(familyNotes)
    .set({ deletedAt: new Date() })
    .where(eq(familyNotes.id, id))
    .returning({ id: familyNotes.id });
  return updated ?? null;
}
