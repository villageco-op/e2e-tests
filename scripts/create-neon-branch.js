import fs from "node:fs";

export async function createNeonBranch(customRunId) {
  const {
    NEON_PROJECT_ID,
    NEON_API_KEY,
    NEON_PARENT_BRANCH_ID,
    NEON_DB_USER,
    NEON_ROLE_PASSWORD,
    NEON_DB_NAME,
    E2E_RUN_ID,
    GITHUB_OUTPUT,
    GITHUB_ENV,
  } = process.env;

  const runId = customRunId || E2E_RUN_ID || Date.now().toString();
  const branchName = `e2e-run-${runId}`;

  const response = await fetch(
    `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NEON_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch: { name: branchName, parent_id: NEON_PARENT_BRANCH_ID },
        endpoints: [{ type: "read_write" }],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create Neon branch: ${errorText}`);
  }

  const data = await response.json();
  const branchId = data.branch.id;
  const dbHost = data.endpoints[0].host;
  const dbUrl = `postgresql://${NEON_DB_USER}:${NEON_ROLE_PASSWORD}@${dbHost}/${NEON_DB_NAME}?sslmode=require`;

  console.log(`✅ Created Neon branch: ${branchId}`);

  if (GITHUB_OUTPUT) {
    fs.appendFileSync(GITHUB_OUTPUT, `branch_id=${branchId}\n`);
  }
  if (GITHUB_ENV) {
    fs.appendFileSync(GITHUB_ENV, `E2E_NEON_DB_URL=${dbUrl}\n`);
  }

  return { branchId, dbUrl, runId };
}

// Execute directly if run via CLI (e.g. in GitHub Actions step)
if (process.argv[1]?.endsWith("create-neon-branch.js")) {
  createNeonBranch().catch((err) => {
    console.error("❌ Error creating branch:", err.message);
    process.exit(1);
  });
}
