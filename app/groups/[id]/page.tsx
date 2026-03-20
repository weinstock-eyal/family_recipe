import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/src/lib/auth";
import { getGroupWithMembers, isGroupMember } from "@/src/data/groups";
import { getInvitationsByGroup } from "@/src/data/invitations";
import { GroupMemberList } from "@/components/group-member-list";
import { GroupInviteSection } from "@/components/group-invite-section";
import { GroupActions } from "@/components/group-actions";
import { GroupName } from "@/components/group-name";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await verifySession();
  if (!session) redirect("/login");

  const { id } = await params;
  const groupId = parseInt(id, 10);
  if (isNaN(groupId)) notFound();

  // Verify membership
  const isMember = await isGroupMember(groupId, session.userId);
  if (!isMember) notFound();

  const result = await getGroupWithMembers(groupId);
  if (!result.success) notFound();

  const group = result.data;
  const currentUserRole = group.members.find(
    (m) => m.userId === session.userId
  )?.role;
  const isAdmin = currentUserRole === "admin";

  const invitationsResult = isAdmin
    ? await getInvitationsByGroup(groupId)
    : null;
  const invitations =
    invitationsResult?.success ? invitationsResult.data : [];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <GroupName groupId={groupId} name={group.name} isAdmin={isAdmin} />
          <p className="text-sm text-muted-foreground">
            {group.members.length} חברים
          </p>
        </div>
        <GroupActions
          groupId={groupId}
          groupName={group.name}
          isAdmin={isAdmin}
          currentUserId={session.userId}
        />
      </div>

      <GroupMemberList
        groupId={groupId}
        members={group.members}
        isAdmin={isAdmin}
        currentUserId={session.userId}
      />

      {isAdmin && (
        <GroupInviteSection
          groupId={groupId}
          invitations={invitations}
        />
      )}
    </div>
  );
}
