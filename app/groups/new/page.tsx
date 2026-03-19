"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { createGroupAction } from "@/app/groups/actions";

export default function NewGroupPage() {
  const router = useRouter();

  const [state, action, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const name = formData.get("name") as string;
      const result = await createGroupAction({ name });
      if (result.success) {
        return { success: true, groupId: result.data.id };
      }
      return { success: false, error: result.error };
    },
    null
  );

  useEffect(() => {
    if (state?.success && "groupId" in state) {
      router.push(`/groups/${state.groupId}`);
    }
  }, [state, router]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">קבוצה חדשה</h1>

      <Card className="p-6">
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם הקבוצה</Label>
            <Input
              id="name"
              name="name"
              placeholder='לדוגמה: "משפחת כהן המורחבת"'
              required
              minLength={1}
              maxLength={255}
              className="min-h-[44px]"
            />
          </div>

          {state && !state.success && "error" in state && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full min-h-[44px]"
          >
            {isPending ? "יוצר..." : "צור קבוצה"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
