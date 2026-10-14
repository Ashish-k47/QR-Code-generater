/**
 * src/analytics/telemetry.js
 *
 * ⚠️  STUB — Do not implement yet.
 * This file exists only so Vitest can resolve the module path.
 * All exports throw NOT_IMPLEMENTED and are replaced by vi.mock() in tests.
 *
 * Contract (to be implemented later):
 *   logAnalyticsEvent(eventName: string, meta?: object) → void
 *   Must console.log: "[Analytics] User interacted with Ticket QR Code Generator Worker"
 */

export const ANALYTICS_EVENTS = {
  QR_GENERATED: 'qr_generated',
  FORM_SUBMITTED: 'form_submitted',
  TICKET_VIEWED: 'ticket_viewed',
};

export function logAnalyticsEvent(_eventName, _meta) {
  throw new Error('NOT_IMPLEMENTED: logAnalyticsEvent');
}
