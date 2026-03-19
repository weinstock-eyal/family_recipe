import { redirect } from "next/navigation";
import { RecipeForm } from "@/components/recipe-form";
import { createRecipe } from "@/app/actions";
import { verifySession } from "@/src/lib/auth";
import { getGroupsByUserId } from "@/src/data/groups";
import { getUserById } from "@/src/data/users";

export default async function NewRecipePage() {
  const session = await verifySession();
  if (!session) redirect("/login");

  const [groupsResult, userResult] = await Promise.all([
    getGroupsByUserId(session.userId),
    getUserById(session.userId),
  ]);

  const groups = groupsResult.success
    ? groupsResult.data.map((g) => ({ id: g.id, name: g.name }))
    : [];

  const shareWithAllByDefault =
    userResult.success ? userResult.data.shareWithAllByDefault === 1 : true;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">מתכון חדש</h1>
      <RecipeForm
        action={createRecipe}
        submitLabel="שמירת מתכון"
        pendingLabel="שומר..."
        groups={groups}
        shareWithAllByDefault={shareWithAllByDefault}
      />
    </div>
  );
}
