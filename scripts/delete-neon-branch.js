export async function deleteNeonBranch(branchIdInput) {
  const { NEON_PROJECT_ID, NEON_API_KEY } = process.env;
  const branchId = branchIdInput || process.argv[2];

  if (!branchId) {
    console.warn("⚠️ No branch ID provided for deletion.");
    return;
  }

  const response = await fetch(
    `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${branchId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${NEON_API_KEY}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete branch ${branchId}: ${errorText}`);
  }

  console.log(`✅ Deleted Neon branch: ${branchId}`);
}

// Execute directly if run via CLI
if (process.argv[1]?.endsWith("delete-neon-branch.js")) {
  deleteNeonBranch().catch((err) => {
    console.error("❌ Error deleting branch:", err.message);
    process.exit(1);
  });
}
