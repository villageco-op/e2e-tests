import { test, expect } from "../fixtures";

test.describe("Order Completion and Review Popups", () => {
  test("buyer order completion dialog appears globally and chains into the review form upon confirmation", async ({
    buyerWithOrder,
  }) => {
    const { page, seedOrder } = buyerWithOrder;

    // Seed a paid order with a scheduled time in the past so the completion modal triggers
    const pastScheduledTime = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString();
    await seedOrder({
      status: "paid",
      scheduledDate: pastScheduledTime,
      buyerReport: null,
    });

    await page.goto("/");

    const dialogTitle = page.getByRole("heading", { name: /Did you receive your order\?/i });
    await expect(dialogTitle).toBeVisible();
    await expect(page.getByText(/1 pending confirmation/i)).toBeVisible();

    const confirmReceivedBtn = page.getByRole("button", { name: /Yes, Order (Delivered|Picked Up)/i });
    await expect(confirmReceivedBtn).toBeVisible();
    await confirmReceivedBtn.click();

    await expect(page.getByText(/Order status updated successfully!/i)).toBeVisible();

    const reviewHeader = page.getByRole("heading", { name: /Leave a Review/i });
    await expect(reviewHeader).toBeVisible();

    const starButtons = page.getByRole("button", { name: /Rate \d stars/i });
    await starButtons.nth(4).click(); // 5-star rating

    const commentTextarea = page.getByPlaceholder(/Tell others about the quality, freshness/i);
    await commentTextarea.fill("Amazing local produce, super smooth pickup!");

    const submitReviewBtn = page.getByRole("button", { name: /^Submit$/i });
    await expect(submitReviewBtn).toBeEnabled();
    await submitReviewBtn.click();

    await expect(page.getByText(/Review submitted successfully! Thank you\./i)).toBeVisible();
    await expect(reviewHeader).not.toBeVisible();
  });

  test("buyer can dismiss or remind later on order completion popup", async ({
    buyerWithOrder,
  }) => {
    const { page, seedOrder } = buyerWithOrder;

    const pastScheduledTime = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString();
    await seedOrder({
      status: "paid",
      scheduledDate: pastScheduledTime,
      buyerReport: null,
    });

    await page.goto("/");

    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const dialogTitle = page.getByRole("heading", { name: /Did you receive your order\?/i });
    await expect(dialogTitle).toBeVisible();

    const remindLaterBtn = page.getByRole("button", { name: /Remind me later/i });
    await expect(remindLaterBtn).toBeVisible();
    await remindLaterBtn.click();

    await expect(dialogTitle).not.toBeVisible();
  });
});
