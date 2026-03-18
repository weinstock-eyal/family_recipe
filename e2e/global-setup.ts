import { execSync } from "child_process";
import path from "path";
import { loginAndSaveState } from "./helpers/auth";
import { USERS } from "./helpers/test-data";

const BASE_URL = "http://localhost:3000";
const AUTH_DIR = path.join(__dirname, ".auth");
const MAX_SEED_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedDatabase() {
  for (let attempt = 1; attempt <= MAX_SEED_RETRIES; attempt++) {
    try {
      execSync("npx tsx src/db/seed.ts", {
        cwd: path.join(__dirname, ".."),
        stdio: "inherit",
      });
      return;
    } catch (error) {
      if (attempt < MAX_SEED_RETRIES) {
        console.log(`Seed attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms...`);
        await sleep(RETRY_DELAY_MS);
      } else {
        throw error;
      }
    }
  }
}

async function globalSetup() {
  // Seed the database with known test data
  console.log("Seeding database...");
  await seedDatabase();

  // Create storageState files for each test user
  console.log("Creating auth states...");

  await loginAndSaveState(
    BASE_URL,
    USERS.mama.email,
    USERS.mama.password,
    path.join(AUTH_DIR, "mama.json")
  );

  await loginAndSaveState(
    BASE_URL,
    USERS.eyal.email,
    USERS.eyal.password,
    path.join(AUTH_DIR, "eyal.json")
  );

  console.log("Global setup complete.");
}

export default globalSetup;
