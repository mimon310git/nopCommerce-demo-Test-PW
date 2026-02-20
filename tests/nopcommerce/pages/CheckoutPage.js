const { expect } = require("@playwright/test");

class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.checkoutButton = page.getByRole("button", { name: "Checkout", exact: true });
    this.checkoutAsGuestButton = page.getByRole("button", {
      name: "Checkout as Guest",
      exact: true,
    });
    this.billing = page.locator("#billing-new-address-form");
  }

  async acceptTerms() {
    await this.page
      .getByRole("checkbox", { name: "I agree with the terms of service" })
      .check();
  }

  async clickCheckoutFromCart() {
    await this.checkoutButton.click();
  }

  async proceedAsGuest() {
    await expect(this.checkoutAsGuestButton).toBeVisible();
    await expect(async () => {
      await this.checkoutAsGuestButton.click();
      await expect.poll(() => this.page.url()).toContain("onepagecheckout");
    }).toPass({ timeout: 30000 });
  }

  async fillBillingAddress({
    firstName,
    lastName,
    email,
    country,
    state,
    city,
    address1,
    zip,
    phone,
  }) {
    await expect(this.billing).toBeVisible();

    await this.billing.getByRole("textbox", { name: "First name:" }).fill(firstName);
    await this.billing.getByRole("textbox", { name: "Last name:" }).fill(lastName);
    await this.billing.getByRole("textbox", { name: "Email:" }).fill(email);
    await this.billing
      .getByRole("combobox", { name: "Country:" })
      .selectOption({ label: country });

    const stateSelect = this.billing.getByRole("combobox", {
      name: "State / province:",
      exact: true,
    });

    await expect
      .poll(async () => stateSelect.locator("option").count())
      .toBeGreaterThan(1);

    const stateLabel = state || "New York";
    const hasStateOption = await stateSelect
      .locator("option")
      .evaluateAll(
        (options, label) =>
          options.some((option) => option.textContent?.trim() === label),
        stateLabel,
      );

    if (hasStateOption) {
      await stateSelect.selectOption({ label: stateLabel });
    }

    if ((await stateSelect.inputValue()) === "0") {
      const fallbackValue = await stateSelect.locator("option").nth(1).getAttribute("value");
      if (fallbackValue && fallbackValue !== "0") {
        await stateSelect.selectOption(fallbackValue);
      }
    }

    await this.billing.getByRole("textbox", { name: "City:" }).fill(city);
    await this.billing.getByRole("textbox", { name: "Address 1:" }).fill(address1);
    await this.billing.getByRole("textbox", { name: "Zip / postal code:" }).fill(zip);
    await this.billing.getByRole("textbox", { name: "Phone number:" }).fill(phone);
  }

  async continueFromBilling() {
    await this.page
      .locator("#billing-buttons-container")
      .getByRole("button", { name: "Continue", exact: true })
      .click();
  }
}

module.exports = { CheckoutPage };
