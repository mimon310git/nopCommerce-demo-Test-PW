# nopCommerce Test Scenarios

## TS-01 Register Account (US-01)

**Preconditions**

- Clear localStorage and sessionStorage
- User is not logged in
- Start URL: https://demo.nopcommerce.com/

| #   | Test Step            | Test Data                                                                                                              | Expected Result                                          |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | Open Register page   | Header link: Register                                                                                                  | Register page is displayed                               |
| 2   | Fill required fields | First name: John; Last name: User; Email: qa+{timestamp}@mail.com; Company: Testers; Password: Password123!; Confirm: Password123! | Fields are accepted; no required field errors            |
| 3   | Submit registration  | Button: Register                                                                                                       | URL contains /registerresult; success message is visible |

## TS-02 Login To Account (US-02)

**Preconditions**

- Clear localStorage and sessionStorage
- Existing user credentials available
- Start URL: https://demo.nopcommerce.com/

| #   | Test Step        | Test Data                                      | Expected Result                    |
| --- | ---------------- | ---------------------------------------------- | ---------------------------------- |
| 1   | Open Login page  | Header link: Log in                            | Login page is displayed            |
| 2   | Fill credentials | Email: example@ex.com; Password: Password123!  | Fields are accepted                |
| 3   | Submit login     | Button: Log in                                 | My account and Log out are visible |

## TS-03 Add Product To Cart (US-03)

**Preconditions**

- Clear localStorage and sessionStorage
- Start URL: https://demo.nopcommerce.com/

| #   | Test Step            | Test Data           | Expected Result                                       |
| --- | -------------------- | ------------------- | ----------------------------------------------------- |
| 1   | Search product       | Search: Laptop      | Matching product list is displayed                    |
| 2   | Open product details | Product: Asus Laptop| Product details page is displayed                     |
| 3   | Add to cart          | Button: Add to cart | Success notification is visible; cart count increases |

## TS-04 Complete Checkout (US-04)

**Preconditions**

- Clear localStorage and sessionStorage
- Cart contains at least one item

| #   | Test Step                     | Test Data                                                                                                                                                     | Expected Result                    |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | Open cart                     | Header link: Shopping cart                                                                                                                                    | Cart page is displayed             |
| 2   | Start checkout                | Terms checkbox: checked; Button: Checkout                                                                                                                     | Checkout flow starts               |
| 3   | Fill required checkout fields | First: John; Last: Smith; Email: guest+{timestamp}@mail.com; Country: United States of America; State: New York; City: New York; Address: 1 Main St; Zip: 10001; Phone: 1234567890 | Required fields are accepted       |
| 4   | Confirm order                 | Button: Confirm                                                                                                                                               | Order success message is displayed |

## TS-05 Sort Products (US-05)

**Preconditions**

- Clear localStorage and sessionStorage
- Open category listing

| #   | Test Step             | Test Data                      | Expected Result                          |
| --- | --------------------- | ------------------------------ | ---------------------------------------- |
| 1   | Open category listing | Category: Notebooks            | Product listing is displayed             |
| 2   | Apply sorting         | Sort option: Price Low to High | Product order changes to ascending price |
| 3   | Verify selected sort  | Sort dropdown value            | Selected option remains visible          |

## TS-06 Filter Products By CPU (US-06)

**Preconditions**

- Clear localStorage and sessionStorage
- Open category with CPU filters

| #   | Test Step         | Test Data                              | Expected Result                                              |
| --- | ----------------- | -------------------------------------- | ------------------------------------------------------------ |
| 1   | Open listing      | Category: Notebooks                    | Product listing is displayed                                 |
| 2   | Apply CPU filter  | CPU Type: Intel Core i5                | Product list updates and only i5-matching products are shown |
| 3   | Change CPU filter | CPU Type: Intel Core i7 (i5 unchecked) | Product list updates and only i7-matching products are shown |

## TS-07 View Product Details (US-07)

**Preconditions**

- Clear localStorage and sessionStorage
- Start URL: home page

| #   | Test Step                 | Test Data                               | Expected Result                           |
| --- | ------------------------- | --------------------------------------- | ----------------------------------------- |
| 1   | Open product from listing | Product: Lenovo Thinkpad Carbon Laptop  | Product detail page is displayed          |
| 2   | Verify key details        | Name, price, short description          | Product information is visible            |
| 3   | Verify purchase action    | Button: Add to cart                     | Add to cart button is visible and enabled |

## TS-08 Add And Remove Wishlist Item (US-08)

**Preconditions**

- Clear localStorage and sessionStorage
- Start URL: home or category page

| #   | Test Step            | Test Data                         | Expected Result                   |
| --- | -------------------- | --------------------------------- | --------------------------------- |
| 1   | Open product details | Product: Asus Laptop              | Product page is displayed         |
| 2   | Add to wishlist      | Button: Add to wishlist           | Success notification is displayed |
| 3   | Open wishlist        | Header link: Wishlist             | Added product is visible          |
| 4   | Remove from wishlist | Remove button / Update wishlist   | Product is removed from wishlist  |

## TS-09 Update Cart Quantity (US-09)

**Preconditions**

- Clear localStorage and sessionStorage
- Cart contains one product

| #   | Test Step       | Test Data                    | Expected Result                           |
| --- | --------------- | ---------------------------- | ----------------------------------------- |
| 1   | Open cart page  | Header link: Shopping cart   | Cart page is displayed                    |
| 2   | Change quantity | Quantity: current + 1        | Quantity input is updated                 |
| 3   | Apply update    | Button: Update shopping cart | Totals are recalculated; updated quantity stays visible |

## TS-10 Validate Required Fields (US-10)

**Preconditions**

- Clear localStorage and sessionStorage
- Open Register page

| #   | Test Step              | Test Data                                        | Expected Result                                    |
| --- | ---------------------- | ------------------------------------------------ | -------------------------------------------------- |
| 1   | Submit empty form      | Button: Register                                 | Required field validation messages are displayed   |
| 2   | Enter invalid email    | Email: qa-at-mail.com                            | Invalid email validation is displayed              |
| 3   | Correct invalid fields | Email: qa+{timestamp}@mail.com + required fields | Validation messages disappear; form is submittable |
