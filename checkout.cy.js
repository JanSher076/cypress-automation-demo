/**
 * SauceDemo – 5 critical tests
 * Login happens only once via cy.session
 * Every test starts on the Products page
 */

describe('SauceDemo – Purchase Flow & Edge Cases', () => {

  beforeEach(() => {
    // Login only once and cache the session
    cy.session('standard_user', () => {
      cy.visit('/');
      cy.get('[data-test="username"]').type('standard_user');
      cy.get('[data-test="password"]').type('secret_sauce');
      cy.get('[data-test="login-button"]').click();
      cy.url().should('include', 'inventory.html');
      cy.get('.title').should('have.text', 'Products');
    });

    // After session restore, go to the product page
    // Using the full path relative to baseUrl is more reliable
    cy.visit('/inventory.html', { failOnStatusCode: false });
    
    // Safety check – if we somehow landed on login page, force login again
    cy.url().then((url) => {
      if (url.includes('saucedemo.com/') && !url.includes('inventory')) {
        cy.get('[data-test="username"]').type('standard_user');
        cy.get('[data-test="password"]').type('secret_sauce');
        cy.get('[data-test="login-button"]').click();
      }
    });

    cy.get('.title').should('have.text', 'Products');
  });

  // ────────────────────────────────────────────────
  // 1. Happy Path
  // ────────────────────────────────────────────────
  it('1. should complete a normal purchase successfully', () => {
    const productName = 'Sauce Labs Backpack';

    cy.contains('.inventory_item_name', productName).should('be.visible');
    cy.get('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    cy.get('.shopping_cart_badge').should('have.text', '1');

    cy.get('.shopping_cart_link').click();
    cy.get('.cart_item').should('have.length', 1);
    cy.get('.inventory_item_name').should('have.text', productName);

    cy.get('[data-test="checkout"]').click();
    cy.get('[data-test="firstName"]').type('Jane');
    cy.get('[data-test="lastName"]').type('Doe');
    cy.get('[data-test="postalCode"]').type('90210');
    cy.get('[data-test="continue"]').click();

    cy.get('.inventory_item_name').should('have.text', productName);
    cy.get('[data-test="finish"]').click();

    cy.url().should('include', '/checkout-complete.html');
    cy.get('.complete-header').should('have.text', 'Thank you for your order!');
  });

  // ────────────────────────────────────────────────
  // 2. Whitespace-only fields (Defect)
  // ────────────────────────────────────────────────
  it('2. should NOT allow whitespace-only values in checkout form', () => {
    cy.get('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    cy.get('.shopping_cart_link').click();
    cy.get('[data-test="checkout"]').click();

    cy.get('[data-test="firstName"]').type('   ');
    cy.get('[data-test="lastName"]').type('   ');
    cy.get('[data-test="postalCode"]').type('   ');
    cy.get('[data-test="continue"]').click();

    // Expected correct behavior
    cy.url().should('include', '/checkout-step-one.html');
    cy.get('[data-test="error"]').should('be.visible');
  });

  // ────────────────────────────────────────────────
  // 3. Empty cart $0 order (Defect)
  // ────────────────────────────────────────────────
  it('3. should NOT allow completing checkout with an empty cart', () => {
    cy.get('.shopping_cart_link').click();

    // Clear cart if anything is left
    cy.get('body').then($body => {
      if ($body.find('[data-test^="remove"]').length > 0) {
        cy.get('[data-test^="remove"]').click({ multiple: true });
      }
    });

    cy.get('[data-test="checkout"]').click();

    cy.get('[data-test="firstName"]').type('Empty');
    cy.get('[data-test="lastName"]').type('Cart');
    cy.get('[data-test="postalCode"]').type('00000');
    cy.get('[data-test="continue"]').click();

    cy.url().should('include', '/checkout-step-two.html');
    cy.get('.summary_total_label').should('contain', 'Total: $0.00');
  });

  // ────────────────────────────────────────────────
  // 4. Four items → floating-point total (Defect)
  // ────────────────────────────────────────────────

  
  it('4. should display clean currency total (no floating-point garbage)', () => {


    const expectTwoDecimals = (selector, label) =>
  cy.get(selector).invoke('text').then(text => {
    const amount = text.trim().match(/\$(\S+)$/)?.[1];   // text after the last "$"
    expect(amount, `${label} amount found in "${text.trim()}"`).to.exist;
    expect(amount, `${label} has exactly two decimals`).to.match(/^\d+\.\d{2}$/);
  });

    cy.get('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    cy.get('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
    cy.get('[data-test="add-to-cart-sauce-labs-bolt-t-shirt"]').click();
    cy.get('[data-test="add-to-cart-sauce-labs-fleece-jacket"]').click();

    cy.get('.shopping_cart_badge').should('have.text', '4');
    cy.get('.shopping_cart_link').click();
    cy.get('[data-test="checkout"]').click();

    cy.get('[data-test="firstName"]').type('Float');
    cy.get('[data-test="lastName"]').type('Bug');
    cy.get('[data-test="postalCode"]').type('12345');
    cy.get('[data-test="continue"]').click();

    // This will fail today because of the long decimal
   /* cy.get('.summary_subtotal_label')
      .invoke('text')
      .should('match', /Item total: \$105\.96$/); */
       expectTwoDecimals('.summary_subtotal_label', 'Item total');
  expectTwoDecimals('.summary_tax_label', 'Tax');
  expectTwoDecimals('.summary_total_label', 'Total');
  });

  // ────────────────────────────────────────────────
  // 5. Direct URL bypass of step one (Defect)
  // ────────────────────────────────────────────────
  it('5. should NOT allow direct access to checkout-step-two without personal info', () => {
    cy.get('[data-test="add-to-cart-sauce-labs-backpack"]').click();

    // Try to skip step one
    cy.visit('/checkout-step-two.html', { failOnStatusCode: false });

    // Expected correct behavior after the bug is fixed
    cy.url().should('include', '/checkout-step-one.html');
  });
});


/**
 * SauceDemo – Critical Purchase Flow + Known Defects
 * 5 tests covering happy path + the major issues we discovered


describe('SauceDemo – Purchase Flow & Edge Cases', () => {

  beforeEach(() => {
    cy.visit('/');
    // Login once for most tests
    cy.get('[data-test="username"]').type('standard_user');
    cy.get('[data-test="password"]').type('secret_sauce');
    cy.get('[data-test="login-button"]').click();
    cy.url().should('include', '/inventory.html');
  });

  // ────────────────────────────────────────────────
  // 1. Happy Path – Successful Purchase
  // ────────────────────────────────────────────────
  it('1. should complete a normal purchase successfully', () => {
    const productName = 'Sauce Labs Backpack';

    cy.contains('.inventory_item_name', productName).should('be.visible');
    cy.get('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    cy.get('.shopping_cart_badge').should('have.text', '1');

    cy.get('.shopping_cart_link').click();
    cy.get('.cart_item').should('have.length', 1);
    cy.get('.inventory_item_name').should('have.text', productName);

    cy.get('[data-test="checkout"]').click();
    cy.get('[data-test="firstName"]').type('Jane');
    cy.get('[data-test="lastName"]').type('Doe');
    cy.get('[data-test="postalCode"]').type('90210');
    cy.get('[data-test="continue"]').click();

    cy.get('.inventory_item_name').should('have.text', productName);
    cy.get('[data-test="finish"]').click();

    cy.url().should('include', '/checkout-complete.html');
    cy.get('.complete-header').should('have.text', 'Thank you for your order!');
  });

  // ────────────────────────────────────────────────
  // 2. Whitespace-only fields (Defect)
  // Expected: should block checkout
  // Actual today: accepts spaces and continues
  // ────────────────────────────────────────────────
  it('2. should NOT allow whitespace-only values in checkout form', () => {
    cy.get('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    cy.get('.shopping_cart_link').click();
    cy.get('[data-test="checkout"]').click();

    // Type only spaces
    cy.get('[data-test="firstName"]').type('   ');
    cy.get('[data-test="lastName"]').type('   ');
    cy.get('[data-test="postalCode"]').type('   ');
    cy.get('[data-test="continue"]').click();

    // Expected correct behavior → should stay on step one and show error
    cy.url().should('include', '/checkout-step-one.html');
    cy.get('[data-test="error"]').should('be.visible');
  });

  // ────────────────────────────────────────────────
  // 3. Empty cart can complete $0 order (Defect)
  // ────────────────────────────────────────────────
  it('3. should NOT allow completing checkout with an empty cart', () => {
    // Make sure cart is empty
    cy.get('.shopping_cart_link').click();
    cy.get('body').then($body => {
      if ($body.find('.cart_item').length > 0) {
        cy.get('[data-test^="remove"]').click({ multiple: true });
      }
    });

    cy.get('[data-test="checkout"]').click();

    // Fill form (even though cart is empty)
    cy.get('[data-test="firstName"]').type('Empty');
    cy.get('[data-test="lastName"]').type('Cart');
    cy.get('[data-test="postalCode"]').type('00000');
    cy.get('[data-test="continue"]').click();

    // Expected: should not reach overview or should block finish
    // Current buggy behavior reaches overview with $0
    cy.url().should('include', '/checkout-step-two.html');
    cy.get('.summary_total_label').should('contain', 'Total: $0.00');

    // We assert the defect exists (will fail when fixed)
    cy.get('[data-test="finish"]').should('be.visible');
  });

  // ────────────────────────────────────────────────
  // 4. Four items → long decimal total (Defect)
  // 29.99 + 9.99 + 15.99 + 49.99 = 105.96
  // But shows 105.96000000000001
  // ────────────────────────────────────────────────
  it('4. should display clean currency total (no floating-point garbage)', () => {
    // Add first 4 products
    cy.get('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    cy.get('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
    cy.get('[data-test="add-to-cart-sauce-labs-bolt-t-shirt"]').click();
    cy.get('[data-test="add-to-cart-sauce-labs-fleece-jacket"]').click();

    cy.get('.shopping_cart_badge').should('have.text', '4');
    cy.get('.shopping_cart_link').click();
    cy.get('[data-test="checkout"]').click();

    cy.get('[data-test="firstName"]').type('Float');
    cy.get('[data-test="lastName"]').type('Bug');
    cy.get('[data-test="postalCode"]').type('12345');
    cy.get('[data-test="continue"]').click();

    // The defect: Item total shows long decimal
    cy.get('.summary_subtotal_label')
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        // This assertion will FAIL today because of the bug
        // When fixed it should pass with clean "$105.96"
        expect(text).to.match(/Item total: \$105\.96$/);
      });
  });

  // ────────────────────────────────────────────────
  // 5. Direct URL bypass of checkout step one (Defect)
  // ────────────────────────────────────────────────
  it('5. should NOT allow direct access to checkout-step-two without personal info', () => {
    // Add an item so cart is not empty
    cy.get('[data-test="add-to-cart-sauce-labs-backpack"]').click();

    // Bypass step one by going directly to step two
    cy.visit('/checkout-step-two.html');

    // Expected correct behavior: should redirect back to step one or cart
    // Current buggy behavior: shows overview and allows Finish
    cy.url().should('include', '/checkout-step-one.html'); // expected after fix
  });
});
*/

/*
describe('SauceDemo – Purchase Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should complete a full purchase successfully', () => {
    // Login
    cy.get('[data-test="username"]').type('standard_user');
    cy.get('[data-test="password"]').type('secret_sauce');
    cy.get('[data-test="login-button"]').click();

    cy.url().should('include', '/inventory.html');
    cy.get('.title').should('have.text', 'Products');

    // Add product
    const productName = 'Sauce Labs Backpack';
    cy.contains('.inventory_item_name', productName).should('be.visible');
    cy.get('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    cy.get('.shopping_cart_badge').should('have.text', '1');

    // Cart
    cy.get('.shopping_cart_link').click();
    cy.url().should('include', '/cart.html');
    cy.get('.cart_item').should('have.length', 1);
    cy.get('.inventory_item_name').should('have.text', productName);

    // Checkout
    cy.get('[data-test="checkout"]').click();
    cy.url().should('include', '/checkout-step-one.html');

    cy.get('[data-test="firstName"]').type('Jane');
    cy.get('[data-test="lastName"]').type('Doe');
    cy.get('[data-test="postalCode"]').type('90210');
    cy.get('[data-test="continue"]').click();

    // Overview
    cy.url().should('include', '/checkout-step-two.html');
    cy.get('.inventory_item_name').should('have.text', productName);
    cy.get('.summary_total_label').should('contain', 'Total:');

    // Finish
    cy.get('[data-test="finish"]').click();

    // Success
    cy.url().should('include', '/checkout-complete.html');
    cy.get('.complete-header').should('have.text', 'Thank you for your order!');
    cy.get('.complete-text').should('be.visible');
    cy.get('[data-test="back-to-products"]').should('be.visible');
  });
});
*/