"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeMemberAction, deleteGroupAction } from "@/app/groups/actions";

export function GroupActions({
  groupId,
  groupName,
  isAdmin,
  currentUserId,
}: {
  groupId: number;
  groupName: string;
  isAdmin: boolean;
  currentUserId: number;
}) {
  const router = useRouter();

  const [leaveState, leaveAction, isLeaving] = useActionState(
    async () => {
      return await removeMemberAction({ groupId, userId: currentUserId });
    },
    null
  );

  const [deleteState, deleteAction, isDeleting] = useActionState(
    async () => {
      if (!confirm(`למחוק את הקבוצה "${groupName}"? פעולה זו לא ניתנת לביטול.`)) {
        return null;
      }
      return await deleteGroupAction({ groupId });
    },
    null
  );

  useEffect(() => {
    if (leaveState?.success || deleteState?.success) {
      router.push("/groups");
    }
  }, [leaveState, deleteState, router]);

  return (
    <div className="flex gap-2">
      <form action={leaveAction}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={isLeaving}
          className="min-h-[44px] gap-1.5"
        >
          <LogOut className="size-4" />
          {isLeaving ? "עוזב..." : "עזוב קבוצה"}
        </Button>
      </form>

      {isAdmin && (
        <form action={deleteAction}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isDeleting}
            className="min-h-[44px] gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
            {isDeleting ? "מוחק..." : "מחק קבוצה"}
          </Button>
        </form>
      )}

      {leaveState && !leaveState.success && (
        <p className="text-sm text-destructive">{leaveState.error}</p>
      )}
      {deleteState && !deleteState.success && (
        <p className="text-sm text-destructive">{deleteState.error}</p>
      )}
    </div>
  );
}
