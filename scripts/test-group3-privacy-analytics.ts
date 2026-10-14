import {
  sanitizeAnalyticsPayload,
  hasAnalyticsConsent,
  setAnalyticsConsent,
  trackEvent,
  getEventLog,
  clearEventLog,
  trackPageView,
  trackPropertySearch,
  trackPropertyView,
  trackFunnelStep,
  trackFunnelCompleted,
  trackEnquirySubmitted,
  trackAuthEvent,
} from '../src/utils/analytics';

export async function runGroup3PrivacyAnalyticsTests() {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean, extra?: string) {
    if (condition) {
      results.push(`[PASS] ${desc}`);
      passed++;
    } else {
      results.push(`[FAIL] ${desc}${extra ? ` - ${extra}` : ''}`);
      failed++;
    }
  }

  console.log('\n--- 20. Group 3: Privacy-Preserving Web Analytics Suite ---');

  // ====================================================================
  // TEST SECTION 1: Automated PII Sanitization Invariants
  // ====================================================================
  try {
    const dirtyPayload: any = {
      locality: 'Whitefield',
      bhk: '3 BHK',
      budget: 15000000,
      phone: '+919876543210',
      owner_phone: '9876543210',
      email: 'seller@example.com',
      user_email: 'buyer@sellmyghar.in',
      password: 'SecretPassword123!',
      session_token: 'jwt-token-xyz',
      buyer_name: 'John Doe',
      seller_name: 'Jane Smith',
      secret_key: 'sk_live_123',
      deed_number: 'DEED-98765',
      user_input_note: 'Call me at test@phishing.com immediately',
      phone_in_value: '+919845012345',
    };

    const cleaned = sanitizeAnalyticsPayload(dirtyPayload);

    // 1.1 Non-PII fields preserved
    assert('Legitimate non-PII dimension locality is preserved', cleaned?.locality === 'Whitefield');
    assert('Legitimate non-PII dimension bhk is preserved', cleaned?.bhk === '3 BHK');
    assert('Legitimate non-PII dimension budget is preserved', cleaned?.budget === 15000000);

    // 1.2 PII key names stripped
    assert('phone key is strictly stripped from telemetry', cleaned?.phone === undefined);
    assert('owner_phone key is strictly stripped from telemetry', cleaned?.owner_phone === undefined);
    assert('email key is strictly stripped from telemetry', cleaned?.email === undefined);
    assert('user_email key is strictly stripped from telemetry', cleaned?.user_email === undefined);
    assert('password key is strictly stripped from telemetry', cleaned?.password === undefined);
    assert('session_token key is strictly stripped from telemetry', cleaned?.session_token === undefined);
    assert('buyer_name key is strictly stripped from telemetry', cleaned?.buyer_name === undefined);
    assert('seller_name key is strictly stripped from telemetry', cleaned?.seller_name === undefined);
    assert('secret_key key is strictly stripped from telemetry', cleaned?.secret_key === undefined);
    assert('deed_number key is strictly stripped from telemetry', cleaned?.deed_number === undefined);

    // 1.3 PII values in arbitrary keys stripped
    assert('Phone number value in arbitrary key is stripped', cleaned?.phone_in_value === undefined);
  } catch (err: any) {
    assert('PII sanitization section encountered exception', false, err.message);
  }

  // ====================================================================
  // TEST SECTION 2: DPDP Section 6 Consent Management
  // ====================================================================
  try {
    // Initial consent state
    setAnalyticsConsent(true);
    assert('Consent granted sets hasAnalyticsConsent to true', hasAnalyticsConsent() === true);

    // Consent withdrawal
    setAnalyticsConsent(false);
    assert('Consent withdrawal sets hasAnalyticsConsent to false', hasAnalyticsConsent() === false);

    // Restore consent
    setAnalyticsConsent(true);
    assert('Re-granting consent updates hasAnalyticsConsent to true', hasAnalyticsConsent() === true);
  } catch (err: any) {
    assert('Consent section encountered exception', false, err.message);
  }

  // ====================================================================
  // TEST SECTION 3: High-Value Event Tracking Dispatchers
  // ====================================================================
  try {
    clearEventLog();

    // 3.1 Page View
    trackPageView('/sell-flat-in-whitefield-bangalore', 'Sell Flat in Whitefield');
    const log1 = getEventLog();
    const last1 = log1[log1.length - 1];
    assert('trackPageView dispatches PAGE_VIEW event', last1?.type === 'PAGE_VIEW');
    assert('PAGE_VIEW contains page_path', last1?.properties?.page_path === '/sell-flat-in-whitefield-bangalore');

    // 3.2 Property Search
    trackPropertySearch({ locality: 'Indiranagar', bhkType: '3 BHK', budgetMax: 25000000 });
    const log2 = getEventLog();
    const last2 = log2[log2.length - 1];
    assert('trackPropertySearch dispatches PROPERTY_SEARCH event', last2?.type === 'PROPERTY_SEARCH');
    assert('PROPERTY_SEARCH contains locality Indiranagar', last2?.properties?.locality === 'Indiranagar');
    assert('PROPERTY_SEARCH contains bhk 3 BHK', last2?.properties?.bhk === '3 BHK');

    // 3.3 Property Detail View
    trackPropertyView({ propertyId: 'prop-test-789', locality: 'HSR Layout', bhkType: '2 BHK', askingPrice: 12000000 });
    const log3 = getEventLog();
    const last3 = log3[log3.length - 1];
    assert('trackPropertyView dispatches PROPERTY_VIEW event', last3?.type === 'PROPERTY_VIEW');
    assert('PROPERTY_VIEW contains property_id', last3?.properties?.property_id === 'prop-test-789');

    // 3.4 Seller Funnel Progression
    trackFunnelStep('SELLER_WIZARD', 3, 'Configuration & Status');
    const log4 = getEventLog();
    const last4 = log4[log4.length - 1];
    assert('trackFunnelStep dispatches SELLER_FUNNEL_STEP event', last4?.type === 'SELLER_FUNNEL_STEP');
    assert('SELLER_FUNNEL_STEP records step_number 3', last4?.properties?.step_number === 3);

    // 3.5 Funnel Completion
    trackFunnelCompleted('SELLER_WIZARD', { bhkType: '3 BHK', locality: 'Whitefield', totalImages: 5 });
    const log5 = getEventLog();
    const last5 = log5[log5.length - 1];
    assert('trackFunnelCompleted dispatches SELLER_FUNNEL_COMPLETE event', last5?.type === 'SELLER_FUNNEL_COMPLETE');
    assert('SELLER_FUNNEL_COMPLETE records non-PII locality and image count', last5?.properties?.locality === 'Whitefield' && last5?.properties?.images_count === 5);

    // 3.6 Enquiry Submission
    trackEnquirySubmitted({ enquiryType: 'CONTACT', locality: 'GENERAL' });
    const log6 = getEventLog();
    const last6 = log6[log6.length - 1];
    assert('trackEnquirySubmitted dispatches ENQUIRY_SUBMIT event', last6?.type === 'ENQUIRY_SUBMIT');
    assert('ENQUIRY_SUBMIT records enquiry_type CONTACT', last6?.properties?.enquiry_type === 'CONTACT');

    // 3.7 Auth Event
    trackAuthEvent('LOGIN_SUCCESS');
    const log7 = getEventLog();
    const last7 = log7[log7.length - 1];
    assert('trackAuthEvent dispatches AUTH_EVENT event', last7?.type === 'AUTH_EVENT');
    assert('AUTH_EVENT records LOGIN_SUCCESS action', last7?.properties?.action === 'LOGIN_SUCCESS');

    // 3.8 Buffer Boundedness
    for (let i = 0; i < 150; i++) {
      trackEvent('PAGE_VIEW', { count: i });
    }
    const finalLog = getEventLog();
    assert('Telemetry buffer strictly enforces maximum size boundary of 100 events', finalLog.length === 100);
  } catch (err: any) {
    assert('Event tracking section encountered exception', false, err.message);
  }

  return { passed, failed, results };
}
