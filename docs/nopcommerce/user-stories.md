# nopCommerce User Stories

## US-01 Register Account

**User Story**
As a visitor, I want to create an account, so that I can place orders and track them.

**Acceptance Criteria**
- User can open Register page from header navigation.
- User can fill all required registration fields.
- Registration is successful with a valid unique email.
- My account and Log out links are visible after registration.

## US-02 Login To Account

**User Story**
As a registered user, I want to log in to my account, so that I can access my profile and orders.

**Acceptance Criteria**
- User can open Login page from header navigation.
- User can submit valid credentials.
- Login is successful and user is authenticated.
- My account and Log out links are visible after login.

## US-03 Add Product To Cart

**User Story**
As a shopper, I want to add a product to cart, so that I can purchase it later.

**Acceptance Criteria**
- User can find and open a product detail page.
- User can add product to cart from detail or listing page.
- Success notification is displayed after adding to cart.
- Cart quantity and cart content are updated correctly.

## US-04 Complete Checkout

**User Story**
As a shopper, I want to complete checkout, so that I can place an order.

**Acceptance Criteria**
- Cart contains at least one product before checkout starts.
- User can agree with terms and proceed to checkout.
- User can fill required checkout fields and continue through steps.
- Order can be confirmed and success message is displayed.

## US-05 Sort Products

**User Story**
As a shopper, I want to sort product listings, so that I can find suitable products faster.

**Acceptance Criteria**
- User can open a category or product listing page.
- User can select a sort option from the sort dropdown.
- Product order is updated according to the selected sort option.
- Selected sort option remains visible after sorting.

## US-06 Filter Products By CPU

**User Story**
As a shopper, I want to filter products by CPU type, so that I can quickly narrow down products matching my hardware preference.

**Acceptance Criteria**
- User can open a category or product listing page.
- User can apply CPU filter Intel Core i5 and the list updates.
- User can change filter to Intel Core i7 and the list updates correctly.
- Selected CPU filter remains visible after filtering.

## US-07 View Product Details

**User Story**
As a shopper, I want to open a product detail page, so that I can review product information before buying.

**Acceptance Criteria**
- User can open product detail page from the listing.
- Product name, price, and main product info are visible.
- Add to cart button is visible on product detail page.
- Breadcrumb or navigation back to listing is visible.

## US-08 Add And Remove Wishlist Item

**User Story**
As a shopper, I want to add and remove products from wishlist, so that I can manage saved items.

**Acceptance Criteria**
- User can add a product to wishlist from listing or product detail page.
- Success notification is displayed after adding to wishlist.
- Wishlist page contains the added product.
- User can remove product from wishlist and it is no longer displayed.

## US-09 Update Cart Quantity

**User Story**
As a shopper, I want to change product quantity in cart, so that I can adjust my order before checkout.

**Acceptance Criteria**
- User can open shopping cart with at least one product.
- User can change product quantity in cart.
- Cart totals are recalculated after quantity update.
- Updated quantity is displayed correctly in cart.

## US-10 Validate Required Fields

**User Story**
As a shopper, I want to see validation messages for required fields, so that I can fix input errors and continue.

**Acceptance Criteria**
- User can open a form with required fields (register, login, checkout).
- Validation message is displayed when a required field is empty.
- Validation message is displayed for invalid email format.
- Validation message disappears after valid input is entered.



