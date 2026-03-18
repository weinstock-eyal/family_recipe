import "server-only";
import { db } from "@/src/db";
import { users, recipes, familyNotes } from "@/src/db/schema";
import { eq, desc, sql, and, isNull } from "drizzle-orm";

export async function getAllUsers() {
  try {
    const data = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return { success: false as const, error: "שגיאה בטעינת המשתמשים" };
  }
}

export async function getUserById(id: number) {
  try {
    const [data] = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!data) {
      return { success: false as const, error: "המשתמש לא נמצא" };
    }

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return { success: false as const, error: "שגיאה בטעינת המשתמש" };
  }
}

export async function getUserByEmail(email: string) {
  try {
    const [data] = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    return { success: true as const, data: data ?? null };
  } catch (error) {
    console.error("Failed to fetch user by email:", error);
    return { success: false as const, error: "שגיאה בחיפוש משתמש" };
  }
}

export async function insertUser(data: {
  email: string;
  passwordHash: string;
  displayName: string;
  role: string;
}) {
  const [created] = await db
    .insert(users)
    .values({
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      displayName: data.displayName,
      role: data.role,
    })
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    });
  return created;
}

export async function updateUser(
  id: number,
  data: {
    displayName?: string;
    role?: string;
    isActive?: number;
    passwordHash?: string;
  }
) {
  const [updated] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    });
  return updated ?? null;
}

export async function updateUserDisplayName(
  id: number,
  oldName: string,
  newName: string
) {
  return await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(users)
      .set({ displayName: newName })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    // Cascade displayName to recipes
    await tx
      .update(recipes)
      .set({ uploadedBy: newName })
      .where(eq(recipes.uploadedBy, oldName));

    // Cascade displayName to family notes
    await tx
      .update(familyNotes)
      .set({ author: newName })
      .where(eq(familyNotes.author, oldName));

    return updated ?? null;
  });
}

export async function getUserContentCounts(id: number) {
  try {
    const result = await getUserById(id);
    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    const displayName = result.data.displayName;

    const [recipeCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(recipes)
      .where(
        and(eq(recipes.uploadedBy, displayName), isNull(recipes.deletedAt))
      );

    const [noteCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(familyNotes)
      .where(
        and(eq(familyNotes.author, displayName), isNull(familyNotes.deletedAt))
      );

    return {
      success: true as const,
      data: {
        recipes: Number(recipeCount.count),
        notes: Number(noteCount.count),
      },
    };
  } catch (error) {
    console.error("Failed to count user content:", error);
    return { success: false as const, error: "שגיאה בבדיקת תוכן המשתמש" };
  }
}

export async function deleteUser(id: number) {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });
  return deleted ?? null;
}
