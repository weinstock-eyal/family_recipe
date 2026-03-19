import { test, expect } from "@playwright/test";

test.describe("Recipe Creation", () => {
  test("create minimal recipe with title only", async ({ page }) => {
    await page.goto("/recipes/new");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "מתכון חדש" })).toBeVisible();

    // Fill only title
    await page.getByPlaceholder("למשל: עוגת שוקולד של סבתא").fill("מתכון בדיקה מינימלי");
    await page.getByRole("button", { name: "שמירת מתכון" }).click();

    // Should redirect to detail page
    await page.waitForURL(/\/recipes\/\d+/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "מתכון בדיקה מינימלי" })).toBeVisible();

    // Server should set the uploader to current user
    await expect(page.getByText("העלה: אמא")).toBeVisible();
  });

  test("create full recipe with all fields", async ({ page }) => {
    await page.goto("/recipes/new");
    await page.waitForLoadState("networkidle");

    // Title
    await page.getByPlaceholder("למשל: עוגת שוקולד של סבתא").fill("מתכון מלא לבדיקה");

    // Image URL
    await page.getByPlaceholder("https://...").first().fill("https://placehold.co/800x600");

    // Tags
    await page.getByPlaceholder("קינוחים, חלבי, אפייה").fill("בדיקה, חדש");

    // Expand and fill ingredients
    await page.getByText("מרכיבים (אופציונלי)").click();
    // Add first ingredient row
    await page.getByPlaceholder("כמות").first().fill("2");
    await page.getByPlaceholder("יחידה").first().fill("כוסות");
    await page.getByPlaceholder("שם המרכיב").first().fill("קמח");

    // Expand and fill instructions
    await page.getByText("הוראות הכנה (אופציונלי)").click();
    await page.getByPlaceholder("שלב 1").first().fill("לערבב הכל");

    // Submit
    await page.getByRole("button", { name: "שמירת מתכון" }).click();

    // Verify redirect and data
    await page.waitForURL(/\/recipes\/\d+/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "מתכון מלא לבדיקה" })).toBeVisible();
    await expect(page.getByText("בדיקה", { exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByText("חדש", { exact: true })).toBeVisible();
    await expect(page.getByText("קמח")).toBeVisible();
    await expect(page.getByText("לערבב הכל")).toBeVisible();
  });

  test("title is required", async ({ page }) => {
    await page.goto("/recipes/new");

    // Try to submit without title
    await page.getByRole("button", { name: "שמירת מתכון" }).click();

    // Should still be on /recipes/new (browser validation blocks submit)
    await expect(page).toHaveURL("/recipes/new");
  });

  test("ingredients section is collapsible", async ({ page }) => {
    await page.goto("/recipes/new");

    // Initially collapsed - no ingredient inputs visible
    await expect(page.getByPlaceholder("שם המרכיב")).not.toBeVisible();

    // Click to expand
    await page.getByText("מרכיבים (אופציונלי)").click();
    // Now ingredient add button should be visible
    await expect(page.getByPlaceholder("שם המרכיב").first()).toBeVisible();

    // Click to collapse
    await page.getByText("מרכיבים (אופציונלי)").click();
    await expect(page.getByPlaceholder("שם המרכיב")).not.toBeVisible();
  });

  test("instructions section is collapsible", async ({ page }) => {
    await page.goto("/recipes/new");

    await expect(page.getByPlaceholder("שלב 1")).not.toBeVisible();

    await page.getByText("הוראות הכנה (אופציונלי)").click();
    await expect(page.getByPlaceholder("שלב 1").first()).toBeVisible();

    await page.getByText("הוראות הכנה (אופציונלי)").click();
    await expect(page.getByPlaceholder("שלב 1")).not.toBeVisible();
  });

  test("cancel button navigates back", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "מתכון חדש" }).click();
    await expect(page).toHaveURL("/recipes/new");

    await page.getByRole("button", { name: "ביטול" }).click();
    await expect(page).toHaveURL("/");
  });
});
