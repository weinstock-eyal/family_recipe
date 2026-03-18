"use client";

import { useOptimistic } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleGroceryItem, removeGroceryItem } from "@/app/grocery/actions";

type GroceryItem = {
  id: number;
  item: string;
  amount: string | null;
  unit: string | null;
  checked: number;
  recipeTitle: string | null;
  recipeId: number;
};

type Props = {
  items: GroceryItem[];
};

export function GroceryList({ items }: Props) {
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    items,
    (state, update: { id: number; action: "toggle" | "remove" }) => {
      if (update.action === "remove") {
        return state.filter((i) => i.id !== update.id);
      }
      return state.map((i) =>
        i.id === update.id ? { ...i, checked: i.checked === 0 ? 1 : 0 } : i
      );
    }
  );

  // Group by recipe
  const grouped = new Map<string, GroceryItem[]>();
  for (const item of optimisticItems) {
    const key = item.recipeTitle ?? "אחר";
    const group = grouped.get(key) ?? [];
    group.push(item);
    grouped.set(key, group);
  }

  async function handleToggle(id: number) {
    setOptimisticItems({ id, action: "toggle" });
    await toggleGroceryItem({ id });
  }

  async function handleRemove(id: number) {
    setOptimisticItems({ id, action: "remove" });
    await removeGroceryItem({ id });
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([recipeTitle, groupItems]) => (
        <div key={recipeTitle} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            מתוך: {recipeTitle}
          </h3>
          <div className="space-y-2">
            {groupItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Checkbox
                  checked={item.checked === 1}
                  onCheckedChange={() => handleToggle(item.id)}
                />
                <span
                  className={`flex-1 text-base ${
                    item.checked === 1
                      ? "text-muted-foreground line-through opacity-60"
                      : ""
                  }`}
                >
                  {item.amount && <span className="font-semibold">{item.amount} </span>}
                  {item.unit && <span>{item.unit} </span>}
                  {item.item}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemove(item.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
