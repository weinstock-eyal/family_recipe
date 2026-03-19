"use client";

import { useActionState } from "react";
import { Shield, UserMinus, ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { removeMemberAction, updateMemberRoleAction } from "@/app/groups/actions";

type Member = {
  userId: number;
  role: string;
  joinedAt: Date;
  displayName: string;
  email: string;
};

export function GroupMemberList({
  groupId,
  members,
  isAdmin,
  currentUserId,
}: {
  groupId: number;
  members: Member[];
  isAdmin: boolean;
  currentUserId: number;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">חברי הקבוצה</h2>
      <div className="space-y-2">
        {members.map((member) => (
          <MemberRow
            key={member.userId}
            groupId={groupId}
            member={member}
            isAdmin={isAdmin}
            isSelf={member.userId === currentUserId}
          />
        ))}
      </div>
    </div>
  );
}

function MemberRow({
  groupId,
  member,
  isAdmin,
  isSelf,
}: {
  groupId: number;
  member: Member;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const [removeState, removeAction, isRemoving] = useActionState(
    async () => {
      return await removeMemberAction({ groupId, userId: member.userId });
    },
    null
  );

  const [roleState, roleAction, isUpdatingRole] = useActionState(
    async () => {
      const newRole = member.role === "admin" ? "member" : "admin";
      return await updateMemberRoleAction({
        groupId,
        userId: member.userId,
        role: newRole,
      });
    },
    null
  );

  const error = removeState && !removeState.success ? removeState.error : null;
  const roleError = roleState && !roleState.success ? roleState.error : null;

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">
              {member.displayName}
              {isSelf && (
                <span className="text-muted-foreground font-normal"> (את/ה)</span>
              )}
            </span>
            {member.role === "admin" && (
              <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                <Shield className="size-3" />
                מנהל
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isAdmin && !isSelf && (
            <>
              <form action={roleAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  disabled={isUpdatingRole}
                  className="min-h-[44px] min-w-[44px]"
                  title={member.role === "admin" ? "הורד למשתמש רגיל" : "הפוך למנהל"}
                >
                  <ArrowUpDown className="size-4" />
                </Button>
              </form>
              <form action={removeAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  disabled={isRemoving}
                  className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                  title="הסר מהקבוצה"
                >
                  <UserMinus className="size-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
      {(error || roleError) && (
        <p className="mt-2 text-xs text-destructive">{error || roleError}</p>
      )}
    </Card>
  );
}
