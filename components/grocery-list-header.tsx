"use client";

import { useState } from "react";
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
import { clearGroceryList } from "@/app/grocery/actions";

type Props = {
  sessionId: string;
  totalCount: number;
  checkedCount: number;
};

export function GroceryListHeader({ sessionId, totalCount, checkedCount }: Props) {
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function handleClear() {
    setClearing(true);
    await clearGroceryList({ sessionId });
    setClearing(false);
    setOpen(false);
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">רשימת קניות</h1>
        <p className="text-sm text-muted-foreground">
          {totalCount} פריטים | {checkedCount}/{totalCount} הושלמו
        </p>
      </div>
      {totalCount > 0 && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={<Button variant="destructive" size="sm" className="gap-1.5" />}
          >
            <Trash2 className="size-4" />
            נקה הכל
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ניקוי רשימת קניות</DialogTitle>
              <DialogDescription>
                האם לנקות את כל רשימת הקניות?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={clearing} className="min-h-[44px]">
                ביטול
              </Button>
              <Button variant="destructive" onClick={handleClear} disabled={clearing} className="min-h-[44px]">
                {clearing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    מנקה...
                  </>
                ) : (
                  "כן, נקה"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
