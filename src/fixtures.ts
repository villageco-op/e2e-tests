import { test as base, Page } from '@playwright/test';
import { createAuthenticatedPage } from './utils/createAuthenticatedPage';

export type MyTestOptions = {
  baseURLApi: string;
  runId: string;
  generateTestEmail: (identifier?: string) => string;
  onboardedSellerPage: { page: Page; email: string };
  onboardedBuyerPage: Page;
  sellerWithProducePage: { page: Page; email: string; produceId: string };
  newUnonboardedPage: Page;
};

export const test = base.extend<MyTestOptions>({
  baseURLApi: ['https://stagingapi.villageco-op.com', { option: true }],
  
  runId: [process.env.E2E_RUN_ID || `${Date.now()}`, { option: true }],
  
  generateTestEmail: async ({ runId }, use) => {
    await use((identifier = 'user') => `e2e-test-${runId}-${identifier}@villageco-op.com`);
  },

  onboardedSellerPage: async ({ browser, request, baseURL, baseURLApi, generateTestEmail }, use) => {
    const email = generateTestEmail('static-seller');
    await request.post(`${baseURLApi}/api/testing/seed-user`, {
      data: {
        email,
        stripeOnboarded: true,
        profile: { name: 'Jane Doe', address: '123 Farm Lane', city: 'Austin', state: 'TX', zip: '78701' }
      }
    });

    const { page, context } = await createAuthenticatedPage(browser, request, baseURL, baseURLApi, email);
    
    await use({ page, email });

    await page.close();
    await context.close();
  },

  sellerWithProducePage: async ({ onboardedSellerPage, request, baseURLApi }, use) => {
    const { page, email } = onboardedSellerPage;

    const response = await request.post(`${baseURLApi}/api/testing/seed-produce`, {
      data: {
        email: email,
        produce: {
          title: 'E2E Crisp Apples',
          pricePerOz: 0.45,
          totalOzInventory: 200,
          isSubscribable: true,
        }
      }
    });

    const body = await response.json();
    const produceId = body.produce.id;

    await use({ page, email, produceId });
  },

  onboardedBuyerPage: async ({ browser, request, baseURL, baseURLApi, generateTestEmail }, use) => {
    const email = generateTestEmail(`buyer-${Date.now()}`);

    await request.post(`${baseURLApi}/api/testing/seed-user`, {
      data: {
        email,
        stripeOnboarded: false,
        profile: { name: 'John Doe', address: '456 Market St', city: 'Austin', state: 'TX', zip: '78702' }
      }
    });

    const { page, context } = await createAuthenticatedPage(browser, request, baseURL, baseURLApi, email);
    
    await use(page);

    await page.close();
    await context.close();
  },

  newUnonboardedPage: async ({ browser, request, baseURL, baseURLApi, generateTestEmail }, use) => {
    const email = generateTestEmail(`unonboarded-${Date.now()}`);

    await request.post(`${baseURLApi}/api/testing/seed-user`, {
      data: {
        email,
        stripeOnboarded: false,
      }
    });

    const { page, context } = await createAuthenticatedPage(browser, request, baseURL, baseURLApi, email);
    
    await use(page);

    await page.close();
    await context.close();
  }
});

export { expect, request } from '@playwright/test';
