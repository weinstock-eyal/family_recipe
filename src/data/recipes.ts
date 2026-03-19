import { db } from "@/src/db";
import { recipes, familyNotes, recipeGroupShares, familyGroupMembers } from "@/src/db/schema";
import type { Ingredient, IngredientGroup, InstructionSection } from "@/src/db/schema";
import { eq, desc, ilike, sql, isNull, and, or, inArray } from "drizzle-orm";

// --- Normalization helpers (backward compat with old flat arrays) ---

export function normalizeIngredients(raw: unknown): IngredientGroup[] | null {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null;
  // Old format: Ingredient[] (has "item" but no "items")
  if ("item" in raw[0] && !("items" in raw[0])) {
    return [{ items: raw as Ingredient[] }];
  }
  return raw as IngredientGroup[];
}

export function normalizeInstructions(raw: unknown): InstructionSection[] | null {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null;
  // Old format: string[]
  if (typeof raw[0] === "string") {
    return [{ steps: raw as string[] }];
  }
  return raw as InstructionSection[];
}

const DEFAULT_PAGE_SIZE = 20;

// Subquery: group IDs for a given user
function userGroupIdsSq(userId: number) {
  return db
    .select({ groupId: familyGroupMembers.groupId })
    .from(familyGroupMembers)
    .where(eq(familyGroupMembers.userId, userId));
}

// Subquery: recipe IDs visible to a user via group shares
function visibleRecipeIdsSq(userId: number) {
  return db
    .select({ recipeId: recipeGroupShares.recipeId })
    .from(recipeGroupShares)
    .where(inArray(recipeGroupShares.groupId, userGroupIdsSq(userId)));
}

export async function getRecipes({
  limit = DEFAULT_PAGE_SIZE,
  offset = 0,
  userId,
  displayName,
}: {
  limit?: number;
  offset?: number;
  userId: number;
  displayName: string;
}) {
  try {
    const data = await db
      .select()
      .from(recipes)
      .where(
        and(
          isNull(recipes.deletedAt),
          or(
            inArray(recipes.id, visibleRecipeIdsSq(userId)),
            eq(recipes.uploadedBy, displayName)
          )
        )
      )
      .orderBy(desc(recipes.createdAt))
      .limit(limit)
      .offset(offset);

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to fetch recipes:", error);
    return { success: false as const, error: "שגיאה בטעינת המתכונים" };
  }
}

