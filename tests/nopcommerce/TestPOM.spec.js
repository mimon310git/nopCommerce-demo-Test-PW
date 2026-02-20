const { test, expect } = require("@playwright/test");
const user = require("./fixtures/testData.json");
const { HomePage } = require("./pages/HomePage");
const { AuthPage } = require("./pages/AuthPage");
const { AccountPage } = require("./pages/AccountPage");
const { CatalogPage } = require("./pages/CatalogPage");
const { CartPage } = require("./pages/CartPage");
const { CheckoutPage } = require("./pages/CheckoutPage");

test.describe("POM Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    const home = new HomePage(page);
    await home.open(user.baseUrl);
    await home.clearStorage();
  });

  test("TS-01 Register Account", async ({ page, browserName }) => {
    const auth = new AuthPage(page);
    const reg = user.users.register;
    const uniqueEmail = `qa+${browserName}-${Date.now()}@mail.com`;

    await auth.openRegister(user.baseUrl);
    await auth.fillRegistrationForm({
      ...reg,
      email: uniqueEmail,
    });
    await auth.submitRegister();
    await auth.expectRegistrationSuccess();
  });

  test("TS-02 Login To Account", async ({ page }) => {
    const auth = new AuthPage(page);
    const account = new AccountPage(page);

    await auth.openLogin(user.baseUrl);
    await auth.fillLoginForm({
      email: user.users.existing.email,
      password: user.users.existing.password,
    });
    await auth.submitLogin();
    await account.expectUserIsLoggedIn();
  });

  test("TS-03 Add Product To Cart", async ({ page }) => {
    const cart = new CartPage(page);

    await cart.addProductFromSearch({
      searchKeyword: user.products.searchKeyword,
      productName: user.products.productName,
      baseUrl: user.baseUrl,
    });

    await cart.expectCartCount("(1)");
    await expect
      .soft(page.locator("#bar-notification"))
      .toContainText("The product has been added to your shopping cart", {
        timeout: 15000,
      });
  });

  test("TS-04 Checkout precondition via CartPage", async ({ page }) => {
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
    await cart.expectProductVisibleInCart(user.products.productName);

    await checkoutPage.acceptTerms();
    await checkoutPage.clickCheckoutFromCart();
    await expect.poll(() => page.url()).toContain("login/checkoutasguest");

    await checkoutPage.proceedAsGuest();
    await expect.poll(() => page.url()).toContain("onepagecheckout");

    await checkoutPage.fillBillingAddress({
      firstName: checkout.firstName,
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
  });

  test("TS-05 Sort Products", async ({ page }) => {
    const catalog = new CatalogPage(page);

    await catalog.openNotebooks(user.baseUrl);
    const beforePrices = await catalog.readVisiblePrices();

    await catalog.sortByPriceLowToHigh();

    const orderedUrl = `${user.baseUrl}notebooks?orderby=10`;
    await page.goto(orderedUrl);
    await expect(page).toHaveURL(orderedUrl);

    await expect
      .poll(async () => {
        const prices = await catalog.readVisiblePrices();
        const sorted = [...prices].sort((a, b) => a - b);
        return prices.join("|") === sorted.join("|");
      })
      .toBeTruthy();

    const afterPrices = await catalog.readVisiblePrices();
    expect(afterPrices).toEqual([...afterPrices].sort((a, b) => a - b));
    expect(afterPrices.join("|")).not.toBe(beforePrices.join("|"));
  });

  test("TS-06 Filter Products By CPU", async ({ page }) => {
    const catalog = new CatalogPage(page);

    await catalog.openNotebooks(user.baseUrl);

    const i5ProductLinks = await catalog.applyCpuFilter(user.products.cpuI5);
    const i7ProductLinks = await catalog.applyCpuFilter(user.products.cpuI7);

    expect(i5ProductLinks.length).toBeGreaterThan(0);
    expect(i7ProductLinks.length).toBeGreaterThan(0);
    expect(i7ProductLinks.join("|")).not.toBe(i5ProductLinks.join("|"));

    const detailsPage = await page.context().newPage();
    try {
      for (const productLink of i5ProductLinks) {
        await detailsPage.goto(productLink);
        const cpuRow = detailsPage
          .getByRole("row")
          .filter({ hasText: "CPU Type" })
          .first();
        await expect(cpuRow).toContainText(user.products.cpuI5);
      }
      for (const productLink of i7ProductLinks) {
        await detailsPage.goto(productLink);
        const cpuRow = detailsPage
          .getByRole("row")
          .filter({ hasText: "CPU Type" })
          .first();
        await expect(cpuRow).toContainText(user.products.cpuI7);
      }
    } finally {
      await detailsPage.close();
    }
  });

  test("TS-07 View Product Details", async ({ page }) => {
    const catalog = new CatalogPage(page);
    const productName = user.products.detailsProductName;

    await catalog.openNotebooks(user.baseUrl);
    await catalog.openProductByName(productName);
    await catalog.expectProductDetails(
      productName,
      `${user.baseUrl}${user.products.detailsProductSlug}`,
    );
    await catalog.expectProductPageBasics();
  });

  test("TS-08 Simple wishlist flow", async ({ page }) => {
    const catalog = new CatalogPage(page);
    const productName = user.products.wishlistProductName;

    await catalog.goToWishlist(user.baseUrl);
    await catalog.ensureWishlistIsEmpty();

    await catalog.openNotebooks(user.baseUrl);
    await catalog.openProductByName(productName);
    await catalog.expectProductDetails(
      productName,
      `${user.baseUrl}${user.products.wishlistProductSlug}`,
    );

    await page.evaluate(() => {
      window.__cfRLUnblockHandlers = true;
    });

    await catalog.addCurrentProductToWishlist();
    await catalog.openWishlistFromHeader(user.baseUrl);
    await catalog.removeProductFromWishlist(productName);
  });

  test("TS-09 Update Cart Quantity", async ({ page }) => {
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

    const subtotalRow = page.getByRole("row").filter({
      hasText: "Sub-Total:",
    }).first();
    const subtotalValueCell = subtotalRow.getByRole("cell").last();

    const parseMoney = (text) => {
      const normalized = (text || "")
        .trim()
        .replace("$", "")
        .replaceAll(",", "");
      return Number(normalized);
    };
    const readSubtotal = async () => {
      await expect(subtotalValueCell).toBeVisible();
      const text = (await subtotalValueCell.textContent()) || "";
      return parseMoney(text);
    };

    const beforeSubtotal = await readSubtotal();
    expect(beforeSubtotal).toBeGreaterThan(0);

    let quantityInput = productRow.getByRole("spinbutton").first();
    if (!(await quantityInput.isVisible().catch(() => false))) {
      quantityInput = productRow.getByRole("textbox").first();
    }

    await expect(quantityInput).toBeVisible();
    const currentQty = Number(await quantityInput.inputValue());
    const targetQty = String((Number.isNaN(currentQty) ? 1 : currentQty) + 1);
    await quantityInput.fill(targetQty);

    const updateCartButton = page
      .getByRole("button", { name: "Update shopping cart", exact: true })
      .first();
    if (await updateCartButton.isVisible().catch(() => false)) {
      await updateCartButton.click();
    } else {
      await quantityInput.press("Enter");
    }

    await expect(quantityInput).toHaveValue(targetQty);
    await expect.poll(readSubtotal).toBeGreaterThan(beforeSubtotal);
  });

  test("TS-10 Validate Required Fields", async ({ page, browserName }) => {
    const auth = new AuthPage(page);
    const reg = user.users.register;

    await auth.openRegister(user.baseUrl);
    await auth.submitEmptyRegisterAndAssertRequiredErrors();

    await page.goto(user.baseUrl);
    await auth.openRegister(user.baseUrl);
    await auth.fillRegistrationForm({
      ...reg,
      email: user.users.invalid.formatEmail,
    });
    await auth.submitRegister();
    await auth.expectInvalidEmailValidation();

    const uniqueEmail = `qa+${browserName}-${Date.now()}@mail.com`;
    await page.goto(user.baseUrl);
    await auth.openRegister(user.baseUrl);
    await auth.fillRegistrationForm({
      ...reg,
      email: uniqueEmail,
    });
    await auth.submitRegister();
    await auth.expectRegistrationSuccess();
  });
});

