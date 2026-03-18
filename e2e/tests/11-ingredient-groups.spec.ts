import { test, expect } from "@playwright/test";

test.describe("Ingredient Groups", () => {
  test("create recipe with single unnamed group shows flat list", async ({ page }) => {
    await page.goto("/recipes/new");

    // Fill title
    await page.getByLabel("שם המתכון *").fill("מתכון בדיקה - קבוצה אחת");

    // Open ingredients
    await page.getByText("מרכיבים (אופציונלי)").click();

    // Fill first ingredient
    await page.getByPlaceholder("כמות").first().fill("2");
    await page.getByPlaceholder("יחידה").first().fill("כוסות");
    await page.getByPlaceholder("שם המרכיב").first().fill("קמח");

    // Submit
    await page.getByRole("button", { name: "שמור מתכון" }).click();
    await expect(page).toHaveURL(/\/recipes\/\d+/);

    // Should show ingredients heading without group name
    await expect(page.getByRole("heading", { name: "מרכיבים" })).toBeVisible();
    await expect(page.getByText("קמח")).toBeVisible();
  });

  test("create recipe with two named groups", async ({ page }) => {
    await page.goto("/recipes/new");

    await page.getByLabel("שם המתכון *").fill("עוגת שוקולד עם ציפוי");

    // Open ingredients
    await page.getByText("מרכיבים (אופציונלי)").click();

    // First ingredient in first group
    await page.getByPlaceholder("כמות").first().fill("3");
    await page.getByPlaceholder("יחידה").first().fill("כוסות");
    await page.getByPlaceholder("שם המרכיב").first().fill("קמח");

    // Add a second group
    await page.getByRole("button", { name: "הוסף קבוצת מרכיבים" }).click();

    // Name the groups
    const groupNameInputs = page.getByPlaceholder("שם הקבוצה (למשל: לבצק, לציפוי)");
    await groupNameInputs.first().fill("לעוגה");
    await groupNameInputs.nth(1).fill("לציפוי");

    // Fill second group ingredient
    const secondGroupItems = page.getByPlaceholder("שם המרכיב").nth(1);
    await secondGroupItems.fill("שוקולד מריר");
    await page.getByPlaceholder("כמות").nth(1).fill("200");
    await page.getByPlaceholder("יחידה").nth(1).fill("גרם");

    // Submit
    await page.getByRole("button", { name: "שמור מתכון" }).click();
    await expect(page).toHaveURL(/\/recipes\/\d+/);

    // Should show both group names
    await expect(page.getByText("לעוגה")).toBeVisible();
    await expect(page.getByText("לציפוי")).toBeVisible();

    // Should show ingredients
    await expect(page.getByText("קמח")).toBeVisible();
    await expect(page.getByText("שוקולד מריר")).toBeVisible();
  });

  test("multiplier works across groups", async ({ page }) => {
    // Navigate to a recipe with ingredients (hummus)
    await page.goto("/");
    await page.getByText("חומוס הבית").first().click();
    await expect(page).toHaveURL(/\/recipes\/\d+/);

    // Click x2 multiplier
    await page.getByRole("button", { name: "x2" }).click();

    // Original amount "2" for חומוס יבש should become "4"
    const ingredientsList = page.locator("ul");
    await expect(ingredientsList.getByText("4").first()).toBeVisible();
  });
});
