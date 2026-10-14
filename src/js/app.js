/**
 * src/js/app.js
 *
 * Application controller for Ticket QR Code Generator Worker.
 *
 * Responsibilities
 *   • Wire DOM events to business logic (validate → generate → display)
 *   • Manage loading / empty / error states
 *   • Delegate to validated modules: ticketValidator, qrApiClient, telemetry
 *   • Fire analytics pings on every primary action
 *   • Sanitize all text inputs before they enter state
 *
 * No framework — pure DOM APIs + ES modules.
 */

import { validateTicketInput, sanitizeInput } from '../validators/ticketValidator.js';
import { generateQrCode, fetchTicketList, QR_API_ERRORS } from '../api/qrApiClient.js';
import { logAnalyticsEvent, ANALYTICS_EVENTS } from '../analytics/telemetry.js';

// ─── DOM References ───────────────────────────────────────────────────────────

const form            = document.getElementById('ticket-form');
const submitBtn       = document.getElementById('submit-btn');
const loadingEl       = document.getElementById('loading-indicator');
const qrResultEl      = document.getElementById('qr-result');
const qrImageEl       = document.getElementById('qr-image');
const qrTicketIdEl    = document.getElementById('qr-ticket-id');
const qrMetaBodyEl    = document.getElementById('qr-meta-body');
const downloadBtn     = document.getElementById('qr-download-btn');
const emptyStateEl    = document.getElementById('empty-state');
const errorBannerEl   = document.getElementById('error-banner');
const errorBannerMsg  = document.getElementById('error-banner-msg');
const errorBannerClose= document.getElementById('error-banner-close');
const ticketTableBody = document.getElementById('ticket-table-body');
const ticketTableWrap = document.getElementById('ticket-table-wrap');
const refreshBtn      = document.getElementById('refresh-btn');
const qrPlaceholderEl = document.getElementById('qr-placeholder');

/** All required input fields on the form */
const FIELDS = ['ticketId', 'eventName', 'holderName', 'seatNumber', 'issueDate'];

// ─── State ────────────────────────────────────────────────────────────────────

let currentQrDataUrl = null;
let currentTicketId  = null;

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Show/hide the global loading overlay */
function setLoading(visible) {
  loadingEl.style.display  = visible ? 'flex' : 'none';
  loadingEl.setAttribute('aria-hidden', String(!visible));
  submitBtn.disabled       = visible;
}

/** Show the QR result panel */
function showQrResult(data, payload) {
  currentQrDataUrl = data.qrCodeDataUrl;
  currentTicketId  = data.ticketId;

  qrImageEl.src = data.qrCodeDataUrl;
  qrImageEl.alt = `QR Code for ticket ${data.ticketId}`;

  // Populate meta table
  const rows = [
    ['Ticket ID',   payload.ticketId],
    ['Event',       payload.eventName],
    ['Holder',      payload.holderName],
    ['Seat',        payload.seatNumber],
    ['Issue Date',  payload.issueDate],
    ['Generated',   new Date(data.generatedAt).toLocaleString()],
  ];
  qrMetaBodyEl.innerHTML = rows
    .map(
      ([label, value]) => `
      <tr class="qr-meta__row">
        <td class="qr-meta__label">${label}</td>
        <td class="qr-meta__value">${escapeHtml(value)}</td>
      </tr>`
    )
    .join('');

  qrResultEl.style.display = 'flex';
  qrResultEl.removeAttribute('aria-hidden');
  if (qrPlaceholderEl) qrPlaceholderEl.style.display = 'none';
  qrResultEl.focus?.();
}

/** Escape HTML for safe insertion into innerHTML */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Show the error banner with a message */
function showError(message) {
  errorBannerMsg.textContent = message;
  errorBannerEl.style.display = 'flex';
  errorBannerEl.setAttribute('aria-hidden', 'false');
  errorBannerEl.focus?.();
}

/** Hide the error banner */
function clearError() {
  errorBannerEl.style.display = 'none';
  errorBannerEl.setAttribute('aria-hidden', 'true');
}

/** Clear all field-level validation errors */
function clearFieldErrors() {
  FIELDS.forEach((id) => {
    const input = document.getElementById(id);
    const errorSpan = document.getElementById(`${id}-error`);
    if (!input || !errorSpan) return;
    input.classList.remove('error');
    input.removeAttribute('aria-invalid');
    errorSpan.style.display = 'none';
  });
}

/** Highlight the fields that failed validation */
function applyFieldErrors(errors = []) {
  errors.forEach((fieldId) => {
    const input = document.getElementById(fieldId);
    const errorSpan = document.getElementById(`${fieldId}-error`);
    if (!input || !errorSpan) return;
    input.classList.add('error');
    input.setAttribute('aria-invalid', 'true');
    errorSpan.style.display = 'flex';
  });

  // Move focus to the first offending field for keyboard users
  if (errors.length > 0) {
    document.getElementById(errors[0])?.focus();
  }
}

/** Read the current form values into a raw payload object */
function readFormValues() {
  return Object.fromEntries(
    FIELDS.map((id) => [id, document.getElementById(id)?.value ?? ''])
  );
}

// ─── Ticket List ──────────────────────────────────────────────────────────────

