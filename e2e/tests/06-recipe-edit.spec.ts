import { test, expect } from "@playwright/test";
import { RECIPES } from "../helpers/test-data";

// Helper: create a recipe owned by the current user and return on its detail page
async function createOwnRecipe(page: import("@playwright/test").Page, title: string) {
  await page.goto("/recipes/new");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("למשל: עוגת שוקולד של סבתא").fill(title);
  await page.getByRole("button", { name: "שמירת מתכון" }).click();
  await page.waitForURL(/\/recipes\/\d+/, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

test.describe("Recipe Editing", () => {
  test("edit page pre-populates form with existing data", async ({ page }) => {
    // Create a recipe with ingredients so we can verify edit pre-population
    await page.goto("/recipes/new");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("למשל: עוגת שוקולד של סבתא").fill("מתכון לבדיקת עריכה");
    await page.getByText("מרכיבים (אופציונלי)").click();
    await page.getByPlaceholder("כמות").first().fill("1");
    await page.getByPlaceholder("יחידה").first().fill("כוס");
    await page.getByPlaceholder("שם המרכיב").first().fill("קמח");
    await page.getByRole("button", { name: "שמירת מתכון" }).click();
    await page.waitForURL(/\/recipes\/\d+/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Click edit button
    await page.getByRole("link", { name: "עריכה" }).click();
    await page.waitForURL(/\/edit/, { timeout: 10000 });

    // Verify page heading
    await expect(page.getByRole("heading", { name: "עריכת מתכון" })).toBeVisible();

    // Title field should be pre-populated
    const titleInput = page.getByPlaceholder("למשל: עוגת שוקולד של סבתא");
    await expect(titleInput).toHaveValue("מתכון לבדיקת עריכה");

    // Ingredients section should be expanded (recipe has ingredients)
    await expect(page.getByPlaceholder("שם המרכיב").first()).toBeVisible();
  });

  test("update recipe title", async ({ page }) => {
    // First create a recipe to edit (don't modify seed data)
    await createOwnRecipe(page, "מתכון לעריכה");

    // Go to edit
    await page.getByRole("link", { name: "עריכה" }).click();
    await expect(page).toHaveURL(/\/edit/);

    // Wait for edit form hydration
    await page.waitForLoadState("networkidle");

    // Change title
    const titleInput = page.getByPlaceholder("למשל: עוגת שוקולד של סבתא");
    await titleInput.clear();
    await titleInput.fill("מתכון מעודכן");
    await page.getByRole("button", { name: "עדכון מתכון" }).click();

    // Verify redirect and updated title
    await page.waitForURL(/\/recipes\/\d+$/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "מתכון מעודכן" })).toBeVisible();
  });

  test("non-owner redirected from edit URL", async ({ browser }) => {
    // Use eyal's auth state
    const context = await browser.newContext({
      storageState: "./e2e/.auth/eyal.json",
    });
    const page = await context.newPage();

    // First, find the ID of a recipe owned by mama
    await page.goto("/");
    await page.getByText(RECIPES.tea.title).first().click();
    await expect(page).toHaveURL(/\/recipes\/\d+/);

    const url = page.url();
    const recipeId = url.match(/\/recipes\/(\d+)/)?.[1];

    // Try to navigate to edit page directly
    await page.goto(`/recipes/${recipeId}/edit`);

    // Should be redirected to detail page (not edit)
    await expect(page).toHaveURL(`/recipes/${recipeId}`);
    await expect(page.getByRole("heading", { name: "עריכת מתכון" })).not.toBeVisible();

    await context.close();
  });

  test("edit preserves existing ingredients", async ({ page }) => {
    // Create a recipe with ingredients
    await page.goto("/recipes/new");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("למשל: עוגת שוקולד של סבתא").fill("מתכון עם מרכיבים");
    await page.getByText("מרכיבים (אופציונלי)").click();
    await page.getByPlaceholder("כמות").first().fill("3");
    await page.getByPlaceholder("יחידה").first().fill("כוסות");
    await page.getByPlaceholder("שם המרכיב").first().fill("סוכר");
    await page.getByRole("button", { name: "שמירת מתכון" }).click();
    await page.waitForURL(/\/recipes\/\d+/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Verify ingredient exists
    await expect(page.getByText("סוכר")).toBeVisible();

    // Edit only the title
    await page.getByRole("link", { name: "עריכה" }).click();
    await page.waitForURL(/\/edit/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    const titleInput = page.getByPlaceholder("למשל: עוגת שוקולד של סבתא");
    await titleInput.clear();
    await titleInput.fill("מתכון עם מרכיבים - מעודכן");
    await page.getByRole("button", { name: "עדכון מתכון" }).click();
    await page.waitForURL(/\/recipes\/\d+$/, { timeout: 15000 });

    // Ingredients should still be there
    await expect(page.getByText("סוכר")).toBeVisible();
    await expect(page.getByRole("heading", { name: "מרכיבים", exact: true })).toBeVisible();
  });
});
