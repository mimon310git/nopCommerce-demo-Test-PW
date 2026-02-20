# Demo Full Test - nopCommerce E2E

This repository contains FE E2E tests for nopCommerce demo using Playwright and Page Object Model (POM).

## 1. Requirements

- Node.js: 18+ (recommended 20 LTS)
- npm: 9+
- OS: Windows/macOS/Linux
- Browsers for Playwright: Chromium, Firefox, WebKit

Verify local setup:

```bash
node -v
npm -v
```

## 2. Install Dependencies

```bash
npm install
npx playwright install
```

## 3. Project Structure

- `tests/nopcommerce/*.spec.js` - original scenario specs
- `tests/nopcommerce/TestPOM.spec.js` - consolidated positive POM suite (TS-01..TS-10)
- `tests/nopcommerce/NegativePOM.spec.js` - consolidated negative POM suite (NTS-01..NTS-08)
- `tests/nopcommerce/pages/*.js` - page objects
- `tests/nopcommerce/fixtures/testData.json` - test data
- `docs/nopcommerce/*` - user stories and test scenarios

## 4. Run Tests

Run all tests:

```bash
npm test
```

Run only positive POM suite:

```bash
npm run test:pom
```

Run only positive POM suite on Chromium:

```bash
npm run test:pom:chromium
```

Run only negative POM suite:

```bash
npm run test:negative
```

Run only negative POM suite on Chromium:

```bash
npm run test:negative:chromium
```

List discovered tests:

```bash
npm run test:list
```

## 5. Reporting

The Playwright config uses HTML reporter.

Generate HTML report by running tests:

```bash
npm run report:html
```

Open latest HTML report:

```bash
npm run report:open
```

Generate JSON report file:

```bash
npm run report:json
```

Output location:

- HTML report: `playwright-report/`
- JSON report: `test-results/report.json`

## 6. Determinism and Clean State

Each test suite starts with clean client state by clearing:

- `localStorage`
- `sessionStorage`

This keeps test runs repeatable in FE-only mode.

## 7. Useful Notes

- Tests target: `https://demo.nopcommerce.com/`
- Data is stored only in browser/session context for FE test preconditions.
- Dynamic values (e.g., email) are generated with timestamp to avoid collisions.

## 8. Quick Commands

```bash
npm test
npm run test:pom
npm run test:negative
npm run report:open
```
