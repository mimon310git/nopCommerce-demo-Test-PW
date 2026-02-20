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
          (await productCards.nth(i).getByText("$").first().textContent()) ||
          "";
        const normalized = priceText
          .trim()
          .replace("$", "")
          .replaceAll(",", "");
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
      const origin = new URL(user.baseUrl).origin;
      await page.goto(`${user.baseUrl}notebooks`, {
        waitUntil: "domcontentloaded",
      });

      const sidebar = page.getByRole("complementary");
      const filterCheckbox = sidebar
        .getByRole("checkbox", { name: cpuLabel, exact: true })
        .first();
      const filterText = sidebar.getByText(cpuLabel, { exact: true }).first();

      await expect(filterCheckbox).toBeVisible();
      await expect(filterText).toBeVisible();

      if (!(await filterCheckbox.isChecked())) {
        await page.evaluate(() => {
          window.__cfRLUnblockHandlers = true;
        });
        await Promise.all([
          page.waitForURL(/\/notebooks\?.*specs=\d+/),
          filterText.click(),
        ]);
      }

      const specsValue = new URL(page.url()).searchParams.get("specs");
      if (specsValue) {
        await page.goto(`${origin}/notebooks?specs=${encodeURIComponent(specsValue)}`, {
          waitUntil: "domcontentloaded",
        });
      }

      await expect(filterCheckbox).toBeChecked();

      const productTitleLinks = page.locator(
        "main .product-grid .item-box .product-title a",
      );
      await expect(productTitleLinks.first()).toBeVisible();
      const links = await productTitleLinks.evaluateAll((elements) =>
        elements.map((link) => link.href).filter(Boolean),
      );
      return [...new Set(links)];
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
    await assertProductsMatchCpu(i5ProductLinks, "Intel Core i5");
    await assertProductsMatchCpu(i7ProductLinks, "Intel Core i7");
  });

  test("TS-07 View Product Details", async ({ page }) => {
    await page.goto(`${user.baseUrl}notebooks`);
    await expect(page).toHaveURL(`${user.baseUrl}notebooks`);
    await expect(page.locator(".product-item").first()).toBeVisible();

    const productName = "Lenovo Thinkpad Carbon Laptop";
    await page.getByRole("link", { name: productName, exact: true }).click();

    await expect(page).toHaveURL(
      `${user.baseUrl}lenovo-thinkpad-carbon-laptop`,
    );
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
    await expect(async () => {
      await page.goto(`${user.baseUrl}wishlist`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page).toHaveURL(`${user.baseUrl}wishlist`);
      await expect(
        page.getByRole("heading", { name: "Wishlist", exact: true }),
      ).toBeVisible();
    }).toPass({ timeout: 20000 });

    for (let i = 0; i < 5; i++) {
      if (await emptyWishlistMessage.isVisible().catch(() => false)) {
        break;
      }
      const removeButton = page
        .getByRole("button", { name: "Remove", exact: true })
        .first();
      if (!(await removeButton.isVisible().catch(() => false))) {
        break;
      }
      await removeButton.click();
      const removedByButton = await expect
        .poll(async () => {
          const emptyVisible = await emptyWishlistMessage
            .isVisible()
            .catch(() => false);
          const hasRemoveButtons =
            (await page
              .getByRole("button", { name: "Remove", exact: true })
              .count()) > 0;
          return emptyVisible || !hasRemoveButtons;
        })
        .toBeTruthy()
        .then(() => true)
        .catch(() => false);

      if (!removedByButton) {
        const updateWishlistButton = page.getByRole("button", {
          name: "Update wishlist",
          exact: true,
        });
        if (await updateWishlistButton.isVisible().catch(() => false)) {
          await updateWishlistButton.click({ timeout: 5000 });
        }
      }
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
    await row.getByRole("button", { name: "Remove", exact: true }).click();

    const removedByButton = await expect
      .poll(async () => {
        const rowCount = await row.count();
        const emptyVisible = await emptyWishlistMessage
          .isVisible()
          .catch(() => false);
        return rowCount === 0 || emptyVisible;
      })
      .toBeTruthy()
      .then(() => true)
      .catch(() => false);

    if (!removedByButton) {
      const updateWishlistButton = page.getByRole("button", {
        name: "Update wishlist",
        exact: true,
      });
      if (await updateWishlistButton.isVisible().catch(() => false)) {
        await updateWishlistButton.click({ timeout: 5000 });
      }
      await expect
        .poll(async () => {
          const rowCount = await row.count();
          const emptyVisible = await emptyWishlistMessage
            .isVisible()
            .catch(() => false);
          return rowCount === 0 || emptyVisible;
        })
        .toBeTruthy();
    }

    await expect(emptyWishlistMessage).toBeVisible();
  });
});
