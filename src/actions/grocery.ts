"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/src/db";
import { groceryListItems } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import type { Ingredient } from "@/src/db/schema";
import type { ActionResult } from "@/src/lib/types";

export async function addIngredientsToGroceryList({
  sessionId,
  recipeId,
  ingredients,
  multiplier = 1,
}: {
  sessionId: string;
  recipeId: number;
  ingredients: Ingredient[];
  multiplier?: number;
}): Promise<ActionResult<void>> {
  try {
    const rows = ingredients.map((ing) => ({
      sessionId,
      recipeId,
      item: ing.item,
      amount: ing.amount
        ? String(parseFloat(ing.amount) * multiplier)
        : null,
      unit: ing.unit || null,
    }));

    await db.insert(groceryListItems).values(rows);

    revalidatePath("/grocery");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to add ingredients to grocery list:", error);
    return { success: false, error: "שגיאה בהוספת פריטים לרשימת הקניות" };
  }
}

export async function toggleGroceryItem(
  id: number
): Promise<ActionResult<{ checked: number }>> {
  try {
    const [item] = await db
      .select({ checked: groceryListItems.checked })
      .from(groceryListItems)
      .where(eq(groceryListItems.id, id))
      .limit(1);

    if (!item) {
      return { success: false, error: "הפריט לא נמצא" };
    }

    const newChecked = item.checked === 0 ? 1 : 0;

    await db
      .update(groceryListItems)
      .set({ checked: newChecked })
      .where(eq(groceryListItems.id, id));

    revalidatePath("/grocery");
    return { success: true, data: { checked: newChecked } };
  } catch (error) {
    console.error("Failed to toggle grocery item:", error);
    return { success: false, error: "שגיאה בעדכון הפריט" };
  }
}

export async function removeGroceryItem(
  id: number
): Promise<ActionResult<void>> {
  try {
    const [deleted] = await db
      .delete(groceryListItems)
      .where(eq(groceryListItems.id, id))
      .returning({ id: groceryListItems.id });

    if (!deleted) {
      return { success: false, error: "הפריט לא נמצא" };
    }

    revalidatePath("/grocery");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to remove grocery item:", error);
    return { success: false, error: "שגיאה במחיקת הפריט" };
  }
}

export async function clearGroceryList(
  sessionId: string
): Promise<ActionResult<void>> {
  try {
    await db
      .delete(groceryListItems)
      .where(eq(groceryListItems.sessionId, sessionId));

    revalidatePath("/grocery");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to clear grocery list:", error);
    return { success: false, error: "שגיאה בניקוי רשימת הקניות" };
  }
}
