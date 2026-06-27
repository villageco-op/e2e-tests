import { expect } from '@playwright/test';
import { test } from '../fixtures';
import { seedInvite } from '@/utils/seedInvite';

test.describe('Critical User Flows', () => {

  test('Create account + onboarding', async ({ newUnonboardedPage }) => {
    const page = newUnonboardedPage;

    await page.goto('/onboarding');
    await expect(page).toHaveURL(/.*\/onboarding/);

    const individualBtn = page.getByRole('button', { name: /Individual/i });
    await individualBtn.click();
    
    await page.getByLabel(/Real Name/i).fill('Jane Doe');
    await page.getByLabel(/Street Address/i).fill('123 Farm Lane');
    
    const cityInput = page.getByLabel(/City/i);
    await cityInput.clear();
    await cityInput.fill('Austin');
    
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Texas' }).click();
    
    await page.getByLabel(/ZIP Code/i).fill('78701');
    await page.getByRole('button', { name: /Continue/i }).click();

    await page.getByRole('button', { name: /Seller/i }).click();

    await page.getByLabel(/About You/i).fill('I grow organic strawberries in the valley.');
    await page.getByRole('button', { name: /Continue/i }).click();

    await page.getByRole('button', { name: /Not right now/i }).click();

    const successHeading = page.getByRole('heading', { name: /You're in!/i });
    await expect(successHeading).toBeVisible();

    const stripeBtn = page.getByRole('button', { name: /Complete Stripe Onboarding/i });
    await expect(stripeBtn).toBeVisible();
    await expect(stripeBtn).toBeEnabled();
  });

  test('Create organization onboarding', async ({ newUnonboardedPage }) => {
    const page = newUnonboardedPage;

    await page.goto('/onboarding'); 
    const orgBtn = page.getByRole('button', { name: /Organization/i });
    await orgBtn.click();

    const pantryBtn = page.getByRole('button', { name: /Food Pantry/i });
    await pantryBtn.click();

    await page.getByRole('button', { name: /Continue/i }).click();

    await page.getByLabel(/Organization Name/i).fill('Gary Food Network');
    await page.getByLabel(/Custom Subdomain/i).fill('gary-network');
    await page.getByLabel(/Street Address/i).fill('401 Broadway');
    await page.getByLabel(/ZIP Code/i).fill('46402');

    await expect(page.getByText(/Subdomain is available!/i)).toBeVisible();

    await page.getByRole('button', { name: /Create Organization/i }).click();

    await page.getByLabel(/Member Email Address/i).fill('partner@garyfood.org');
    await page.getByRole('button', { name: /Invite/i }).click();

    await expect(page.getByRole('cell', { name: 'partner@garyfood.org' })).toBeVisible();
    
    await page.getByRole('button', { name: /Finish & Go to Dashboard/i }).click();
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('Accept organization invitation', async ({ userWithOrganizationPage, onboardedBuyerPage, baseURLApi, request }) => {
    const { orgId } = userWithOrganizationPage;
    const { page, email } = onboardedBuyerPage;

    const inviteRecord = await seedInvite(request, baseURLApi, {
      email: email,
      orgId: orgId,
      role: 'member'
    });

    await page.goto(`/verify-invite?org=${orgId}&code=${inviteRecord.code}&email=${email}`);

    await expect(page.getByRole('heading', { name: /Join E2E Test Organization/i })).toBeVisible();

    const emailInput = page.getByLabel(/Email Address/i);
    await expect(emailInput).toHaveValue(email);
    await expect(emailInput).toBeDisabled();

    await expect(page.getByLabel(/Invitation Code/i)).toHaveValue(inviteRecord.code);

    await page.getByRole('button', { name: /Accept Invitation/i }).click();

    await expect(page).toHaveURL(/.*\/org-dashboard/);
  });

  test('Create listing', async ({ onboardedSellerPage }) => {
    const { page } = onboardedSellerPage;
    const listingTitle = `Gala Apples ${Math.floor(Math.random() * 1000)}`;

    await page.goto('/seller/new-listing');

    await page.getByLabel(/Title/i).fill(listingTitle);
    await page.getByLabel(/Description/i).fill('Crispy and sweet organic gala apples from the north orchard.');
    
    await page.getByLabel(/Produce Type/i).click();
    await page.getByRole('option', { name: 'Stone Fruits' }).click();

    await page.getByLabel(/Price per lb/i).fill('3.50');
    await page.getByLabel(/Total Inventory/i).fill('100');

    await page.getByLabel(/Available By/i).fill('2026-05-01T10:00');
    await page.getByLabel(/Season Start/i).fill('2026-05-01');
    await page.getByLabel(/Season End/i).fill('2026-09-01');

    await page.getByLabel(/Allow customers to set up recurring orders/i).check();

    const publishBtn = page.getByRole('button', { name: /Publish Listing/i });
    await publishBtn.click();

    await expect(page.getByText(/Listing created successfully/i)).toBeVisible();

    await expect(page).toHaveURL(/.*\/seller\/listings/);
    await expect(page.getByText(listingTitle)).toBeVisible();
  });

  test('Order', async ({ onboardedBuyerPage, sellerWithProducePage }) => {
    test.setTimeout(60_000);

    const { page } = onboardedBuyerPage;
    const { produceId } = sellerWithProducePage;
    
    await page.goto(`/produce/${produceId}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('button', { name: /Order Now/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: /Add to Cart/i }).click();

    await expect(page.getByText(/Added to cart!/i)).toBeVisible();

    await page.getByRole('button', { name: /View cart/i }).first().click();

    const checkoutBtn = page.getByRole('button', { name: /Checkout/i });
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    await page.waitForURL(/.*stripe.com.*/);

    await page.locator('#email').fill(`buyer-test-${Date.now()}@example.com`);
    await page.locator('#cardNumber').fill('4242');
    await page.locator('#cardNumber').pressSequentially('4242424242424242');
    await page.locator('#cardExpiry').fill('12/28');
    await page.locator('#cardCvc').fill('123');
    await page.locator('#billingName').fill('John Buyer');
    await page.locator('#billingPostalCode').fill('90210');
    await page.locator('#phoneNumber').fill('2025550143');
    
    await page.getByTestId('hosted-payment-submit-button').click();

    await page.waitForURL(/.*\/checkout\/success*/);
    await expect(page.getByRole('heading', { name: /Order Confirmed!/i })).toBeVisible();
  });

  test('Subscribe', async ({ onboardedBuyerPage, sellerWithProducePage }) => {
    test.setTimeout(60_000);

    const { page } = onboardedBuyerPage;
    const { produceId } = sellerWithProducePage;
    
    await page.goto(`/produce/${produceId}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('button', { name: /Order Now/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/Subscribe to this item/i).click();

    await page.getByRole('button', { name: /Add to Cart/i }).click();
    await expect(page.getByText(/Added to cart!/i)).toBeVisible();

    await page.getByRole('button', { name: /View cart/i }).first().click();

    const checkoutBtn = page.getByRole('button', { name: /Checkout/i });
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    await page.waitForURL(/.*stripe.com.*/);

    await page.locator('#email').fill(`subscriber-test-${Date.now()}@example.com`);
    await page.locator('#cardNumber').fill('4242');
    await page.locator('#cardNumber').pressSequentially('4242424242424242');
    await page.locator('#cardExpiry').fill('12/28');
    await page.locator('#cardCvc').fill('123');
    await page.locator('#billingName').fill('Jane Subscriber');
    await page.locator('#billingPostalCode').fill('90210');
    await page.locator('#phoneNumber').fill('2025550143');

    await page.getByTestId('hosted-payment-submit-button').click();

    await page.waitForURL(/.*\/checkout\/success*/);
    await expect(page.getByRole('heading', { name: /Order Confirmed!/i })).toBeVisible();
  });
});
