import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/tests",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  expect: {
    timeout: 30000,
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "unauthenticated",
      use: { storageState: { cookies: [], origins: [] } },
      testMatch: "**/01-auth.spec.ts",
    },
    {
      name: "mama-user",
      use: { storageState: "./e2e/.auth/mama.json" },
      testIgnore: "**/01-auth.spec.ts",
    },
    {
      name: "eyal-user",
      use: { storageState: "./e2e/.auth/eyal.json" },
      testMatch: "**/{06-recipe-edit,authorization}.spec.ts",
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
