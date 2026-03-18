import { test, expect } from "@playwright/test";
import { RECIPES, TOTAL_SEED_RECIPES } from "../helpers/test-data";

test.describe("Home Page", () => {
  test("displays all seed recipes", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("המתכונים שלנו")).toBeVisible();
    await expect(page.getByText(`${TOTAL_SEED_RECIPES} מתכונים`)).toBeVisible();

    // All 5 recipe cards should be visible
    for (const recipe of Object.values(RECIPES)) {
      await expect(page.getByText(recipe.title).first()).toBeVisible();
    }
  });

  test("recipe card displays correct information", async ({ page }) => {
    await page.goto("/");

    const hummusCard = page.locator("a", {
      has: page.getByText(RECIPES.hummus.title),
    });
    await expect(hummusCard).toBeVisible();

    // Owner name
    await expect(hummusCard.getByText("מאת אבא")).toBeVisible();

    // Has ingredients badge
    await expect(hummusCard.getByText("מרכיבים")).toBeVisible();

    // Tags
    for (const tag of RECIPES.hummus.tags) {
      await expect(hummusCard.getByText(tag)).toBeVisible();
    }
  });

  test("recipe card without ingredients hides badge", async ({ page }) => {
    await page.goto("/");

    const chocolateCard = page.locator("a", {
      has: page.getByText(RECIPES.chocolate.title),
    });
    await expect(chocolateCard).toBeVisible();

    // Should NOT have "מרכיבים" badge
    await expect(chocolateCard.getByText("מרכיבים")).not.toBeVisible();
  });

  test("click recipe card navigates to detail", async ({ page }) => {
    await page.goto("/");

    await page.getByText(RECIPES.hummus.title).first().click();
    await expect(page).toHaveURL(/\/recipes\/\d+/);
    await expect(page.getByRole("heading", { name: RECIPES.hummus.title })).toBeVisible();
  });

  test("search filters recipes with debounce", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("חיפוש לפי שם, מרכיב, תגית או הערה...").fill("חומוס");

    // Wait for URL to update after debounce
    await expect(page).toHaveURL(/\?q=/);

    // Only hummus should be visible
    await expect(page.getByText(RECIPES.hummus.title).first()).toBeVisible();
    await expect(page.getByText(RECIPES.chocolate.title)).not.toBeVisible();

    // Recipe count should be hidden during search
    await expect(page.getByText(`${TOTAL_SEED_RECIPES} מתכונים`)).not.toBeVisible();
  });

  test("search with no results shows empty state", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("חיפוש לפי שם, מרכיב, תגית או הערה...").fill("פיצה");
    await expect(page).toHaveURL(/\?q=/);

    await expect(page.getByText("לא נמצאו מתכונים")).toBeVisible();
  });

  test("create recipe button navigates to /recipes/new", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "מתכון חדש" }).click();
    await expect(page).toHaveURL("/recipes/new");
  });
});
