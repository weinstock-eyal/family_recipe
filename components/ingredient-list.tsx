"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { IngredientGroup } from "@/src/db/schema";

const MULTIPLIERS = [0.5, 1, 2] as const;

export function IngredientList({ groups }: { groups: IngredientGroup[] }) {
  const [multiplier, setMultiplier] = useState(1);

  function formatAmount(amount: string, mult: number): string {
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    const result = num * mult;
    return result % 1 === 0 ? String(result) : result.toFixed(1);
  }

  const hasMultipleGroups = groups.length > 1 || (groups.length === 1 && groups[0].name);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">מרכיבים</h2>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {MULTIPLIERS.map((m) => (
            <Button
              key={m}
              variant={multiplier === m ? "default" : "ghost"}
              size="xs"
              onClick={() => setMultiplier(m)}
            >
              x{m}
            </Button>
          ))}
        </div>
      </div>

      {groups.map((group, gi) => (
        <div key={gi} className="space-y-2">
          {hasMultipleGroups && group.name && (
            <h3 className="text-base font-semibold text-muted-foreground">{group.name}</h3>
          )}
          <ul className="space-y-2">
            {group.items.map((ing, i) => (
              <li key={i} className="flex items-center gap-2 text-base">
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                {ing.amount && (
                  <span className="font-semibold">
                    {formatAmount(ing.amount, multiplier)}
                  </span>
                )}
                {ing.unit && <span>{ing.unit}</span>}
                <span>{ing.item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
