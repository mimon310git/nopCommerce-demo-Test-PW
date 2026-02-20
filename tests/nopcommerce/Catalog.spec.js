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
    await expect(page).toHaveURL(`${user.baseUrl}notebooks`);

    const readPrices = async () => {
      const productCards = page.getByRole("article");
      const count = await productCards.count();
      const prices = [];

      for (let i = 0; i < count; i++) {
        const priceText =
          (await productCards.nth(i).getByText("$").first().textContent()) || "";
        const normalized = priceText.trim().replace("$", "").replaceAll(",", "");
        prices.push(Number(normalized));
      }

      return prices;
    };

    const beforePrices = await readPrices();
    console.log("Before", beforePrices);

    const sortOrder = page.getByLabel("Select product sort order", {
      exact: true,
    });
    await sortOrder.selectOption("10");
    await expect(sortOrder).toHaveValue("10");

    await expect
      .poll(() => new URL(page.url()).searchParams.get("orderby"))
      .toBe("10");

    await expect
      .poll(async () => {
        const prices = await readPrices();
        return JSON.stringify(prices);
      })
      .not.toBe(JSON.stringify(beforePrices));

    const afterPrices = await readPrices();
    console.log("After", afterPrices);
    expect(afterPrices).toEqual([...afterPrices].sort((a, b) => a - b));
  });

  test("TS-06 Filter Products By CPU", async ({ page }) => {
    await page.goto(`${user.baseUrl}notebooks`);

    const applyCpuFilter = async (cpuLabel) => {
      await page.goto(`${user.baseUrl}notebooks`);

      const filterCheckbox = page
        .getByRole("complementary")
        .getByRole("checkbox", { name: cpuLabel, exact: true })
        .first();
      await expect(filterCheckbox).toBeVisible();
      if (!(await filterCheckbox.isChecked())) {
        await filterCheckbox.check();
      }
      await expect(filterCheckbox).toBeChecked();

      await page.waitForLoadState("networkidle");

      const productCards = page.locator(".product-item");
      const cardCount = await productCards.count();
      const productLinks = [];

      for (let i = 0; i < cardCount; i++) {
        const href = await productCards
          .nth(i)
          .getByRole("link")
          .first()
          .getAttribute("href");
        if (href) {
          productLinks.push(new URL(href, user.baseUrl).toString());
        }
      }

      return productLinks;
    };

    const assertProductsMatchCpu = async (productLinks, cpuLabel) => {
      const detailsPage = await page.context().newPage();
      try {
        for (const productLink of productLinks) {
          await detailsPage.goto(productLink);
          const cpuRow = detailsPage
            .getByRole("row")
            .filter({ hasText: "CPU Type" })
            .first();
          await expect(cpuRow).toContainText(cpuLabel);
        }
      } finally {
        await detailsPage.close();
      }
    };

    const i5ProductLinks = await applyCpuFilter("Intel Core i5");
    const i7ProductLinks = await applyCpuFilter("Intel Core i7");

    console.log("I5 products:", i5ProductLinks);
    console.log("I7 products:", i7ProductLinks);

    expect(i5ProductLinks.length).toBeGreaterThan(0);
    expect(i7ProductLinks.length).toBeGreaterThan(0);
    expect(i7ProductLinks.join("|")).not.toBe(i5ProductLinks.join("|"));
    await assertProductsMatchCpu(i5ProductLinks, "Intel Core i5");
    await assertProductsMatchCpu(i7ProductLinks, "Intel Core i7");
  });

  test("TS-07 View Product Details", async ({ page }) => {
    await page.goto(`${user.baseUrl}notebooks`);
    await expect(page).toHaveURL(`${user.baseUrl}notebooks`);
    await expect(page.locator(".product-item").first()).toBeVisible();

    const productName = "Lenovo Thinkpad Carbon Laptop";
    await page.getByRole("link", { name: productName, exact: true }).click();

    await expect(page).toHaveURL(`${user.baseUrl}lenovo-thinkpad-carbon-laptop`);
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
    const emptyWishlistMessage = page.getByText("The wishlist is empty!", {
      exact: true,
    });

    // Precondition for deterministic run: wishlist starts empty.
    await page.goto(`${user.baseUrl}wishlist`);
    await page.waitForLoadState("networkidle");
    for (let i = 0; i < 5; i++) {
      if (await emptyWishlistMessage.isVisible().catch(() => false)) {
        break;
      }
      const removeCheckbox = page.locator("input[name='removefromcart']").first();
      if ((await removeCheckbox.count()) === 0) {
        break;
      }
      await removeCheckbox.evaluate((input) => {
        input.checked = true;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      const updateWishlistButton = page.getByRole("button", {
        name: "Update wishlist",
        exact: true,
      });
      if (await updateWishlistButton.isVisible().catch(() => false)) {
        await updateWishlistButton.click();
      }
      await page.waitForLoadState("networkidle");
    }
    await expect(emptyWishlistMessage).toBeVisible();

    await page.goto(`${user.baseUrl}notebooks`);
    await page.getByRole("link", { name: productName, exact: true }).click();
    await expect(page).toHaveURL(`${user.baseUrl}asus-laptop`);
    await expect(
      page.getByRole("heading", { name: productName }),
    ).toBeVisible();

    await page.evaluate(() => {
      window.__cfRLUnblockHandlers = true;
    });

    const addToWishlistButton = page
      .getByRole("main")
      .getByRole("button", { name: "Add to wishlist", exact: true })
      .first();
    await expect(addToWishlistButton).toBeEnabled();
    const barNotification = page.locator("#bar-notification");

    const wishlistLink = page
      .getByRole("banner")
      .getByRole("link", { name: "Wishlist" });
    await expect(async () => {
      await addToWishlistButton.click();
      await expect(barNotification).toContainText(
        "The product has been added to your wishlist",
      );
      await expect(wishlistLink).not.toContainText("(0)");
    }).toPass({ timeout: 20000 });

    await wishlistLink.click();
    await expect(page).toHaveURL(`${user.baseUrl}wishlist`);

    const row = page.getByRole("row").filter({
      has: page.getByRole("link", { name: productName, exact: true }),
    });

    await expect(row).toBeVisible();

    const removeCheckbox = row.locator("input[name='removefromcart']");
    await removeCheckbox.evaluate((input) => {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page
      .getByRole("button", { name: "Update wishlist", exact: true })
      .click();
    await page.waitForLoadState("networkidle");
    await expect(row).toHaveCount(0);
    await expect(emptyWishlistMessage).toBeVisible();
  });
});
