const Stripe = require('stripe');

if (!process.env.STRIPE_TEST_SECRET_KEY) {
  console.error('⚠️ No STRIPE_TEST_SECRET_KEY provided. Skipping Stripe cleanup.');
  process.exit(0);
}

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY);

async function cleanup() {
  const runId = process.env.E2E_RUN_ID;
  
  if (!runId) {
    console.warn('⚠️ No E2E_RUN_ID provided. Please ensure your E2E tests are using a specific run ID.');
    process.exit(0);
  }

  console.log(`Starting Stripe cleanup for Run ID: ${runId}`);

  try {
    const query = `email~"e2e-test-${runId}"`;
    
    const customers = await stripe.customers.search({ 
      query,
      limit: 100 // max limit per page
    });

    if (customers.data.length === 0) {
      console.log('✅ No Stripe customers found for this run. Nothing to clean.');
      return;
    }

    for (const customer of customers.data) {
      await stripe.customers.del(customer.id);
      console.log(`🧹 Deleted Stripe customer: ${customer.email} (${customer.id})`);
    }

    console.log('✅ Stripe cleanup complete.');
  } catch (error) {
    console.error('❌ Failed to cleanup Stripe:', error);
    process.exit(1);
  }
}

cleanup();
