class HomePage {
  constructor(page) {
    this.page = page;
    this.registerLink = page.getByRole("link", { name: "Register", exact: true });
    this.loginLink = page.getByRole("link", { name: "Log in", exact: true });
  }

  async open(baseUrl) {
    await this.page.goto(baseUrl);
  }

  async clearStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  async openRegister() {
    await this.registerLink.click();
  }

  async openLogin() {
    await this.loginLink.click();
  }
}

module.exports = { HomePage };
