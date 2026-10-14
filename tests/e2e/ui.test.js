/**
 * E2E / COMPONENT TEST SUITE — UI Behaviour & Accessibility
 *
 * File: tests/e2e/ui.test.js
 *
 * What we are testing:
 *   The DOM behaviour of the Ticket QR Code Generator Worker UI.
 *   We use jsdom (configured in vitest.config.js) to simulate the browser
 *   and manually build DOM structures that mirror what the real components
 *   will render.  No UI framework code is required — only the contracts.
 *
 * Requirements covered:
 *   - User Story: Interface is accessible and usable
 *   - Empty State: Show "No data found" — never a blank screen
 *   - Invalid Inputs: Highlight offending fields in red, prevent submission
 *   - Loading State: Visual loading indicator during async ops
 *   - Accessibility (a11y): ARIA labels, keyboard navigation
 *   - Design System: monochromatic, consistent spacing
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// ─── jsdom DOM setup helpers ────────────────────────────────────────────────
/**
 * Builds the canonical markup skeleton that the real component must produce.
 * Replace this with actual component render calls once implemented.
 */
function buildFormDOM() {
  document.body.innerHTML = `
    <main id="app" role="main" aria-label="Ticket QR Code Generator Worker">

      <!-- ── Header ─────────────────────────────────── -->
      <header>
        <h1 id="app-title">Ticket QR Code Generator Worker</h1>
      </header>

      <!-- ── Loading Indicator ──────────────────────── -->
      <div
        id="loading-indicator"
        role="status"
        aria-live="polite"
        aria-label="Loading, please wait"
        aria-hidden="true"
        data-testid="loading-indicator"
        style="display:none"
      >
        <span class="spinner" aria-hidden="true"></span>
        <span class="loading-text">Loading…</span>
      </div>

      <!-- ── Empty State ────────────────────────────── -->
      <div
        id="empty-state"
        data-testid="empty-state"
        role="alert"
        aria-live="polite"
        style="display:none"
      >
        <p>No data found. Please try a different search or create a new ticket.</p>
      </div>

      <!-- ── Ticket Form ────────────────────────────── -->
      <form
        id="ticket-form"
        novalidate
        aria-labelledby="app-title"
        data-testid="ticket-form"
      >

        <!-- Ticket ID -->
        <div class="field-group" data-testid="field-ticketId">
          <label for="ticketId">Ticket ID <span aria-hidden="true">*</span></label>
          <input
            type="text"
            id="ticketId"
            name="ticketId"
            aria-required="true"
            aria-describedby="ticketId-error"
            placeholder="e.g. TKT-2024-001"
            autocomplete="off"
          />
          <span id="ticketId-error" role="alert" class="field-error" aria-live="assertive" style="display:none">
            Ticket ID is required.
          </span>
        </div>

        <!-- Event Name -->
        <div class="field-group" data-testid="field-eventName">
          <label for="eventName">Event Name <span aria-hidden="true">*</span></label>
          <input
            type="text"
            id="eventName"
            name="eventName"
            aria-required="true"
            aria-describedby="eventName-error"
            placeholder="e.g. Prodesk Annual Summit"
          />
          <span id="eventName-error" role="alert" class="field-error" aria-live="assertive" style="display:none">
            Event Name is required.
          </span>
        </div>

        <!-- Holder Name -->
        <div class="field-group" data-testid="field-holderName">
          <label for="holderName">Holder Name <span aria-hidden="true">*</span></label>
          <input
            type="text"
            id="holderName"
            name="holderName"
            aria-required="true"
            aria-describedby="holderName-error"
            placeholder="e.g. Alice Johnson"
          />
          <span id="holderName-error" role="alert" class="field-error" aria-live="assertive" style="display:none">
            Holder Name is required.
          </span>
        </div>

        <!-- Seat Number -->
        <div class="field-group" data-testid="field-seatNumber">
          <label for="seatNumber">Seat Number <span aria-hidden="true">*</span></label>
          <input
            type="text"
            id="seatNumber"
            name="seatNumber"
            aria-required="true"
            aria-describedby="seatNumber-error"
            placeholder="e.g. A-12"
          />
          <span id="seatNumber-error" role="alert" class="field-error" aria-live="assertive" style="display:none">
            Seat Number is required.
          </span>
        </div>

        <!-- Issue Date -->
        <div class="field-group" data-testid="field-issueDate">
          <label for="issueDate">Issue Date <span aria-hidden="true">*</span></label>
          <input
            type="date"
            id="issueDate"
            name="issueDate"
            aria-required="true"
            aria-describedby="issueDate-error"
          />
          <span id="issueDate-error" role="alert" class="field-error" aria-live="assertive" style="display:none">
            Issue Date is required.
          </span>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          id="submit-btn"
          aria-label="Generate QR Code for ticket"
          data-testid="submit-btn"
        >
          Generate QR Code
        </button>

      </form>

      <!-- ── QR Result Area ─────────────────────────── -->
      <section
        id="qr-result"
        aria-label="Generated QR Code"
        data-testid="qr-result"
        style="display:none"
      >
        <img id="qr-image" alt="QR Code for the ticket" src="" />
        <p id="qr-ticket-id" aria-live="polite"></p>
      </section>

    </main>
  `;
}

