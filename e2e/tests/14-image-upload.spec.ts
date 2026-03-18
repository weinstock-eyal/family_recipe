import { test, expect } from "@playwright/test";
import path from "path";

const TEST_IMAGE_PATH = path.join(__dirname, "..", "fixtures", "test-image.jpg");

test.describe("Image Upload", () => {
  test("file picker upload shows preview", async ({ page }) => {
    await page.goto("/recipes/new");

    // The hidden file input is inside the image upload component
    const fileInput = page.locator('input[type="file"]');

    // Upload a test image via file input
    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    // Should show a preview image (either uploading overlay or the image itself)
    // The component shows an Image element when there's a preview/value
    await expect(page.locator("img[alt='תצוגה מקדימה']")).toBeVisible({ timeout: 10000 });
  });

  test("URL input fallback works", async ({ page }) => {
    await page.goto("/recipes/new");

    // Click "or enter image URL" link
    await page.getByText("או הזן קישור לתמונה").click();

    // URL input should appear
    const urlInput = page.locator('input[placeholder="https://..."]');
    await expect(urlInput).toBeVisible();

    // Enter a URL
    await urlInput.fill("https://placehold.co/100x100");

    // Fill required title and submit
    await page.getByLabel("שם המתכון *").fill("מתכון עם תמונה URL");
    await page.getByRole("button", { name: "שמור מתכון" }).click();

    await expect(page).toHaveURL(/\/recipes\/\d+/);

    // Image should be displayed on the recipe page
    await expect(page.locator("img").first()).toBeVisible();
  });

  test("remove image button clears the image", async ({ page }) => {
    await page.goto("/recipes/new");

    // Upload a test image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    // Wait for preview
    await expect(page.locator("img[alt='תצוגה מקדימה']")).toBeVisible({ timeout: 10000 });

    // Click remove button (X button on the preview)
    await page.locator("button").filter({ has: page.locator("svg.lucide-x") }).first().click();

    // Upload area should reappear
    await expect(page.getByText("גרור תמונה לכאן או לחץ לבחירה")).toBeVisible();
  });
});
