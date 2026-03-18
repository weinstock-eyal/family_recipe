import { test, expect } from "@playwright/test";
import { RECIPES } from "../helpers/test-data";

// Helper: navigate to a recipe detail page
async function goToRecipe(page: import("@playwright/test").Page, title: string) {
  await page.goto("/");
  await page.getByText(title).first().click();
  await expect(page).toHaveURL(/\/recipes\/\d+/);
}

test.describe("Family Notes", () => {
  test("existing notes displayed with correct info", async ({ page }) => {
    await goToRecipe(page, RECIPES.hummus.title);

    // Section heading
    await expect(page.getByText("הערות משפחתיות")).toBeVisible();

    // Hummus has 2 notes: one by אמא (tip) and one by יעל (change)
    await expect(page.getByText("אני מוסיפה קצת כמון, זה עושה הבדל ענק")).toBeVisible();
    await expect(page.getByText("ניסיתי עם שלושה לימונים במקום אחד, יצא יותר טוב")).toBeVisible();

    // Type badges
    await expect(page.getByText("טיפ").first()).toBeVisible();
    await expect(page.getByText("שינוי").first()).toBeVisible();

    // Authors
    await expect(page.locator(".rounded-lg.border.p-4").filter({ hasText: "אמא" }).first()).toBeVisible();
    await expect(page.locator(".rounded-lg.border.p-4").filter({ hasText: "יעל" }).first()).toBeVisible();
  });

  test("create a comment note", async ({ page }) => {
    await goToRecipe(page, RECIPES.hummus.title);

    // Fill note text
    await page.getByPlaceholder("כתבו הערה...").fill("הערת בדיקה חדשה");

    // Default type is "הערה" (comment) - just submit
    await page.getByRole("button", { name: "הוסף הערה" }).click();

    // Note should appear with correct badge and author
    await expect(page.getByText("הערת בדיקה חדשה")).toBeVisible();
  });

  test("create a tip note", async ({ page }) => {
    await goToRecipe(page, RECIPES.chocolate.title);

    await page.getByPlaceholder("כתבו הערה...").fill("טיפ בדיקה");

    // Select tip type
    const noteForm = page.locator("form").filter({ hasText: "הערה חדשה" });
    await noteForm.getByRole("button", { name: "טיפ" }).click();

    await page.getByRole("button", { name: "הוסף הערה" }).click();

    // Note should appear with tip badge
    await expect(page.getByText("טיפ בדיקה")).toBeVisible();
  });

  test("create a change note", async ({ page }) => {
    await goToRecipe(page, RECIPES.chocolate.title);

    await page.getByPlaceholder("כתבו הערה...").fill("שינוי בדיקה");

    const noteForm = page.locator("form").filter({ hasText: "הערה חדשה" });
    await noteForm.getByRole("button", { name: "שינוי" }).click();

    await page.getByRole("button", { name: "הוסף הערה" }).click();

    await expect(page.getByText("שינוי בדיקה")).toBeVisible();
  });

  test("delete own note", async ({ page }) => {
    await goToRecipe(page, RECIPES.shakshuka.title);

    // Create a note first
    await page.getByPlaceholder("כתבו הערה...").fill("הערה למחיקה");
    await page.getByRole("button", { name: "הוסף הערה" }).click();
    await expect(page.getByText("הערה למחיקה")).toBeVisible();

    // Delete it - find the note card with our text and click מחיקה within it
    const noteCard = page.locator(".rounded-lg.border.p-4").filter({ hasText: "הערה למחיקה" });
    await noteCard.getByText("מחיקה").click();

    // Note should disappear
    await expect(page.getByText("הערה למחיקה")).not.toBeVisible();
  });

  test("cannot delete other users notes", async ({ page }) => {
    await goToRecipe(page, RECIPES.hummus.title);

    // Hummus has a note by יעל: "ניסיתי עם שלושה לימונים..."
    // As אמא, we should be able to delete our own note but not יעל's
    const yaelNote = page
      .locator(".rounded-lg.border.p-4")
      .filter({ hasText: "ניסיתי עם שלושה לימונים" });

    await expect(yaelNote).toBeVisible();

    // The delete link should NOT be inside יעל's note card (since we're אמא)
    await expect(yaelNote.getByText("מחיקה")).not.toBeVisible();
  });
});
