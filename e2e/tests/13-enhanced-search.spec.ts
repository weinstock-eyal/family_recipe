import { test, expect } from "@playwright/test";

test.describe("Enhanced Search", () => {
  test("search by recipe title", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("חיפוש לפי שם, מרכיב, תגית או הערה...").fill("חומוס");
    await expect(page).toHaveURL(/\?q=/);

    await expect(page.getByText("חומוס הבית")).toBeVisible();
  });

  test("search by ingredient name", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("חיפוש לפי שם, מרכיב, תגית או הערה...").fill("טחינה");
    await expect(page).toHaveURL(/\?q=/);

    // "חומוס הבית" contains טחינה in its ingredients
    await expect(page.getByText("חומוס הבית")).toBeVisible();
  });

  test("search by tag", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("חיפוש לפי שם, מרכיב, תגית או הערה...").fill("טבעוני");
    await expect(page).toHaveURL(/\?q=/);

    // "חומוס הבית" has tag "טבעוני"
    await expect(page.getByText("חומוס הבית")).toBeVisible();
  });

  test("search by family note", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("חיפוש לפי שם, מרכיב, תגית או הערה...").fill("כמון");
    await expect(page).toHaveURL(/\?q=/);

    // "חומוס הבית" has a note mentioning כמון
    await expect(page.getByText("חומוס הבית")).toBeVisible();
  });

  test("search with no results", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("חיפוש לפי שם, מרכיב, תגית או הערה...").fill("פיצה");
    await expect(page).toHaveURL(/\?q=/);

    await expect(page.getByText("לא נמצאו מתכונים")).toBeVisible();
  });
});
