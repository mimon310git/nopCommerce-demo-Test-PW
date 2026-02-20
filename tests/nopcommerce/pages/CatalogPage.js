const { expect } = require("@playwright/test");

class CatalogPage {
  constructor(page) {
    this.page = page;
    this.main = page.getByRole("main");
    this.banner = page.getByRole("banner");
    this.sortOrderSelect = page.getByLabel("Select product sort order", {
      exact: true,
    });
    this.wishlistLink = this.banner.getByRole("link", { name: "Wishlist" });
    this.emptyWishlistMessage = page.getByText("The wishlist is empty!", {
      exact: true,
    });
  }

  async openNotebooks(baseUrl) {
    await this.page.goto(`${baseUrl}notebooks`);
    await expect(this.page).toHaveURL(`${baseUrl}notebooks`);
  }

  async readVisiblePrices() {
    const productCards = this.page.getByRole("article");
    const count = await productCards.count();
    const prices = [];

    for (let i = 0; i < count; i++) {
      const priceText =
        (await productCards.nth(i).getByText("$").first().textContent()) || "";
      const normalized = priceText.trim().replace("$", "").replaceAll(",", "");
      prices.push(Number(normalized));
    }

    return prices;
  }

  async sortByPriceLowToHigh() {
    await this.sortOrderSelect.selectOption("10");
    await expect(this.sortOrderSelect).toHaveValue("10");
    await expect
      .poll(() => new URL(this.page.url()).searchParams.get("orderby"))
      .toBe("10");
  }

  async applyCpuFilter(cpuLabel) {
    const origin = new URL(this.page.url()).origin;
    await this.page.goto(`${origin}/notebooks`, {
      waitUntil: "domcontentloaded",
    });

    const sidebar = this.page.getByRole("complementary");
    const cpuCheckbox = sidebar
      .getByRole("checkbox", { name: cpuLabel, exact: true })
      .first();
    const cpuFilterText = sidebar.getByText(cpuLabel, { exact: true }).first();

    await expect(cpuCheckbox).toBeVisible();
    await expect(cpuFilterText).toBeVisible();

    if (!(await cpuCheckbox.isChecked())) {
      await this.page.evaluate(() => {
        window.__cfRLUnblockHandlers = true;
      });
      await Promise.all([
        this.page.waitForURL(/\/notebooks\?.*specs=\d+/),
        cpuFilterText.click(),
      ]);
    }

    const specsValue = new URL(this.page.url()).searchParams.get("specs");
    if (specsValue) {
      await this.page.goto(`${origin}/notebooks?specs=${encodeURIComponent(specsValue)}`, {
        waitUntil: "domcontentloaded",
      });
    }
    await expect(cpuCheckbox).toBeChecked();

    const productTitleLinks = this.page.locator("main .product-grid .item-box .product-title a");
    await expect(productTitleLinks.first()).toBeVisible();
    const links = await productTitleLinks.evaluateAll((elements) =>
      elements.map((link) => link.href).filter(Boolean),
    );
    return [...new Set(links)];
  }

  async openProductByName(productName) {
    await this.page.getByRole("link", { name: productName, exact: true }).click();
  }

  async expectProductDetails(productName, expectedUrl) {
    await expect(this.page).toHaveURL(expectedUrl);
    await expect(this.page.getByRole("heading", { name: productName })).toBeVisible();
  }

  async expectProductPageBasics() {
    await expect(this.page.getByText("$").first()).toBeVisible();
    await expect(this.page.getByText("$", { exact: false }).first()).toContainText("$");
    await expect(this.page.locator(".short-description")).toBeVisible();
    const addToCartButton = this.main
      .getByRole("button", { name: "Add to cart", exact: true })
      .first();
    await expect(addToCartButton).toBeVisible();
    await expect(addToCartButton).toBeEnabled();
  }

  async goToWishlist(baseUrl) {
    await expect(async () => {
      await this.page.goto(`${baseUrl}wishlist`, {
        waitUntil: "domcontentloaded",
      });
      await expect(this.page).toHaveURL(`${baseUrl}wishlist`);
      await expect(
        this.page.getByRole("heading", { name: "Wishlist", exact: true }),
      ).toBeVisible();
    }).toPass({ timeout: 20000 });
  }

  async ensureWishlistIsEmpty() {
    for (let i = 0; i < 10; i++) {
      if (await this.emptyWishlistMessage.isVisible().catch(() => false)) {
        return;
      }

      const removeButtons = this.page.getByRole("button", {
        name: "Remove",
        exact: true,
      });

      if ((await removeButtons.count()) === 0) {
        break;
      }

      await removeButtons.first().click();
      const removedByButton = await expect
        .poll(async () => {
          const emptyVisible = await this.emptyWishlistMessage.isVisible().catch(() => false);
          const hasRemoveButtons = (await removeButtons.count()) > 0;
          return emptyVisible || !hasRemoveButtons;
        })
        .toBeTruthy()
        .then(() => true)
        .catch(() => false);

      if (!removedByButton) {
        const updateWishlistButton = this.page.getByRole("button", {
          name: "Update wishlist",
          exact: true,
        });
        if (await updateWishlistButton.isVisible().catch(() => false)) {
          await updateWishlistButton.click({ timeout: 5000 });
        }
      }
    }

    await expect(this.emptyWishlistMessage).toBeVisible();
  }

  async addCurrentProductToWishlist() {
    const addToWishlistButton = this.main
      .getByRole("button", { name: "Add to wishlist", exact: true })
      .first();

    await expect(addToWishlistButton).toBeEnabled();

    const barNotification = this.page.locator("#bar-notification");
    await expect(async () => {
      await addToWishlistButton.click();
      await expect(barNotification).toContainText(
        "The product has been added to your wishlist",
      );
      await expect(this.wishlistLink).not.toContainText("(0)");
    }).toPass({ timeout: 20000 });
  }

  async openWishlistFromHeader(baseUrl) {
    await this.wishlistLink.click();
    await expect(this.page).toHaveURL(`${baseUrl}wishlist`);
  }

  getWishlistRowByProductName(productName) {
    return this.page.getByRole("row").filter({
      has: this.page.getByRole("link", { name: productName, exact: true }),
    });
  }

  async removeProductFromWishlist(productName) {
    const row = this.getWishlistRowByProductName(productName);
    const isRemovedOrEmpty = async () => {
      const rowCount = await row.count();
      const emptyVisible = await this.emptyWishlistMessage.isVisible().catch(() => false);
      return rowCount === 0 || emptyVisible;
    };

    await expect(row).toBeVisible();
    await this.page.evaluate(() => {
      window.__cfRLUnblockHandlers = true;
    });
    await row.getByRole("button", { name: "Remove", exact: true }).click();

    const removedByButton = await expect
      .poll(isRemovedOrEmpty, { timeout: 10000 })
      .toBeTruthy()
      .then(() => true)
      .catch(() => false);

    if (!removedByButton) {
      const updateWishlistButton = this.page.getByRole("button", {
        name: "Update wishlist",
        exact: true,
      });
      await expect(updateWishlistButton).toBeVisible();

      await expect(async () => {
        await this.page.evaluate(() => {
          window.__cfRLUnblockHandlers = true;
        });
        await updateWishlistButton.click({ timeout: 5000 });
        await expect.poll(isRemovedOrEmpty, { timeout: 10000 }).toBeTruthy();
      }).toPass({ timeout: 20000 });
    }

    await expect.poll(isRemovedOrEmpty, { timeout: 10000 }).toBeTruthy();
    await expect(this.emptyWishlistMessage).toBeVisible();
  }
}

module.exports = { CatalogPage };
