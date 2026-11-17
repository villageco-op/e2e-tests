import { test, expect } from "../fixtures";

test.describe("Order Details Page", () => {
  test("renders order details and action controls for a pending order", async ({
    buyerWithOrder,
  }) => {
    const { page, orderId } = buyerWithOrder;

    await page.goto(`/orders/${orderId}`);

    await expect(page.getByRole("button", { name: /Cancel Order/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Reschedule/i })).toBeVisible();
  });

  test("cancels an order with a reason and displays toast confirmation", async ({
    buyerWithOrder,
  }) => {
    const { page, orderId } = buyerWithOrder;

    await page.goto(`/orders/${orderId}`);

    const cancelBtn = page.getByRole("button", { name: /Cancel Order/i });
    await cancelBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const textarea = page.getByPlaceholder(/E.g., Out of stock/i);
    await textarea.fill("I accidentally ordered too many carrots.");

    const confirmBtn = page.getByRole("button", { name: /Confirm Cancellation/i });
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    await expect(page.getByText(/Order has been canceled/i)).toBeVisible();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Cancel Order/i })).not.toBeVisible();
  });

  test("reschedules an order with a proposed new date and time", async ({
    buyerWithOrder,
  }) => {
    const { page, orderId } = buyerWithOrder;

    await page.goto(`/orders/${orderId}`);

    const rescheduleBtn = page.getByRole("button", { name: /Reschedule/i });
    await rescheduleBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const dateInput = page.getByLabel(/New Date & Time/i);
    await dateInput.fill("2026-05-20T10:00");

    const submitBtn = page.getByRole("button", { name: /Propose New Time/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(
      page.getByText(/Reschedule request sent successfully/i),
    ).toBeVisible();
  });

  test("hides action buttons when viewing a completed order", async ({
    buyerWithOrder,
  }) => {
    const { page, seedOrder } = buyerWithOrder;

    const completedOrder = await seedOrder({ status: "completed" });
    await page.goto(`/orders/${completedOrder.id}`);

    await expect(page.getByRole("button", { name: /Cancel Order/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Reschedule/i })).not.toBeVisible();
  });

  test("buyer can report order as received within 24 hours", async ({
    buyerWithOrder,
  }) => {
    const { page, seedOrder } = buyerWithOrder;

    // Schedule within the last 12 hours (falls in 0-24 hour window)
    const recentScheduledTime = new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString();
    const order = await seedOrder({
      status: "paid",
      scheduledDate: recentScheduledTime,
    });

    await page.goto(`/orders/${order.id}`);

    const reportReceivedBtn = page.getByRole("button", { name: /Report Received/i });
    await expect(reportReceivedBtn).toBeVisible();
    await reportReceivedBtn.click();

    await expect(page.getByText(/Status report submitted successfully/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Report Received/i })).not.toBeVisible();
  });

  test("buyer can report order as not received within 24 hours", async ({
    buyerWithOrder,
  }) => {
    const { page, seedOrder } = buyerWithOrder;

    const recentScheduledTime = new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString();
    const order = await seedOrder({
      status: "paid",
      scheduledDate: recentScheduledTime,
    });

    await page.goto(`/orders/${order.id}`);

    const reportNotReceivedBtn = page.getByRole("button", { name: /Report Not Received/i });
    await expect(reportNotReceivedBtn).toBeVisible();
    await reportNotReceivedBtn.click();

    await expect(page.getByText(/Status report submitted successfully/i)).toBeVisible();
  });

  test("seller can report order as fulfilled between 24 and 48 hours", async ({
    sellerWithOrder,
  }) => {
    const { page, seedOrder } = sellerWithOrder;

    // Schedule 30 hours ago (falls in 24-48 hour window)
    const pastScheduledTime = new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString();
    const order = await seedOrder({
      status: "paid",
      scheduledDate: pastScheduledTime,
    });

    await page.goto(`/orders/${order.id}`);

    const reportFulfilledBtn = page.getByRole("button", { name: /Report Fulfilled/i });
    await expect(reportFulfilledBtn).toBeVisible();
    await reportFulfilledBtn.click();

    await expect(page.getByText(/Status report submitted successfully/i)).toBeVisible();
  });

  test("user can open a dispute when counterparty has reported within 48 hours", async ({
    buyerWithOrder,
  }) => {
    const { page, seedOrder } = buyerWithOrder;

    // Schedule 10 hours ago with an existing seller report
    const recentScheduledTime = new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString();
    const order = await seedOrder({
      status: "completed",
      scheduledDate: recentScheduledTime,
      sellerReport: "fulfilled",
      sellerReportedAt: recentScheduledTime,
    });

    await page.goto(`/orders/${order.id}`);

    const disputeBtn = page.getByRole("button", { name: /Dispute Order/i });
    await expect(disputeBtn).toBeVisible();
    await disputeBtn.click();

    await expect(page.getByText(/Dispute opened successfully/i)).toBeVisible();
  });

  test("buyer can open review dialog, submit a rating and comment, and see success confirmation", async ({
    buyerWithOrder,
  }) => {
    const { page, seedOrder } = buyerWithOrder;

    const completedOrder = await seedOrder({
      status: "completed",
      review: null,
    });

    await page.goto(`/orders/${completedOrder.id}`);

    const reviewBtn = page.getByRole("button", { name: /^Review$/i });
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();

    const dialogTitle = page.getByText(/Leave a Review/i);
    await expect(dialogTitle).toBeVisible();

    const starButtons = page.getByRole("button", { name: /Rate \d stars/i });
    await starButtons.nth(3).click(); // 4-star rating

    const commentTextarea = page.getByPlaceholder(/Tell others about the quality, freshness/i);
    await commentTextarea.fill("The produce was exceptionally fresh and arrived right on time!");

    const submitReviewBtn = page.getByRole("button", { name: /^Submit$/i });
    await expect(submitReviewBtn).toBeEnabled();
    await submitReviewBtn.click();

    await expect(page.getByText(/Review submitted successfully! Thank you\./i)).toBeVisible();
    await expect(dialogTitle).not.toBeVisible();
  });
});
