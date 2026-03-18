import { test, expect } from "@playwright/test";
import { USERS } from "../helpers/test-data";

test.describe("Authentication", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");

    // Title
    await expect(page.getByText("מתכונים משפחתיים")).toBeVisible();
    await expect(page.getByText("היכנסו כדי לגשת למתכוני המשפחה")).toBeVisible();

    // Form labels
    await expect(page.getByLabel("אימייל")).toBeVisible();
    await expect(page.getByLabel("סיסמה")).toBeVisible();

    // Submit button
    await expect(page.getByRole("button", { name: "כניסה" })).toBeVisible();

    // Forgot password - disabled
    const forgotBtn = page.getByRole("button", { name: "שכחתי סיסמה" });
    await expect(forgotBtn).toBeVisible();
    await expect(forgotBtn).toBeDisabled();
  });

  test("successful login redirects to home", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.getByLabel("אימייל").fill(USERS.mama.email);
    await page.getByLabel("סיסמה").fill(USERS.mama.password);
    await page.getByRole("button", { name: "כניסה" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByText("שלום, אמא")).toBeVisible();
  });

  test("invalid credentials shows Hebrew error", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.getByLabel("אימייל").fill(USERS.mama.email);
    await page.getByLabel("סיסמה").fill("wrongpassword");
    await page.getByRole("button", { name: "כניסה" }).click();

    await expect(page.getByText("אימייל או סיסמה שגויים")).toBeVisible();
  });

  test("loading state during login", async ({ page }) => {
    await page.goto("/login");

    // Slow down the login API so we can observe loading state
    await page.route("**/api/auth/login", async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.continue();
    });

    await page.getByLabel("אימייל").fill(USERS.mama.email);
    await page.getByLabel("סיסמה").fill(USERS.mama.password);
    await page.getByRole("button", { name: "כניסה" }).click();

    // Loading text should appear
    await expect(page.getByText("מתחבר...")).toBeVisible();
  });

  test("unauthenticated user redirected to /login", async ({ page }) => {
    // Try home page
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);

    // Try recipes/new
    await page.goto("/recipes/new");
    await expect(page).toHaveURL(/\/login/);

    // Try grocery
    await page.goto("/grocery");
    await expect(page).toHaveURL(/\/login/);
  });

  test("logout clears session and redirects", async ({ browser }) => {
    // Use a new context with mama's auth state
    const context = await browser.newContext({
      storageState: "./e2e/.auth/mama.json",
    });
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.getByText("שלום, אמא")).toBeVisible();

    // Click logout
    await page.getByRole("button", { name: "יציאה" }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Trying to navigate home should redirect back to login
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);

    await context.close();
  });
});
