import { test, expect } from "@playwright/test";
import { RECIPES } from "../helpers/test-data";

test.describe("Grocery List", () => {
  test("empty grocery list shows message", async ({ page }) => {
    await page.goto("/grocery");

    await expect(page.getByText("רשימת הקניות ריקה")).toBeVisible();
    await expect(page.getByText("הוסיפו מרכיבים מדף המתכון")).toBeVisible();

    // Clear all button should NOT be visible when list is empty
    await expect(page.getByText("נקה הכל")).not.toBeVisible();
  });

  test("add ingredients to grocery list from recipe", async ({ page }) => {
    // Navigate to recipe with ingredients
    await page.goto("/");
    await page.getByText(RECIPES.hummus.title).first().click();
    await expect(page).toHaveURL(/\/recipes\/\d+/);

    // Click add to grocery
    await page.getByRole("button", { name: "הוסף לרשימת קניות" }).click();

    // Success feedback
    await expect(page.getByText("נוסף לרשימת הקניות!")).toBeVisible();

    // Navigate to grocery page
    await page.goto("/grocery");

    // Items should be grouped under recipe title
    await expect(page.getByText(`מתוך: ${RECIPES.hummus.title}`)).toBeVisible();

    // Some ingredients should be visible
    await expect(page.getByText("חומוס יבש")).toBeVisible();
    await expect(page.getByText("טחינה גולמית")).toBeVisible();
  });

  test("progress display shows correct counts", async ({ page }) => {
    // Add items first
    await page.goto("/");
    await page.getByText(RECIPES.tea.title).first().click();
    await expect(page).toHaveURL(/\/recipes\/\d+/);
    await page.getByRole("button", { name: "הוסף לרשימת קניות" }).click();
    await expect(page.getByText("נוסף לרשימת הקניות!")).toBeVisible();

    await page.goto("/grocery");

    // Should show progress text with format "N פריטים | 0/N הושלמו"
    await expect(page.getByText(/\d+ פריטים/)).toBeVisible();
    await expect(page.getByText(/0\/\d+ הושלמו/)).toBeVisible();
  });

  test("toggle checkbox marks item with strikethrough", async ({ page }) => {
    // Add items
    await page.goto("/");
    await page.getByText(RECIPES.cookies.title).first().click();
    await expect(page).toHaveURL(/\/recipes\/\d+/);
    await page.getByRole("button", { name: "הוסף לרשימת קניות" }).click();
    await expect(page.getByText("נוסף לרשימת הקניות!")).toBeVisible();

    await page.goto("/grocery");
    await page.waitForLoadState("networkidle");

    // Click the first checkbox
    const firstCheckbox = page.getByRole("checkbox").first();
    await firstCheckbox.click();

    // The text should get line-through class
    const itemRow = page.locator(".line-through").first();
    await expect(itemRow).toBeVisible();
  });

  test("remove individual item", async ({ page }) => {
    // Create a fresh recipe with ingredients, add to grocery, then remove one
    await page.goto("/recipes/new");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("למשל: עוגת שוקולד של סבתא").fill("מתכון להסרה מקניות");
    await page.getByText("מרכיבים (אופציונלי)").click();
    await page.getByPlaceholder("כמות").first().fill("1");
    await page.getByPlaceholder("יחידה").first().fill("כוס");
    await page.getByPlaceholder("שם המרכיב").first().fill("פריט להסרה");
    await page.getByRole("button", { name: "שמירת מתכון" }).click();
    await expect(page).toHaveURL(/\/recipes\/\d+/);
    await page.getByRole("button", { name: "הוסף לרשימת קניות" }).click();
    await expect(page.getByText("נוסף לרשימת הקניות!")).toBeVisible();

    await page.goto("/grocery");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("פריט להסרה")).toBeVisible();

    // Click X button to remove the item (the button with X icon in the same row)
    const itemRow = page.locator(".rounded-lg.border.p-3").filter({ hasText: "פריט להסרה" });
    await itemRow.getByRole("button").click();

    // Item should disappear
    await expect(page.getByText("פריט להסרה")).not.toBeVisible();
  });

  test("clear all with confirmation removes everything", async ({ page }) => {
    // Add items
    await page.goto("/");
    await page.getByText(RECIPES.hummus.title).first().click();
    await expect(page).toHaveURL(/\/recipes\/\d+/);
    await page.getByRole("button", { name: "הוסף לרשימת קניות" }).click();
    await expect(page.getByText("נוסף לרשימת הקניות!")).toBeVisible();

    await page.goto("/grocery");
    await page.waitForLoadState("networkidle");

    // Click clear all
    await page.getByRole("button", { name: "נקה הכל" }).click();

    // Dialog should appear
    await expect(page.getByText("ניקוי רשימת קניות")).toBeVisible();
    await expect(page.getByText("האם לנקות את כל רשימת הקניות?")).toBeVisible();

    // Confirm
    await page.getByRole("button", { name: "כן, נקה" }).click();

    // Should show empty state
    await expect(page.getByText("רשימת הקניות ריקה")).toBeVisible();
  });

  test("clear all cancel keeps items", async ({ page }) => {
    // Add items
    await page.goto("/");
    await page.getByText(RECIPES.tea.title).first().click();
    await expect(page).toHaveURL(/\/recipes\/\d+/);
    await page.getByRole("button", { name: "הוסף לרשימת קניות" }).click();
    await expect(page.getByText("נוסף לרשימת הקניות!")).toBeVisible();

    await page.goto("/grocery");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("מים רותחים").first()).toBeVisible();

    // Click clear all, then cancel
    await page.getByRole("button", { name: "נקה הכל" }).click();
    await page.getByRole("button", { name: "ביטול" }).click();

    // Items should still be there
    await expect(page.getByText("מים רותחים").first()).toBeVisible();
  });

  test("add-to-grocery success feedback auto-resets", async ({ page }) => {
    await page.goto("/");
    await page.getByText(RECIPES.cookies.title).first().click();
    await expect(page).toHaveURL(/\/recipes\/\d+/);

    await page.getByRole("button", { name: "הוסף לרשימת קניות" }).click();

    // Success text appears
    await expect(page.getByText("נוסף לרשימת הקניות!")).toBeVisible();

    // Should revert after ~2 seconds
    await expect(page.getByText("הוסף לרשימת קניות")).toBeVisible({ timeout: 5000 });
  });
});