beforeEach(() => buildFormDOM());
afterEach(() => { document.body.innerHTML = ''; });

// ═══════════════════════════════════════════════════════════════════
// SUITE 1 — Structural Integrity: Required Elements Exist
// ═══════════════════════════════════════════════════════════════════
describe('UI Structure — Required Elements', () => {
  it('should render a <main> landmark with the correct aria-label', () => {
    const main = document.querySelector('main[aria-label="Ticket QR Code Generator Worker"]');
    expect(main).not.toBeNull();
  });

  it('should render the primary heading', () => {
    const h1 = document.querySelector('h1#app-title');
    expect(h1).not.toBeNull();
    expect(h1.textContent).toContain('Ticket QR Code Generator Worker');
  });

  it('should render the ticket form with a novalidate attribute', () => {
    const form = document.querySelector('form#ticket-form');
    expect(form).not.toBeNull();
    expect(form).toHaveAttribute('novalidate');
  });

  it('should render a submit button with an aria-label', () => {
    const btn = document.querySelector('#submit-btn');
    expect(btn).not.toBeNull();
    expect(btn).toHaveAttribute('aria-label');
    expect(btn.getAttribute('aria-label').length).toBeGreaterThan(0);
  });

  it('should render the loading indicator (initially hidden)', () => {
    const loader = document.querySelector('[data-testid="loading-indicator"]');
    expect(loader).not.toBeNull();
    expect(loader.style.display).toBe('none');
  });

  it('should render the empty state container (initially hidden)', () => {
    const emptyState = document.querySelector('[data-testid="empty-state"]');
    expect(emptyState).not.toBeNull();
    expect(emptyState.style.display).toBe('none');
  });

  it('should render the QR result section (initially hidden)', () => {
    const result = document.querySelector('[data-testid="qr-result"]');
    expect(result).not.toBeNull();
    expect(result.style.display).toBe('none');
  });
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 2 — Accessibility (a11y)
// NFR: 100% Lighthouse a11y score
// ═══════════════════════════════════════════════════════════════════
describe('Accessibility — ARIA & Labelling', () => {
  const FIELDS = ['ticketId', 'eventName', 'holderName', 'seatNumber', 'issueDate'];

  FIELDS.forEach((fieldId) => {
    it(`<input #${fieldId}> should have a matching <label> element`, () => {
      const input = document.getElementById(fieldId);
      const label = document.querySelector(`label[for="${fieldId}"]`);
      expect(input).not.toBeNull();
      expect(label).not.toBeNull();
    });

    it(`<input #${fieldId}> should carry aria-required="true"`, () => {
      const input = document.getElementById(fieldId);
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it(`<input #${fieldId}> should reference an error span via aria-describedby`, () => {
      const input = document.getElementById(fieldId);
      const describedById = input.getAttribute('aria-describedby');
      expect(describedById).toBeTruthy();
      const errorEl = document.getElementById(describedById);
      expect(errorEl).not.toBeNull();
    });
  });

  it('should render the loading indicator with role="status"', () => {
    const loader = document.querySelector('[data-testid="loading-indicator"]');
    expect(loader).toHaveAttribute('role', 'status');
  });

  it('should render the loading indicator with aria-live="polite"', () => {
    const loader = document.querySelector('[data-testid="loading-indicator"]');
    expect(loader).toHaveAttribute('aria-live', 'polite');
  });

  it('should render the empty state with role="alert"', () => {
    const emptyState = document.querySelector('[data-testid="empty-state"]');
    expect(emptyState).toHaveAttribute('role', 'alert');
  });

  it('should render the QR image with a non-empty alt attribute', () => {
    const img = document.querySelector('#qr-image');
    expect(img).not.toBeNull();
    expect(img.getAttribute('alt')).not.toBe('');
  });

  it('all form fields should be focusable (not disabled or hidden)', () => {
    const inputs = document.querySelectorAll('form input');
    inputs.forEach((input) => {
      expect(input.disabled).toBe(false);
      expect(input.type).not.toBe('hidden');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 3 — Invalid Input UI Behaviour
// NFR: Prevent submission, highlight offending fields in red
// ═══════════════════════════════════════════════════════════════════
describe('UI Behaviour — Invalid Input Handling', () => {
  /**
   * Simulates what the form controller must do when validation fails.
   * The real controller logic will replace these manual DOM manipulations.
   */
  function simulateValidationError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorSpan = document.getElementById(`${fieldId}-error`);
    // Contract: controller must add class "error" and show the error span
    input.classList.add('error');
    input.setAttribute('aria-invalid', 'true');
    errorSpan.style.display = 'block';
  }

  it('should add class "error" to an input when validation fails', () => {
    simulateValidationError('ticketId');
    const input = document.getElementById('ticketId');
    expect(input.classList.contains('error')).toBe(true);
  });

  it('should set aria-invalid="true" on a failed input', () => {
    simulateValidationError('ticketId');
    const input = document.getElementById('ticketId');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should make the error message span visible when validation fails', () => {
    simulateValidationError('eventName');
    const errorSpan = document.getElementById('eventName-error');
    expect(errorSpan.style.display).toBe('block');
  });

  it('the error span must contain a non-empty human-readable message', () => {
    const errorSpan = document.getElementById('ticketId-error');
    expect(errorSpan.textContent.trim().length).toBeGreaterThan(0);
  });

  it('should NOT navigate / submit the form when required fields are empty', () => {
    const form = document.querySelector('form#ticket-form');
    let submitted = false;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Controller validation fires; form should NOT progress if fields are empty
      const ticketId = document.getElementById('ticketId').value;
      if (!ticketId) {
        submitted = false;
        return;
      }
      submitted = true;
    });

    // Dispatch submit with empty fields
    form.dispatchEvent(new Event('submit'));
    expect(submitted).toBe(false);
  });

  it('should allow submission when all fields are valid', () => {
    const form = document.querySelector('form#ticket-form');
    let submitted = false;

    // Fill in all fields
    document.getElementById('ticketId').value = 'TKT-001';
    document.getElementById('eventName').value = 'Summit';
    document.getElementById('holderName').value = 'Alice';
    document.getElementById('seatNumber').value = 'A-1';
    document.getElementById('issueDate').value = '2024-10-01';

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitted = true;
    });

    form.dispatchEvent(new Event('submit'));
    expect(submitted).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 4 — Loading Indicator Visibility
// Unhappy Path: bad connectivity → must show a visual loader
// ═══════════════════════════════════════════════════════════════════
describe('UI Behaviour — Loading State', () => {
  function showLoader() {
    const loader = document.querySelector('[data-testid="loading-indicator"]');
    loader.style.display = 'flex';
    loader.setAttribute('aria-hidden', 'false');
  }

  function hideLoader() {
    const loader = document.querySelector('[data-testid="loading-indicator"]');
    loader.style.display = 'none';
    loader.setAttribute('aria-hidden', 'true');
  }

  it('should be hidden before any async operation starts', () => {
    const loader = document.querySelector('[data-testid="loading-indicator"]');
    expect(loader.style.display).toBe('none');
  });

  it('should become visible when an async operation begins', () => {
    showLoader();
    const loader = document.querySelector('[data-testid="loading-indicator"]');
    expect(loader.style.display).not.toBe('none');
  });

  it('should set aria-hidden="false" while loading so screen readers announce it', () => {
    showLoader();
    const loader = document.querySelector('[data-testid="loading-indicator"]');
    expect(loader).toHaveAttribute('aria-hidden', 'false');
  });

  it('should be hidden again after the async operation completes', () => {
    showLoader();
    hideLoader();
    const loader = document.querySelector('[data-testid="loading-indicator"]');
    expect(loader.style.display).toBe('none');
  });

  it('should contain visible text describing the loading state', () => {
    const loader = document.querySelector('[data-testid="loading-indicator"]');
    const textEl = loader.querySelector('.loading-text');
    expect(textEl).not.toBeNull();
    expect(textEl.textContent.trim().length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 5 — Empty State
// Unhappy Path: "do not show a blank screen"
// ═══════════════════════════════════════════════════════════════════
describe('UI Behaviour — Empty State', () => {
  function showEmptyState() {
    const emptyState = document.querySelector('[data-testid="empty-state"]');
    emptyState.style.display = 'block';
  }

  it('should show the empty state container when there is no data', () => {
    showEmptyState();
    const emptyState = document.querySelector('[data-testid="empty-state"]');
    expect(emptyState.style.display).not.toBe('none');
  });

  it('should display a user-friendly "No data found" message', () => {
    const emptyState = document.querySelector('[data-testid="empty-state"]');
    expect(emptyState.textContent).toMatch(/no data found/i);
  });

  it('should not show both the empty state and the QR result simultaneously', () => {
    showEmptyState();
    const emptyState = document.querySelector('[data-testid="empty-state"]');
    const qrResult = document.querySelector('[data-testid="qr-result"]');
    // Both cannot be visible at the same time
    const bothVisible =
      emptyState.style.display !== 'none' && qrResult.style.display !== 'none';
    expect(bothVisible).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 6 — Design System Constraints
// NFR: Monochromatic, consistent 16px/32px padding steps
// ═══════════════════════════════════════════════════════════════════
describe('Design System — DOM Structure Constraints', () => {
  it('each form field should be wrapped in a .field-group container', () => {
    const fieldGroups = document.querySelectorAll('.field-group');
    expect(fieldGroups.length).toBeGreaterThanOrEqual(5); // one per required field
  });

  it('each .field-group should contain exactly one <label> and one <input>', () => {
    const fieldGroups = document.querySelectorAll('.field-group');
    fieldGroups.forEach((group) => {
      expect(group.querySelectorAll('label').length).toBe(1);
      expect(group.querySelectorAll('input').length).toBe(1);
    });
  });

  it('each .field-group should contain an error span with class "field-error"', () => {
    const fieldGroups = document.querySelectorAll('.field-group');
    fieldGroups.forEach((group) => {
      const errorSpan = group.querySelector('.field-error');
      expect(errorSpan).not.toBeNull();
    });
  });

  it('error spans must use role="alert" for immediate screen reader announcement', () => {
    const errorSpans = document.querySelectorAll('.field-error');
    errorSpans.forEach((span) => {
      expect(span).toHaveAttribute('role', 'alert');
    });
  });

  it('the QR result section should have a descriptive aria-label', () => {
    const section = document.querySelector('[data-testid="qr-result"]');
    expect(section).toHaveAttribute('aria-label');
    expect(section.getAttribute('aria-label').length).toBeGreaterThan(0);
  });
});
