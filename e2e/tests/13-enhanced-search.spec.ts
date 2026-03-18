import { test, expect } from "@playwright/test";

test.describe("Enhanced Search", () => {
  test("search by recipe title", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("חיפוש לפי שם, מרכיב, תגית או הערה...").fill("חומוס");
    await page.waitForURL(/\?q=.*חומוס/);

    await expect(page.getByText("חומוס הבית")).toBeVisible();
  });

  test("search by ingredient name", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("חיפוש לפי שם, מרכיב, תגית או הערה...").fill("טחינה");
    await page.waitForURL(/\?q=.*טחינה/);

    // "חומוס הבית" contains טחינה in its ingredients
    await expect(page.getByText("חומוס הבית")).toBeVisible();
  });

  test("search by tag", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("חיפוש לפי שם, מרכיב, תגית או הערה...").fill("טבעוני");
    await page.waitForURL(/\?q=.*טבעוני/);

    // "חומוס הבית" has tag "טבעוני"
    await expect(page.getByText("חומוס הבית")).toBeVisible();
  });

  test("search by family note", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("חיפוש לפי שם, מרכיב, תגית או הערה...").fill("כמון");
    await page.waitForURL(/\?q=.*כמון/);

    // "חומוס הבית" has a note mentioning כמון
    await expect(page.getByText("חומוס הבית")).toBeVisible();
  });

  test("search with no results", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("חיפוש לפי שם, מרכיב, תגית או הערה...").fill("פיצה");
    await page.waitForURL(/\?q=.*פיצה/);

    await expect(page.getByText("לא נמצאו מתכונים")).toBeVisible();
  });
});
