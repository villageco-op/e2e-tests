import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import 'dotenv/config'; 

const {
  NEON_PROJECT_ID,
  NEON_API_KEY,
  STRIPE_TEST_SECRET_KEY
} = process.env;

const runId = crypto.randomBytes(4).toString('hex');
const branchName = `e2e-local-${runId}`;
let branchId = null;

async function run() {
  try {
    console.log(`🚀 Creating Neon branch: ${branchName}...`);
    
    const response = await fetch(`https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branch: { name: branchName },
        endpoints: [{ type: 'read_write' }]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create Neon branch: ${await response.text()}`);
    }

    const data = await response.json();
    branchId = data.branch.id;
    const dbHost = data.endpoints[0].host;
    
    const dbUser = process.env.NEON_DB_USER;
    const dbPassword = process.env.NEON_ROLE_PASSWORD;
    const dbName = process.env.NEON_DB_NAME;

    const dbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}/${dbName}?sslmode=require`;
    console.log(`✅ Neon branch created: ${branchId}`);

    console.log('🎭 Running Playwright Tests...');
    
    execSync('pnpm test', {
      stdio: 'inherit',
      env: {
        ...process.env,
        E2E_NEON_DB_URL: dbUrl,
        E2E_RUN_ID: runId,
      }
    });

  } catch (error) {
    console.error('❌ Error during E2E test run:', error.message);
  } finally {
    console.log('\n🧹 Starting cleanup...');

    if (branchId) {
      try {
        console.log(`🗑️ Deleting Neon branch: ${branchId}...`);
        await fetch(`https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${branchId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${NEON_API_KEY}` }
        });
        console.log('✅ Neon branch deleted.');
      } catch (err) {
        console.error('Failed to delete Neon branch:', err.message);
      }
    }

    if (STRIPE_TEST_SECRET_KEY) {
      try {
        console.log('💳 Running Stripe customer cleanup...');
        execSync('node ./scripts/stripe-cleanup.js', { 
          stdio: 'inherit',
          env: {
            ...process.env,
            E2E_RUN_ID: runId
          }
        });
      } catch (err) {
        console.error('Failed to clean up Stripe customers:', err.message);
      }
    }
    
    console.log('🏁 Cleanup finished.');
  }
}

run();
