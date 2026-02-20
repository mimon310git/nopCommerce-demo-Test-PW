const { test, expect } = require("@playwright/test");
const user = require("./fixtures/testData.json");
const { HomePage } = require("./pages/HomePage");
const { AuthPage } = require("./pages/AuthPage");
const { CartPage } = require("./pages/CartPage");
const { CheckoutPage } = require("./pages/CheckoutPage");

test.describe("POM Negative Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    const home = new HomePage(page);
    await home.open(user.baseUrl);
    await home.clearStorage();
  });

  test("NTS-01 Login With Invalid Password", async ({ page }) => {
    const auth = new AuthPage(page);

    await auth.openLogin(user.baseUrl);
    await auth.fillLoginForm({
      email: user.users.existing.email,
      password: user.users.invalid.password,
    });
    await auth.submitLogin();

    await expect(page.getByRole("main")).toContainText("Login was unsuccessful.");
    await expect(
      page.getByRole("banner").getByRole("link", { name: "My account", exact: true }),
    ).toHaveCount(0);
  });

  test("NTS-02 Register With Existing Email", async ({ page }) => {
    const auth = new AuthPage(page);
    const reg = user.users.register;
    const duplicateEmail = `qa+dup-${Date.now()}@mail.com`;

    await auth.openRegister(user.baseUrl);
    await auth.fillRegistrationForm({
      ...reg,
      email: duplicateEmail,
    });
    await auth.submitRegister();
    await auth.expectRegistrationSuccess();

    const logOutLink = page
      .getByRole("banner")
      .getByRole("link", { name: "Log out", exact: true });
    await expect(logOutLink).toBeVisible();
    await logOutLink.click();

    await auth.openRegister(user.baseUrl);
    await auth.fillRegistrationForm({
      ...reg,
      email: duplicateEmail,
    });
    await auth.submitRegister();

    await expect(page.getByRole("main")).toContainText("The specified email already exists");
    await expect.poll(() => page.url()).toContain("register");
  });

  test("NTS-03 Register With Password Mismatch", async ({ page }) => {
    const auth = new AuthPage(page);
    const reg = user.users.register;
    const uniqueEmail = `qa+mismatch-${Date.now()}@mail.com`;

    await auth.openRegister(user.baseUrl);
    await auth.fillRegistrationForm({
      ...reg,
      email: uniqueEmail,
      confirmPassword: user.users.invalid.confirmPassword,
    });
    await auth.submitRegister();

    await expect(
      page.locator("[data-valmsg-for='ConfirmPassword']"),
    ).toContainText("do not match");
    await expect.poll(() => page.url()).toContain("register");
  });

  test("NTS-04 Add Product To Cart With Missing Required Product Fields", async ({
    page,
  }) => {
    await page.goto(`${user.baseUrl}${user.products.negativeProductSlug}`);
    await expect(page.getByRole("main")).toContainText(user.products.negativeProductName);

    await page.evaluate(() => {
      window.__cfRLUnblockHandlers = true;
    });

    await page
      .getByRole("main")
      .getByRole("button", { name: "Add to cart", exact: true })
      .first()
      .click();

    await expect(
      page.getByRole("banner").getByRole("link", { name: "Shopping cart" }),
    ).toContainText("(0)");
  });

  test("NTS-05 Checkout Without Accepting Terms", async ({ page }) => {
    const auth = new AuthPage(page);
    const cart = new CartPage(page);

    await auth.openLogin(user.baseUrl);
    await auth.fillLoginForm({
      email: user.users.existing.email,
      password: user.users.existing.password,
    });
    await auth.submitLogin();
    await expect(
      page.getByRole("banner").getByRole("link", { name: "My account", exact: true }),
    ).toBeVisible();

    await cart.addProductFromSearch({
      searchKeyword: user.products.searchKeyword,
      productName: user.products.productName,
      baseUrl: user.baseUrl,
    });

    await cart.openCart();
    await expect(page).toHaveURL(`${user.baseUrl}cart`);
    await page.evaluate(() => {
      window.__cfRLUnblockHandlers = true;
    });

    const termsCheckbox = page.getByRole("checkbox", {
      name: "I agree with the terms of service and I adhere to them unconditionally",
      exact: true,
    });
    await expect(termsCheckbox).toBeVisible();
    if (await termsCheckbox.isChecked()) {
      await termsCheckbox.uncheck();
    }
    await expect(termsCheckbox).not.toBeChecked();

    await page.getByRole("button", { name: "Checkout", exact: true }).click();

    await expect(page).toHaveURL(`${user.baseUrl}cart`);
    const termsWarningBox = page.locator("#terms-of-service-warning-box");
    await expect(termsWarningBox).toBeVisible();
    await expect(termsWarningBox).toContainText(
      "Please accept the terms of service before the next step",
    );
  });

  test("NTS-06 Checkout With Missing Required Billing Field", async ({ page }) => {
    const cart = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
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
    await checkoutPage.acceptTerms();
    await checkoutPage.clickCheckoutFromCart();
    await checkoutPage.proceedAsGuest();

    await checkoutPage.fillBillingAddress({
      firstName: "",
      lastName: checkout.lastName,
      email: guestEmail,
      country: checkout.country,
      state: checkout.state,
      city: checkout.city,
      address1: checkout.address1,
      zip: checkout.zip,
      phone: checkout.phone,
    });

    await checkoutPage.continueFromBilling();

    await expect.poll(() => page.url()).toContain("onepagecheckout");
    await expect(
      page.locator("#billing-buttons-container").getByRole("button", {
        name: "Continue",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.locator("#billing-new-address-form").getByRole("textbox", {
        name: "First name:",
      }),
    ).toHaveValue("");
  });

  test("NTS-07 Update Cart Quantity To Zero", async ({ page }) => {
    const cart = new CartPage(page);

    await cart.addProductFromSearch({
      searchKeyword: user.products.searchKeyword,
      productName: user.products.productName,
      baseUrl: user.baseUrl,
    });

    await cart.openCart();
    await expect(page).toHaveURL(`${user.baseUrl}cart`);

    const productRow = page.getByRole("row").filter({
      has: page.getByRole("link", {
        name: user.products.productName,
        exact: true,
      }),
    });

    await expect(productRow).toBeVisible();

    let quantityInput = productRow.getByRole("spinbutton").first();
    if (!(await quantityInput.isVisible().catch(() => false))) {
      quantityInput = productRow.getByRole("textbox").first();
    }

    await quantityInput.fill("0");

    const updateCartButton = page
      .getByRole("button", { name: "Update shopping cart", exact: true })
      .first();

    if (await updateCartButton.isVisible().catch(() => false)) {
      await updateCartButton.click();
    } else {
      await quantityInput.press("Enter");
    }

    await expect
      .poll(async () => {
        const rowCount = await productRow.count();
        const emptyVisible = await page
          .getByRole("main")
          .getByText("Your Shopping Cart is empty")
          .isVisible()
          .catch(() => false);

        return rowCount === 0 || emptyVisible;
      })
      .toBeTruthy();

    await expect(
      page.getByRole("banner").getByRole("link", { name: "Shopping cart" }),
    ).toContainText("(0)");
  });

  test("NTS-08 Submit Register Form Empty", async ({ page }) => {
    const auth = new AuthPage(page);

    await auth.openRegister(user.baseUrl);
    await auth.submitEmptyRegisterAndAssertRequiredErrors();
    await expect.poll(() => page.url()).toContain("register");
  });
});


