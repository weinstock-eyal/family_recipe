"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/src/db";
import { familyNotes } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import type { ActionResult } from "@/src/lib/types";
import { getDisplayName } from "@/src/lib/auth";

type CreateNoteInput = {
  recipeId: number;
  note: string;
  noteType?: "comment" | "tip" | "change";
};

export async function createNote(
  input: CreateNoteInput
): Promise<ActionResult<{ id: number }>> {
  try {
    const displayName = await getDisplayName();

    const [created] = await db
      .insert(familyNotes)
      .values({
        recipeId: input.recipeId,
        author: displayName,
        note: input.note,
        noteType: input.noteType ?? "comment",
      })
      .returning({ id: familyNotes.id });

    revalidatePath(`/recipes/${input.recipeId}`);
    return { success: true, data: { id: created.id } };
  } catch (error) {
    console.error("Failed to create note:", error);
    return { success: false, error: "שגיאה ביצירת ההערה" };
  }
}

export async function deleteNote(
  id: number,
  recipeId: number
): Promise<ActionResult<void>> {
  try {
    const [deleted] = await db
      .delete(familyNotes)
      .where(eq(familyNotes.id, id))
      .returning({ id: familyNotes.id });

    if (!deleted) {
      return { success: false, error: "ההערה לא נמצאה" };
    }

    revalidatePath(`/recipes/${recipeId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete note:", error);
    return { success: false, error: "שגיאה במחיקת ההערה" };
  }
}
