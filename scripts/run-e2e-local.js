import { execSync } from "node:child_process";
import crypto from "node:crypto";
import "dotenv/config";
import { createNeonBranch } from "./create-neon-branch.js";
import { deleteNeonBranch } from "./delete-neon-branch.js";

const runId = crypto.randomBytes(4).toString("hex");
let branchId = null;

async function run() {
  try {
    const res = await createNeonBranch(runId);
    branchId = res.branchId;

    console.log("🎭 Running Playwright Tests...");
    execSync("pnpm test", {
      stdio: "inherit",
      env: {
        ...process.env,
        E2E_NEON_DB_URL: res.dbUrl,
        E2E_RUN_ID: runId,
      },
    });
  } catch (error) {
    console.error("❌ Error during E2E test run:", error.message);
  } finally {
    console.log("\n🧹 Starting cleanup...");
    if (branchId) {
      await deleteNeonBranch(branchId).catch(console.error);
    }
    if (process.env.STRIPE_TEST_SECRET_KEY) {
      try {
        execSync("node ./scripts/stripe-cleanup.js", {
          stdio: "inherit",
          env: { ...process.env, E2E_RUN_ID: runId },
        });
      } catch (err) {
        console.error("Failed Stripe cleanup:", err.message);
      }
    }
    console.log("🏁 Cleanup finished.");
  }
}

run();
