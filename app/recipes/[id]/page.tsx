import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getRecipeById, normalizeIngredients, normalizeInstructions } from "@/src/data/recipes";
import { verifySession } from "@/src/lib/auth";
import { RecipeDetail } from "@/components/recipe-detail";
import { IngredientList } from "@/components/ingredient-list";
import { AddToGroceryButton } from "@/components/add-to-grocery-button";
import { LikeButtons } from "@/components/like-buttons";
import { NotesSection } from "@/components/notes-section";
import { DeleteRecipeButton } from "@/components/delete-recipe-button";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);
  if (isNaN(recipeId)) notFound();

  const [result, session] = await Promise.all([
    getRecipeById(recipeId),
    verifySession(),
  ]);

  if (!result.success) notFound();

  const recipe = result.data;
  const currentUser = session?.displayName ?? "";
  const isOwner = recipe.uploadedBy === currentUser;
  const ingredientGroups = normalizeIngredients(recipe.ingredients);
  const instructionSections = normalizeInstructions(recipe.instructions);
  const hasIngredients = ingredientGroups !== null && ingredientGroups.some(g => g.items.length > 0);
  const flatIngredients = ingredientGroups?.flatMap(g => g.items) ?? [];
  const sessionId = String(session?.userId ?? "");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-2">
        <Link href="/">
          <Button variant="ghost" size="default" className="min-h-[44px] gap-1.5">
            <ArrowRight className="size-4" />
            חזרה למתכונים
          </Button>
        </Link>

        {isOwner && (
          <div className="flex items-center gap-2">
            <Link href={`/recipes/${recipeId}/edit`}>
              <Button variant="outline" size="default" className="min-h-[44px] gap-1.5">
                <Pencil className="size-4" />
                עריכה
              </Button>
            </Link>
            <DeleteRecipeButton recipeId={recipeId} recipeTitle={recipe.title} />
          </div>
        )}
      </div>

      <RecipeDetail
        title={recipe.title}
        uploadedBy={recipe.uploadedBy}
        createdAt={recipe.createdAt}
        imageUrl={recipe.imageUrl}
        youtubeUrl={recipe.youtubeUrl}
        sourceUrl={recipe.sourceUrl}
        instructions={instructionSections}
        hasIngredients={hasIngredients}
      />

      {recipe.tags && recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {hasIngredients && ingredientGroups && (
        <>
          <Separator />
          <IngredientList groups={ingredientGroups} />
          <AddToGroceryButton
            recipeId={recipeId}
            ingredients={flatIngredients}
            sessionId={sessionId}
          />
        </>
      )}

      <Separator />

      <LikeButtons
        recipeId={recipeId}
        likes={recipe.likes}
        dislikes={recipe.dislikes}
      />

      <Separator />

      <NotesSection
        recipeId={recipeId}
        notes={recipe.familyNotes}
        currentUser={currentUser}
      />
    </div>
  );
}