/** Render the ticket list section (table or empty state). */
async function renderTicketList() {
  try {
    const response = await fetchTicketList();
    const tickets  = response.data; // guaranteed array

    if (tickets.length === 0) {
      ticketTableWrap.style.display = 'none';
      emptyStateEl.style.display    = 'flex';
    } else {
      ticketTableWrap.style.display = 'block';
      emptyStateEl.style.display    = 'none';

      ticketTableBody.innerHTML = tickets
        .map(
          (t) => `
        <tr>
          <td class="ticket-id">${escapeHtml(t.ticketId)}</td>
          <td>${escapeHtml(t.eventName)}</td>
          <td>${escapeHtml(t.holderName)}</td>
          <td>${escapeHtml(t.seatNumber)}</td>
          <td>${escapeHtml(t.issueDate)}</td>
          <td>
            <button
              class="view-qr-btn"
              aria-label="View QR code for ticket ${escapeHtml(t.ticketId)}"
              data-qr="${escapeHtml(t.qrCodeDataUrl)}"
              data-id="${escapeHtml(t.ticketId)}"
            >
              View QR
            </button>
          </td>
        </tr>`
        )
        .join('');

      // Log analytics
      logAnalyticsEvent(ANALYTICS_EVENTS.TICKET_VIEWED);
    }
  } catch {
    showError('Unable to load ticket list. Please refresh.');
  }
}

// ─── Form Submission ──────────────────────────────────────────────────────────

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();
  clearFieldErrors();

  // 1. Read raw values
  const rawPayload = readFormValues();

  // 2. Sanitize all text fields against XSS before validation
  const sanitizedPayload = Object.fromEntries(
    FIELDS.map((id) => [id, id !== 'issueDate' ? sanitizeInput(rawPayload[id]) : rawPayload[id]])
  );

  // 3. Validate
  const validation = validateTicketInput(sanitizedPayload);

  if (!validation.valid) {
    applyFieldErrors(validation.errors);
    return; // Prevent submission — NFR: invalid inputs
  }

  // 4. Log form submit analytics
  logAnalyticsEvent(ANALYTICS_EVENTS.FORM_SUBMITTED, {
    ticketId: validation.data.ticketId,
  });

  // 5. Show loading indicator (NFR: async visual feedback)
  setLoading(true);
  qrResultEl.style.display = 'none';

  try {
    // 6. Generate QR code
    const response = await generateQrCode(validation.data);

    if (!response.success) {
      throw { type: QR_API_ERRORS.SERVER_ERROR, message: 'QR generation returned failure.' };
    }

    // 7. Display result
    showQrResult(response.data, validation.data);

    // 8. Fire primary action analytics (NFR: telemetry)
    logAnalyticsEvent(ANALYTICS_EVENTS.QR_GENERATED, {
      ticketId: response.data.ticketId,
    });

    // 9. Refresh the ticket list
    await renderTicketList();

  } catch (err) {
    const messages = {
      [QR_API_ERRORS.NETWORK_ERROR]:   'Network error — check your connection and try again.',
      [QR_API_ERRORS.TIMEOUT]:         'Request timed out — you may be on a slow connection. Please retry.',
      [QR_API_ERRORS.SERVER_ERROR]:    'A server error occurred. Please try again shortly.',
      [QR_API_ERRORS.INVALID_PAYLOAD]: 'The ticket data is invalid. Please review all fields.',
      [QR_API_ERRORS.NOT_FOUND]:       'Ticket not found. Please verify the Ticket ID.',
    };
    const message = (err && err.type && messages[err.type])
      ? messages[err.type]
      : 'An unexpected error occurred. Please try again.';
    showError(message);
  } finally {
    setLoading(false);
  }
});

// ─── Download QR ──────────────────────────────────────────────────────────────

downloadBtn?.addEventListener('click', () => {
  if (!currentQrDataUrl) return;
  const link = document.createElement('a');
  link.href     = currentQrDataUrl;
  link.download = `ticket-qr-${currentTicketId ?? 'unknown'}.png`;
  link.click();

  logAnalyticsEvent(ANALYTICS_EVENTS.QR_GENERATED, {
    action:   'download',
    ticketId: currentTicketId,
  });
});

// ─── View QR from list ────────────────────────────────────────────────────────

ticketTableBody?.addEventListener('click', (e) => {
  const btn = e.target.closest('.view-qr-btn');
  if (!btn) return;

  const qrUrl = btn.dataset.qr;
  const ticketId = btn.dataset.id;

  if (qrUrl) {
    qrImageEl.src = qrUrl;
    qrImageEl.alt = `QR Code for ticket ${ticketId}`;
    qrResultEl.style.display = 'flex';
    qrResultEl.scrollIntoView({ behavior: 'smooth' });

    logAnalyticsEvent(ANALYTICS_EVENTS.TICKET_VIEWED, { ticketId });
  }
});

// ─── Refresh Button ───────────────────────────────────────────────────────────

refreshBtn?.addEventListener('click', () => {
  renderTicketList();
});

// ─── Error Banner Dismiss ─────────────────────────────────────────────────────

errorBannerClose?.addEventListener('click', clearError);

// ─── Initialise ───────────────────────────────────────────────────────────────

(async function init() {
  setLoading(false);
  clearError();
  await renderTicketList();
})();
