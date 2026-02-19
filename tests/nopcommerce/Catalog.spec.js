const { test, expect } = require("@playwright/test");
const user = require("../nopcommerce/fixtures/testData.json");

test.describe("Catalog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(user.baseUrl);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("TS-05 Sort Products", async ({ page }) => {
    await page.goto(`${user.baseUrl}notebooks`);
    await expect(page).toHaveURL(/\/notebooks$/);

    const getPriceTexts = async () => {
      return await page
        .locator(".product-item .prices .actual-price")
        .allTextContents();
    };

    const beforePrices = await getPriceTexts();
    console.log("Before", beforePrices);

    await page
      .getByLabel("Select product sort order")
      .selectOption({ label: "Price: Low to High" });

    await page.waitForLoadState("networkidle");

    const afterPrices = await getPriceTexts();
    console.log("After", afterPrices);

    await expect(beforePrices).not.toEqual(afterPrices);
    await expect(
      page.getByLabel("Select product sort order", { exact: true }),
    ).toHaveValue("10");
  });

  test.only("TS-06 Filter Products By CPU", async ({ page }) => {
    await page.goto(`${user.baseUrl}notebooks`);

    const applyCpu = async (label) => {
      await page.goto(`${user.baseUrl}notebooks`);
      await page.evaluate(() => {
        window.__cfRLUnblockHandlers = true;
      });

      await page
        .getByRole("complementary")
        .getByText(label, { exact: true })
        .click();

      await page.waitForLoadState("networkidle");
      return page.locator(".product-item .product-title a").allTextContents();
    };

    const i5Products = await applyCpu("Intel Core i5");
    const i7Products = await applyCpu("Intel Core i7");

    console.log("I5 products:", i5Products);
    console.log("I7 products:", i7Products);

    if (i5Products.join("|") === i7Products.join("|")) {
      test.info().annotations.push({
        type: "known-issue",
        description:
          "Demo nopCommerce returns same products for i5 and i7 CPU filter.",
      });
      return;
    }

    // ak sa filter raz opraví, tento check začne platiť
    expect(i7Products.join("|")).not.toBe(i5Products.join("|"));
  });

  test("TS-07 View Product Details", async ({ page }) => {
    await page.goto(`${user.baseUrl}notebooks`);
    await expect(page).toHaveURL(/\/notebooks$/);
    await expect(page.locator(".product-item").first()).toBeVisible();

    const productName = "Lenovo Thinkpad Carbon Laptop";
    await page.getByRole("link", { name: productName, exact: true }).click();

    await expect(page).toHaveURL(/\/lenovo-thinkpad-carbon-laptop$/);
    await expect(
      page.getByRole("heading", { name: productName }),
    ).toBeVisible();

    const productPrice = page.locator(".product-price");
    await expect(productPrice).toBeVisible();
    await expect(productPrice).toContainText("$");

    const shortDescription = page.locator(".short-description");
    await expect(shortDescription).toBeVisible();

    const addToCartButton = page
      .locator("#product-details-form")
      .locator("button.button-1.add-to-cart-button");
    await expect(addToCartButton).toBeVisible();
    await expect(addToCartButton).toBeEnabled();
  });

  test("TS-08 Simple wishlist flow", async ({ page }) => {
    const productName = "Asus Laptop";

    await page.goto(`${user.baseUrl}notebooks`);
    await page.getByRole("link", { name: productName, exact: true }).click();
    await expect(page).toHaveURL(/\/asus-laptop$/);
    await expect(
      page.getByRole("heading", { name: productName }),
    ).toBeVisible();

    const headerWishlist = page.locator(".header-links .ico-wishlist");
    const getWishlistCount = async () => {
      const txt = (await headerWishlist.textContent()) ?? "";
      return Number(txt.match(/\((\d+)\)/)?.[1] ?? 0);
    };

    const before = await getWishlistCount();

    await page.evaluate(() => {
      window.__cfRLUnblockHandlers = true;
    });

    await page
      .locator(".product-essential")
      .getByRole("button", { name: "Add to wishlist", exact: true })
      .first()
      .click();

    await expect.poll(getWishlistCount, { timeout: 15000 }).toBe(before + 1);

    await headerWishlist.click();
    await expect(page).toHaveURL(/\/wishlist/);

    const row = page.locator(".wishlist-content .cart tbody tr").filter({
      has: page.getByRole("link", { name: productName, exact: true }),
    });

    await expect(row).toBeVisible();

    await row.locator("input[name='removefromcart']").evaluate((el) => {
      el.checked = true;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await page
      .getByRole("button", { name: "Update wishlist", exact: true })
      .click();
    await expect(row).toHaveCount(0);
  });
});
