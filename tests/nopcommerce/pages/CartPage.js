const { expect } = require("@playwright/test");

class CartPage {
  constructor(page) {
    this.page = page;
    this.searchBox = page.getByRole("textbox", { name: "Search store" });
    this.searchButton = page.getByRole("button", { name: "Search" });
    this.cartLink = page.getByRole("link", { name: /Shopping cart \(\d+\)/ });
  }

  async addProductFromSearch({ searchKeyword, productName, baseUrl }) {
    await this.searchBox.fill(searchKeyword);
    await this.searchButton.click();
    await expect(this.page).toHaveURL(`${baseUrl}search?q=${searchKeyword}`);

    await this.page
      .getByRole("link", { name: productName, exact: true })
      .click();

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
      await this.page.locator("#add-to-cart-button-5").click();

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
