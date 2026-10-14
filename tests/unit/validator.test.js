/**
 * UNIT TEST SUITE — Input Validation
 *
 * File: tests/unit/validator.test.js
 *
 * What we are testing:
 *   The `validateTicketInput` function that will live in
 *   src/validators/ticketValidator.js.
 *
 * WHY tests-first:
 *   We pin the exact contract the validator must honour BEFORE any
 *   implementation is written.  The tests will fail (red) until the
 *   production code is added (green → refactor).
 *
 * Requirements covered:
 *   - NFR: Invalid Inputs  → prevent submission, highlight offending fields
 *   - NFR: Security        → XSS sanitisation of all text inputs
 *   - NFR: Data structure  → consistent, typed output shape
 */

import { describe, it, expect, vi } from 'vitest';

// ------------------------------------------------------------------
// Stub the module that does not exist yet.
// Vitest will replace this import once the real file is created.
// The stub lets every test fail with a clean "not implemented"
// error rather than a noisy import crash.
// ------------------------------------------------------------------
vi.mock('../../src/validators/ticketValidator.js', () => ({
  validateTicketInput: vi.fn(() => {
    throw new Error('NOT_IMPLEMENTED: validateTicketInput');
  }),
  sanitizeInput: vi.fn((val) => {
    throw new Error('NOT_IMPLEMENTED: sanitizeInput');
  }),
}));

import {
  validateTicketInput,
  sanitizeInput,
} from '../../src/validators/ticketValidator.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns a fully-valid ticket payload. Override individual fields to test
 *  edge cases without repeating the whole object every time. */
const validTicket = (overrides = {}) => ({
  ticketId: 'TKT-2024-001',
  eventName: 'Prodesk Annual Summit',
  holderName: 'Alice Johnson',
  seatNumber: 'A-12',
  issueDate: '2024-11-15',
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 1 — Happy Path (valid inputs)
// ═══════════════════════════════════════════════════════════════════
describe('validateTicketInput — Happy Path', () => {
  it('should return { valid: true } for a fully-populated, valid ticket', () => {
    const result = validateTicketInput(validTicket());

    expect(result).toMatchObject({ valid: true });
    expect(result.errors).toBeUndefined();
  });

  it('should trim trailing/leading whitespace from string fields and still pass', () => {
    const result = validateTicketInput(
      validTicket({ eventName: '  Prodesk Annual Summit  ' })
    );
    expect(result.valid).toBe(true);
  });

  it('should return a normalised payload inside result.data on success', () => {
    const result = validateTicketInput(validTicket());
    expect(result).toHaveProperty('data');
    expect(result.data).toMatchObject({
      ticketId: expect.any(String),
      eventName: expect.any(String),
      holderName: expect.any(String),
      seatNumber: expect.any(String),
      issueDate: expect.any(String),
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 2 — Empty / Missing Fields (Unhappy Path)
// ═══════════════════════════════════════════════════════════════════
describe('validateTicketInput — Empty / Missing Fields', () => {
  it('should return { valid: false } when ticketId is empty string', () => {
    const result = validateTicketInput(validTicket({ ticketId: '' }));
    expect(result.valid).toBe(false);
  });

  it('should flag `ticketId` in the errors list when it is missing', () => {
    const result = validateTicketInput(validTicket({ ticketId: '' }));
    expect(result.errors).toContain('ticketId');
  });

  it('should return { valid: false } when eventName is missing', () => {
    const result = validateTicketInput(validTicket({ eventName: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('eventName');
  });

  it('should return { valid: false } when holderName is missing', () => {
    const result = validateTicketInput(validTicket({ holderName: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('holderName');
  });

  it('should return { valid: false } when seatNumber is missing', () => {
    const result = validateTicketInput(validTicket({ seatNumber: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('seatNumber');
  });

  it('should return { valid: false } when issueDate is missing', () => {
    const result = validateTicketInput(validTicket({ issueDate: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('issueDate');
  });

  it('should collect ALL missing fields at once (not fail-fast)', () => {
    const result = validateTicketInput({
      ticketId: '',
      eventName: '',
      holderName: '',
      seatNumber: '',
      issueDate: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(5);
  });

  it('should return { valid: false } when the entire input is null', () => {
    const result = validateTicketInput(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should return { valid: false } when the entire input is undefined', () => {
    const result = validateTicketInput(undefined);
    expect(result.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 3 — Malformed / Type Errors
// ═══════════════════════════════════════════════════════════════════
describe('validateTicketInput — Malformed Inputs', () => {
  it('should reject a ticketId that exceeds 50 characters', () => {
    const result = validateTicketInput(
      validTicket({ ticketId: 'A'.repeat(51) })
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('ticketId');
  });

  it('should reject an issueDate that is not a valid ISO-8601 date string', () => {
    const result = validateTicketInput(
      validTicket({ issueDate: 'not-a-date' })
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('issueDate');
  });

  it('should reject an issueDate set in the future (post-today)', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = validateTicketInput(
      validTicket({ issueDate: future.toISOString().split('T')[0] })
    );
    // Business rule: tickets cannot be pre-dated beyond today
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('issueDate');
  });

  it('should reject non-string ticketId (e.g. a number)', () => {
    const result = validateTicketInput(validTicket({ ticketId: 12345 }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('ticketId');
  });

  it('should reject a seatNumber containing special characters', () => {
    const result = validateTicketInput(
      validTicket({ seatNumber: 'A<script>alert(1)</script>' })
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('seatNumber');
  });
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 4 — Security: XSS Sanitisation
// NFR: "Sanitize all text inputs against XSS injection"
// ═══════════════════════════════════════════════════════════════════
describe('sanitizeInput — XSS Prevention', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '"><svg onload=alert(1)>',
    "'; DROP TABLE tickets; --",
    '&lt;script&gt;',
    '\u003cscript\u003ealert(1)\u003c/script\u003e',
  ];

  xssPayloads.forEach((payload) => {
    it(`should strip or encode XSS payload: "${payload.slice(0, 30)}..."`, () => {
      const sanitized = sanitizeInput(payload);
      // The sanitized result must NOT contain executable script tags
      expect(sanitized).not.toMatch(/<script[\s\S]*?>/i);
      expect(sanitized).not.toMatch(/javascript:/i);
      expect(sanitized).not.toMatch(/onerror=/i);
      expect(sanitized).not.toMatch(/onload=/i);
    });
  });

  it('should leave clean, safe text untouched', () => {
    const clean = 'Alice Johnson — Seat B-7';
    expect(sanitizeInput(clean)).toBe(clean);
  });

  it('should return an empty string when passed an empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('should coerce non-string input to string before sanitising', () => {
    expect(() => sanitizeInput(42)).not.toThrow();
  });
});
