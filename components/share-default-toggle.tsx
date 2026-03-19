"use client";

import { useActionState, useOptimistic } from "react";
import { Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateShareDefaultAction } from "@/app/groups/actions";

export function ShareDefaultToggle({
  userId,
  defaultValue,
}: {
  userId: number;
  defaultValue: boolean;
}) {
  const [optimisticValue, setOptimisticValue] = useOptimistic(defaultValue);

  const [state, action] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const newValue = formData.get("shareWithAll") === "on";
      setOptimisticValue(newValue);
      return await updateShareDefaultAction({
        shareWithAllByDefault: newValue,
      });
    },
    null
  );

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Settings className="mt-0.5 size-4 text-muted-foreground shrink-0" />
        <div className="flex-1 space-y-2">
          <h3 className="text-sm font-semibold">הגדרות שיתוף</h3>
          <form action={action}>
            <div className="flex items-center gap-3 min-h-[44px]">
              <Checkbox
                id="shareWithAll"
                name="shareWithAll"
                checked={optimisticValue}
                onCheckedChange={(checked) => {
                  const form = document.getElementById("shareWithAll")?.closest("form");
                  if (form) {
                    const input = form.querySelector<HTMLInputElement>('[name="shareWithAll"]');
                    if (input) input.checked = !!checked;
                    form.requestSubmit();
                  }
                }}
              />
              <Label htmlFor="shareWithAll" className="text-sm leading-tight cursor-pointer">
                שתף מתכונים חדשים עם כל הקבוצות שלי כברירת מחדל
              </Label>
            </div>
          </form>
          <p className="text-xs text-muted-foreground">
            {optimisticValue
              ? "כשתעלה מתכון חדש, הוא ישותף אוטומטית עם כל הקבוצות שלך."
              : "כשתעלה מתכון חדש, תצטרך לבחור ידנית עם אילו קבוצות לשתף."}
          </p>
        </div>
      </div>
    </Card>
  );
}
