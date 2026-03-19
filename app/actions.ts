"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getDisplayName, verifySession } from "@/src/lib/auth";
import {
  insertRecipe,
  updateRecipeById,
  updateRecipeShares,
  softDeleteRecipe,
  toggleReaction,
  getRecipeById,
} from "@/src/data/recipes";
import { getUserGroupIds } from "@/src/data/groups";
import { getUserById } from "@/src/data/users";
import {
  insertNote,
  softDeleteNote,
  getNoteById,
} from "@/src/data/notes";
import type { ActionResult } from "@/src/lib/types";

// --- Zod Schemas ---

const IngredientSchema = z.object({
  amount: z.string(),
  unit: z.string(),
  item: z.string().min(1, "שם המרכיב נדרש"),
});

const IngredientGroupSchema = z.object({
  name: z.string().optional(),
  items: z.array(IngredientSchema),
});

const InstructionSectionSchema = z.object({
  name: z.string().optional(),
  steps: z.array(z.string()),
});

const CreateRecipeSchema = z.object({
  title: z.string().min(1, "שם המתכון נדרש"),
  imageUrl: z.string().url().optional(),
  youtubeUrl: z.string().url().optional(),
  sourceUrl: z.string().url().optional(),
  ingredients: z.array(IngredientGroupSchema).optional(),
  instructions: z.array(InstructionSectionSchema).optional(),
  tags: z.array(z.string()).optional(),
  initialNote: z.string().min(1).optional(),
  initialNoteType: z.enum(["comment", "tip", "change"]).optional(),
  groupIds: z.array(z.number().int().positive()).optional(),
});

const UpdateRecipeSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1, "שם המתכון נדרש").optional(),
  imageUrl: z.string().url().optional(),
  youtubeUrl: z.string().url().optional(),
  sourceUrl: z.string().url().optional(),
  ingredients: z.array(IngredientGroupSchema).optional(),
  instructions: z.array(InstructionSectionSchema).optional(),
  tags: z.array(z.string()).optional(),
  groupIds: z.array(z.number().int().positive()).optional(),
});

const DeleteRecipeSchema = z.object({
  id: z.number().int().positive(),
});

const ToggleLikeSchema = z.object({
  id: z.number().int().positive(),
  previousReaction: z.enum(["like", "dislike"]).nullable(),
  newReaction: z.enum(["like", "dislike"]).nullable(),
});

const CreateNoteSchema = z.object({
  recipeId: z.number().int().positive(),
  note: z.string().min(1, "תוכן ההערה נדרש"),
  noteType: z.enum(["comment", "tip", "change"]).optional().default("comment"),
});

const DeleteNoteSchema = z.object({
  id: z.number().int().positive(),
  recipeId: z.number().int().positive(),
});

// --- Recipe Actions ---

export async function createRecipe(
  input: z.infer<typeof CreateRecipeSchema>
): Promise<ActionResult<{ id: number }>> {
  try {
    const parsed = CreateRecipeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const session = await verifySession();
    if (!session) return { success: false, error: "לא מחובר" };
    const displayName = session.displayName;

    const { initialNote, initialNoteType, groupIds, ...recipeData } = parsed.data;

    // If no groupIds provided, use all user's groups if shareWithAllByDefault is on
    let finalGroupIds = groupIds;
    if (!finalGroupIds) {
      const userResult = await getUserById(session.userId);
      if (userResult.success && userResult.data.shareWithAllByDefault === 1) {
        finalGroupIds = await getUserGroupIds(session.userId);
      }
    }

    const created = await insertRecipe({
      ...recipeData,
      uploadedBy: displayName,
      groupIds: finalGroupIds,
    });

    if (initialNote) {
      await insertNote({
        recipeId: created.id,
        note: initialNote,
        noteType: initialNoteType ?? "comment",
        author: displayName,
      });
    }

    revalidatePath("/");
    return { success: true, data: { id: created.id } };
  } catch (error) {
    console.error("createRecipe failed:", error);
    return { success: false, error: "שגיאה ביצירת המתכון" };
  }
}

