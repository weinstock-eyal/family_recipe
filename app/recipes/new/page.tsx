import { RecipeForm } from "@/components/recipe-form";
import { createRecipe } from "@/app/actions";

export default function NewRecipePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">מתכון חדש</h1>
      <RecipeForm
        action={createRecipe}
        submitLabel="שמירת מתכון"
        pendingLabel="שומר..."
      />
    </div>
  );
}
