import "server-only";
import { db } from "@/src/db";
import {
  familyGroups,
  familyGroupMembers,
  users,
} from "@/src/db/schema";
import { eq, and, isNull, sql, desc } from "drizzle-orm";

export async function getGroupsByUserId(userId: number) {
  try {
    const data = await db
      .select({
        id: familyGroups.id,
        name: familyGroups.name,
        createdById: familyGroups.createdById,
        createdAt: familyGroups.createdAt,
        role: familyGroupMembers.role,
        memberCount: sql<number>`(
          SELECT count(*) FROM family_group_members
          WHERE group_id = ${familyGroups.id}
        )`,
      })
      .from(familyGroupMembers)
      .innerJoin(familyGroups, eq(familyGroupMembers.groupId, familyGroups.id))
      .where(
        and(
          eq(familyGroupMembers.userId, userId),
          isNull(familyGroups.deletedAt)
        )
      )
      .orderBy(desc(familyGroups.createdAt));

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to fetch user groups:", error);
    return { success: false as const, error: "שגיאה בטעינת הקבוצות" };
  }
}

export async function getUserGroupIds(userId: number): Promise<number[]> {
  const rows = await db
    .select({ groupId: familyGroupMembers.groupId })
    .from(familyGroupMembers)
    .innerJoin(familyGroups, eq(familyGroupMembers.groupId, familyGroups.id))
    .where(
      and(
        eq(familyGroupMembers.userId, userId),
        isNull(familyGroups.deletedAt)
      )
    );

  return rows.map((r) => r.groupId);
}

export async function getGroupById(groupId: number) {
  try {
    const [data] = await db
      .select({
        id: familyGroups.id,
        name: familyGroups.name,
        createdById: familyGroups.createdById,
        createdAt: familyGroups.createdAt,
        memberCount: sql<number>`(
          SELECT count(*) FROM family_group_members
          WHERE group_id = ${familyGroups.id}
        )`,
      })
      .from(familyGroups)
      .where(and(eq(familyGroups.id, groupId), isNull(familyGroups.deletedAt)))
      .limit(1);

    if (!data) {
      return { success: false as const, error: "הקבוצה לא נמצאה" };
    }

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to fetch group:", error);
    return { success: false as const, error: "שגיאה בטעינת הקבוצה" };
  }
}

export async function getGroupWithMembers(groupId: number) {
  try {
    const groupResult = await getGroupById(groupId);
    if (!groupResult.success) return groupResult;

    const members = await db
      .select({
        userId: familyGroupMembers.userId,
        role: familyGroupMembers.role,
        joinedAt: familyGroupMembers.joinedAt,
        displayName: users.displayName,
        email: users.email,
      })
      .from(familyGroupMembers)
      .innerJoin(users, eq(familyGroupMembers.userId, users.id))
      .where(eq(familyGroupMembers.groupId, groupId))
      .orderBy(familyGroupMembers.joinedAt);

    return {
      success: true as const,
      data: { ...groupResult.data, members },
    };
  } catch (error) {
    console.error("Failed to fetch group with members:", error);
    return { success: false as const, error: "שגיאה בטעינת הקבוצה" };
  }
}

export async function createGroup(data: { name: string; createdById: number }) {
  return await db.transaction(async (tx) => {
    const [group] = await tx
      .insert(familyGroups)
      .values({ name: data.name, createdById: data.createdById })
      .returning();

    await tx.insert(familyGroupMembers).values({
      groupId: group.id,
      userId: data.createdById,
      role: "admin",
    });

    return group;
  });
}

export async function updateGroup(groupId: number, data: { name: string }) {
  const [updated] = await db
    .update(familyGroups)
    .set({ name: data.name })
    .where(eq(familyGroups.id, groupId))
    .returning();
  return updated ?? null;
}

export async function softDeleteGroup(groupId: number) {
  const [updated] = await db
    .update(familyGroups)
    .set({ deletedAt: new Date() })
    .where(eq(familyGroups.id, groupId))
    .returning({ id: familyGroups.id });
  return updated ?? null;
}

export async function addMemberToGroup(
  groupId: number,
  userId: number,
  role: string = "member"
) {
  const [created] = await db
    .insert(familyGroupMembers)
    .values({ groupId, userId, role })
    .returning();
  return created;
}

export async function removeMemberFromGroup(groupId: number, userId: number) {
  const [deleted] = await db
    .delete(familyGroupMembers)
    .where(
      and(
        eq(familyGroupMembers.groupId, groupId),
        eq(familyGroupMembers.userId, userId)
      )
    )
    .returning({ id: familyGroupMembers.id });
  return deleted ?? null;
}

export async function updateMemberRole(
  groupId: number,
  userId: number,
  role: string
) {
  const [updated] = await db
    .update(familyGroupMembers)
    .set({ role })
    .where(
      and(
        eq(familyGroupMembers.groupId, groupId),
        eq(familyGroupMembers.userId, userId)
      )
    )
    .returning();
  return updated ?? null;
}

export async function isGroupAdmin(groupId: number, userId: number) {
  const [row] = await db
    .select({ role: familyGroupMembers.role })
    .from(familyGroupMembers)
    .where(
      and(
        eq(familyGroupMembers.groupId, groupId),
        eq(familyGroupMembers.userId, userId)
      )
    )
    .limit(1);
  return row?.role === "admin";
}

export async function isGroupMember(groupId: number, userId: number) {
  const [row] = await db
    .select({ id: familyGroupMembers.id })
    .from(familyGroupMembers)
    .where(
      and(
        eq(familyGroupMembers.groupId, groupId),
        eq(familyGroupMembers.userId, userId)
      )
    )
    .limit(1);
  return !!row;
}

export async function getGroupAdminCount(groupId: number) {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(familyGroupMembers)
    .where(
      and(
        eq(familyGroupMembers.groupId, groupId),
        eq(familyGroupMembers.role, "admin")
      )
    );
  return Number(result.count);
}
