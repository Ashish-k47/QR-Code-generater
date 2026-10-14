# Ticket QR Code Generator Worker — Test Suite

> **Status:** 🔴 All tests intentionally RED (Test-First / TDD — no implementation yet)

---

## Architecture

```
QR Code generater/
├── src/                          # (empty — implementation goes here later)
│   ├── validators/
│   │   └── ticketValidator.js    # stub target
│   ├── api/
│   │   └── qrApiClient.js        # stub target
│   └── analytics/
│       └── telemetry.js          # stub target
│
├── tests/
│   ├── setup.js                  # global test bootstrap (jest-dom matchers)
│   │
│   ├── unit/
│   │   ├── validator.test.js     # input validation + XSS sanitisation
│   │   └── analytics.test.js    # telemetry / console logging
│   │
│   ├── integration/
│   │   └── qrApi.test.js        # API client: happy path + all error states
│   │
│   └── e2e/
│       └── ui.test.js           # DOM / accessibility / empty/loading states
│
├── vitest.config.js
└── package.json
```

---

## Test Coverage Map

| Test File | Requirement Covered | Suites | Tests |
|-----------|---------------------|--------|-------|
| `unit/validator.test.js` | Invalid inputs, XSS security, data shape | 4 | 28 |
| `unit/analytics.test.js` | Telemetry simulation, log format | 4 | 14 |
| `integration/qrApi.test.js` | API errors, empty state, async timing | 4 | 19 |
| `e2e/ui.test.js` | Accessibility, loading, empty state, design system | 6 | 40+ |

---

## Running Tests

```bash
# Run all tests once (CI mode)
npm test

# Watch mode (development)
npm run test:watch

# With coverage report
npm run test:coverage

# By layer
npm run test:unit
npm run test:integration
npm run test:ui
```

---

## TDD Cycle

```
RED  →  tests fail with "NOT_IMPLEMENTED"  ← you are here
GREEN → implement src/ modules to pass tests
REFACTOR → clean up without breaking tests
```

---

## What Each Test Suite Verifies

### `unit/validator.test.js`
- **Happy Path** — valid ticket passes, returns `{ valid: true, data: {...} }`
- **Empty Fields** — every required field individually triggers `{ valid: false, errors: [fieldName] }`
- **Bulk validation** — all 5 empty fields reported at once (no fail-fast)
- **Type errors** — numbers, oversized strings, bad date formats all rejected
- **XSS Sanitisation** — 7 real XSS payloads verified stripped/encoded

### `unit/analytics.test.js`
- **Log format** — `[Analytics]` prefix + "Ticket QR Code Generator Worker" mandatory
- **Event types** — all `ANALYTICS_EVENTS` constants fire without throwing
- **Metadata** — timestamp auto-injected; optional metadata merged
- **Guard rails** — `undefined`/empty event names warn or throw

### `integration/qrApi.test.js`
- **Happy path** — response shape: `{ success, data: { qrCodeDataUrl, ticketId, generatedAt } }`
- **NETWORK_ERROR, TIMEOUT, SERVER_ERROR (500), INVALID_PAYLOAD (400), NOT_FOUND (404)**
- **Empty body** — `success: false`, not a silent null
- **Async contract** — returns a `Promise`, resolves within 8 s on 3G simulation

### `e2e/ui.test.js`
- **Structure** — `<main>` landmark, `<h1>`, form with `novalidate`, all initial hidden states
- **A11y** — label ↔ input binding, `aria-required`, `aria-describedby` → error span, `role="status"`, `role="alert"`, non-empty `alt`
- **Invalid inputs** — `.error` class, `aria-invalid="true"`, error span visible, form blocked
- **Loading** — `display:none` → `flex`, `aria-hidden` toggled, loading text present
- **Empty state** — visible, "No data found" text, mutually exclusive with QR result
- **Design system** — `.field-group` wrappers, one label + one input each, `.field-error` spans

---

## Non-Functional Requirements Traced

| NFR | Test Location |
|-----|--------------|
| Accessibility — 100% Lighthouse | `e2e/ui.test.js` Suite 2 |
| Telemetry — `[Analytics]` console log | `unit/analytics.test.js` |
| Security — XSS sanitisation | `unit/validator.test.js` Suite 4 |
| Invalid input — red highlight + block | `e2e/ui.test.js` Suite 3 |
| Bad connectivity — loading indicator | `e2e/ui.test.js` Suite 4 |
| Empty state — "No data found" | `e2e/ui.test.js` Suite 5, `integration/qrApi.test.js` Suite 3 |
| Consistent data shape | `integration/qrApi.test.js` Suite 1 |
| Async timing (3G) | `integration/qrApi.test.js` Suite 4 |
| Design system — spacing/structure | `e2e/ui.test.js` Suite 6 |
