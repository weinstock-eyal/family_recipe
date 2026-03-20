"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/src/lib/auth";
import {
  createGroup,
  updateGroup,
  softDeleteGroup,
  isGroupAdmin,
  isGroupMember,
  removeMemberFromGroup,
  updateMemberRole,
  getGroupAdminCount,
} from "@/src/data/groups";
import {
  createInvitation,
  softDeleteInvitation,
  useInvitation,
  getInvitationByCode,
} from "@/src/data/invitations";
import { updateUser } from "@/src/data/users";
import type { ActionResult } from "@/src/lib/types";

// --- Zod Schemas ---

const CreateGroupSchema = z.object({
  name: z.string().min(1, "שם הקבוצה נדרש").max(255),
});

const UpdateGroupSchema = z.object({
  groupId: z.number().int().positive(),
  name: z.string().min(1, "שם הקבוצה נדרש").max(255),
});

const DeleteGroupSchema = z.object({
  groupId: z.number().int().positive(),
});

const RemoveMemberSchema = z.object({
  groupId: z.number().int().positive(),
  userId: z.number().int().positive(),
});

const UpdateMemberRoleSchema = z.object({
  groupId: z.number().int().positive(),
  userId: z.number().int().positive(),
  role: z.enum(["admin", "member"]),
});

