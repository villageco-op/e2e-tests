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
  options?: { timeout?: number; pollIntervalMs?: number; checkEnabled?: boolean },
): Promise<Locator | null> {
  const timeout = options?.timeout ?? 2_000;
  const pollIntervalMs = options?.pollIntervalMs ?? 200;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const scopes: Array<Page | Frame> = [page, ...page.frames()];

    const pairs: Array<{ candidate: Locator; priority: number }> = [];
    let priority = 0;
    for (const createLocator of locatorFactories) {
      for (const scope of scopes) {
        pairs.push({ candidate: createLocator(scope).first(), priority: priority++ });
      }
    }

    const checks = await Promise.all(
      pairs.map(async ({ candidate, priority: idx }) => {
        try {
          const visible = await candidate.isVisible();
          if (!visible) return null;
          if (options?.checkEnabled) {
            const enabled = await candidate.isEnabled();
            if (!enabled) return null;
          }
          return { candidate, idx };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message.includes("Target page, context or browser has been closed")) {
            throw err;
          }
          return null;
        }
      }),
    );

    const match = checks
      .filter((item): item is { candidate: Locator; idx: number } => item !== null)
      .sort((a, b) => a.idx - b.idx)[0];

    if (match) {
      return match.candidate;
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await page.waitForTimeout(Math.min(pollIntervalMs, remaining));
  }

  return null;
}

async function tryFillInput(
  page: Page,
  locatorFactories: LocatorFactory[],
  value: string | undefined,
  options?: { sequential?: boolean; timeout?: number },
): Promise<boolean> {
  if (!value) {
    return false;
  }

  const target = await findFirstVisibleLocator(page, locatorFactories, {
    timeout: options?.timeout ?? 2_000,
  });

  if (!target) {
    return false;
  }

  if (options?.sequential) {
    await target.click();
    await target.pressSequentially(value, { delay: 15 });
  } else {
    await target.fill(value);
  }

  return true;
}

async function handlePostSubmitLinkPrompt(page: Page, phoneNumber = "2025550143") {
  const linkDeadline = Date.now() + 8_000;

  while (Date.now() < linkDeadline) {
    if (/\/checkout\/success/.test(page.url())) {
      return;
    }

    await tryFillInput(
      page,
      [
        (scope) => scope.locator('input[type="tel"], input[name*="phone" i], input[id*="phone" i]'),
        (scope) => scope.getByLabel(/phone|mobile/i),
      ],
      phoneNumber,
      { timeout: 600 },
    );

    const linkActionBtn = await findFirstVisibleLocator(
      page,
      [
        (scope) =>
          scope.getByRole("button", {
            name: /pay without link|continue as guest|skip|pay|continue/i,
          }),
        (scope) => scope.locator('button[type="submit"]'),
      ],
      { timeout: 800, pollIntervalMs: 150, checkEnabled: true },
    );

    if (linkActionBtn) {
      await linkActionBtn.click();
      return;
    }

    await page.waitForTimeout(250);
  }
}

export async function fillStripeCheckout(page: Page, details: StripeCustomerDetails) {
  await page.waitForURL(/https:\/\/checkout\.stripe\.com|.*stripe\.com.*/, {
    timeout: 25_000,
  });

  await findFirstVisibleLocator(
    page,
    [
      (scope) => scope.locator("#email, #Email, input[type='email'], input[name='email']"),
      (scope) => scope.locator("#cardNumber, #cardnumber, input[autocomplete='cc-number']"),
      (scope) => scope.locator("input"),
    ],
    { timeout: 8_000 },
  );

  await tryFillInput(
    page,
    [
      (scope) => scope.locator("#email, #Email"),
      (scope) => scope.getByLabel(/email|e-mail/i),
      (scope) =>
        scope.locator(
          'input[type="email"], input[name="email"], input[name="Email"], input[autocomplete="email"]',
        ),
    ],
    details.email,
    { timeout: 3_000 },
  );

  await tryFillInput(
    page,
    [
      (scope) => scope.locator("#cardNumber, #cardnumber, #number, #cc-number"),
      (scope) => scope.getByLabel(/card number|number/i),
      (scope) =>
        scope.locator(
          'input[name="cardNumber"], input[name="cardnumber"], input[name="number"], input[autocomplete="cc-number"]',
        ),
    ],
    details.cardNumber,
    { sequential: true, timeout: 3_000 },
  );

  await tryFillInput(
    page,
    [
      (scope) => scope.locator("#cardExpiry, #cardexpiry, #expiry, #exp, #cc-exp"),
      (scope) => scope.getByLabel(/expiration|expiry|exp/i),
      (scope) =>
        scope.locator(
          'input[name="cardExpiry"], input[name="cardexpiry"], input[name="expiry"], input[name="exp"], input[autocomplete="cc-exp"]',
        ),
    ],
    details.expiry,
    { timeout: 2_000 },
  );

  await tryFillInput(
    page,
    [
      (scope) => scope.locator("#cardCvc, #cardcvc, #cvc, #cvv, #securityCode, #cc-csc"),
      (scope) => scope.getByLabel(/cvc|cvv|security code|csc/i),
      (scope) =>
        scope.locator(
          'input[name="cardCvc"], input[name="cardcvc"], input[name="cvc"], input[name="cvv"], input[autocomplete="cc-csc"]',
        ),
    ],
    details.cvc,
    { timeout: 2_000 },
  );

  await tryFillInput(
    page,
    [
      (scope) => scope.locator("#billingName, #billingname, #name, #cardholderName, #cc-name"),
      (scope) => scope.getByLabel(/name on card|cardholder name|full name|name/i),
      (scope) =>
        scope.locator(
          'input[name="billingName"], input[name="billingname"], input[name="name"], input[autocomplete="cc-name"]',
        ),
    ],
    details.name,
    { timeout: 2_000 },
  );

  await tryFillInput(
    page,
    [
      (scope) =>
        scope.locator("#billingPostalCode, #billingpostalcode, #postalCode, #postalcode, #zip, #postal"),
      (scope) => scope.getByLabel(/postal code|postal|zip/i),
      (scope) =>
        scope.locator(
          'input[name="billingPostalCode"], input[name="billingpostalcode"], input[name="postalCode"], input[name="postalcode"], input[name="zip"], input[autocomplete="postal-code"]',
        ),
    ],
    details.postalCode,
    { timeout: 1_500 },
  );

  await tryFillInput(
    page,
    [
      (scope) => scope.locator("#phoneNumber, #phonenumber, #phone, #tel"),
      (scope) => scope.getByLabel(/phone|mobile|telephone/i),
      (scope) =>
        scope.locator(
          'input[type="tel"], input[name="phoneNumber"], input[name="phonenumber"], input[name="phone"], input[autocomplete="tel"]',
        ),
    ],
    details.phoneNumber,
    { timeout: 1_500 },
  );

  const submitBtn = await findFirstVisibleLocator(
    page,
    [
      (scope) => scope.getByTestId("hosted-payment-submit-button"),
      (scope) => scope.getByRole("button", { name: /pay|subscribe|submit|complete|continue/i }),
      (scope) => scope.locator('button[type="submit"]'),
    ],
    { timeout: 10_000, pollIntervalMs: 200, checkEnabled: true },
  );

  if (!submitBtn) {
    throw new Error("Could not find a visible, enabled submit button on Stripe Checkout.");
  }

  await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
  await submitBtn.click();
  await handlePostSubmitLinkPrompt(page, details.phoneNumber);
}
