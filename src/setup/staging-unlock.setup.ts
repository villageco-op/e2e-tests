import { test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";

const authFile = path.resolve(
  __dirname,
  "../../playwright/.auth/staging-state.json",
);

setup("Unlock staging environment", async ({ request, baseURL }) => {
  const targetBaseUrl = baseURL || process.env.PLAYWRIGHT_TEST_BASE_URL;

  if (!targetBaseUrl) {
    throw new Error(
      "PLAYWRIGHT_TEST_BASE_URL or use.baseURL is not configured.",
    );
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  const unlockUrl = new URL("/api/staging-unlock", targetBaseUrl).toString();

  const response = await request.get(unlockUrl, {
    headers: {
      "x-vercel-protection-bypass": process.env.VERCEL_BYPASS_TOKEN!,
    },
  });

  console.log("URL:", response.url());
  console.log("Status:", response.status());
  console.log("Headers:", response.headers());
  console.log("Body:", await response.text());

  if (!response.ok()) {
    throw new Error(
      `Failed to unlock staging: ${response.status()} ${response.statusText()}`,
    );
  }

  await request.storageState({ path: authFile });
});
