import { test, expect } from "@playwright/test";

test.describe("Instruction Sections", () => {
  test("create recipe with single unnamed section shows plain numbered list", async ({ page }) => {
    await page.goto("/recipes/new");

    await page.getByPlaceholder("למשל: עוגת שוקולד של סבתא").fill("מתכון בדיקה - הוראות");

    // Open instructions
    await page.getByText("הוראות הכנה (אופציונלי)").click();

    // Fill steps
    await page.getByPlaceholder("שלב 1").fill("לחמם תנור ל-180 מעלות");

    await page.getByRole("button", { name: "הוסף שלב" }).click();
    await page.getByPlaceholder("שלב 2").fill("לערבב את כל החומרים");

    // Submit
    await page.getByRole("button", { name: "שמירת מתכון" }).click();
    await page.waitForURL(/\/recipes\/\d+/, { timeout: 15000 });

    // Should show instructions
    await expect(page.getByRole("heading", { name: "הוראות הכנה" })).toBeVisible();
    await expect(page.getByText("לחמם תנור ל-180 מעלות")).toBeVisible();
    await expect(page.getByText("לערבב את כל החומרים")).toBeVisible();
  });

  test("create recipe with two named sections", async ({ page }) => {
    await page.goto("/recipes/new");

    await page.getByPlaceholder("למשל: עוגת שוקולד של סבתא").fill("קציצות ברוטב");

    // Open instructions
    await page.getByText("הוראות הכנה (אופציונלי)").click();

    // Fill first step
    await page.getByPlaceholder("שלב 1").fill("לערבב בשר עם תבלינים");

    // Add second section
    await page.getByRole("button", { name: "הוסף חלק" }).click();

    // Name the sections
    const sectionNames = page.getByPlaceholder("שם החלק (למשל: הכנת הבצק, הכנת הרוטב)");
    await sectionNames.first().fill("הכנת הקציצות");
    await sectionNames.nth(1).fill("הכנת הרוטב");

    // Fill second section step
    await page.getByPlaceholder("שלב 1").nth(1).fill("לחמם שמן במחבת");

    // Submit
    await page.getByRole("button", { name: "שמירת מתכון" }).click();
    await page.waitForURL(/\/recipes\/\d+/, { timeout: 15000 });

    // Should show section headings
    await expect(page.getByText("הכנת הקציצות")).toBeVisible();
    await expect(page.getByText("הכנת הרוטב")).toBeVisible();

    // Should show steps
    await expect(page.getByText("לערבב בשר עם תבלינים")).toBeVisible();
    await expect(page.getByText("לחמם שמן במחבת")).toBeVisible();
  });

  test("step numbering resets per section", async ({ page }) => {
    // Navigate to the recipe created in previous test
    await page.goto("/");
    await page.getByText("קציצות ברוטב").first().click();
    await page.waitForURL(/\/recipes\/\d+/, { timeout: 15000 });

    // Both sections should start with step "1"
    const stepNumbers = page.locator("span.flex.size-7");
    const allNumbers = await stepNumbers.allTextContents();

    // Should have at least two "1"s (one per section)
    const onesCount = allNumbers.filter((n) => n.trim() === "1").length;
    expect(onesCount).toBeGreaterThanOrEqual(2);
  });
});
