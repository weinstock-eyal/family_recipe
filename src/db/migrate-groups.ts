/**
 * Migration script: Creates a default "המשפחה" group,
 * adds all existing active users to it, and links all
 * existing recipes to the group via recipeGroupShares.
 *
 * Run: npx tsx src/db/migrate-groups.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { eq, isNull } from "drizzle-orm";

const {
  users,
  recipes,
  familyGroups,
  familyGroupMembers,
  recipeGroupShares,
} = schema;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql, { schema });

  console.log("Starting family groups migration...");

  // Find first admin user to be the group creator
  const [adminUser] = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);

  if (!adminUser) {
    console.error("No admin user found. Cannot create default group.");
    await sql.end();
    process.exit(1);
  }

  console.log(`Using admin "${adminUser.displayName}" (ID: ${adminUser.id}) as group creator`);

  await db.transaction(async (tx) => {
    // 1. Create default group
    const [group] = await tx
      .insert(familyGroups)
      .values({
        name: "המשפחה",
        createdById: adminUser.id,
      })
      .returning();

    console.log(`Created group "${group.name}" (ID: ${group.id})`);

    // 2. Add all active users as members
    const allUsers = await tx
      .select({ id: users.id, displayName: users.displayName, role: users.role })
      .from(users)
      .where(eq(users.isActive, 1));

    if (allUsers.length > 0) {
      await tx.insert(familyGroupMembers).values(
        allUsers.map((user) => ({
          groupId: group.id,
          userId: user.id,
          role: user.id === adminUser.id ? "admin" : "member",
        }))
      );
      console.log(`Added ${allUsers.length} users to the group`);
    }

    // 3. Link all non-deleted recipes to the group
    const allRecipes = await tx
      .select({ id: recipes.id })
      .from(recipes)
      .where(isNull(recipes.deletedAt));

    if (allRecipes.length > 0) {
      await tx.insert(recipeGroupShares).values(
        allRecipes.map((recipe) => ({
          recipeId: recipe.id,
          groupId: group.id,
        }))
      );
      console.log(`Linked ${allRecipes.length} recipes to the group`);
    }
  });

  console.log("Migration complete!");
  await sql.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
