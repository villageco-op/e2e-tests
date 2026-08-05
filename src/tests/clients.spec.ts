import { expect } from "@playwright/test";
import { test } from "../fixtures";

test.describe("Client Management Flows", () => {
  test("Create a new client record", async ({ userWithOrganizationPage }) => {
    const { page } = userWithOrganizationPage;

    await page.goto("/org/clients");

    // Open add client flow
    const addClientBtn = page.getByText(/\+ New Client/i);
    await addClientBtn.click();

    // Fill primary details
    await page.getByPlaceholder(/Enter full name/i).fill("Peter Parker");
    await page
      .getByPlaceholder(/name@domain.com/i)
      .fill("peter@dailybugle.com");
    await page.getByPlaceholder(/\(555\) 000-0000|555/i).fill("555-1962");

    // Fill address details
    await page.getByLabel(/Street Address/i).fill("20 Ingram St");

    const cityInput = page.getByLabel(/City/i);
    await cityInput.clear();
    await cityInput.fill("Forest Hills");

    const stateDropdown = page.getByRole("combobox");
    await stateDropdown.click();
    await page.getByRole("option", { name: "New York" }).click();

    await page.getByLabel(/ZIP Code/i).fill("11375");

    // Submit the form
    const submitBtn = page.getByRole("button", { name: /add client/i });
    await submitBtn.click();

    // Verify confirmation and representation in UI
    await expect(
      page.getByText("Client registered successfully."),
    ).toBeVisible();
    await expect(page.getByText("Peter Parker")).toBeVisible();
  });

  test("Edit an existing client record", async ({
    organizationWithClientPage,
  }) => {
    const { page, client } = organizationWithClientPage;

    await page.goto("/org/clients");

    // Select client row to enable actions
    const clientRow = page.getByText(client.name);
    await expect(clientRow).toBeVisible();
    await clientRow.click();

    // Click edit action
    const editBtn = page.getByRole("button", { name: /edit/i });
    await editBtn.click();

    // Edit and clear relevant fields
    const nameInput = page.getByLabel(/Full Name/i);
    await nameInput.clear();
    await nameInput.fill("Jane H. Doe");

    const emailInput = page.getByLabel(/Email/i);
    await emailInput.clear();
    await emailInput.fill("jane.updated@example.com");

    const phoneInput = page.getByLabel(/Phone Number/i);
    await phoneInput.clear();
    await phoneInput.fill("(555) 987-6543");

    const addressInput = page.getByLabel(/Street Address/i);
    await addressInput.clear();
    await addressInput.fill("456 Oak St");

    const cityInput = page.getByLabel(/City/i);
    await cityInput.clear();
    await cityInput.fill("Milwaukee");

    const stateDropdown = page.getByRole("combobox");
    await stateDropdown.click();
    await page.getByRole("option", { name: "Wisconsin" }).click();

    const zipInput = page.getByLabel(/ZIP Code/i);
    await zipInput.clear();
    await zipInput.fill("53202");

    // Save changes
    const saveButton = page.getByRole("button", { name: /save changes/i });
    await saveButton.click();

    // Assert edits reflect on the list
    await expect(page.getByText("Jane H. Doe")).toBeVisible();
  });

  test("Delete an existing client record", async ({
    organizationWithClientPage,
  }) => {
    const { page, client } = organizationWithClientPage;

    await page.goto("/org/clients");

    // Select the client row
    const clientRow = page.getByText(client.name);
    await expect(clientRow).toBeVisible();
    await clientRow.click();

    // Click top action bar delete button
    const deleteBtn = page.getByRole("button", { name: /delete/i });
    await expect(deleteBtn).toBeEnabled();
    await deleteBtn.click();

    // Confirm deletion in modal
    const confirmBtn = page.getByRole("button", { name: /Confirm Deletion/i });
    await confirmBtn.click();

    // Verify toast notification and UI state
    await expect(
      page.getByText("Client record removed permanently."),
    ).toBeVisible();
    await expect(page.getByText(client.name)).not.toBeVisible();
  });
});
