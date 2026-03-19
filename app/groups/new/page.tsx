"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { createGroupAction } from "@/app/groups/actions";

export default function NewGroupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    try {
      const result = await createGroupAction({ name });
      if (result.success) {
        router.push(`/groups/${result.data.id}`);
        return;
      }
      setError(result.error);
    } catch {
      setError("שגיאה ביצירת הקבוצה");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">קבוצה חדשה</h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && (
            <p className="text-sm text-destructive">{error}</p>
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
