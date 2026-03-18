import { ShoppingCart } from "lucide-react";
import { verifySession } from "@/src/lib/auth";
import { getGroceryItems } from "@/src/data/grocery";
import { GroceryListHeader } from "@/components/grocery-list-header";
import { GroceryList } from "@/components/grocery-list";

export default async function GroceryPage() {
  const session = await verifySession();
  if (!session) return null;

  const sessionId = String(session.userId);
  const result = await getGroceryItems({ sessionId });
  const items = result.success ? result.data : [];
  const checkedCount = items.filter((i) => i.checked === 1).length;

  return (
    <div className="space-y-8">
      <GroceryListHeader
        sessionId={sessionId}
        totalCount={items.length}
        checkedCount={checkedCount}
      />

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <ShoppingCart className="size-12 text-muted-foreground/50" />
          <div className="space-y-1">
            <p className="text-lg text-muted-foreground">רשימת הקניות ריקה</p>
            <p className="text-sm text-muted-foreground">
              הוסיפו מרכיבים מדף המתכון
            </p>
          </div>
        </div>
      ) : (
        <GroceryList items={items} />
      )}
    </div>
  );
}
