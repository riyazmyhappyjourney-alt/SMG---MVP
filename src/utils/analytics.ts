/**
 * Privacy-Preserving Conversion & Event Analytics
 * Collects non-PII interaction telemetry (page views, searches, funnel progression, conversion milestones)
 * strictly in accordance with the Digital Personal Data Protection (DPDP) Act, 2023.
 *
 * Non-Negotiable Privacy Safeguards:
 * 1. Zero PII: Passwords, tokens, phone numbers, email addresses, personal names, and deeds are sanitized.
 * 2. Consent-Gated: External analytics dispatches are suppressed if consent is withheld or withdrawn.
 * 3. Fallback Resilient: Functions safely in SSR, test runners, or when ad-blockers block scripts.
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
  | 'SELLER_FUNNEL_STEP'
  | 'SELLER_FUNNEL_COMPLETE'
  | 'SELLER_FUNNEL_ABANDON'
  | 'SELLER_CONSULTATION_CLICK'
  | 'LISTING_CARD_CLICK'
  | 'PROPERTY_SEARCH'
  | 'PROPERTY_VIEW'
  | 'ENQUIRY_SUBMIT'
  | 'HOW_IT_WORKS_CTA_CLICK'
  | 'CTA_BANNER_CLICK'
  | 'HERO_VALUATION_SUBMITTED'
  | 'AUTH_EVENT';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: string;
  properties?: Record<string, string | number | boolean>;
}

// In-memory telemetry buffer (resets per session, keeps bounded to last 100 events)
const eventLog: AnalyticsEvent[] = [];

// ====================================================================
// 1. PII SANITIZATION ENGINE
// ====================================================================

const FORBIDDEN_KEY_PATTERNS = [
  /email/i,
  /phone/i,
  /mobile/i,
  /password/i,
  /token/i,
  /secret/i,
  /pan/i,
  /aadhaar/i,
  /deed/i,
  /document/i,
  /address/i,
  /^(user_?name|full_?name|first_?name|last_?name|buyer_?name|seller_?name|customer_?name|client_?name)$/i,
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

export function sanitizeAnalyticsPayload(
  props?: Record<string, string | number | boolean>
): Record<string, string | number | boolean> | undefined {
  if (!props) return undefined;
  const clean: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(props)) {
    // 1. Filter forbidden PII key names
    if (FORBIDDEN_KEY_PATTERNS.some((pat) => pat.test(key))) {
      continue;
    }

    // 2. Filter forbidden PII string values
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (EMAIL_PATTERN.test(trimmed) || PHONE_PATTERN.test(trimmed)) {
        continue;
      }
    }

    clean[key] = value;
  }

  return clean;
}

// ====================================================================
// 2. DPDP CONSENT MANAGEMENT
// ====================================================================

const CONSENT_STORAGE_KEY = 'smg_analytics_consent';
let memoryConsent: boolean | null = null;

export function hasAnalyticsConsent(): boolean {
  if (memoryConsent !== null) {
    return memoryConsent;
  }
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return true; // Safe fallback for server-side or test environments
  }
  return localStorage.getItem(CONSENT_STORAGE_KEY) !== 'false';
}

export function setAnalyticsConsent(granted: boolean): void {
  memoryConsent = granted;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, granted ? 'true' : 'false');
    } catch {}
    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: granted ? 'granted' : 'denied',
      });
    }
  }
}

// ====================================================================
// 3. GA4 INTEGRATION & DISPATCH
// ====================================================================

let ga4Initialized = false;

export function initGA4(measurementId?: string): void {
  if (typeof window === 'undefined' || ga4Initialized) return;

  const id = measurementId || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GA4_MEASUREMENT_ID);
  if (!id || typeof id !== 'string' || !id.startsWith('G-')) {
    return;
  }

  try {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);

    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () {
      w.dataLayer.push(arguments);
    };

    w.gtag('js', new Date());
    w.gtag('config', id, {
      anonymize_ip: true,
      send_page_view: false, // Explicit page view tracking via trackPageView
    });

    ga4Initialized = true;
  } catch {
    // Graceful no-op on script loading restrictions
  }
}

// ====================================================================
// 4. CORE EVENT TRACKING DISPATCHER
// ====================================================================

export function trackEvent(
  type: AnalyticsEventType,
  properties?: Record<string, string | number | boolean>
): void {
  try {
    const cleanProps = sanitizeAnalyticsPayload(properties);

    const event: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      timestamp: new Date().toISOString(),
      properties: cleanProps,
    };

    eventLog.push(event);

    if (eventLog.length > 100) {
      eventLog.shift();
    }

    // Dispatch to GA4 if initialized and consent granted
    if (hasAnalyticsConsent() && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', type.toLowerCase(), cleanProps || {});
    }

    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production' && process.env?.RUNNING_TESTS !== 'true') {
      console.debug(`[Telemetry] ${type}`, cleanProps || {});
    }
  } catch {
    // Fail silently without disrupting user interaction
  }
}

export function getEventLog(): readonly AnalyticsEvent[] {
  return [...eventLog];
}

export function clearEventLog(): void {
  eventLog.length = 0;
}

// ====================================================================
// 5. TYPED HIGH-VALUE MILESTONE HELPERS
// ====================================================================

export function trackPageView(pagePath: string, pageTitle?: string): void {
  trackEvent('PAGE_VIEW', {
    page_path: pagePath,
    page_title: pageTitle || pagePath,
  });
}

export function trackPropertySearch(params: {
  locality?: string;
  bhkType?: string;
  budgetMin?: number;
  budgetMax?: number;
}): void {
  trackEvent('PROPERTY_SEARCH', {
    locality: params.locality || 'ALL',
    bhk: params.bhkType || 'ANY',
    ...(params.budgetMin !== undefined ? { budget_min: params.budgetMin } : {}),
    ...(params.budgetMax !== undefined ? { budget_max: params.budgetMax } : {}),
  });
}

export function trackPropertyView(params: {
  propertyId: string;
  locality?: string;
  bhkType?: string;
  askingPrice?: number;
}): void {
  trackEvent('PROPERTY_VIEW', {
    property_id: params.propertyId,
    locality: params.locality || 'UNKNOWN',
    bhk: params.bhkType || 'UNKNOWN',
    ...(params.askingPrice ? { price: params.askingPrice } : {}),
  });
}

export function trackFunnelStarted(funnelName: string, source?: string): void {
  trackEvent('SELLER_FUNNEL_START', {
    funnel: funnelName,
    source: source || 'DIRECT',
  });
}

export function trackFunnelStep(funnelName: string, stepNumber: number, stepName: string): void {
  trackEvent('SELLER_FUNNEL_STEP', {
    funnel: funnelName,
    step_number: stepNumber,
    step_name: stepName,
  });
}

export function trackFunnelCompleted(
  funnelName: string,
  metadata?: { bhkType?: string; locality?: string; totalImages?: number }
): void {
  trackEvent('SELLER_FUNNEL_COMPLETE', {
    funnel: funnelName,
    ...(metadata?.bhkType ? { bhk: metadata.bhkType } : {}),
    ...(metadata?.locality ? { locality: metadata.locality } : {}),
    ...(metadata?.totalImages ? { images_count: metadata.totalImages } : {}),
  });
}

export function trackFormAbandonment(formName: string, lastFieldCompleted?: string): void {
  trackEvent('SELLER_FUNNEL_ABANDON', {
    form: formName,
    ...(lastFieldCompleted ? { last_field: lastFieldCompleted } : {}),
  });
}

export function trackEnquirySubmitted(params: {
  enquiryType: 'BUYER' | 'SELLER' | 'CONTACT';
  locality?: string;
}): void {
  trackEvent('ENQUIRY_SUBMIT', {
    enquiry_type: params.enquiryType,
    locality: params.locality || 'GENERAL',
  });
}

export function trackAuthEvent(action: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'RESET_REQUEST'): void {
  trackEvent('AUTH_EVENT', {
    action,
  });
}
