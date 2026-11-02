import { test, expect } from "../fixtures";

test.describe("Edit Listing Page", () => {
  test("updates listing details successfully", async ({ sellerWithProducePage }) => {
    const { page, produceId } = sellerWithProducePage;

    await page.goto(`/seller/listings/${produceId}/edit`);

    const titleInput = page.getByLabel(/Title/i);
    await expect(titleInput).toBeVisible();

    await titleInput.clear();
    await titleInput.fill("Organic Heirloom Tomatoes");

    const descriptionInput = page.getByLabel(/Description/i);
    await descriptionInput.clear();
    await descriptionInput.fill("Freshly harvested organic heirloom tomatoes, rich in flavor.");

    const saveBtn = page.getByRole("button", { name: /Save Changes/i });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    await expect(page.getByText(/Listing updated successfully/i)).toBeVisible();
    await page.waitForURL(/.*\/seller\/listings.*/);
  });

  test("pauses and resumes a listing from the danger zone", async ({ sellerWithProducePage }) => {
    const { page, produceId } = sellerWithProducePage;

    await page.goto(`/seller/listings/${produceId}/edit`);

    const pauseBtn = page.getByRole("button", { name: /Pause Listing/i });
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();

    await expect(page.getByText(/Pausing listing.../i)).toBeVisible();
    await expect(page.getByText(/Listing paused successfully/i)).toBeVisible();

    const resumeBtn = page.getByRole("button", { name: /Resume Listing/i });
    await expect(resumeBtn).toBeVisible();

    await resumeBtn.click();
    await expect(page.getByText(/Resuming listing.../i)).toBeVisible();
    await expect(page.getByText(/Listing resumed successfully/i)).toBeVisible();
    
    await expect(page.getByRole("button", { name: /Pause Listing/i })).toBeVisible();
  });

  test("deletes a listing with confirmation", async ({ sellerWithProducePage }) => {
    const { page, produceId } = sellerWithProducePage;

    await page.goto(`/seller/listings/${produceId}/edit`);

    const deleteBtn = page.getByRole("button", { name: /Delete Listing/i });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /Delete Listing/i })).toBeVisible();

    const confirmDeleteBtn = dialog.getByRole("button", { name: /Yes, Delete Listing/i });
    await expect(confirmDeleteBtn).toBeEnabled();
    await confirmDeleteBtn.click();

    await expect(page.getByText(/Listing deleted successfully/i)).toBeVisible();
    await page.waitForURL(/.*\/seller\/listings.*/);
  });
});
