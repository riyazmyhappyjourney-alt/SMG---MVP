import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { AiSensyNotificationService } from '../src/server/notifications/aisensy-service';
import { EmailNotificationService, DEFAULT_ONBOARDING_EMAIL_SUBJECT, DEFAULT_ONBOARDING_EMAIL_HTML } from '../src/server/notifications/email-service';
import { OtpService } from '../src/server/auth/otp-service';
import { executeQuery } from '../src/server/db/pool';

export async function runAuthAndNotificationTests(): Promise<{ passed: number; failed: number; results: string[] }> {
  console.log('\n======================================================');
  console.log('--- Auth UX, Registration Email & WhatsApp Test Suite ---');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  function record(description: string, condition: boolean, details?: string) {
    if (condition) {
      passed++;
      results.push(`[PASS] ${description}`);
      console.log(`  [PASS] ${description}`);
    } else {
      failed++;
      results.push(`[FAIL] ${description} ${details ? `(${details})` : ''}`);
      console.error(`  [FAIL] ${description} ${details ? `(${details})` : ''}`);
    }
  }

  // 1. Static Component Inspection: Post Property Login Screen & Welcome Screen
  const authPagePath = path.resolve('src/components/auth/AuthPage.tsx');
  const authPageContent = fs.readFileSync(authPagePath, 'utf8');

  record(
    'AuthPage supports dedicated intent prop (POST_PROPERTY vs GENERAL)',
    authPageContent.includes("intent?: 'POST_PROPERTY' | 'GENERAL'") &&
    authPageContent.includes("isPostProperty")
  );

  record(
    'Post Property auth screen displays heading "Login to Post Your Property" and explanation',
    authPageContent.includes('Login to Post Your Property') &&
    authPageContent.includes('Authentication is required to submit and manage your property on SellMyGhar.in.')
  );

  record(
    'Post Property registration path displays "Create an Account to Post Your Property"',
    authPageContent.includes('Create an Account to Post Your Property') &&
    authPageContent.includes('Sign up to Post Property')
  );

  record(
    'General Login / Register screen displays heading "Welcome to SellMyGhar.in" and Bengaluru supporting text',
    authPageContent.includes('Welcome to SellMyGhar.in') &&
    authPageContent.includes('Your trusted starting point for buying or selling a home in Bengaluru.')
  );

  record(
    'AuthPage offers existing Google Sign-In and Phone Number OTP without email/password fields',
    authPageContent.includes('Continue with Phone Number') &&
    authPageContent.includes('Continue with Google') &&
    !authPageContent.includes('type="password"')
  );

  // 2. Routing & Redirect Preservation in App.tsx and AuthCallback.tsx
  const appPath = path.resolve('src/App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  record(
    'App.tsx passes intent="POST_PROPERTY" when visitor navigates to SELLER_ASSISTED while logged out',
    appContent.includes("currentRoute === 'SELLER_ASSISTED'") &&
    appContent.includes('intent="POST_PROPERTY"')
  );

  record(
    'App.tsx detects SELLER_ASSISTED redirect intent for LOGIN route',
    appContent.includes("loginReturnRoute === 'SELLER_ASSISTED'") &&
    appContent.includes("sessionStorage.getItem('sellmyghar_auth_redirect') === 'SELLER_ASSISTED'")
  );

  const authCallbackPath = path.resolve('src/components/auth/AuthCallback.tsx');
  const authCallbackContent = fs.readFileSync(authCallbackPath, 'utf8');

  record(
    'AuthCallback preserves SELLER_ASSISTED destination after Google OAuth and routes to /#/seller-assisted',
    authCallbackContent.includes("stored === 'SELLER_ASSISTED'") &&
    authCallbackContent.includes("targetHash = '/#/seller-assisted'")
  );

  // 3. Registration Email Content & Formatting
  record(
    'Registration email subject is exact: "Welcome to SellMyGhar.in"',
    DEFAULT_ONBOARDING_EMAIL_SUBJECT === 'Welcome to SellMyGhar.in'
  );

  record(
    'Registration email HTML contains exact welcome copy and contact',
    DEFAULT_ONBOARDING_EMAIL_HTML.includes('Hello {{name}},') &&
    DEFAULT_ONBOARDING_EMAIL_HTML.includes('Welcome to SellMyGhar.in.') &&
    DEFAULT_ONBOARDING_EMAIL_HTML.includes("We're here to make your home buying or selling journey in Bengaluru clearer and easier.") &&
    DEFAULT_ONBOARDING_EMAIL_HTML.includes('You can now access your account and continue with your intended action on SellMyGhar.in.') &&
    DEFAULT_ONBOARDING_EMAIL_HTML.includes('contact@sellmyghar.in')
  );

  // 4. Email Notification Service Mock Dispatch
  const testEmailVars = {
    userId: 'usr-test-reg-01',
    name: 'Ananya Rao',
    email: 'ananya.rao@example.com',
  };

  let capturedEmailPayload: any = null;
  EmailNotificationService.setMockProvider(async (payload) => {
    capturedEmailPayload = payload;
    return { success: true, messageId: 'msg-mock-reg-01' };
  });

  try {
    const emailRes = await EmailNotificationService.handleUserOnboarding(testEmailVars);
    record(
      'New registration dispatches welcome email with status DELIVERED',
      emailRes.dispatched && emailRes.status === 'DELIVERED'
    );
    record(
      'Welcome email dispatched to correct recipient with onboarding sender',
      Boolean(
        capturedEmailPayload &&
        capturedEmailPayload.to === 'ananya.rao@example.com' &&
        capturedEmailPayload.from.includes('onboarding@sellmyghar.in')
      )
    );
    record(
      'Welcome email rendered recipient name in body',
      Boolean(capturedEmailPayload && capturedEmailPayload.html.includes('Ananya Rao'))
    );
  } finally {
    EmailNotificationService.setMockProvider(null);
  }

  // 5. WhatsApp Registration Confirmation via AiSensy
  AiSensyNotificationService.clearDispatchedMessages();
  let capturedWaPayload: any = null;
  AiSensyNotificationService.setMockDispatcher(async (payload) => {
    capturedWaPayload = payload;
    return { success: true, data: { status: 'submitted', messageId: 'msg-wa-reg-01' } };
  });

  try {
    const waRecord = await AiSensyNotificationService.handleUserRegistered({
      userId: 'usr-test-reg-01',
      userName: 'Ananya Rao',
      userPhone: '9845012345',
    });

    record(
      'WhatsApp registration confirmation dispatches with status DELIVERED',
      waRecord.status === 'DELIVERED'
    );
    record(
      'WhatsApp registration normalizes phone number with 91 prefix',
      waRecord.destination === '919845012345'
    );
    record(
      'WhatsApp registration passes userName parameter to template',
      Boolean(
        capturedWaPayload &&
        capturedWaPayload.campaignName === (process.env.AISENSY_CAMPAIGN_USER_WELCOME || 'SMG_User_Registered') &&
        capturedWaPayload.templateParams[0] === 'Ananya Rao'
      )
    );

    // Test duplicate registration WhatsApp is suppressed by idempotency
    const dupWaRecord = await AiSensyNotificationService.handleUserRegistered({
      userId: 'usr-test-reg-01',
      userName: 'Ananya Rao',
      userPhone: '9845012345',
    });
    record(
      'WhatsApp registration idempotency prevents duplicate dispatch for same user',
      dupWaRecord.status === 'SIMULATED' &&
      dupWaRecord.providerResponse?.message?.includes('Duplicate')
    );

    // Test Google registration without phone number skips safely
    const noPhoneRecord = await AiSensyNotificationService.handleUserRegistered({
      userId: 'usr-google-no-phone',
      userName: 'Google User',
      userPhone: undefined,
    });
    record(
      'Google registration without phone number skips WhatsApp safely without failing',
      noPhoneRecord.status === 'SKIPPED_INVALID_PHONE' &&
      noPhoneRecord.error?.includes('No phone number supplied')
    );
  } finally {
    AiSensyNotificationService.setMockDispatcher(null);
  }

  // 6. Backend OTP Login vs Registration Separation
  const serverPath = path.resolve('server.ts');
  const serverContent = fs.readFileSync(serverPath, 'utf8');

  record(
    'Server OTP handler checks isNewUser before triggering welcome notifications',
    serverContent.includes('const { authenticatedUser, userRecord, isNewUser } = await OtpService.verifyOtp(') &&
    serverContent.includes('if (isNewUser) {')
  );

  record(
    'Server Google session handler checks isNewGoogleUser before triggering welcome notifications',
    serverContent.includes('let isNewGoogleUser = false;') &&
    serverContent.includes('if (isNewGoogleUser && rawEmail) {')
  );

  record(
    'Server OTP registration records statutory communication consent in consents table',
    serverContent.includes("purpose, notice_version") &&
    serverContent.includes("'COMMUNICATION', 'v1.0'")
  );

  // 7. Server-side Property Submission Protection
  record(
    'Server-side POST /api/properties endpoint strictly enforces authenticateUser middleware',
    serverContent.includes("app.post('/api/properties', jsonUpload, rateLimit('property-create', 10, 3600), authenticateUser")
  );

  console.log(`\nSubtotal: ${passed} passed, ${failed} failed\n`);
  return { passed, failed, results };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthAndNotificationTests().then((res) => {
    if (res.failed > 0) {
      process.exit(1);
    }
  });
}
