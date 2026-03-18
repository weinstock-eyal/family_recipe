import { test, expect } from "@playwright/test";

test.describe("Navigation & UI", () => {
  test("header displays all expected elements", async ({ page }) => {
    await page.goto("/");

    // App title
    await expect(page.getByRole("link", { name: "מתכונים משפחתיים" })).toBeVisible();

    // Navigation links
    await expect(page.getByRole("link", { name: "דף הבית" })).toBeVisible();
    await expect(page.getByRole("link", { name: "רשימת קניות" })).toBeVisible();

    // User greeting
    await expect(page.getByText("שלום, אמא")).toBeVisible();

    // Logout button
    await expect(page.getByRole("button", { name: "יציאה" })).toBeVisible();
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/grocery");

    // Click home link
    await page.getByRole("link", { name: "דף הבית" }).click();
    await expect(page).toHaveURL("/");

    // Click grocery link
    await page.getByRole("link", { name: "רשימת קניות" }).click();
    await expect(page).toHaveURL("/grocery");

    // Click app title to go home
    await page.getByRole("link", { name: "מתכונים משפחתיים" }).click();
    await expect(page).toHaveURL("/");
  });

  test("theme toggle switches dark mode", async ({ page }) => {
    await page.goto("/");

    // Click theme toggle (light → dark)
    await page.getByRole("button", { name: "מצב כהה" }).click();

    // html element should have dark class
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Toggle back (dark → light)
    await page.getByRole("button", { name: "מצב בהיר" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("theme persists across navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch to dark mode
    await page.getByRole("button", { name: "מצב כהה" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Navigate to grocery
    await page.getByRole("link", { name: "רשימת קניות" }).click();
    await expect(page).toHaveURL("/grocery");

    // Dark mode should persist
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("RTL layout is correctly set", async ({ page }) => {
    await page.goto("/");

    // html element should have lang="he" and dir="rtl"
    await expect(page.locator("html")).toHaveAttribute("lang", "he");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
