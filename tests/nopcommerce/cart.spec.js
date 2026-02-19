const { test, expect } = require("@playwright/test");
const user = require("../nopcommerce/fixtures/testData.json");
const { CartPage } = require("./pages/CartPage");

test.describe("Cart", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(user.baseUrl);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("Add Product To Cart", async ({ page }) => {
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

  test.only("TS-09 Update Cart Quantity", async ({ page }) => {
    const cart = new CartPage(page);

    await cart.addProductFromSearch({
      searchKeyword: user.products.searchKeyword,
      productName: user.products.productName,
      baseUrl: user.baseUrl,
    });

    await cart.openCart();
    await expect(page).toHaveURL(/\/cart$/);

    const productRow = page.getByRole("row", {
      name: new RegExp(user.products.productName, "i"),
    });
    await expect(productRow).toBeVisible();

    let quantityInput = productRow.getByRole("spinbutton").first();
    if (!(await quantityInput.isVisible().catch(() => false))) {
      quantityInput = productRow.getByRole("textbox").first();
    }

    await expect(quantityInput).toBeVisible();
    await quantityInput.fill("2");

    const updateCartButton = page
      .getByRole("button", { name: /update shopping cart/i })
      .first();
    if (await updateCartButton.isVisible().catch(() => false)) {
      await updateCartButton.click();
    } else {
      await quantityInput.press("Enter");
    }

    await expect(quantityInput).toHaveValue("2");
  });
});
