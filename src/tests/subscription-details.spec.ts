import { test, expect } from "../fixtures";

test.describe("Buyer Subscription Details Page", () => {
  test("displays active subscription details, items, and action buttons", async ({
    buyerWithSubscription,
  }) => {
    const { page, subscriptionId } = buyerWithSubscription;

    await page.goto(`/subscriptions/${subscriptionId}`);

    await expect(page.getByText(/Subscription Details/i)).toBeVisible();
    await expect(page.getByText(/E2E Crisp Apples/i)).toBeVisible();

    await expect(page.getByRole("button", { name: /Edit/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Pause/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cancel/i })).toBeVisible();
  });

  test("edits subscription quantity and fulfillment type with dynamic price update", async ({
    buyerWithSubscription,
  }) => {
    const { page, subscriptionId } = buyerWithSubscription;

    await page.goto(`/subscriptions/${subscriptionId}`);

    await page.getByRole("button", { name: /Edit/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      page.getByText(/Adjust your recurring order details/i),
    ).toBeVisible();

    const qtyInput = page.getByLabel(/Quantity/i);
    const saveBtn = page.getByRole("button", { name: /Save Changes/i });

    await qtyInput.clear();
    await qtyInput.fill("0");
    await expect(saveBtn).toBeDisabled();

    await qtyInput.clear();
    await qtyInput.fill("20");
    await expect(dialog.getByText(/\$9.00/i)).toBeVisible();

    const fulfillmentTrigger = page.getByLabel(/Fulfillment Type/i);
    await fulfillmentTrigger.click();
    await page.getByRole("option", { name: /pickup/i }).click();

    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    await expect(dialog).not.toBeVisible();
  });

  test("pauses and resumes a subscription", async ({
    buyerWithSubscription,
  }) => {
    const { page, subscriptionId } = buyerWithSubscription;

    await page.goto(`/subscriptions/${subscriptionId}`);

    const pauseBtn = page.getByRole("button", { name: /Pause/i });
    await pauseBtn.click();

    const resumeBtn = page.getByRole("button", { name: /Resume/i });
    await expect(resumeBtn).toBeVisible();

    await resumeBtn.click();
    await expect(page.getByRole("button", { name: /Pause/i })).toBeVisible();
  });

  test("cancels a subscription requiring a reason", async ({
    buyerWithSubscription,
  }) => {
    const { page, subscriptionId } = buyerWithSubscription;

    await page.goto(`/subscriptions/${subscriptionId}`);

    await page.getByRole("button", { name: /Cancel/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const confirmBtn = page.getByRole("button", {
      name: /Confirm Cancellation/i,
    });
    const textarea = page.getByPlaceholder(/E.g., Moving away/i);

    await expect(confirmBtn).toBeDisabled();

    await textarea.fill(
      "I am moving to a different city and can no longer receive local deliveries.",
    );
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    await expect(dialog).not.toBeVisible();

    await expect(page.getByRole("button", { name: /Edit/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Pause/i })).not.toBeVisible();
  });

  test("already canceled subscription does not display action controls", async ({
    buyerWithSubscription,
  }) => {
    const { page, seedSubscription } = buyerWithSubscription;

    const canceledSub = await seedSubscription({
      status: "canceled",
      cancelReason: "No longer needed.",
    });

    await page.goto(`/subscriptions/${canceledSub.id}`);

    await expect(page.getByText(/Subscription Details/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Edit/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Pause/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Cancel/i })).not.toBeVisible();
  });
});
