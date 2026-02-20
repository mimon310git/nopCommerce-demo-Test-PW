const { test, expect } = require("@playwright/test");
const user = require("../nopcommerce/fixtures/testData.json");
const { CartPage } = require("./pages/CartPage");

test.describe("Checkout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(user.baseUrl);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("Checkout precondition via CartPage", async ({ page }) => {
    const cart = new CartPage(page);
    const checkout = user.checkout;
    const guestEmail = checkout.email.replace(
      "{timestamp}",
      Date.now().toString(),
    );

    await cart.addProductFromSearch({
      searchKeyword: user.products.searchKeyword,
      productName: user.products.productName,
      baseUrl: user.baseUrl,
    });

    await cart.openCart();
    await expect(page).toHaveURL(`${user.baseUrl}cart`);
    await cart.expectProductVisibleInCart(user.products.productName);

    await page
      .getByRole("checkbox", { name: "I agree with the terms of service" })
      .check();
    await page.getByRole("button", { name: "Checkout", exact: true }).click();

    await expect(page).toHaveURL(/\/login\/checkoutasguest/);
    const checkoutAsGuestButton = page.getByRole("button", {
      name: "Checkout as Guest",
      exact: true,
    });
    await expect(checkoutAsGuestButton).toBeVisible();
    await expect(async () => {
      await checkoutAsGuestButton.click();
      await expect(page).toHaveURL(/\/onepagecheckout/, { timeout: 10000 });
    }).toPass({ timeout: 30000 });

    const billing = page.locator("#opc-billing");
    await expect(billing).toBeVisible();
    await billing
      .getByRole("textbox", { name: "First name:" })
      .fill(checkout.firstName);
    await billing
      .getByRole("textbox", { name: "Last name:" })
      .fill(checkout.lastName);
    await billing.getByRole("textbox", { name: "Email:" }).fill(guestEmail);
    await billing
      .getByRole("combobox", { name: "Country:" })
      .selectOption({ label: checkout.country });

    const state = billing.getByRole("combobox", {
      name: "State / province:",
      exact: true,
    });
    await expect
      .poll(async () => state.locator("option").count())
      .toBeGreaterThan(1);
    await state.selectOption({ label: checkout.state || "New York" });
    await expect(state).not.toHaveValue("0");

    await billing.getByRole("textbox", { name: "City:" }).fill(checkout.city);
    await billing
      .getByRole("textbox", { name: "Address 1:" })
      .fill(checkout.address1);
    await billing
      .getByRole("textbox", { name: "Zip / postal code:" })
      .fill(checkout.zip);
    await billing
      .getByRole("textbox", { name: "Phone number:" })
      .fill(checkout.phone);

    await page
      .locator("#billing-buttons-container")
      .getByRole("button", { name: "Continue", exact: true })
      .click();
  });
});
