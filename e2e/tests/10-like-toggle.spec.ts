import { test, expect } from "@playwright/test";
import { RECIPES } from "../helpers/test-data";

async function goToRecipe(page: import("@playwright/test").Page, title: string) {
  await page.goto("/");
  await page.getByText(title).first().click();
  await expect(page).toHaveURL(/\/recipes\/\d+/);
}

test.describe("Like/Dislike Toggle", () => {
  test("like toggles on and off", async ({ page }) => {
    await goToRecipe(page, RECIPES.shakshuka.title);

    // Clear localStorage to start fresh
    await page.evaluate((id) => {
      localStorage.removeItem(`recipe-reaction-${id}`);
    }, await page.evaluate(() => {
      const match = window.location.pathname.match(/\/recipes\/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }));
    await page.reload();

    const likeButton = page.locator("button").filter({ hasText: /^\d+$/ }).first();
    const initialCount = parseInt((await likeButton.textContent()) ?? "0");

    // Click like - should increment
    await likeButton.click();
    await expect(likeButton).toContainText(String(initialCount + 1));

    // Click like again - should toggle off (decrement)
    await likeButton.click();
    await expect(likeButton).toContainText(String(initialCount));
  });

  test("switching from like to dislike", async ({ page }) => {
    await goToRecipe(page, RECIPES.shakshuka.title);

    // Clear localStorage
    await page.evaluate((id) => {
      localStorage.removeItem(`recipe-reaction-${id}`);
    }, await page.evaluate(() => {
      const match = window.location.pathname.match(/\/recipes\/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }));
    await page.reload();

    const likeButton = page.locator("button").filter({ hasText: /^\d+$/ }).first();
    const dislikeButton = page.locator("button").filter({ hasText: /^\d+$/ }).nth(1);

    const initialLikes = parseInt((await likeButton.textContent()) ?? "0");
    const initialDislikes = parseInt((await dislikeButton.textContent()) ?? "0");

    // Click like
    await likeButton.click();
    await expect(likeButton).toContainText(String(initialLikes + 1));

    // Switch to dislike - like should go down, dislike should go up
    await dislikeButton.click();
    await expect(likeButton).toContainText(String(initialLikes));
    await expect(dislikeButton).toContainText(String(initialDislikes + 1));
  });

  test("reaction persists after page reload", async ({ page }) => {
    await goToRecipe(page, RECIPES.cookies.title);

    // Clear localStorage
    const recipeId = await page.evaluate(() => {
      const match = window.location.pathname.match(/\/recipes\/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    await page.evaluate((id) => {
      localStorage.removeItem(`recipe-reaction-${id}`);
    }, recipeId);
    await page.reload();

    const likeButton = page.locator("button").filter({ hasText: /^\d+$/ }).first();

    // Click like
    await likeButton.click();

    // Reload page
    await page.reload();

    // Like button should still be highlighted (variant="default")
    // Check that localStorage has the reaction
    const stored = await page.evaluate((id) => {
      return localStorage.getItem(`recipe-reaction-${id}`);
    }, recipeId);
    expect(stored).toBe("like");
  });
});
