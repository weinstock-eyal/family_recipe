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
    // Only admin users see the badge — check if it's there, skip if not admin
    const isAdmin = await page.getByText("ניהול משתמשים").isVisible().catch(() => false);
    if (!isAdmin) {
      test.skip();
      return;
    }
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
    // Check that at least 3 members are listed (אייל, אמא, יעל)
    // The current user sees "(את/ה)" next to their name
    await expect(page.getByText("(את/ה)")).toBeVisible();
    await expect(page.locator("text=אמא").first()).toBeVisible();
    await expect(page.locator("text=יעל").first()).toBeVisible();
  });

  test("group detail shows leave and delete buttons for admin", async ({ page }) => {
    await page.goto("/groups");
    await page.getByText("המשפחה").click();

    await expect(page.getByRole("button", { name: "עזוב קבוצה" })).toBeVisible();

    // "מחק קבוצה" only visible for admin
    const isAdmin = await page.getByText("ניהול משתמשים").isVisible().catch(() => false);
    if (isAdmin) {
      await expect(page.getByRole("button", { name: "מחק קבוצה" })).toBeVisible();
    }
  });

  // ─── Invitation Flow ──────────────────────────────────

  test("admin can create invitation", async ({ page }) => {
    await page.goto("/groups");
    await page.getByText("המשפחה").click();
    await page.waitForLoadState("networkidle");

    // Only admin can create invitations — skip for non-admin
    const inviteButton = page.getByRole("button", { name: "הזמנה חדשה" });
    if (!(await inviteButton.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await inviteButton.click();
    await expect(page.getByText("הזמנה חדשה נוצרה!")).toBeVisible();
  });

  test("invitation code is copyable", async ({ page }) => {
    await page.goto("/groups");
    await page.getByText("המשפחה").click();
    await page.waitForLoadState("networkidle");

    const inviteButton = page.getByRole("button", { name: "הזמנה חדשה" });
    if (!(await inviteButton.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await inviteButton.click();
    await expect(page.getByText("הזמנה חדשה נוצרה!")).toBeVisible();

    const codeEl = page.locator("code").first();
    await expect(codeEl).toBeVisible();
    const code = await codeEl.textContent();
    expect(code).toBeTruthy();
    expect(code!.length).toBe(6);
  });

  // ─── Invite Join Page ─────────────────────────────────

  test("invite page shows join button for valid code", async ({ page }) => {
    await page.goto("/groups");
    await page.getByText("המשפחה").click();
    await page.waitForLoadState("networkidle");

    const inviteButton = page.getByRole("button", { name: "הזמנה חדשה" });
    if (!(await inviteButton.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await inviteButton.click();
    await expect(page.getByText("הזמנה חדשה נוצרה!")).toBeVisible();

    const code = await page.locator("code").first().textContent();

    await page.goto(`/invite/${code}`);
    await expect(page.getByText("הזמנה להצטרף לקבוצה")).toBeVisible();
    await expect(page.getByRole("button", { name: "הצטרף לקבוצה" })).toBeVisible();
  });

  test("invite page shows error for invalid code", async ({ page }) => {
    await page.goto("/invite/INVALID");
    await page.getByRole("button", { name: "הצטרף לקבוצה" }).click();

    await expect(page.getByText("הזמנה לא נמצאה")).toBeVisible();
  });

  test("joining group you are already a member of shows error", async ({ page }) => {
    await page.goto("/groups");
    await page.getByText("המשפחה").click();
    await page.waitForLoadState("networkidle");

    const inviteButton = page.getByRole("button", { name: "הזמנה חדשה" });
    if (!(await inviteButton.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await inviteButton.click();
    await expect(page.getByText("הזמנה חדשה נוצרה!")).toBeVisible();

    const code = await page.locator("code").first().textContent();

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
      test.skip();
      return;
    }
    await groupLink.click();
    await page.waitForURL(/\/groups\/\d+/, { timeout: 10000 });

    // Click delete
    await page.getByRole("button", { name: "מחק קבוצה" }).click();

    // Wait for the delete action to complete - may show 404 or redirect
    await page.waitForTimeout(3000);

    // Navigate to groups list to verify group was deleted
    await page.goto("/groups");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("קבוצת בדיקה")).not.toBeVisible();
  });

  // ─── Visibility & Access Control ──────────────────────

  test("home page shows seed recipes via search (user in default group)", async ({ page }) => {
    await page.goto("/");
    // Use search to find a specific seed recipe (there may be many test-created recipes above)
    await page.getByPlaceholder("חיפוש לפי שם, מרכיב, תגית או הערה...").fill("חומוס");
    await expect(page.getByText("חומוס הבית")).toBeVisible();
  });

  test("zero-groups banner is NOT shown when user has groups", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("אתה רואה רק מתכונים שהעלית")
    ).not.toBeVisible();
  });
});
