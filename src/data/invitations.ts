import "server-only";
import { db } from "@/src/db";
import {
  groupInvitations,
  familyGroups,
  familyGroupMembers,
} from "@/src/db/schema";
import { eq, and, isNull, sql, desc } from "drizzle-orm";
import crypto from "crypto";

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
}

export async function createInvitation(data: {
  groupId: number;
  createdById: number;
  maxUses?: number | null;
  expiresAt?: Date | null;
}) {
  let code = generateCode();

  // Retry if code already exists (unlikely but possible)
  for (let i = 0; i < 5; i++) {
    const [existing] = await db
      .select({ id: groupInvitations.id })
      .from(groupInvitations)
      .where(eq(groupInvitations.code, code))
      .limit(1);

    if (!existing) break;
    code = generateCode();
  }

  const [created] = await db
    .insert(groupInvitations)
    .values({
      groupId: data.groupId,
      code,
      createdById: data.createdById,
      maxUses: data.maxUses ?? null,
      expiresAt: data.expiresAt ?? null,
    })
    .returning();

  return created;
}

export async function getInvitationByCode(code: string) {
  try {
    const [data] = await db
      .select({
        id: groupInvitations.id,
        groupId: groupInvitations.groupId,
        code: groupInvitations.code,
        maxUses: groupInvitations.maxUses,
        usedCount: groupInvitations.usedCount,
        expiresAt: groupInvitations.expiresAt,
        createdAt: groupInvitations.createdAt,
        groupName: familyGroups.name,
      })
      .from(groupInvitations)
      .innerJoin(familyGroups, eq(groupInvitations.groupId, familyGroups.id))
      .where(
        and(
          eq(groupInvitations.code, code.toUpperCase()),
          isNull(groupInvitations.deletedAt),
          isNull(familyGroups.deletedAt)
        )
      )
      .limit(1);

    if (!data) {
      return { success: false as const, error: "הזמנה לא נמצאה או שפג תוקפה" };
    }

    // Check expiry
    if (data.expiresAt && data.expiresAt < new Date()) {
      return { success: false as const, error: "פג תוקף ההזמנה" };
    }

    // Check max uses
    if (data.maxUses !== null && data.usedCount >= data.maxUses) {
      return { success: false as const, error: "ההזמנה הגיעה למספר השימושים המרבי" };
    }

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to fetch invitation:", error);
    return { success: false as const, error: "שגיאה בטעינת ההזמנה" };
  }
}

export async function useInvitation(code: string, userId: number) {
  return await db.transaction(async (tx) => {
    // Re-fetch inside transaction for safety
    const [invitation] = await tx
      .select()
      .from(groupInvitations)
      .where(
        and(
          eq(groupInvitations.code, code.toUpperCase()),
          isNull(groupInvitations.deletedAt)
        )
      )
      .limit(1);

    if (!invitation) {
      throw new Error("הזמנה לא נמצאה");
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new Error("פג תוקף ההזמנה");
    }

    if (invitation.maxUses !== null && invitation.usedCount >= invitation.maxUses) {
      throw new Error("ההזמנה הגיעה למספר השימושים המרבי");
    }

    // Check if already a member
    const [existing] = await tx
      .select({ id: familyGroupMembers.id })
      .from(familyGroupMembers)
      .where(
        and(
          eq(familyGroupMembers.groupId, invitation.groupId),
          eq(familyGroupMembers.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      throw new Error("אתה כבר חבר בקבוצה זו");
    }

    // Add member
    await tx.insert(familyGroupMembers).values({
      groupId: invitation.groupId,
      userId,
      role: "member",
    });

    // Increment used count
    await tx
      .update(groupInvitations)
      .set({ usedCount: sql`${groupInvitations.usedCount} + 1` })
      .where(eq(groupInvitations.id, invitation.id));

    return invitation.groupId;
  });
}

export async function getInvitationsByGroup(groupId: number) {
  try {
    const data = await db
      .select({
        id: groupInvitations.id,
        code: groupInvitations.code,
        maxUses: groupInvitations.maxUses,
        usedCount: groupInvitations.usedCount,
        expiresAt: groupInvitations.expiresAt,
        createdAt: groupInvitations.createdAt,
      })
      .from(groupInvitations)
      .where(
        and(
          eq(groupInvitations.groupId, groupId),
          isNull(groupInvitations.deletedAt)
        )
      )
      .orderBy(desc(groupInvitations.createdAt));

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to fetch invitations:", error);
    return { success: false as const, error: "שגיאה בטעינת ההזמנות" };
  }
}

export async function softDeleteInvitation(id: number) {
  const [updated] = await db
    .update(groupInvitations)
    .set({ deletedAt: new Date() })
    .where(eq(groupInvitations.id, id))
    .returning({ id: groupInvitations.id });
  return updated ?? null;
}
