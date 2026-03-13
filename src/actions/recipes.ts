"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/src/db";
import { recipes } from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";
import type { Ingredient } from "@/src/db/schema";
import type { ActionResult } from "@/src/lib/types";
import { getDisplayName } from "@/src/lib/auth";

type CreateRecipeInput = {
  title: string;
  imageUrl?: string;
  youtubeUrl?: string;
  sourceUrl?: string;
  ingredients?: Ingredient[];
  instructions?: string[];
  tags?: string[];
};

export async function createRecipe(
  input: CreateRecipeInput
): Promise<ActionResult<{ id: number }>> {
  try {
    const displayName = await getDisplayName();

    const [created] = await db
      .insert(recipes)
      .values({
        title: input.title,
        uploadedBy: displayName,
        imageUrl: input.imageUrl ?? null,
        youtubeUrl: input.youtubeUrl ?? null,
        sourceUrl: input.sourceUrl ?? null,
        ingredients: input.ingredients ?? null,
        instructions: input.instructions ?? null,
        tags: input.tags ?? null,
      })
      .returning({ id: recipes.id });

    revalidatePath("/");
    return { success: true, data: { id: created.id } };
  } catch (error) {
    console.error("Failed to create recipe:", error);
    return { success: false, error: "שגיאה ביצירת המתכון" };
  }
}

type UpdateRecipeInput = {
  id: number;
  title?: string;
  imageUrl?: string;
  youtubeUrl?: string;
  sourceUrl?: string;
  ingredients?: Ingredient[];
  instructions?: string[];
  tags?: string[];
};

export async function updateRecipe(
  input: UpdateRecipeInput
): Promise<ActionResult<{ id: number }>> {
  try {
    const { id, ...fields } = input;

    const [updated] = await db
      .update(recipes)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(recipes.id, id))
      .returning({ id: recipes.id });

    if (!updated) {
      return { success: false, error: "המתכון לא נמצא" };
    }

    revalidatePath("/");
    revalidatePath(`/recipes/${id}`);
    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("Failed to update recipe:", error);
    return { success: false, error: "שגיאה בעדכון המתכון" };
  }
}

export async function deleteRecipe(
  id: number
): Promise<ActionResult<void>> {
  try {
    const [deleted] = await db
      .delete(recipes)
      .where(eq(recipes.id, id))
      .returning({ id: recipes.id });

    if (!deleted) {
      return { success: false, error: "המתכון לא נמצא" };
    }

    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete recipe:", error);
    return { success: false, error: "שגיאה במחיקת המתכון" };
  }
}

export async function toggleRecipeLike(
  id: number,
  type: "like" | "dislike"
): Promise<ActionResult<{ likes: number; dislikes: number }>> {
  try {
    const column = type === "like" ? recipes.likes : recipes.dislikes;

    const [updated] = await db
      .update(recipes)
      .set({ [type === "like" ? "likes" : "dislikes"]: sql`${column} + 1` })
      .where(eq(recipes.id, id))
      .returning({ likes: recipes.likes, dislikes: recipes.dislikes });

    if (!updated) {
      return { success: false, error: "המתכון לא נמצא" };
    }

    revalidatePath(`/recipes/${id}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to toggle recipe like:", error);
    return { success: false, error: "שגיאה בעדכון הדירוג" };
  }
}
