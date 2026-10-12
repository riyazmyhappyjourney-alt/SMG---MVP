/**
 * Privacy-Preserving Conversion & Event Analytics
 * Collects non-PII interaction telemetry (CTA clicks, calculator usage, locality exploration)
 * without logging personal data, phone numbers, or IP addresses.
 */

export type AnalyticsEventType =
  | 'PAGE_VIEW'
  | 'HERO_CTA_PRIMARY_CLICK'
  | 'HERO_CTA_SECONDARY_CLICK'
  | 'HERO_SLIDE_CHANGE'
  | 'HOLDING_CALCULATOR_INTERACT'
  | 'HOLDING_CALCULATOR_CTA_CLICK'
  | 'LOCALITY_CARD_CLICK'
  | 'LOCALITY_PAGE_VIEW'
  | 'SELLER_CONVERSION_CARD_CLICK'
  | 'SELLER_FUNNEL_START'
  | 'SELLER_CONSULTATION_CLICK'
  | 'LISTING_CARD_CLICK';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: string;
  properties?: Record<string, string | number | boolean>;
}

// In-memory telemetry buffer (resets per session, no external third-party tracker leak)
const eventLog: AnalyticsEvent[] = [];

export function trackEvent(
  type: AnalyticsEventType,
  properties?: Record<string, string | number | boolean>
): void {
  try {
    const event: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      timestamp: new Date().toISOString(),
      properties: properties ? { ...properties } : undefined,
    };

    eventLog.push(event);

    // Keep log bounded to last 100 events
    if (eventLog.length > 100) {
      eventLog.shift();
    }

    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[Telemetry] ${type}`, properties || {});
    }
  } catch {
    // Fail silently without disrupting user interaction
  }
}

export function getEventLog(): readonly AnalyticsEvent[] {
  return [...eventLog];
}
