"use client";

import { useState, useActionState } from "react";
import { Copy, Check, Link2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createInvitationAction, revokeInvitationAction } from "@/app/groups/actions";
import { format } from "date-fns";

type Invitation = {
  id: number;
  code: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  createdAt: Date;
};

export function GroupInviteSection({
  groupId,
  invitations,
}: {
  groupId: number;
  invitations: Invitation[];
}) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [createState, createAction, isCreating] = useActionState(
    async () => {
      return await createInvitationAction({ groupId });
    },
    null
  );

  const newCode = createState?.success ? createState.data.code : null;

  async function copyInviteLink(code: string) {
    const url = `${window.location.origin}/invite/${code}`;
    await navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">הזמנות</h2>
        <form action={createAction}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isCreating}
            className="min-h-[44px] gap-1.5"
          >
            <Link2 className="size-4" />
            {isCreating ? "יוצר..." : "הזמנה חדשה"}
          </Button>
        </form>
      </div>

      {newCode && (
        <Card className="border-primary bg-primary/5 p-4 space-y-2">
          <p className="text-sm font-medium">הזמנה חדשה נוצרה!</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
              {newCode}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => copyInviteLink(newCode)}
            >
              {copiedCode === newCode ? (
                <Check className="size-4 text-green-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            שלח את הקישור לחבר משפחה דרך וואטסאפ או הודעה
          </p>
        </Card>
      )}

      {createState && !createState.success && (
        <p className="text-sm text-destructive">{createState.error}</p>
      )}

      {invitations.length > 0 && (
        <div className="space-y-2">
          {invitations.map((inv) => (
            <InvitationRow
              key={inv.id}
              invitation={inv}
              groupId={groupId}
              copiedCode={copiedCode}
              onCopy={copyInviteLink}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InvitationRow({
  invitation,
  groupId,
  copiedCode,
  onCopy,
}: {
  invitation: Invitation;
  groupId: number;
  copiedCode: string | null;
  onCopy: (code: string) => void;
}) {
  const [revokeState, revokeAction, isRevoking] = useActionState(
    async () => {
      return await revokeInvitationAction({ id: invitation.id, groupId });
    },
    null
  );

  const isExpired = invitation.expiresAt && invitation.expiresAt < new Date();
  const isMaxedOut =
    invitation.maxUses !== null && invitation.usedCount >= invitation.maxUses;

  return (
    <Card className="flex items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono">{invitation.code}</code>
          {isExpired && <Badge variant="destructive" className="text-xs">פג תוקף</Badge>}
          {isMaxedOut && <Badge variant="secondary" className="text-xs">מלא</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          שימושים: {invitation.usedCount}
          {invitation.maxUses !== null && ` / ${invitation.maxUses}`}
          {" | "}
          נוצר: {format(invitation.createdAt, "dd/MM/yyyy")}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="min-h-[44px] min-w-[44px]"
          onClick={() => onCopy(invitation.code)}
          disabled={!!isExpired || !!isMaxedOut}
        >
          {copiedCode === invitation.code ? (
            <Check className="size-4 text-green-600" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
        <form action={revokeAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={isRevoking}
            className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </form>
      </div>
      {revokeState && !revokeState.success && (
        <p className="text-xs text-destructive">{revokeState.error}</p>
      )}
    </Card>
  );
}
