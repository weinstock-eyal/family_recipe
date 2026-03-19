import { test, expect } from "@playwright/test";

test.describe("Recipe Deletion", () => {
  test("confirmation dialog appears with correct content", async ({ page }) => {
    // Create a recipe to test dialog on
    await page.goto("/recipes/new");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("למשל: עוגת שוקולד של סבתא").fill("מתכון למחיקה דיאלוג");
    await page.getByRole("button", { name: "שמירת מתכון" }).click();
    await page.waitForURL(/\/recipes\/\d+/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Click delete button
    await page.getByRole("button", { name: "מחיקה" }).click();

    // Dialog should appear
    await expect(page.getByText("מחיקת מתכון")).toBeVisible();
    await expect(page.getByText(/האם למחוק את "מתכון למחיקה דיאלוג"/)).toBeVisible();
    await expect(page.getByRole("button", { name: "כן, מחק" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ביטול" })).toBeVisible();
  });

  test("cancel delete closes dialog and keeps recipe", async ({ page }) => {
    await page.goto("/recipes/new");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("למשל: עוגת שוקולד של סבתא").fill("מתכון לביטול מחיקה");
    await page.getByRole("button", { name: "שמירת מתכון" }).click();
    await page.waitForURL(/\/recipes\/\d+/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "מחיקה" }).click();
    await expect(page.getByText("מחיקת מתכון")).toBeVisible();

    // Click cancel
    await page.getByRole("button", { name: "ביטול" }).click();

    // Dialog should close, recipe still visible
    await expect(page.getByText("מחיקת מתכון")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "מתכון לביטול מחיקה" })).toBeVisible();
  });

  test("confirm delete removes recipe and redirects to home", async ({ page }) => {
    // Create a fresh recipe specifically for deletion
    await page.goto("/recipes/new");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("למשל: עוגת שוקולד של סבתא").fill("מתכון למחיקה סופית");
    await page.getByRole("button", { name: "שמירת מתכון" }).click();
    await page.waitForURL(/\/recipes\/\d+/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Delete it
    await page.getByRole("button", { name: "מחיקה" }).click();
    await page.getByRole("button", { name: "כן, מחק" }).click();

    // Should redirect to home
    await expect(page).toHaveURL("/");

    // Recipe should not appear in the list
    await expect(page.getByText("מתכון למחיקה סופית")).not.toBeVisible();
  });
});