export async function getRecipeById(id: number) {
  try {
    const data = await db.query.recipes.findFirst({
      where: (r, { and, eq, isNull }) =>
        and(eq(r.id, id), isNull(r.deletedAt)),
      with: {
        familyNotes: {
          where: (notes, { isNull }) => isNull(notes.deletedAt),
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
  userId,
  displayName,
}: {
  query: string;
  limit?: number;
  offset?: number;
  userId: number;
  displayName: string;
}) {
  try {
    const pattern = `%${query}%`;
    const data = await db
      .selectDistinctOn([recipes.id], {
        id: recipes.id,
        title: recipes.title,
        uploadedBy: recipes.uploadedBy,
        createdAt: recipes.createdAt,
        updatedAt: recipes.updatedAt,
        imageUrl: recipes.imageUrl,
        youtubeUrl: recipes.youtubeUrl,
        sourceUrl: recipes.sourceUrl,
        ingredients: recipes.ingredients,
        instructions: recipes.instructions,
        tags: recipes.tags,
        likes: recipes.likes,
        dislikes: recipes.dislikes,
        deletedAt: recipes.deletedAt,
      })
      .from(recipes)
      .leftJoin(
        familyNotes,
        and(eq(familyNotes.recipeId, recipes.id), isNull(familyNotes.deletedAt))
      )
      .where(
        and(
          isNull(recipes.deletedAt),
          or(
            inArray(recipes.id, visibleRecipeIdsSq(userId)),
            eq(recipes.uploadedBy, displayName)
          ),
          or(
            ilike(recipes.title, pattern),
            sql`${recipes.tags}::text ILIKE ${pattern}`,
            sql`${recipes.ingredients}::text ILIKE ${pattern}`,
            ilike(familyNotes.note, pattern)
          )
        )
      )
      .orderBy(recipes.id, desc(recipes.createdAt))
      .limit(limit)
      .offset(offset);

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to search recipes:", error);
    return { success: false as const, error: "שגיאה בחיפוש מתכונים" };
  }
}

export async function getRecipesCount(userId: number, displayName: string) {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(recipes)
      .where(
        and(
          isNull(recipes.deletedAt),
          or(
            inArray(recipes.id, visibleRecipeIdsSq(userId)),
            eq(recipes.uploadedBy, displayName)
          )
        )
      );

    return { success: true as const, data: result.count };
  } catch (error) {
    console.error("Failed to count recipes:", error);
    return { success: false as const, error: "שגיאה בספירת המתכונים" };
  }
}

// --- Mutation Helpers ---

export async function insertRecipe(data: {
  title: string;
  uploadedBy: string;
  imageUrl?: string | null;
  youtubeUrl?: string | null;
  sourceUrl?: string | null;
  ingredients?: IngredientGroup[] | null;
  instructions?: InstructionSection[] | null;
  tags?: string[] | null;
  groupIds?: number[];
}) {
  const { groupIds, ...recipeData } = data;

  return await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(recipes)
      .values({
        title: recipeData.title,
        uploadedBy: recipeData.uploadedBy,
        imageUrl: recipeData.imageUrl ?? null,
        youtubeUrl: recipeData.youtubeUrl ?? null,
        sourceUrl: recipeData.sourceUrl ?? null,
        ingredients: recipeData.ingredients ?? null,
        instructions: recipeData.instructions ?? null,
        tags: recipeData.tags ?? null,
      })
      .returning();

    if (groupIds && groupIds.length > 0) {
      await tx.insert(recipeGroupShares).values(
        groupIds.map((groupId) => ({
          recipeId: created.id,
          groupId,
        }))
      );
    }

    return created;
  });
}

export async function updateRecipeShares(recipeId: number, groupIds: number[]) {
  return await db.transaction(async (tx) => {
    // Remove all existing shares
    await tx
      .delete(recipeGroupShares)
      .where(eq(recipeGroupShares.recipeId, recipeId));

    // Insert new shares
    if (groupIds.length > 0) {
      await tx.insert(recipeGroupShares).values(
        groupIds.map((groupId) => ({
          recipeId,
          groupId,
        }))
      );
    }
  });
}

export async function getRecipeGroupIds(recipeId: number): Promise<number[]> {
  const rows = await db
    .select({ groupId: recipeGroupShares.groupId })
    .from(recipeGroupShares)
    .where(eq(recipeGroupShares.recipeId, recipeId));
  return rows.map((r) => r.groupId);
}

export async function updateRecipeById(
  id: number,
  data: {
    title?: string;
    imageUrl?: string;
    youtubeUrl?: string;
    sourceUrl?: string;
    ingredients?: IngredientGroup[];
    instructions?: InstructionSection[];
    tags?: string[];
  }
) {
  const [updated] = await db
    .update(recipes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(recipes.id, id))
    .returning();
  return updated ?? null;
}

export async function softDeleteRecipe(id: number) {
  const [updated] = await db
    .update(recipes)
    .set({ deletedAt: new Date() })
    .where(eq(recipes.id, id))
    .returning({ id: recipes.id });
  return updated ?? null;
}

export async function toggleReaction(
  id: number,
  previousReaction: "like" | "dislike" | null,
  newReaction: "like" | "dislike" | null
) {
  const updates: Record<string, unknown> = {};

  if (previousReaction === "like") {
    updates.likes = sql`GREATEST(${recipes.likes} - 1, 0)`;
  } else if (previousReaction === "dislike") {
    updates.dislikes = sql`GREATEST(${recipes.dislikes} - 1, 0)`;
  }

  if (newReaction === "like") {
    updates.likes = sql`${recipes.likes} + 1`;
  } else if (newReaction === "dislike") {
    updates.dislikes = sql`${recipes.dislikes} + 1`;
  }

  if (Object.keys(updates).length === 0) return null;

  const [updated] = await db
    .update(recipes)
    .set(updates)
    .where(eq(recipes.id, id))
    .returning({ likes: recipes.likes, dislikes: recipes.dislikes });
  return updated ?? null;
}
