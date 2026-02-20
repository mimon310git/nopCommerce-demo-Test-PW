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
    await this.page.goto(`${new URL(this.page.url()).origin}/notebooks`);

    const cpuCheckbox = this.page
      .getByRole("complementary")
      .getByRole("checkbox", { name: cpuLabel, exact: true })
      .first();

    await expect(cpuCheckbox).toBeVisible();
    if (!(await cpuCheckbox.isChecked())) {
      await cpuCheckbox.check();
    }
    await expect(cpuCheckbox).toBeChecked();
    await this.page.waitForLoadState("networkidle");

    const productCards = this.page.getByRole("article");
    const count = await productCards.count();
    const productLinks = [];

    for (let i = 0; i < count; i++) {
      const href = await productCards
        .nth(i)
        .getByRole("link")
        .first()
        .getAttribute("href");

      if (href) {
        productLinks.push(new URL(href, this.page.url()).toString());
      }
    }

    return productLinks;
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
    await this.page.goto(`${baseUrl}wishlist`);
    await this.page.waitForLoadState("networkidle");
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
      await this.page.waitForLoadState("networkidle");
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
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(row).toHaveCount(0);
    await expect(this.emptyWishlistMessage).toBeVisible();
  }
}

module.exports = { CatalogPage };
