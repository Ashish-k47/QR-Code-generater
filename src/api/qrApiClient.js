/**
 * src/api/qrApiClient.js
 *
 * ⚠️  STUB — Do not implement yet.
 * This file exists only so Vitest can resolve the module path.
 * All exports throw NOT_IMPLEMENTED and are replaced by vi.mock() in tests.
 *
 * Contract (to be implemented later):
 *   generateQrCode(payload) → Promise<{ success, data: { qrCodeDataUrl, ticketId, generatedAt } }>
 *   fetchTicketList()       → Promise<{ success, data: TicketObject[] }>
 */

export const QR_API_ERRORS = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  NOT_FOUND: 'NOT_FOUND',
};

export async function generateQrCode(_payload) {
  throw new Error('NOT_IMPLEMENTED: generateQrCode');
}

export async function fetchTicketList() {
  throw new Error('NOT_IMPLEMENTED: fetchTicketList');
}
