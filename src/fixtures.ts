import { test as base, expect, Page } from "@playwright/test";
import { createAuthenticatedPage } from "./utils/createAuthenticatedPage";

export type MyTestOptions = {
  baseURLApi: string;
  runId: string;
  generateTestEmail: (identifier?: string) => string;
  onboardedSellerPage: { page: Page; email: string };
  onboardedBuyerPage: { page: Page; email: string };
  sellerWithProducePage: { page: Page; email: string; produceId: string };
  newUnonboardedPage: Page;
  userWithOrganizationPage: {
    page: Page;
    email: string;
    orgId: string;
    subdomain: string;
    userId: string;
  };
  organizationWithClientPage: {
    page: Page;
    email: string;
    orgId: string;
    subdomain: string;
    client: any;
  };
};

export const test = base.extend<MyTestOptions>({
  baseURLApi: ["https://stagingapi.villageco-op.com", { option: true }],

  runId: [process.env.E2E_RUN_ID || `${Date.now()}`, { option: true }],

  generateTestEmail: async ({ runId }, use) => {
    await use(
      (identifier = "user") =>
        `e2e-test-${runId}-${identifier}@villageco-op.com`,
    );
  },

  onboardedSellerPage: async (
    { browser, request, baseURL, baseURLApi, generateTestEmail },
    use,
  ) => {
    const email = generateTestEmail("static-seller");
    await request.post(`${baseURLApi}/api/testing/seed-user`, {
      data: {
        email,
        stripeOnboarded: true,
        profile: {
          name: "Jane Doe",
          address: "123 Farm Lane",
          city: "Austin",
          state: "TX",
          zip: "78701",
        },
      },
    });

    const { page, context } = await createAuthenticatedPage(
      browser,
      request,
      baseURL,
      baseURLApi,
      email,
    );

    await use({ page, email });

    await page.close();
    await context.close();
  },

  sellerWithProducePage: async (
    { onboardedSellerPage, request, baseURLApi },
    use,
  ) => {
    const { page, email } = onboardedSellerPage;

    const response = await request.post(
      `${baseURLApi}/api/testing/seed-produce`,
      {
        data: {
          email: email,
          produce: {
            title: "E2E Crisp Apples",
            pricePerOz: 0.45,
            totalOzInventory: 200,
            isSubscribable: true,
          },
        },
      },
    );

    const body = await response.json();
    const produceId = body.produce.id;

    await use({ page, email, produceId });
  },

  onboardedBuyerPage: async (
    { browser, request, baseURL, baseURLApi, generateTestEmail },
    use,
  ) => {
    const email = generateTestEmail(`buyer-${Date.now()}`);

    await request.post(`${baseURLApi}/api/testing/seed-user`, {
      data: {
        email,
        stripeOnboarded: false,
        profile: {
          name: "John Doe",
          address: "456 Market St",
          city: "Austin",
          state: "TX",
          zip: "78702",
        },
      },
    });

    const { page, context } = await createAuthenticatedPage(
      browser,
      request,
      baseURL,
      baseURLApi,
      email,
    );

    await use({ page, email });

    await page.close();
    await context.close();
  },

  newUnonboardedPage: async (
    { browser, request, baseURL, baseURLApi, generateTestEmail },
    use,
  ) => {
    const email = generateTestEmail(`unonboarded-${Date.now()}`);

    await request.post(`${baseURLApi}/api/testing/seed-user`, {
      data: {
        email,
        stripeOnboarded: false,
      },
    });

    const { page, context } = await createAuthenticatedPage(
      browser,
      request,
      baseURL,
      baseURLApi,
      email,
    );

    await use(page);

    await page.close();
    await context.close();
  },

  userWithOrganizationPage: async (
    { browser, request, baseURL, baseURLApi, generateTestEmail },
    use,
  ) => {
    const email = generateTestEmail(`org-owner-${Date.now()}`);
    const subdomain = `test-org-${Date.now()}`;

    const orgRes = await request.post(
      `${baseURLApi}/api/testing/seed-organization`,
      {
        data: {
          name: "E2E Test Organization",
          email,
          subdomain,
          type: "pantry",
        },
      },
    );
    expect(orgRes.ok()).toBeTruthy();
    const orgBody = await orgRes.json();
    const orgId = orgBody.organization.id;

    const userRes = await request.post(`${baseURLApi}/api/testing/seed-user`, {
      data: {
        email,
        stripeOnboarded: false,
        profile: {
          name: "Org Admin",
          address: "789 Hub Way",
          city: "Madison",
          state: "WI",
          zip: "53703",
        },
        organizationId: orgId,
        orgRole: "admin",
      },
    });

    expect(userRes.ok()).toBeTruthy();
    const userBody = await userRes.json();
    const userId = userBody.user.id;

    const { page, context } = await createAuthenticatedPage(
      browser,
      request,
      baseURL,
      baseURLApi,
      email,
    );

    await use({ page, email, orgId, subdomain, userId });

    await page.close();
    await context.close();
  },

  organizationWithClientPage: async (
    { userWithOrganizationPage, request, baseURLApi },
    use,
  ) => {
    const { page, email, orgId, subdomain, userId } = userWithOrganizationPage;

    const clientRes = await request.post(
      `${baseURLApi}/api/testing/seed-client`,
      {
        data: {
          organizationId: orgId,
          createdById: userId,
          name: "Jane Doe",
          email: "jane.doe@example.com",
          phone: "555-123-4567",
          address: "123 Main St",
          city: "Madison",
          state: "Wisconsin",
          zip: "53703",
        },
      },
    );
    expect(clientRes.ok()).toBeTruthy();
    const clientBody = await clientRes.json();
    const client = clientBody.client;

    await use({ page, email, orgId, subdomain, client });
  },
});

export { expect, request } from "@playwright/test";
