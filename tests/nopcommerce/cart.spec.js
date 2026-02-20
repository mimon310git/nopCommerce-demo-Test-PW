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
    const totalCell = productRow.getByRole("cell").nth(5);
    const parseMoney = (text) =>
      Number(((text || "").replace(/[^0-9.]/g, "").trim() || "NaN"));
    const readSubtotal = async () => {
      const text = (await totalCell.textContent()) || "";
      return parseMoney(text);
    };
    const beforeSubtotal = await readSubtotal();
    expect(beforeSubtotal).not.toBeNaN();

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
});
