import Link from "next/link";
import { Plus, CookingPot, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRecipes, searchRecipes, getRecipesCount, normalizeIngredients } from "@/src/data/recipes";
import { RecipeCard } from "@/components/recipe-card";
import { SearchInput } from "@/components/search-input";
import { verifySession } from "@/src/lib/auth";
import { getUserGroupIds } from "@/src/data/groups";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await verifySession();
  if (!session) redirect("/login");

  const { q } = await searchParams;
  const { userId, displayName } = session;

  const [recipesResult, countResult, groupIds] = await Promise.all([
    q
      ? searchRecipes({ query: q, userId, displayName })
      : getRecipes({ userId, displayName }),
    getRecipesCount(userId, displayName),
    getUserGroupIds(userId),
  ]);

  const hasNoGroups = groupIds.length === 0;

  const recipes = recipesResult.success ? recipesResult.data : [];
  const totalCount = countResult.success ? countResult.data : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">המתכונים שלנו</h1>
          {!q && totalCount > 0 && (
            <p className="text-sm text-muted-foreground">{totalCount} מתכונים</p>
          )}
        </div>
        <Link href="/recipes/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto min-h-[44px] gap-1.5 bg-contrast text-contrast-foreground hover:bg-contrast/90">
            <Plus className="size-4" />
            מתכון חדש
          </Button>
        </Link>
      </div>

      {hasNoGroups && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            אתה רואה רק מתכונים שהעלית. בקש ממשתמש אחר שישלח לך הזמנה להצטרף לקבוצה כדי לראות מתכונים משותפים.
          </p>
        </div>
      )}

      <SearchInput />

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <CookingPot className="size-12 text-muted-foreground/50" />
          <p className="text-lg text-muted-foreground">
            {q ? "לא נמצאו מתכונים" : "עדיין אין מתכונים. הוסיפו את המתכון הראשון!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              title={recipe.title}
              uploadedBy={recipe.uploadedBy}
              createdAt={recipe.createdAt}
              imageUrl={recipe.imageUrl}
              tags={recipe.tags}
              hasIngredients={normalizeIngredients(recipe.ingredients)?.some(g => g.items.length > 0) ?? false}
              likes={recipe.likes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