const CreateInvitationSchema = z.object({
  groupId: z.number().int().positive(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

const RevokeInvitationSchema = z.object({
  id: z.number().int().positive(),
  groupId: z.number().int().positive(),
});

const JoinGroupByCodeSchema = z.object({
  code: z.string().min(1, "קוד הזמנה נדרש"),
});

// --- Actions ---

export async function createGroupAction(
  input: z.infer<typeof CreateGroupSchema>
): Promise<ActionResult<{ id: number }>> {
  try {
    const session = await verifySession();
    if (!session) return { success: false, error: "לא מחובר" };

    const parsed = CreateGroupSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const group = await createGroup({
      name: parsed.data.name,
      createdById: session.userId,
    });

    revalidatePath("/groups");
    return { success: true, data: { id: group.id } };
  } catch (error) {
    console.error("createGroupAction failed:", error);
    const message =
      error instanceof Error && error.message.includes("foreign key")
        ? "המשתמש לא נמצא. נסה להתנתק ולהתחבר מחדש."
        : "שגיאה ביצירת הקבוצה";
    return { success: false, error: message };
  }
}

export async function updateGroupAction(
  input: z.infer<typeof UpdateGroupSchema>
): Promise<ActionResult<void>> {
  try {
    const session = await verifySession();
    if (!session) return { success: false, error: "לא מחובר" };

    const parsed = UpdateGroupSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const isAdmin = await isGroupAdmin(parsed.data.groupId, session.userId);
    if (!isAdmin) {
      return { success: false, error: "רק מנהל קבוצה יכול לערוך את הקבוצה" };
    }

    await updateGroup(parsed.data.groupId, { name: parsed.data.name });

    revalidatePath("/groups");
    revalidatePath(`/groups/${parsed.data.groupId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("updateGroupAction failed:", error);
    return { success: false, error: "שגיאה בעדכון הקבוצה" };
  }
}

export async function deleteGroupAction(
  input: z.infer<typeof DeleteGroupSchema>
): Promise<ActionResult<void>> {
  try {
    const session = await verifySession();
    if (!session) return { success: false, error: "לא מחובר" };

    const parsed = DeleteGroupSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const isAdmin = await isGroupAdmin(parsed.data.groupId, session.userId);
    if (!isAdmin) {
      return { success: false, error: "רק מנהל קבוצה יכול למחוק את הקבוצה" };
    }

    await softDeleteGroup(parsed.data.groupId);

    revalidatePath("/groups");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("deleteGroupAction failed:", error);
    return { success: false, error: "שגיאה במחיקת הקבוצה" };
  }
}

export async function removeMemberAction(
  input: z.infer<typeof RemoveMemberSchema>
): Promise<ActionResult<void>> {
  try {
    const session = await verifySession();
    if (!session) return { success: false, error: "לא מחובר" };

    const parsed = RemoveMemberSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { groupId, userId } = parsed.data;

    // User can remove themselves, or admin can remove others
    const isSelf = userId === session.userId;
    if (!isSelf) {
      const isAdmin = await isGroupAdmin(groupId, session.userId);
      if (!isAdmin) {
        return { success: false, error: "רק מנהל קבוצה יכול להסיר חברים" };
      }
    }

    // Prevent last admin from leaving
    if (isSelf) {
      const isAdmin = await isGroupAdmin(groupId, session.userId);
      if (isAdmin) {
        const adminCount = await getGroupAdminCount(groupId);
        if (adminCount <= 1) {
          return {
            success: false,
            error: "אי אפשר לעזוב את הקבוצה כשאתה המנהל היחיד. מנה מנהל אחר קודם.",
          };
        }
      }
    }

    await removeMemberFromGroup(groupId, userId);

    revalidatePath("/groups");
    revalidatePath(`/groups/${groupId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("removeMemberAction failed:", error);
    return { success: false, error: "שגיאה בהסרת חבר" };
  }
}

export async function updateMemberRoleAction(
  input: z.infer<typeof UpdateMemberRoleSchema>
): Promise<ActionResult<void>> {
  try {
    const session = await verifySession();
    if (!session) return { success: false, error: "לא מחובר" };

    const parsed = UpdateMemberRoleSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { groupId, userId, role } = parsed.data;

    const isAdmin = await isGroupAdmin(groupId, session.userId);
    if (!isAdmin) {
      return { success: false, error: "רק מנהל קבוצה יכול לשנות תפקידים" };
    }

    // Prevent demoting last admin
    if (role === "member") {
      const currentIsAdmin = await isGroupAdmin(groupId, userId);
      if (currentIsAdmin) {
        const adminCount = await getGroupAdminCount(groupId);
        if (adminCount <= 1) {
          return {
            success: false,
            error: "לא ניתן להוריד את המנהל האחרון בקבוצה",
          };
        }
      }
    }

    await updateMemberRole(groupId, userId, role);

    revalidatePath(`/groups/${groupId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("updateMemberRoleAction failed:", error);
    return { success: false, error: "שגיאה בעדכון תפקיד" };
  }
}

export async function createInvitationAction(
  input: z.infer<typeof CreateInvitationSchema>
): Promise<ActionResult<{ code: string }>> {
  try {
    const session = await verifySession();
    if (!session) return { success: false, error: "לא מחובר" };

    const parsed = CreateInvitationSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const isAdmin = await isGroupAdmin(parsed.data.groupId, session.userId);
    if (!isAdmin) {
      return { success: false, error: "רק מנהל קבוצה יכול ליצור הזמנות" };
    }

    const invitation = await createInvitation({
      groupId: parsed.data.groupId,
      createdById: session.userId,
      maxUses: parsed.data.maxUses ?? null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    });

    revalidatePath(`/groups/${parsed.data.groupId}`);
    return { success: true, data: { code: invitation.code } };
  } catch (error) {
    console.error("createInvitationAction failed:", error);
    return { success: false, error: "שגיאה ביצירת הזמנה" };
  }
}

export async function revokeInvitationAction(
  input: z.infer<typeof RevokeInvitationSchema>
): Promise<ActionResult<void>> {
  try {
    const session = await verifySession();
    if (!session) return { success: false, error: "לא מחובר" };

    const parsed = RevokeInvitationSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const isAdmin = await isGroupAdmin(parsed.data.groupId, session.userId);
    if (!isAdmin) {
      return { success: false, error: "רק מנהל קבוצה יכול לבטל הזמנות" };
    }

    await softDeleteInvitation(parsed.data.id);

    revalidatePath(`/groups/${parsed.data.groupId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("revokeInvitationAction failed:", error);
    return { success: false, error: "שגיאה בביטול הזמנה" };
  }
}

export async function joinGroupByCodeAction(
  input: z.infer<typeof JoinGroupByCodeSchema>
): Promise<ActionResult<{ groupId: number }>> {
  try {
    const session = await verifySession();
    if (!session) return { success: false, error: "לא מחובר" };

    const parsed = JoinGroupByCodeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const groupId = await useInvitation(parsed.data.code, session.userId);

    revalidatePath("/groups");
    revalidatePath(`/groups/${groupId}`);
    revalidatePath("/");
    return { success: true, data: { groupId } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "שגיאה בהצטרפות לקבוצה";
    console.error("joinGroupByCodeAction failed:", error);
    return { success: false, error: message };
  }
}

export async function updateShareDefaultAction(
  input: { shareWithAllByDefault: boolean }
): Promise<ActionResult<void>> {
  try {
    const session = await verifySession();
    if (!session) return { success: false, error: "לא מחובר" };

    await updateUser(session.userId, {
      shareWithAllByDefault: input.shareWithAllByDefault ? 1 : 0,
    });

    revalidatePath("/groups");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("updateShareDefaultAction failed:", error);
    return { success: false, error: "שגיאה בעדכון ההגדרה" };
  }
}
