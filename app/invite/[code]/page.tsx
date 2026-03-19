"use client";

import { useActionState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { Users2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { joinGroupByCodeAction } from "@/app/groups/actions";

export default function InviteJoinPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();

  const [state, action, isPending] = useActionState(
    async () => {
      return await joinGroupByCodeAction({ code: params.code });
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      const timeout = setTimeout(() => {
        router.push(`/groups/${state.data.groupId}`);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [state, router]);

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <Card className="p-6 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users2 className="size-8" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold">הזמנה להצטרף לקבוצה</h1>
          <p className="text-sm text-muted-foreground">
            קוד הזמנה: <code className="font-mono">{params.code}</code>
          </p>
        </div>

        {state?.success ? (
          <div className="flex flex-col items-center gap-2 text-green-600">
            <CheckCircle className="size-8" />
            <p className="font-medium">הצטרפת בהצלחה!</p>
            <p className="text-sm text-muted-foreground">מעביר לדף הקבוצה...</p>
          </div>
        ) : (
          <>
            {state && !state.success && (
              <div className="flex items-center gap-2 justify-center text-destructive">
                <XCircle className="size-5" />
                <p className="text-sm">{state.error}</p>
              </div>
            )}
            <form action={action}>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full min-h-[44px]"
              >
                {isPending ? "מצטרף..." : "הצטרף לקבוצה"}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
