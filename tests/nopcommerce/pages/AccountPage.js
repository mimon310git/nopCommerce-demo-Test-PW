const { expect } = require("@playwright/test");

class AccountPage {
  constructor(page) {
    this.page = page;
    this.header = page.getByRole("banner");
    this.myAccountLink = this.header.getByRole("link", {
      name: "My account",
      exact: true,
    });
    this.logOutLink = this.header.getByRole("link", {
      name: "Log out",
      exact: true,
    });
  }

  async expectUserIsLoggedIn() {
    await expect(this.myAccountLink).toBeVisible();
    await expect(this.logOutLink).toBeVisible();
  }
}

module.exports = { AccountPage };
