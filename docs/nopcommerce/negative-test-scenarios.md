# nopCommerce Negative Test Scenarios

## NTS-01 Login With Invalid Password (US-02)

**Preconditions**
- Clear localStorage and sessionStorage
- Existing user email is available
- Start URL: https://demo.nopcommerce.com/

| # | Test Step | Test Data | Expected Result |
|---|-----------|-----------|-----------------|
| 1 | Open Login page | Header link: Log in | Login page is displayed |
| 2 | Fill credentials | Email: existing_user@mail.com; Password: WrongPass123! | Fields are accepted |
| 3 | Submit login | Button: Log in | Login fails; validation error message is displayed |
| 4 | Verify auth state | Header area | My account link is not visible |

## NTS-02 Register With Existing Email (US-01)

**Preconditions**
- Clear localStorage and sessionStorage
- Existing user email is available
- Start URL: https://demo.nopcommerce.com/

| # | Test Step | Test Data | Expected Result |
|---|-----------|-----------|-----------------|
| 1 | Open Register page | Header link: Register | Register page is displayed |
| 2 | Fill required fields | First name: QA; Last name: User; Email: existing_user@mail.com; Password: Test12345!; Confirm: Test12345! | Fields are accepted |
| 3 | Submit registration | Button: Register | Registration fails; duplicate email error is displayed |

## NTS-03 Register With Password Mismatch (US-01)

**Preconditions**
- Clear localStorage and sessionStorage
- Start URL: https://demo.nopcommerce.com/

| # | Test Step | Test Data | Expected Result |
|---|-----------|-----------|-----------------|
| 1 | Open Register page | Header link: Register | Register page is displayed |
| 2 | Fill required fields | First name: QA; Last name: User; Email: qa+{timestamp}@mail.com; Password: Test12345!; Confirm: Test12345? | Fields are accepted |
| 3 | Submit registration | Button: Register | Validation error for password confirmation is displayed |

## NTS-04 Add Out-Of-Stock Product To Cart (US-03)

**Preconditions**
- Clear localStorage and sessionStorage
- Start URL: https://demo.nopcommerce.com/

| # | Test Step | Test Data | Expected Result |
|---|-----------|-----------|-----------------|
| 1 | Open out-of-stock product details | Product with stock = 0 | Product details page is displayed |
| 2 | Try to add to cart | Button: Add to cart | Product is not added; stock or availability warning is displayed |
| 3 | Verify cart count | Header cart counter | Cart count does not increase |

## NTS-05 Checkout Without Accepting Terms (US-04)

**Preconditions**
- Clear localStorage and sessionStorage
- Cart contains at least one item

| # | Test Step | Test Data | Expected Result |
|---|-----------|-----------|-----------------|
| 1 | Open cart | Header link: Shopping cart | Cart page is displayed |
| 2 | Start checkout without terms | Terms checkbox: unchecked; Button: Checkout | Checkout is blocked |
| 3 | Verify warning | Popup or validation area | Terms of service warning is displayed |

## NTS-06 Checkout With Missing Required Billing Field (US-04)

**Preconditions**
- Clear localStorage and sessionStorage
- Cart contains at least one item
- Checkout flow is opened

| # | Test Step | Test Data | Expected Result |
|---|-----------|-----------|-----------------|
| 1 | Fill billing form with one missing field | City: empty (all others valid) | Form shows missing field validation |
| 2 | Continue checkout | Button: Continue | User cannot proceed to next step |

## NTS-07 Update Cart Quantity To Zero (US-09)

**Preconditions**
- Clear localStorage and sessionStorage
- Cart contains one product

| # | Test Step | Test Data | Expected Result |
|---|-----------|-----------|-----------------|
| 1 | Open cart page | Header link: Shopping cart | Cart page is displayed |
| 2 | Set quantity | Quantity: 0 | Quantity field is updated to 0 |
| 3 | Apply update | Button: Update shopping cart | Item is removed from cart OR validation message is displayed |

## NTS-08 Submit Register Form Empty (US-10)

**Preconditions**
- Clear localStorage and sessionStorage
- Start URL: Register page

| # | Test Step | Test Data | Expected Result |
|---|-----------|-----------|-----------------|
| 1 | Submit empty form | Button: Register | Required field validation messages are displayed |
| 2 | Verify no redirect | URL state | User remains on Register page |