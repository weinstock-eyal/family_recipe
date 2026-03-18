"use client";

import { Plus, X, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IngredientGroup } from "@/src/db/schema";

type IngredientRow = { amount: string; unit: string; item: string };

type Props = {
  groups: IngredientGroup[];
  onChange: (groups: IngredientGroup[]) => void;
};

export function IngredientFormList({ groups, onChange }: Props) {
  function addIngredient(groupIndex: number) {
    const updated = groups.map((g, i) =>
      i === groupIndex
        ? { ...g, items: [...g.items, { amount: "", unit: "", item: "" }] }
        : g
    );
    onChange(updated);
  }

  function removeIngredient(groupIndex: number, itemIndex: number) {
    const updated = groups.map((g, i) =>
      i === groupIndex
        ? { ...g, items: g.items.filter((_, j) => j !== itemIndex) }
        : g
    );
    onChange(updated);
  }

  function updateIngredient(
    groupIndex: number,
    itemIndex: number,
    field: keyof IngredientRow,
    value: string
  ) {
    const updated = groups.map((g, gi) =>
      gi === groupIndex
        ? {
            ...g,
            items: g.items.map((row, ii) =>
              ii === itemIndex ? { ...row, [field]: value } : row
            ),
          }
        : g
    );
    onChange(updated);
  }

  function updateGroupName(groupIndex: number, name: string) {
    const updated = groups.map((g, i) =>
      i === groupIndex ? { ...g, name } : g
    );
    onChange(updated);
  }

  function addGroup() {
    onChange([...groups, { name: "", items: [{ amount: "", unit: "", item: "" }] }]);
  }

  function removeGroup(groupIndex: number) {
    onChange(groups.filter((_, i) => i !== groupIndex));
  }

  return (
    <div className="space-y-6">
      {groups.map((group, gi) => (
        <div key={gi} className="space-y-3">
          {/* Show group name input if there are multiple groups or group has a name */}
          {(groups.length > 1 || group.name) && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="שם הקבוצה (למשל: לבצק, לציפוי)"
                value={group.name ?? ""}
                onChange={(e) => updateGroupName(gi, e.target.value)}
                className="flex-1 font-semibold"
              />
              {groups.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeGroup(gi)}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          )}

          {group.items.map((row, ii) => (
            <div key={ii} className="flex items-center gap-2">
              <Input
                placeholder="כמות"
                value={row.amount}
                onChange={(e) => updateIngredient(gi, ii, "amount", e.target.value)}
                className="w-20"
              />
              <Input
                placeholder="יחידה"
                value={row.unit}
                onChange={(e) => updateIngredient(gi, ii, "unit", e.target.value)}
                className="w-24"
              />
              <Input
                placeholder="שם המרכיב"
                value={row.item}
                onChange={(e) => updateIngredient(gi, ii, "item", e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeIngredient(gi, ii)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addIngredient(gi)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            הוסף מרכיב
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addGroup}
        className="gap-1.5"
      >
        <Layers className="size-4" />
        הוסף קבוצת מרכיבים
      </Button>
    </div>
  );
}
