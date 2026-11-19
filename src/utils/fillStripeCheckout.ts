import { expect, type Frame, type Locator, type Page } from "@playwright/test";

type LocatorFactory = (scope: Page | Frame) => Locator;

type StripeCustomerDetails = {
  email: string;
  name: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  postalCode?: string;
  phoneNumber?: string;
};

async function findFirstVisibleLocator(
  page: Page,
  locatorFactories: LocatorFactory[],
  options?: { timeout?: number; perCandidateTimeout?: number; checkEnabled?: boolean },
): Promise<Locator | null> {
  const timeout = options?.timeout ?? 15_000;
  const perCandidateTimeout = options?.perCandidateTimeout ?? Math.min(timeout, 3_000);
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    // Re-query frames on each pass in case Stripe mounts/swaps iframes dynamically
    const scopes: Array<Page | Frame> = [page, ...page.frames()];

    for (const createLocator of locatorFactories) {
      for (const scope of scopes) {
        const candidate = createLocator(scope).first();
        try {
          await candidate.waitFor({
            state: "visible",
            timeout: Math.min(perCandidateTimeout, Math.max(250, deadline - Date.now())),
          });
          if (options?.checkEnabled) {
            await expect(candidate).toBeEnabled({ timeout: 2_000 });
          }
          return candidate;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message.includes("Target page, context or browser has been closed")) {
            throw err;
          }
        }
      }
    }
  }

  return null;
}

async function fillFirstVisibleInput(
  page: Page,
  locatorFactories: LocatorFactory[],
  value: string,
  options?: { required?: boolean; sequential?: boolean; timeout?: number },
) {
  const required = options?.required ?? true;
  const timeout = options?.timeout ?? 15_000;

  const target = await findFirstVisibleLocator(page, locatorFactories, { timeout });

  if (target) {
    if (options?.sequential) {
      await target.click();
      await target.pressSequentially(value, { delay: 25 });
    } else {
      await target.fill(value);
    }
    return;
  }

  if (required) {
    const primary = locatorFactories[0](page).first();
    await expect(
      primary,
      `Required field did not become visible across main page or ${page.frames().length} frames within ${timeout}ms.`,
    ).toBeVisible({ timeout: 2_000 });
  }
}

export async function fillStripeCheckout(page: Page, details: StripeCustomerDetails) {
  await page.waitForURL(/https:\/\/checkout\.stripe\.com|.*stripe\.com.*/, {
    timeout: 30_000,
  });

  await fillFirstVisibleInput(
    page,
    [
      (scope) => scope.locator("#email"),
      (scope) => scope.getByLabel(/email/i),
      (scope) =>
        scope.locator('input[type="email"], input[name="email"], input[autocomplete="email"]'),
    ],
    details.email,
    { timeout: 20_000 },
  );

  // Card number is often formatted/masked by Stripe; sequential typing handles formatting cleanly
  await fillFirstVisibleInput(
    page,
    [
      (scope) => scope.locator("#cardNumber"),
      (scope) => scope.getByLabel(/card number/i),
      (scope) => scope.locator('input[name="cardNumber"], input[autocomplete="cc-number"]'),
    ],
    details.cardNumber,
    { sequential: true },
  );

  await fillFirstVisibleInput(
    page,
    [
      (scope) => scope.locator("#cardExpiry"),
      (scope) => scope.getByLabel(/expiration|expiry/i),
      (scope) => scope.locator('input[name="expiry"], input[autocomplete="cc-exp"]'),
    ],
    details.expiry,
  );

  await fillFirstVisibleInput(
    page,
    [
      (scope) => scope.locator("#cardCvc"),
      (scope) => scope.getByLabel(/cvc|security code|cvv/i),
      (scope) => scope.locator('input[name="cvc"], input[autocomplete="cc-csc"]'),
    ],
    details.cvc,
  );

  await fillFirstVisibleInput(
    page,
    [
      (scope) => scope.locator("#billingName"),
      (scope) => scope.getByLabel(/name on card|cardholder name|full name/i),
      (scope) => scope.locator('input[name="name"], input[autocomplete="cc-name"]'),
    ],
    details.name,
  );

  if (details.postalCode) {
    await fillFirstVisibleInput(
      page,
      [
        (scope) => scope.locator("#billingPostalCode"),
        (scope) => scope.getByLabel(/postal code|zip/i),
        (scope) => scope.locator('input[name="billingPostalCode"], input[autocomplete="postal-code"]'),
      ],
      details.postalCode,
      { required: false },
    );
  }

  if (details.phoneNumber) {
    await fillFirstVisibleInput(
      page,
      [
        (scope) => scope.locator("#phoneNumber"),
        (scope) => scope.getByLabel(/phone/i),
        (scope) => scope.locator('input[type="tel"], input[name="phoneNumber"], input[autocomplete="tel"]'),
      ],
      details.phoneNumber,
      { required: false },
    );
  }

  const submitBtn = await findFirstVisibleLocator(
    page,
    [
      (scope) => scope.getByTestId("hosted-payment-submit-button"),
      (scope) => scope.getByRole("button", { name: /pay|subscribe|submit/i }),
      (scope) => scope.locator('button[type="submit"]'),
    ],
    { timeout: 15_000, checkEnabled: true },
  );

  if (!submitBtn) {
    throw new Error("Could not find a visible, enabled submit button on Stripe Checkout.");
  }

  await submitBtn.click();
}
