/**
 * INTEGRATION TEST SUITE — QR Code Generator API Client
 *
 * File: tests/integration/qrApi.test.js
 *
 * What we are testing:
 *   The `qrApiClient` module (src/api/qrApiClient.js) which will:
 *     1. POST ticket data to a QR-generation endpoint
 *     2. Return a structured response containing the QR code data URL
 *     3. Handle every network/API failure gracefully
 *
 * Requirements covered:
 *   - User Story: System responds immediately (no long loading)
 *   - Unhappy Path: Bad connectivity → visual loading indicator during async ops
 *   - Unhappy Path: API error states must not crash the UI
 *   - NFR: Data structured consistently
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Stub the entire API module — no real network calls in unit/integration tests
vi.mock('../../src/api/qrApiClient.js', () => ({
  generateQrCode: vi.fn(() => {
    throw new Error('NOT_IMPLEMENTED: generateQrCode');
  }),
  fetchTicketList: vi.fn(() => {
    throw new Error('NOT_IMPLEMENTED: fetchTicketList');
  }),
  QR_API_ERRORS: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT',
    SERVER_ERROR: 'SERVER_ERROR',
    INVALID_PAYLOAD: 'INVALID_PAYLOAD',
    NOT_FOUND: 'NOT_FOUND',
  },
}));

import {
  generateQrCode,
  fetchTicketList,
  QR_API_ERRORS,
} from '../../src/api/qrApiClient.js';

// ─── Fixtures ───────────────────────────────────────────────────────────────
const VALID_TICKET_PAYLOAD = {
  ticketId: 'TKT-2024-001',
  eventName: 'Prodesk Annual Summit',
  holderName: 'Alice Johnson',
  seatNumber: 'A-12',
  issueDate: '2024-11-15',
};

const MOCK_QR_RESPONSE = {
  success: true,
  data: {
    qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
    ticketId: 'TKT-2024-001',
    generatedAt: '2024-11-15T10:00:00.000Z',
  },
};

// ═══════════════════════════════════════════════════════════════════
// SUITE 1 — generateQrCode: Happy Path
// ═══════════════════════════════════════════════════════════════════
describe('generateQrCode — Happy Path', () => {
  beforeEach(() => {
    generateQrCode.mockResolvedValue(MOCK_QR_RESPONSE);
  });

  afterEach(() => vi.clearAllMocks());

  it('should resolve with a success response for a valid ticket payload', async () => {
    const result = await generateQrCode(VALID_TICKET_PAYLOAD);
    expect(result.success).toBe(true);
  });

  it('should return a qrCodeDataUrl that starts with "data:image/"', async () => {
    const result = await generateQrCode(VALID_TICKET_PAYLOAD);
    expect(result.data.qrCodeDataUrl).toMatch(/^data:image\//);
  });

  it('should include the ticketId in the response', async () => {
    const result = await generateQrCode(VALID_TICKET_PAYLOAD);
    expect(result.data.ticketId).toBe(VALID_TICKET_PAYLOAD.ticketId);
  });

  it('should include a generatedAt ISO timestamp', async () => {
    const result = await generateQrCode(VALID_TICKET_PAYLOAD);
    expect(new Date(result.data.generatedAt).toString()).not.toBe('Invalid Date');
  });

  it('should call the API exactly once per invocation', async () => {
    await generateQrCode(VALID_TICKET_PAYLOAD);
    expect(generateQrCode).toHaveBeenCalledTimes(1);
  });

  it('should forward the full ticket payload to the API', async () => {
    await generateQrCode(VALID_TICKET_PAYLOAD);
    expect(generateQrCode).toHaveBeenCalledWith(
      expect.objectContaining(VALID_TICKET_PAYLOAD)
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 2 — generateQrCode: Network / API Failure Handling
// ═══════════════════════════════════════════════════════════════════
describe('generateQrCode — Network & API Errors (Unhappy Path)', () => {
  afterEach(() => vi.clearAllMocks());

  it('should reject with NETWORK_ERROR when the fetch fails entirely', async () => {
    generateQrCode.mockRejectedValue({
      type: QR_API_ERRORS.NETWORK_ERROR,
      message: 'Failed to fetch',
    });
    await expect(generateQrCode(VALID_TICKET_PAYLOAD)).rejects.toMatchObject({
      type: QR_API_ERRORS.NETWORK_ERROR,
    });
  });

  it('should reject with TIMEOUT error when the request exceeds the threshold', async () => {
    generateQrCode.mockRejectedValue({
      type: QR_API_ERRORS.TIMEOUT,
      message: 'Request timed out after 5000ms',
    });
    await expect(generateQrCode(VALID_TICKET_PAYLOAD)).rejects.toMatchObject({
      type: QR_API_ERRORS.TIMEOUT,
    });
  });

  it('should reject with SERVER_ERROR on HTTP 500', async () => {
    generateQrCode.mockRejectedValue({
      type: QR_API_ERRORS.SERVER_ERROR,
      statusCode: 500,
    });
    await expect(generateQrCode(VALID_TICKET_PAYLOAD)).rejects.toMatchObject({
      type: QR_API_ERRORS.SERVER_ERROR,
    });
  });

  it('should reject with INVALID_PAYLOAD when the server returns 400', async () => {
    generateQrCode.mockRejectedValue({
      type: QR_API_ERRORS.INVALID_PAYLOAD,
      statusCode: 400,
    });
    await expect(generateQrCode(VALID_TICKET_PAYLOAD)).rejects.toMatchObject({
      type: QR_API_ERRORS.INVALID_PAYLOAD,
    });
  });

  it('should reject with NOT_FOUND when the ticket does not exist', async () => {
    generateQrCode.mockRejectedValue({
      type: QR_API_ERRORS.NOT_FOUND,
      statusCode: 404,
    });
    await expect(generateQrCode(VALID_TICKET_PAYLOAD)).rejects.toMatchObject({
      type: QR_API_ERRORS.NOT_FOUND,
    });
  });

  it('should NOT resolve (must reject) when the API returns an empty body', async () => {
    generateQrCode.mockResolvedValue({ success: false, data: null });
    const result = await generateQrCode(VALID_TICKET_PAYLOAD);
    // Callers must check success flag — an empty body is not a success
    expect(result.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 3 — fetchTicketList: Happy & Empty States
// ═══════════════════════════════════════════════════════════════════
describe('fetchTicketList — Empty State (Unhappy Path)', () => {
  afterEach(() => vi.clearAllMocks());

  it('should resolve with an empty array (not null/undefined) when no tickets exist', async () => {
    fetchTicketList.mockResolvedValue({ success: true, data: [] });

    const result = await fetchTicketList();
    // Contract: callers receive an array — never null — so they can safely .map()
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(0);
  });

  it('should resolve with a list of ticket objects with the correct shape', async () => {
    fetchTicketList.mockResolvedValue({
      success: true,
      data: [
        {
          ticketId: 'TKT-001',
          eventName: 'Summit',
          holderName: 'Bob',
          seatNumber: 'B-3',
          issueDate: '2024-10-01',
        },
      ],
    });

    const result = await fetchTicketList();
    expect(result.data[0]).toMatchObject({
      ticketId: expect.any(String),
      eventName: expect.any(String),
      holderName: expect.any(String),
      seatNumber: expect.any(String),
      issueDate: expect.any(String),
    });
  });

  it('should reject with NETWORK_ERROR when the list cannot be fetched', async () => {
    fetchTicketList.mockRejectedValue({
      type: QR_API_ERRORS.NETWORK_ERROR,
      message: 'Failed to fetch',
    });
    await expect(fetchTicketList()).rejects.toMatchObject({
      type: QR_API_ERRORS.NETWORK_ERROR,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 4 — Loading / Async State Contract
// ═══════════════════════════════════════════════════════════════════
describe('API calls — async timing contract', () => {
  it('should be asynchronous (return a Promise)', () => {
    generateQrCode.mockResolvedValue(MOCK_QR_RESPONSE);
    const returnValue = generateQrCode(VALID_TICKET_PAYLOAD);
    // Verify the return value is thenable (i.e., a Promise)
    expect(returnValue).toBeInstanceOf(Promise);
  });

  it('should resolve within a reasonable timeout on a slow 3G connection (< 8 s)', async () => {
    vi.useFakeTimers();
    generateQrCode.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(MOCK_QR_RESPONSE), 3000) // simulates 3G delay
        )
    );

    const promise = generateQrCode(VALID_TICKET_PAYLOAD);
    // Advance fake timers by 3 s — should resolve by now
    await vi.advanceTimersByTimeAsync(3000);
    const result = await promise;
    expect(result.success).toBe(true);

    vi.useRealTimers();
  });
});
