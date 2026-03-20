"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateGroupAction } from "@/app/groups/actions";

export function GroupName({
  groupId,
  name,
  isAdmin,
}: {
  groupId: number;
  name: string;
  isAdmin: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, submitAction, isPending] = useActionState(
    async (_prev: unknown) => {
      const trimmed = editName.trim();
      if (!trimmed || trimmed === name) {
        setIsEditing(false);
        return null;
      }
      const result = await updateGroupAction({ groupId, name: trimmed });
      if (result.success) {
        setIsEditing(false);
      }
      return result;
    },
    null
  );

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleCancel = () => {
    setEditName(name);
    setIsEditing(false);
  };

  if (!isAdmin || !isEditing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">{name}</h1>
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            onClick={() => {
              setEditName(name);
              setIsEditing(true);
            }}
            aria-label="שנה שם קבוצה"
          >
            <Pencil className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <form action={submitAction} className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="text-lg font-bold h-10"
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Escape") handleCancel();
          }}
        />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="size-8 p-0 text-green-600"
          disabled={isPending}
          aria-label="שמור"
        >
          <Check className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={handleCancel}
          disabled={isPending}
          aria-label="בטל"
        >
          <X className="size-4" />
        </Button>
      </form>
      {state && !state.success && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </div>
  );
}
