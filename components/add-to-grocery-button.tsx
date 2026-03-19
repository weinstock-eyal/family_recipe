"use client";

import { useState } from "react";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addIngredientsToGroceryList } from "@/app/grocery/actions";
import type { Ingredient } from "@/src/db/schema";

type Props = {
  recipeId: number;
  ingredients: Ingredient[];
  sessionId: string;
};

export function AddToGroceryButton({ recipeId, ingredients, sessionId }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  async function handleAdd() {
    setStatus("loading");
    const result = await addIngredientsToGroceryList({
      sessionId,
      recipeId,
      ingredients,
      multiplier: 1,
    });
    if (result.success) {
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("idle");
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full sm:w-auto min-h-[44px] gap-1.5"
      onClick={handleAdd}
      disabled={status === "loading" || status === "success"}
    >
      {status === "loading" ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          מוסיף...
        </>
      ) : status === "success" ? (
        <>
          <Check className="size-4 text-success" />
          נוסף לרשימת הקניות!
        </>
      ) : (
        <>
          <ShoppingCart className="size-4" />
          הוסף לרשימת קניות
        </>
      )}
    </Button>
  );
}
