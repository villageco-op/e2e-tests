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
});
