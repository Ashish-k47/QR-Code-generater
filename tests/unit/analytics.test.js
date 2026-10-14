/**
 * UNIT TEST SUITE — Analytics / Telemetry
 *
 * File: tests/unit/analytics.test.js
 *
 * What we are testing:
 *   The `logAnalyticsEvent` function that will live in
 *   src/analytics/telemetry.js.
 *
 * Requirements covered:
 *   - NFR: Telemetry Simulation → log "[Analytics] User interacted with
 *     Ticket QR Code Generator Worker" on every primary action.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/analytics/telemetry.js', () => ({
  logAnalyticsEvent: vi.fn(() => {
    throw new Error('NOT_IMPLEMENTED: logAnalyticsEvent');
  }),
  ANALYTICS_EVENTS: {
    QR_GENERATED: 'qr_generated',
    FORM_SUBMITTED: 'form_submitted',
    TICKET_VIEWED: 'ticket_viewed',
  },
}));

import {
  logAnalyticsEvent,
  ANALYTICS_EVENTS,
} from '../../src/analytics/telemetry.js';

// ─── Helpers ────────────────────────────────────────────────────────────────
let consoleSpy;

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.clearAllMocks();
});

afterEach(() => {
  consoleSpy.mockRestore();
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 1 — Log Format Contract
// ═══════════════════════════════════════════════════════════════════
describe('logAnalyticsEvent — console output format', () => {
  it('should call console.log with the exact required prefix [Analytics]', () => {
    logAnalyticsEvent(ANALYTICS_EVENTS.QR_GENERATED);

    expect(consoleSpy).toHaveBeenCalledOnce();
    const loggedMessage = consoleSpy.mock.calls[0][0];
    expect(loggedMessage).toMatch(/^\[Analytics\]/);
  });

  it('should include "Ticket QR Code Generator Worker" in the log message', () => {
    logAnalyticsEvent(ANALYTICS_EVENTS.QR_GENERATED);

    const loggedMessage = consoleSpy.mock.calls[0][0];
    expect(loggedMessage).toContain('Ticket QR Code Generator Worker');
  });

  it('should include the event name in the log message', () => {
    logAnalyticsEvent(ANALYTICS_EVENTS.FORM_SUBMITTED);

    const loggedMessage = consoleSpy.mock.calls[0][0];
    expect(loggedMessage).toContain(ANALYTICS_EVENTS.FORM_SUBMITTED);
  });

  it('should produce the exact canonical message for QR_GENERATED event', () => {
    logAnalyticsEvent(ANALYTICS_EVENTS.QR_GENERATED);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Analytics] User interacted with Ticket QR Code Generator Worker',
      expect.objectContaining({ event: ANALYTICS_EVENTS.QR_GENERATED })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 2 — Event Types
// ═══════════════════════════════════════════════════════════════════
describe('logAnalyticsEvent — valid event types', () => {
  Object.values(ANALYTICS_EVENTS).forEach((eventName) => {
    it(`should log without throwing for event: "${eventName}"`, () => {
      expect(() => logAnalyticsEvent(eventName)).not.toThrow();
    });
  });

  it('should call console.log exactly once per event call', () => {
    logAnalyticsEvent(ANALYTICS_EVENTS.TICKET_VIEWED);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 3 — Metadata Payload
// ═══════════════════════════════════════════════════════════════════
describe('logAnalyticsEvent — metadata payload', () => {
  it('should include a timestamp in the payload', () => {
    logAnalyticsEvent(ANALYTICS_EVENTS.QR_GENERATED);

    const payload = consoleSpy.mock.calls[0][1];
    expect(payload).toHaveProperty('timestamp');
    expect(new Date(payload.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('should accept optional metadata and merge it into the payload', () => {
    const meta = { ticketId: 'TKT-001', userId: 'usr-42' };
    logAnalyticsEvent(ANALYTICS_EVENTS.QR_GENERATED, meta);

    const payload = consoleSpy.mock.calls[0][1];
    expect(payload).toMatchObject(meta);
  });

  it('should NOT throw when optional metadata is omitted', () => {
    expect(() => logAnalyticsEvent(ANALYTICS_EVENTS.QR_GENERATED)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════
// SUITE 4 — Guard Rails / Invalid Calls
// ═══════════════════════════════════════════════════════════════════
describe('logAnalyticsEvent — guard rails', () => {
  it('should throw or warn when called with an undefined event name', () => {
    // Either throw OR log a warning — both are acceptable defence strategies.
    // The implementation team picks one; the test accepts either.
    let threw = false;
    try {
      logAnalyticsEvent(undefined);
    } catch {
      threw = true;
    }

    if (!threw) {
      // If it didn't throw, it must have at least warned
      expect(consoleSpy).toHaveBeenCalled();
      const msg = consoleSpy.mock.calls[0][0];
      expect(msg).toMatch(/warn|invalid|unknown/i);
    } else {
      expect(threw).toBe(true);
    }
  });

  it('should throw or warn when called with an empty string event name', () => {
    let threw = false;
    try {
      logAnalyticsEvent('');
    } catch {
      threw = true;
    }
    if (!threw) {
      expect(consoleSpy).toHaveBeenCalled();
    }
  });
});
