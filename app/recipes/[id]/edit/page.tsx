import { notFound, redirect } from "next/navigation";
import { getRecipeById, normalizeIngredients, normalizeInstructions, getRecipeGroupIds } from "@/src/data/recipes";
import { verifySession } from "@/src/lib/auth";
import { getGroupsByUserId } from "@/src/data/groups";
import { RecipeForm } from "@/components/recipe-form";
import { updateRecipe } from "@/app/actions";

export default async function EditRecipePage({
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
  if (!session) redirect("/login");

  if (result.data.uploadedBy !== session.displayName) {
    redirect(`/recipes/${recipeId}`);
  }

  const [groupsResult, recipeGroupIds] = await Promise.all([
    getGroupsByUserId(session.userId),
    getRecipeGroupIds(recipeId),
  ]);

  const groups = groupsResult.success
    ? groupsResult.data.map((g) => ({ id: g.id, name: g.name }))
    : [];

  const recipe = result.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">עריכת מתכון</h1>
      <RecipeForm
        initialData={{
          id: recipe.id,
          title: recipe.title,
          imageUrl: recipe.imageUrl,
          youtubeUrl: recipe.youtubeUrl,
          sourceUrl: recipe.sourceUrl,
          ingredients: normalizeIngredients(recipe.ingredients),
          instructions: normalizeInstructions(recipe.instructions),
          tags: recipe.tags,
        }}
        action={updateRecipe}
        submitLabel="עדכון מתכון"
        pendingLabel="מעדכן..."
        groups={groups}
        initialGroupIds={recipeGroupIds}
      />
    </div>
  );
}
