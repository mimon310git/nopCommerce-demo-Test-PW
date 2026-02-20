const { test, expect } = require("@playwright/test");
const user = require("../nopcommerce/fixtures/testData.json");

test.describe("Auth", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(user.baseUrl);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test(" Register Account", async ({ page }) => {
    const reg = user.users.register;
    const uniqueEmail = `qa+${Date.now()}@mail.com`;
    await page.getByRole("link", { name: "Register" }).click();
    await expect(page).toHaveURL(`${user.baseUrl}register?returnUrl=%2F`);
    //fill the registration form
    await page.getByRole("radio", { name: reg.gender, exact: true }).check();
    await page.getByLabel("First name:", { exact: true }).fill(reg.firstName);
    await page.getByLabel("Last name:", { exact: true }).fill(reg.lastName);
    await page.getByLabel("Email:", { exact: true }).fill(uniqueEmail);
    await page.getByLabel("Company name:", { exact: true }).fill(reg.company);
    await page.getByLabel("Password:", { exact: true }).fill(reg.password);
    await page
      .getByLabel("Confirm password:", { exact: true })
      .fill(reg.confirmPassword);
    await page.getByRole("button", { name: "Register" }).click();
    //assertions after registration
    await expect.poll(() => page.url()).toContain("registerresult");
    await expect(
      page.getByText("Your registration completed", { exact: true }),
    ).toHaveText("Your registration completed");
  });

  test("Login To Account", async ({ page }) => {
    const login = user.users.existing;

    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(`${user.baseUrl}login?returnUrl=%2F`);
    //fill the login form
    await page.getByLabel("Email:").fill(login.email);
    await page.getByLabel("Password:").fill(login.password);
    await page.getByRole("button", { name: "Log in" }).click();
    //assertions after login
    const header = page.getByRole("banner");
    await expect(
      header.getByRole("link", { name: "My account", exact: true }),
    ).toBeVisible();
    await expect(
      header.getByRole("link", { name: "Log out", exact: true }),
    ).toBeVisible();
  });

  test.describe("TS-10 Validate Required Fields", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(user.baseUrl);
      await page.getByRole("link", { name: "Register" }).click();
      await expect(
        page.getByRole("heading", { name: "Register", exact: true }),
      ).toBeVisible();
    });

    test("TS-10.1 empty form shows required errors", async ({ page }) => {
      const form = page.getByRole("main");
      await page.getByRole("button", { name: "Register" }).click();

      await expect(
        form.getByText("First name is required.", { exact: true }),
      ).toBeVisible();
      await expect(
        form.getByText("Last name is required.", { exact: true }),
      ).toBeVisible();
      await expect(
        form.getByText("Email is required.", { exact: true }),
      ).toBeVisible();
      await expect(
        form.locator("[data-valmsg-for='ConfirmPassword']"),
      ).toContainText("Password is required.");
      await expect
        .poll(async () =>
          form.getByText("Password is required.", { exact: true }).count(),
        )
        .toBeGreaterThan(0);
    });

    test("TS-10.2 invalid email shows email validation", async ({ page }) => {
      const form = page.getByRole("main");
      const emailInput = page.getByLabel("Email:", { exact: true });
      await page.getByRole("radio", { name: "Male", exact: true }).check();
      await page.getByLabel("First name:", { exact: true }).fill("John");
      await page.getByLabel("Last name:", { exact: true }).fill("User");
      await page.getByLabel("Password:", { exact: true }).fill("Password123!");
      await page
        .getByLabel("Confirm password:", { exact: true })
        .fill("Password123!");
      await emailInput.fill("qa-at-mail.com");
      await page.getByRole("button", { name: "Register" }).click();

      await expect.poll(() => page.url()).toContain("register");
      await expect
        .poll(async () => emailInput.evaluate((input) => input.checkValidity()))
        .toBe(false);
      await expect(
        form.locator("[data-valmsg-for='Email']"),
      ).toHaveCount(1);
      await expect.soft(
        form.locator("[data-valmsg-for='Email']"),
      ).toContainText(/Please enter a valid email address.|Wrong email/i, {
        timeout: 1000,
      });
    });

    test("TS-10.3 corrected fields remove validation messages", async ({
      page,
      browserName,
    }) => {
      const uniqueEmail = `qa+${browserName}-${Date.now()}@mail.com`;

      await page.getByRole("radio", { name: "Male", exact: true }).check();
      await page.getByLabel("First name:", { exact: true }).fill("John");
      await page.getByLabel("Last name:", { exact: true }).fill("User");
      await page.getByLabel("Email:", { exact: true }).fill(uniqueEmail);
      await page.getByLabel("Password:", { exact: true }).fill("Password123!");
      await page
        .getByLabel("Confirm password:", { exact: true })
        .fill("Password123!");

      await page.getByRole("button", { name: "Register" }).click();

      await expect(page).toHaveURL(/\/registerresult/);
      await expect(
        page.getByText("Your registration completed", { exact: true }),
      ).toBeVisible();
    });
  });
});
