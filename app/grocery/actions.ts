"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/src/lib/types";
import {
  insertGroceryItems,
  getGroceryItemById,
  updateGroceryItemChecked,
  softDeleteGroceryItem,
  softDeleteGroceryListBySession,
} from "@/src/data/grocery";

// --- Zod Schemas ---

const IngredientSchema = z.object({
  amount: z.string(),
  unit: z.string(),
  item: z.string().min(1, "שם המרכיב נדרש"),
});

const AddIngredientsSchema = z.object({
  sessionId: z.string().min(1),
  recipeId: z.number().int().positive(),
  ingredients: z.array(IngredientSchema).min(1, "יש לבחור לפחות מרכיב אחד"),
  multiplier: z.number().positive().optional().default(1),
});

const ToggleGroceryItemSchema = z.object({
  id: z.number().int().positive(),
});

const RemoveGroceryItemSchema = z.object({
  id: z.number().int().positive(),
});

const ClearGroceryListSchema = z.object({
  sessionId: z.string().min(1),
});

// --- Grocery Actions ---

export async function addIngredientsToGroceryList(
  input: z.infer<typeof AddIngredientsSchema>
): Promise<ActionResult<void>> {
  try {
    const parsed = AddIngredientsSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { sessionId, recipeId, ingredients, multiplier } = parsed.data;

    const rows = ingredients.map((ing) => ({
      sessionId,
      recipeId,
      item: ing.item,
      amount: ing.amount
        ? String(parseFloat(ing.amount) * multiplier)
        : null,
      unit: ing.unit || null,
    }));

    await insertGroceryItems(rows);

    revalidatePath("/grocery");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("addIngredientsToGroceryList failed:", error);
    return { success: false, error: "שגיאה בהוספת פריטים לרשימת הקניות" };
  }
}

export async function toggleGroceryItem(
  input: z.infer<typeof ToggleGroceryItemSchema>
): Promise<ActionResult<{ checked: number }>> {
  try {
    const parsed = ToggleGroceryItemSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const item = await getGroceryItemById(parsed.data.id);
    if (!item) {
      return { success: false, error: "הפריט לא נמצא" };
    }

    const newChecked = item.checked === 0 ? 1 : 0;
    const updated = await updateGroceryItemChecked(parsed.data.id, newChecked);
    if (!updated) {
      return { success: false, error: "הפריט לא נמצא" };
    }

    revalidatePath("/grocery");
    return { success: true, data: { checked: newChecked } };
  } catch (error) {
    console.error("toggleGroceryItem failed:", error);
    return { success: false, error: "שגיאה בעדכון הפריט" };
  }
}

export async function removeGroceryItem(
  input: z.infer<typeof RemoveGroceryItemSchema>
): Promise<ActionResult<void>> {
  try {
    const parsed = RemoveGroceryItemSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const deleted = await softDeleteGroceryItem(parsed.data.id);
    if (!deleted) {
      return { success: false, error: "הפריט לא נמצא" };
    }

    revalidatePath("/grocery");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("removeGroceryItem failed:", error);
    return { success: false, error: "שגיאה במחיקת הפריט" };
  }
}

export async function clearGroceryList(
  input: z.infer<typeof ClearGroceryListSchema>
): Promise<ActionResult<void>> {
  try {
    const parsed = ClearGroceryListSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    await softDeleteGroceryListBySession(parsed.data.sessionId);

    revalidatePath("/grocery");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("clearGroceryList failed:", error);
    return { success: false, error: "שגיאה בניקוי רשימת הקניות" };
  }
}
