const { expect } = require("@playwright/test");

class CartPage {
  constructor(page) {
    this.page = page;
    this.searchBox = page.getByRole("textbox", { name: "Search store" });
    this.searchButton = page.getByRole("button", { name: "Search" });
    this.cartLink = page
      .getByRole("banner")
      .getByRole("link", { name: "Shopping cart" });
  }

  async addProductFromSearch({ searchKeyword, productName, baseUrl }) {
    await this.searchBox.fill(searchKeyword);
    await this.searchButton.click();
    await expect(this.page).toHaveURL(`${baseUrl}search?q=${searchKeyword}`);

    const productLink = this.page
      .getByRole("main")
      .getByRole("link", { name: productName, exact: true })
      .first();
    await expect(productLink).toBeVisible();
    const productHref = await productLink.getAttribute("href");
    await expect(productHref).toBeTruthy();
    await productLink.click();
    await expect(this.page).toHaveURL(new URL(productHref, baseUrl).toString());

    await expect(
      this.page.getByRole("heading", {
        level: 1,
        name: productName,
        exact: true,
      }),
    ).toBeVisible();

    for (let attempt = 1; attempt <= 3; attempt++) {
      await this.page.evaluate(() => {
        window.__cfRLUnblockHandlers = true;
      });
      await this.page
        .getByRole("main")
        .getByRole("button", { name: "Add to cart", exact: true })
        .first()
        .click();

      try {
        await expect(this.cartLink).not.toContainText("(0)", {
          timeout: 5000,
        });
        return;
      } catch (error) {
        if (attempt === 3) throw error;
      }
    }
  }

  async openCart() {
    const barNotification = this.page.locator("#bar-notification");
    if (await barNotification.isVisible().catch(() => false)) {
      const cartLinkInNotification = barNotification.getByRole("link", {
        name: /shopping cart/i,
      });
      if (await cartLinkInNotification.isVisible().catch(() => false)) {
        await cartLinkInNotification.click();
        return;
      }

      const closeNotification = barNotification.getByText("Close").first();
      if (await closeNotification.isVisible().catch(() => false)) {
        await closeNotification.click({ force: true });
        await barNotification.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
      }
    }

    await this.cartLink.click();
  }

  async expectCartHasItems() {
    await expect(this.cartLink).not.toContainText("(0)", { timeout: 15000 });
  }

  async expectCartCount(countText) {
    await expect(this.cartLink).toContainText(countText);
  }

  async expectProductVisibleInCart(productName) {
    await expect(
      this.page.locator(".cart").getByRole("link", {
        name: productName,
        exact: true,
      }),
    ).toBeVisible();
  }
}

module.exports = { CartPage };
