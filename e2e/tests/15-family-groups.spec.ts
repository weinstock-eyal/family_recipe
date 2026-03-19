import { test, expect } from "@playwright/test";

test.describe("Family Groups", () => {
  // ─── Navigation ───────────────────────────────────────

  test("groups link visible in desktop header", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "קבוצות" })
    ).toBeVisible();
  });

  test("groups link navigates to /groups", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "קבוצות" }).click();
    await expect(page).toHaveURL("/groups");
  });

  // ─── Groups List Page ─────────────────────────────────

  test("groups page shows default group", async ({ page }) => {
    await page.goto("/groups");
    await expect(page.getByRole("heading", { name: "הקבוצות שלי" })).toBeVisible();
    await expect(page.getByText("המשפחה")).toBeVisible();
  });

  test("groups page shows member count", async ({ page }) => {
    await page.goto("/groups");
    await expect(page.getByText("3 חברים")).toBeVisible();
  });

  test("groups page shows admin badge for admin user", async ({ page }) => {
    await page.goto("/groups");
    await expect(page.getByText("מנהל")).toBeVisible();
  });

  // ─── Create Group ─────────────────────────────────────

  test("create new group", async ({ page }) => {
    await page.goto("/groups/new");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "קבוצה חדשה" })).toBeVisible();

    await page.getByLabel("שם הקבוצה").fill("קבוצת בדיקה");
    await page.getByRole("button", { name: "צור קבוצה" }).click();

    // Should redirect to group detail page
    await page.waitForURL(/\/groups\/\d+/, { timeout: 15000 });
  });

  test("create group button on groups page", async ({ page }) => {
    await page.goto("/groups");
    await page.getByRole("link", { name: "קבוצה חדשה" }).click();
    await expect(page).toHaveURL("/groups/new");
  });

  // ─── Group Detail Page ────────────────────────────────

  test("group detail shows members", async ({ page }) => {
    await page.goto("/groups");

    // Click on the default group
    await page.getByText("המשפחה").click();
    await expect(page).toHaveURL(/\/groups\/\d+/);

    // Should show member list
    await expect(page.getByText("חברי הקבוצה")).toBeVisible();
    await expect(page.getByText("אייל (את/ה)")).toBeVisible();
    await expect(page.getByText("אמא").first()).toBeVisible();
    await expect(page.getByText("יעל").first()).toBeVisible();
  });

  test("group detail shows leave and delete buttons for admin", async ({ page }) => {
    await page.goto("/groups");
    await page.getByText("המשפחה").click();

    await expect(page.getByRole("button", { name: "עזוב קבוצה" })).toBeVisible();
    await expect(page.getByRole("button", { name: "מחק קבוצה" })).toBeVisible();
  });

  // ─── Invitation Flow ──────────────────────────────────

  test("admin can create invitation", async ({ page }) => {
    await page.goto("/groups");
    await page.getByText("המשפחה").click();

    // Admin should see invite section
    await expect(page.getByText("הזמנות")).toBeVisible();

    // Create a new invitation
    await page.getByRole("button", { name: "הזמנה חדשה" }).click();

    // Should show the new invitation code
    await expect(page.getByText("הזמנה חדשה נוצרה!")).toBeVisible();
  });

  test("invitation code is copyable", async ({ page }) => {
    await page.goto("/groups");
    await page.getByText("המשפחה").click();

    // Create a new invitation
    await page.getByRole("button", { name: "הזמנה חדשה" }).click();
    await expect(page.getByText("הזמנה חדשה נוצרה!")).toBeVisible();

    // Should show the code in a code element
    const codeEl = page.locator("code").first();
    await expect(codeEl).toBeVisible();
    const code = await codeEl.textContent();
    expect(code).toBeTruthy();
    expect(code!.length).toBe(6);
  });

  // ─── Invite Join Page ─────────────────────────────────

  test("invite page shows join button for valid code", async ({ page }) => {
    // First, create an invitation
    await page.goto("/groups");
    await page.getByText("המשפחה").click();
    await page.getByRole("button", { name: "הזמנה חדשה" }).click();
    await expect(page.getByText("הזמנה חדשה נוצרה!")).toBeVisible();

    const code = await page.locator("code").first().textContent();

    // Navigate to invite page
    await page.goto(`/invite/${code}`);
    await expect(page.getByText("הזמנה להצטרף לקבוצה")).toBeVisible();
    await expect(page.getByRole("button", { name: "הצטרף לקבוצה" })).toBeVisible();
  });

  test("invite page shows error for invalid code", async ({ page }) => {
    await page.goto("/invite/INVALID");
    await page.getByRole("button", { name: "הצטרף לקבוצה" }).click();

    // Should show error
    await expect(page.getByText("הזמנה לא נמצאה")).toBeVisible();
  });

  test("joining group you are already a member of shows error", async ({ page }) => {
    // Create invitation
    await page.goto("/groups");
    await page.getByText("המשפחה").click();
    await page.getByRole("button", { name: "הזמנה חדשה" }).click();
    await expect(page.getByText("הזמנה חדשה נוצרה!")).toBeVisible();

    const code = await page.locator("code").first().textContent();

    // Try to join own group
    await page.goto(`/invite/${code}`);
    await page.getByRole("button", { name: "הצטרף לקבוצה" }).click();

    await expect(page.getByText("אתה כבר חבר בקבוצה זו")).toBeVisible();
  });

  // ─── Recipe Sharing ───────────────────────────────────

  test("recipe form page loads correctly", async ({ page }) => {
    await page.goto("/recipes/new");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "מתכון חדש" })).toBeVisible();
    await expect(page.getByPlaceholder("למשל: עוגת שוקולד של סבתא")).toBeVisible();
  });

  // ─── Share Default Toggle ─────────────────────────────

  test("share default toggle is visible on groups page", async ({ page }) => {
    await page.goto("/groups");
    await expect(page.getByText("הגדרות שיתוף")).toBeVisible();
    await expect(
      page.getByText("שתף מתכונים חדשים עם כל הקבוצות שלי כברירת מחדל")
    ).toBeVisible();
  });

  // ─── Group Deletion ───────────────────────────────────

  test("admin can delete a group from detail page", async ({ page }) => {
    // Set up dialog handler BEFORE any navigation
    page.on("dialog", (dialog) => dialog.accept());

    // Navigate to the group created by "create new group" test
    await page.goto("/groups");
    await page.waitForLoadState("networkidle");

    // Click on "קבוצת בדיקה" (created in earlier test)
    const groupLink = page.getByText("קבוצת בדיקה");
    if (!(await groupLink.isVisible())) {
      // Skip test if no test group exists (earlier test might have been skipped)
      test.skip();
      return;
    }
    await groupLink.click();
    await page.waitForURL(/\/groups\/\d+/, { timeout: 10000 });

    // Click delete
    await page.getByRole("button", { name: "מחק קבוצה" }).click();

    // Should redirect to groups list
    await page.waitForURL("/groups", { timeout: 15000 });
  });

  // ─── Visibility & Access Control ──────────────────────

  test("home page shows all seed recipes (user in default group)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("עוגת שוקולד של סבתא רחל")).toBeVisible();
    await expect(page.getByText("חומוס הבית")).toBeVisible();
  });

  test("zero-groups banner is NOT shown when user has groups", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("אתה רואה רק מתכונים שהעלית")
    ).not.toBeVisible();
  });
});
