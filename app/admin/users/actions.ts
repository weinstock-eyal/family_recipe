"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin, hashPassword } from "@/src/lib/auth";
import {
  getUserByEmail,
  insertUser,
  updateUser,
  updateUserDisplayName,
  getUserContentCounts,
  deleteUser,
  getUserById,
} from "@/src/data/users";
import type { ActionResult } from "@/src/lib/types";

// --- Zod Schemas ---

const CreateUserSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
  displayName: z.string().min(1, "שם תצוגה נדרש"),
  role: z.enum(["member", "admin"]),
});

const UpdateUserSchema = z.object({
  id: z.number().int().positive(),
  displayName: z.string().min(1, "שם תצוגה נדרש").optional(),
  role: z.enum(["member", "admin"]).optional(),
});

const ResetPasswordSchema = z.object({
  id: z.number().int().positive(),
  newPassword: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
});

const ToggleActiveSchema = z.object({
  id: z.number().int().positive(),
  isActive: z.number().int().min(0).max(1),
});

const DeleteUserSchema = z.object({
  id: z.number().int().positive(),
});

// --- Actions ---

export async function createUserAction(
  input: z.infer<typeof CreateUserSchema>
): Promise<ActionResult<{ id: number }>> {
  try {
    const session = await requireAdmin();

    const parsed = CreateUserSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // Check email uniqueness
    const existing = await getUserByEmail(parsed.data.email);
    if (existing.success && existing.data) {
      return { success: false, error: "כתובת האימייל כבר קיימת במערכת" };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const created = await insertUser({
      email: parsed.data.email,
      passwordHash,
      displayName: parsed.data.displayName,
      role: parsed.data.role,
    });

    revalidatePath("/admin/users");
    return { success: true, data: { id: created.id } };
  } catch (error) {
    console.error("createUser failed:", error);
    return { success: false, error: "שגיאה ביצירת המשתמש" };
  }
}

export async function updateUserAction(
  input: z.infer<typeof UpdateUserSchema>
): Promise<ActionResult<{ id: number }>> {
  try {
    const session = await requireAdmin();

    const parsed = UpdateUserSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { id, ...fields } = parsed.data;

    // Prevent self-demotion
    if (session.userId === id && fields.role && fields.role !== "admin") {
      return { success: false, error: "לא ניתן להוריד את עצמך מתפקיד אדמין" };
    }

    // Get current user data for cascade check
    const current = await getUserById(id);
    if (!current.success) {
      return { success: false, error: "המשתמש לא נמצא" };
    }

    // If displayName changed, use cascading update
    if (fields.displayName && fields.displayName !== current.data.displayName) {
      await updateUserDisplayName(
        id,
        current.data.displayName,
        fields.displayName
      );
      // If role also changed, update it separately
      if (fields.role && fields.role !== current.data.role) {
        await updateUser(id, { role: fields.role });
      }
    } else if (fields.role) {
      await updateUser(id, { role: fields.role });
    }

    revalidatePath("/admin/users");
    revalidatePath("/");
    return { success: true, data: { id } };
  } catch (error) {
    console.error("updateUser failed:", error);
    return { success: false, error: "שגיאה בעדכון המשתמש" };
  }
}

export async function resetPasswordAction(
  input: z.infer<typeof ResetPasswordSchema>
): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin();

    const parsed = ResetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    const updated = await updateUser(parsed.data.id, { passwordHash });
    if (!updated) {
      return { success: false, error: "המשתמש לא נמצא" };
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("resetPassword failed:", error);
    return { success: false, error: "שגיאה באיפוס הסיסמה" };
  }
}

export async function toggleUserActiveAction(
  input: z.infer<typeof ToggleActiveSchema>
): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin();

    const parsed = ToggleActiveSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // Prevent self-deactivation
    if (session.userId === parsed.data.id && parsed.data.isActive === 0) {
      return { success: false, error: "לא ניתן להשבית את עצמך" };
    }

    const updated = await updateUser(parsed.data.id, {
      isActive: parsed.data.isActive,
    });
    if (!updated) {
      return { success: false, error: "המשתמש לא נמצא" };
    }

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("toggleUserActive failed:", error);
    return { success: false, error: "שגיאה בשינוי סטטוס המשתמש" };
  }
}

export async function deleteUserAction(
  input: z.infer<typeof DeleteUserSchema>
): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin();

    const parsed = DeleteUserSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // Prevent self-deletion
    if (session.userId === parsed.data.id) {
      return { success: false, error: "לא ניתן למחוק את עצמך" };
    }

    // Check for existing content
    const counts = await getUserContentCounts(parsed.data.id);
    if (counts.success && (counts.data.recipes > 0 || counts.data.notes > 0)) {
      return {
        success: false,
        error: `לא ניתן למחוק משתמש עם תוכן קיים (${counts.data.recipes} מתכונים, ${counts.data.notes} הערות). יש להשבית את המשתמש במקום.`,
      };
    }

    const deleted = await deleteUser(parsed.data.id);
    if (!deleted) {
      return { success: false, error: "המשתמש לא נמצא" };
    }

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("deleteUser failed:", error);
    return { success: false, error: "שגיאה במחיקת המשתמש" };
  }
}
