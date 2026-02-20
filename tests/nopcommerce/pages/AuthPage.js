const { expect } = require("@playwright/test");

class AuthPage {
  constructor(page) {
    this.page = page;
    this.main = page.getByRole("main");
    this.registerLink = page.getByRole("link", { name: "Register", exact: true });
    this.loginLink = page.getByRole("link", { name: "Log in", exact: true });
    this.registerHeading = page.getByRole("heading", {
      name: "Register",
      exact: true,
    });
    this.registerButton = page.getByRole("button", {
      name: "Register",
      exact: true,
    });
    this.loginButton = page.getByRole("button", { name: "Log in", exact: true });
  }

  async openRegister(baseUrl) {
    await this.registerLink.click();
    await expect(this.page).toHaveURL(`${baseUrl}register?returnUrl=%2F`);
    await expect(this.registerHeading).toBeVisible();
  }

  async openLogin(baseUrl) {
    await this.loginLink.click();
    await expect(this.page).toHaveURL(`${baseUrl}login?returnUrl=%2F`);
  }

  async chooseGender(gender) {
    await this.page.getByRole("radio", { name: gender, exact: true }).check();
  }

  async fillRegistrationForm({
    gender,
    firstName,
    lastName,
    email,
    company,
    password,
    confirmPassword,
  }) {
    if (gender) {
      await this.chooseGender(gender);
    }
    if (firstName !== undefined) {
      await this.page.getByLabel("First name:", { exact: true }).fill(firstName);
    }
    if (lastName !== undefined) {
      await this.page.getByLabel("Last name:", { exact: true }).fill(lastName);
    }
    if (email !== undefined) {
      await this.page.getByLabel("Email:", { exact: true }).fill(email);
    }
    if (company !== undefined) {
      await this.page.getByLabel("Company name:", { exact: true }).fill(company);
    }
    if (password !== undefined) {
      await this.page.getByLabel("Password:", { exact: true }).fill(password);
    }
    if (confirmPassword !== undefined) {
      await this.page
        .getByLabel("Confirm password:", { exact: true })
        .fill(confirmPassword);
    }
  }

  async submitRegister() {
    await this.registerButton.click();
  }

  async fillLoginForm({ email, password }) {
    await this.page.getByLabel("Email:", { exact: true }).fill(email);
    await this.page.getByLabel("Password:", { exact: true }).fill(password);
  }

  async submitLogin() {
    await this.loginButton.click();
  }

  async expectRegistrationSuccess() {
    await expect.poll(() => this.page.url()).toContain("registerresult");
    await expect(
      this.page.getByText("Your registration completed", { exact: true }),
    ).toBeVisible();
  }

  async submitEmptyRegisterAndAssertRequiredErrors() {
    await this.submitRegister();

    await expect(
      this.main.getByText("First name is required.", { exact: true }),
    ).toBeVisible();
    await expect(
      this.main.getByText("Last name is required.", { exact: true }),
    ).toBeVisible();
    await expect(
      this.main.getByText("Email is required.", { exact: true }),
    ).toBeVisible();
    await expect(this.main.locator("[data-valmsg-for='ConfirmPassword']")).toContainText(
      "Password is required.",
    );
    await expect
      .poll(async () =>
        this.main.getByText("Password is required.", { exact: true }).count(),
      )
      .toBeGreaterThan(0);
  }

  async expectInvalidEmailValidation() {
    const emailValidation = this.main.locator("[data-valmsg-for='Email']");
    await expect(emailValidation).toBeVisible();
    await expect
      .poll(async () => {
        const text = ((await emailValidation.textContent()) || "").trim();
        return (
          text === "Please enter a valid email address." || text === "Wrong email"
        );
      })
      .toBeTruthy();
  }
}

module.exports = { AuthPage };
