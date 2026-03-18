"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteRecipe } from "@/app/actions";

type Props = {
  recipeId: number;
  recipeTitle: string;
};

export function DeleteRecipeButton({ recipeId, recipeTitle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteRecipe({ id: recipeId });
    if (result.success) {
      router.push("/");
    } else {
      setDeleting(false);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="destructive" size="sm" className="gap-1.5" />}
      >
        <Trash2 className="size-4" />
        מחיקה
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>מחיקת מתכון</DialogTitle>
          <DialogDescription>
            האם למחוק את &quot;{recipeTitle}&quot;? פעולה זו לא ניתנת לביטול.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
            ביטול
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                מוחק...
              </>
            ) : (
              "כן, מחק"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
