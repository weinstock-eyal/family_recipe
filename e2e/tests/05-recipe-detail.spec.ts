import { test, expect } from "@playwright/test";
import { RECIPES } from "../helpers/test-data";

// Helper: navigate to a recipe detail page by clicking its card on home
async function goToRecipe(page: import("@playwright/test").Page, title: string) {
  await page.goto("/");
  await page.getByText(title).first().click();
  await expect(page).toHaveURL(/\/recipes\/\d+/);
}

test.describe("Recipe Detail", () => {
  test("recipe with ingredients shows full detail", async ({ page }) => {
    await goToRecipe(page, RECIPES.hummus.title);

    // Title and uploader
    await expect(page.getByRole("heading", { name: RECIPES.hummus.title })).toBeVisible();
    await expect(page.getByText("העלה: אבא")).toBeVisible();
    await expect(page.getByText(/נוסף בתאריך:/)).toBeVisible();

    // Tags
    for (const tag of RECIPES.hummus.tags) {
      await expect(page.getByText(tag).first()).toBeVisible();
    }

    // Ingredients section
    await expect(page.getByRole("heading", { name: "מרכיבים" })).toBeVisible();
    await expect(page.getByText("חומוס יבש")).toBeVisible();
    await expect(page.getByText("טחינה גולמית")).toBeVisible();

    // Instructions section
    await expect(page.getByRole("heading", { name: "הוראות הכנה" })).toBeVisible();
    await expect(page.getByText("להשרות את החומוס למשך לילה שלם במים")).toBeVisible();

    // Add to grocery button
    await expect(page.getByText("הוסף לרשימת קניות")).toBeVisible();
  });

  test("recipe without ingredients shows AI placeholder", async ({ page }) => {
    await goToRecipe(page, RECIPES.chocolate.title);

    // Should show no-ingredients message
    await expect(page.getByText("למתכון זה אין מרכיבים מפורטים")).toBeVisible();

    // Disabled AI button
    const aiBtn = page.getByRole("button", { name: "חלץ מרכיבים עם AI" });
    await expect(aiBtn).toBeVisible();
    await expect(aiBtn).toBeDisabled();

    // Should NOT show ingredient section or grocery button
    await expect(page.getByRole("heading", { name: "מרכיבים" })).not.toBeVisible();
    await expect(page.getByText("הוסף לרשימת קניות")).not.toBeVisible();
  });

  test("multiplier buttons scale amounts", async ({ page }) => {
    await goToRecipe(page, RECIPES.hummus.title);

    // Default x1: "2" for חומוס יבש
    const ingredientsList = page.locator("ul");
    await expect(ingredientsList.getByText("2").first()).toBeVisible();

    // Click x2 multiplier
    await page.getByRole("button", { name: "x2" }).click();
    // Amount should double to "4"
    await expect(ingredientsList.getByText("4").first()).toBeVisible();

    // Click x0.5 multiplier
    await page.getByRole("button", { name: "x0.5" }).click();
    // Amount should be "1"
    await expect(ingredientsList.getByText("1").first()).toBeVisible();
  });

  test("back button navigates to home", async ({ page }) => {
    await goToRecipe(page, RECIPES.hummus.title);

    await page.getByRole("link", { name: "חזרה למתכונים" }).click();
    await expect(page).toHaveURL("/");
  });

  test("like button with optimistic update", async ({ page }) => {
    await goToRecipe(page, RECIPES.hummus.title);

    // Get current like count
    const likeButton = page.locator("button").filter({ hasText: /^\d+$/ }).first();
    const initialText = await likeButton.textContent();
    const initialCount = parseInt(initialText ?? "0");

    // Click like
    await likeButton.click();

    // Count should increment optimistically
    await expect(likeButton).toContainText(String(initialCount + 1));
  });

  test("dislike button with optimistic update", async ({ page }) => {
    await goToRecipe(page, RECIPES.hummus.title);

    // Get dislike button (second button with thumbs)
    const dislikeButton = page.locator("button").filter({ hasText: /^\d+$/ }).nth(1);
    const initialText = await dislikeButton.textContent();
    const initialCount = parseInt(initialText ?? "0");

    await dislikeButton.click();
    await expect(dislikeButton).toContainText(String(initialCount + 1));
  });

  test("YouTube link shown for recipe with video", async ({ page }) => {
    await goToRecipe(page, RECIPES.shakshuka.title);
    await expect(page.getByText("צפה בסרטון")).toBeVisible();
  });

  test("YouTube link hidden for recipe without video", async ({ page }) => {
    await goToRecipe(page, RECIPES.hummus.title);
    await expect(page.getByText("צפה בסרטון")).not.toBeVisible();
  });

  test("source link shown for recipe with source", async ({ page }) => {
    await goToRecipe(page, RECIPES.cookies.title);
    await expect(page.getByText("קישור למקור")).toBeVisible();
  });

  test("owner sees edit/delete buttons", async ({ page }) => {
    // As "אמא", navigate to own recipe "תה נענע של אמא"
    await goToRecipe(page, RECIPES.tea.title);

    await expect(page.getByRole("link", { name: "עריכה" })).toBeVisible();
    await expect(page.getByRole("button", { name: "מחיקה" })).toBeVisible();
  });

  test("non-owner does not see edit/delete buttons", async ({ page }) => {
    // As "אמא", navigate to "חומוס הבית" owned by "אבא"
    await goToRecipe(page, RECIPES.hummus.title);

    await expect(page.getByRole("link", { name: "עריכה" })).not.toBeVisible();
    // Recipe delete button is variant="destructive" size="sm" at the top.
    // Notes section also has "מחיקה" buttons for own notes, so scope to the top action bar.
    const topBar = page.locator(".flex.items-center.justify-between").first();
    await expect(topBar.getByRole("button", { name: "מחיקה" })).not.toBeVisible();
  });

  test("instructions displayed with numbered steps", async ({ page }) => {
    await goToRecipe(page, RECIPES.hummus.title);

    // Check numbered steps exist (scoped to the ordered list)
    const instructionsList = page.locator("ol");
    await expect(instructionsList.getByText("1")).toBeVisible();
    await expect(instructionsList.getByText("להשרות את החומוס למשך לילה שלם במים")).toBeVisible();
    await expect(instructionsList.getByText("לטחון בבלנדר עם טחינה, לימון, שום ומלח")).toBeVisible();
  });

  test("non-existent recipe shows 404", async ({ page }) => {
    const response = await page.goto("/recipes/99999");
    expect(response?.status()).toBe(404);
  });
});
