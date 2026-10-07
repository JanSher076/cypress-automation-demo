# SauceDemo Cypress E2E Automation

Automated end-to-end tests for [Sauce Demo](https://www.saucedemo.com/) covering the critical purchase flow and known quality issues.

**Account used:** `standard_user` / `secret_sauce`

---

## What this suite covers

| # | Test | Purpose |
|---|------|---------|
| 1 | Happy path purchase | Login → Add product → Checkout → Confirm order |
| 2 | Whitespace-only form fields | Verifies that pure spaces in First/Last/Zip are rejected |
| 3 | Empty cart checkout | Verifies that an empty cart cannot complete an order |
| 4 | Floating-point total | Verifies clean currency display when adding 4 items |
| 5 | URL step bypass | Verifies that direct access to checkout-step-two is blocked |

Tests 2–5 are written against the **correct expected behaviour**. They currently fail and act as living documentation of the defects until the application is fixed.

---

## Prerequisites

- Node.js 18+
- npm

---

## Setup

```bash
npm install



# Interactive mode (recommended while developing)
npx cypress open

# Headless run (CI / quick check)
npx cypress run

# Headed run from terminal
npx cypress run --headed



saucedemo-cypress/
├── cypress.config.js
├── package.json
├── README.md
└── cypress/
    └── e2e/
        └── checkout.cy.js


Known limitations

Does not yet automate LocalStorage cart manipulation
Relies on the public SauceDemo environment remaining available
Single user account and focused product set
No visual / accessibility / performance assertions


Tech stack

Cypress
JavaScript
VS Code (recommended)
