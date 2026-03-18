import { request } from "@playwright/test";
import fs from "fs";
import path from "path";

export async function loginAndSaveState(
  baseURL: string,
  email: string,
  password: string,
  savePath: string
) {
  const context = await request.newContext({ baseURL });

  const response = await context.post("/api/auth/login", {
    data: { email, password },
  });

  if (!response.ok()) {
    throw new Error(`Login failed for ${email}: ${response.status()}`);
  }

  // Get cookies from the response
  const storageState = await context.storageState();

  // Ensure directory exists
  const dir = path.dirname(savePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(savePath, JSON.stringify(storageState, null, 2));
  await context.dispose();
}