export async function updateRecipe(
  input: z.infer<typeof UpdateRecipeSchema>
): Promise<ActionResult<{ id: number }>> {
  try {
    const parsed = UpdateRecipeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { id, groupIds, ...fields } = parsed.data;

    // Ownership check
    const result = await getRecipeById(id);
    if (!result.success) {
      return { success: false, error: "המתכון לא נמצא" };
    }

    const currentUser = await getDisplayName();
    if (result.data.uploadedBy !== currentUser) {
      return { success: false, error: "אין לך הרשאה לערוך מתכון זה" };
    }

    const updated = await updateRecipeById(id, fields);
    if (!updated) {
      return { success: false, error: "המתכון לא נמצא" };
    }

    // Update group shares if provided
    if (groupIds) {
      await updateRecipeShares(id, groupIds);
    }

    revalidatePath("/");
    revalidatePath(`/recipes/${id}`);
    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("updateRecipe failed:", error);
    return { success: false, error: "שגיאה בעדכון המתכון" };
  }
}

export async function deleteRecipe(
  input: z.infer<typeof DeleteRecipeSchema>
): Promise<ActionResult<void>> {
  try {
    const parsed = DeleteRecipeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // Ownership check
    const result = await getRecipeById(parsed.data.id);
    if (!result.success) {
      return { success: false, error: "המתכון לא נמצא" };
    }

    const currentUser = await getDisplayName();
    if (result.data.uploadedBy !== currentUser) {
      return { success: false, error: "אין לך הרשאה למחוק מתכון זה" };
    }

    const deleted = await softDeleteRecipe(parsed.data.id);
    if (!deleted) {
      return { success: false, error: "המתכון לא נמצא" };
    }

    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("deleteRecipe failed:", error);
    return { success: false, error: "שגיאה במחיקת המתכון" };
  }
}

export async function toggleRecipeLike(
  input: z.infer<typeof ToggleLikeSchema>
): Promise<ActionResult<{ likes: number; dislikes: number }>> {
  try {
    const parsed = ToggleLikeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const updated = await toggleReaction(parsed.data.id, parsed.data.previousReaction, parsed.data.newReaction);
    if (!updated) {
      return { success: false, error: "המתכון לא נמצא" };
    }

    revalidatePath(`/recipes/${parsed.data.id}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("toggleRecipeLike failed:", error);
    return { success: false, error: "שגיאה בעדכון הדירוג" };
  }
}

// --- Note Actions ---

export async function createNote(
  input: z.infer<typeof CreateNoteSchema>
): Promise<ActionResult<{ id: number }>> {
  try {
    const parsed = CreateNoteSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const displayName = await getDisplayName();
    const created = await insertNote({
      ...parsed.data,
      author: displayName,
    });

    revalidatePath(`/recipes/${parsed.data.recipeId}`);
    return { success: true, data: { id: created.id } };
  } catch (error) {
    console.error("createNote failed:", error);
    return { success: false, error: "שגיאה ביצירת ההערה" };
  }
}

export async function deleteNote(
  input: z.infer<typeof DeleteNoteSchema>
): Promise<ActionResult<void>> {
  try {
    const parsed = DeleteNoteSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // Ownership check
    const note = await getNoteById(parsed.data.id);
    if (!note) {
      return { success: false, error: "ההערה לא נמצאה" };
    }

    const currentUser = await getDisplayName();
    if (note.author !== currentUser) {
      return { success: false, error: "אין לך הרשאה למחוק הערה זו" };
    }

    const deleted = await softDeleteNote(parsed.data.id);
    if (!deleted) {
      return { success: false, error: "ההערה לא נמצאה" };
    }

    revalidatePath(`/recipes/${parsed.data.recipeId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("deleteNote failed:", error);
    return { success: false, error: "שגיאה במחיקת ההערה" };
  }
}
