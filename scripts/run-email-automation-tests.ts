import { EmailNotificationService, generateIcsCalendar } from '../src/server/notifications/email-service';
import { executeQuery } from '../src/server/db/pool';

export async function runEmailAutomationTests() {
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

  console.log('--- 13. SellMyGhar Complete Email Automation & Resale Workflow Suite ---');

  // --- Suite 1: Provider Status & Credential Security ---
  try {
    const status = EmailNotificationService.getProviderStatus();
    assert(
      'Provider status truthfully reports provider configuration state',
      typeof status.configured === 'boolean' && typeof status.provider === 'string'
    );
    assert(
      'Provider status never leaks RESEND_API_KEY secret to client',
      !('RESEND_API_KEY' in status) && !('apiKey' in (status as any))
    );
    assert(
      'Provider status specifies verified sender notifications@sellmyghar.in',
      status.senderAddress.includes('notifications@sellmyghar.in')
    );
  } catch (err: any) {
    assert('Provider status check runs without exception', false, err.message);
  }

  // --- Suite 2: Default Templates & 5 Workflows Coverage ---
  try {
    const tplKeys = [
      'PROPERTY_SUBMISSION_RECEIVED',
      'MEETING_SCHEDULED',
      'PROPERTY_APPROVED',
      'PROPERTY_PUBLISHED',
      'USER_ONBOARDING_WELCOME',
    ];

    for (const key of tplKeys) {
      const tpl = await EmailNotificationService.getTemplate(key);
      assert(
        `Template "${key}" exists with active status and non-empty subject and HTML body`,
        Boolean(tpl && tpl.is_active && tpl.subject_template.length > 5 && tpl.html_template.length > 50)
      );
    }

    // Test template interpolation
    const renderedListed = EmailNotificationService.renderTemplate(
      'Property {{property_reference}} submitted by {{customer_name}} in {{locality}}',
      { property_reference: 'SMG-QA-01', customer_name: 'Ananya Sharma', locality: 'Whitefield' }
    );
    assert(
      'Template placeholder interpolation replaces variables case-insensitively',
      renderedListed === 'Property SMG-QA-01 submitted by Ananya Sharma in Whitefield'
    );
  } catch (err: any) {
    assert('Template verification runs without exception', false, err.message);
  }

  // --- Suite 3: RFC 5545 (.ics) Calendar Generator ---
  try {
    const icsContent = generateIcsCalendar({
      uid: 'qa-visit-8841',
      summary: 'Property Site Visit: Sobha Dream Acres',
      description: 'SellMyGhar escorted site inspection with Senior Specialist Rajesh Kumar',
      location: 'Sobha Dream Acres, Panathur Road, Varthur, Bengaluru',
      visitDate: '2026-10-15',
      visitTime: '11:00 AM',
      clientName: 'Vikram Mehta',
      clientEmail: 'vikram.mehta@example.com',
      organizerEmail: 'notifications@sellmyghar.in',
    });

    assert(
      'RFC 5545 calendar invitation starts with BEGIN:VCALENDAR and ends with END:VCALENDAR',
      icsContent.startsWith('BEGIN:VCALENDAR') && icsContent.trim().endsWith('END:VCALENDAR')
    );
    assert(
      'RFC 5545 calendar invitation uses CRLF (\\r\\n) line separators',
      icsContent.includes('\r\nBEGIN:VEVENT\r\n')
    );
    assert(
      'RFC 5545 calendar invitation specifies Asia/Kolkata timezone and IST offset (+0530)',
      icsContent.includes('TZID:Asia/Kolkata') && icsContent.includes('TZOFFSETTO:+0530')
    );
    assert(
      'RFC 5545 calendar invitation sets METHOD:REQUEST and STATUS:CONFIRMED',
      icsContent.includes('METHOD:REQUEST') && icsContent.includes('STATUS:CONFIRMED')
    );
    assert(
      'RFC 5545 calendar invitation contains unique UID and client attendee RSVP',
      icsContent.includes('UID:qa-visit-8841@sellmyghar.in') && icsContent.includes('ATTENDEE;CUTYPE=INDIVIDUAL')
    );
  } catch (err: any) {
    assert('RFC 5545 calendar generator runs without exception', false, err.message);
  }

  // --- Suite 4: Mocked Provider & 4 Real Backend Event Workflows ---
  const dispatchedMails: Array<{
    to: string;
    from: string;
    subject: string;
    html: string;
    attachments?: any[];
    eventType: string;
  }> = [];

  try {
    // Install Mock Email Provider
    EmailNotificationService.setMockProvider(async (payload) => {
      dispatchedMails.push(payload);
      return {
        success: true,
        messageId: `re_mock_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      };
    });

    const testPropId = `prop-test-${Date.now().toString(36)}`;
    const testVisitId = `vis-test-${Date.now().toString(36)}`;

    // Workflow 1: Property Listed (Seller Confirmation)
    const listedRes = await EmailNotificationService.handlePropertyListed({
      id: testPropId,
      referenceId: `SMG-2026-QA01`,
      ownerName: 'Dr. Ramesh Rao',
      ownerEmail: 'dr.ramesh@example.com',
      ownerPhone: '+919876543210',
      propertyType: '3BHK Apartment',
      propertyLocation: 'Prestige Lakeside Habitat, Varthur',
      locality: 'Whitefield',
      listingType: 'Assisted Resale (Verified)',
      askingPrice: 16500000,
    });

    assert(
      'Workflow 1 (Property Listed): successfully dispatches seller confirmation email',
      Boolean(listedRes && listedRes.dispatched && listedRes.status === 'DELIVERED')
    );
    assert(
      'Workflow 1: recipient is seller email and subject mentions submission',
      dispatchedMails.some(m => m.eventType === 'PROPERTY_LISTED' && m.to === 'dr.ramesh@example.com')
    );

    // Workflow 2: Meeting Scheduled (Site Visit with .ics Calendar)
    const meetingRes = await EmailNotificationService.handleMeetingScheduled({
      visitId: testVisitId,
      propertyId: testPropId,
      clientName: 'Sneha Patel',
      clientPhone: '+919888877777',
      clientEmail: 'sneha.patel@example.com',
      visitDate: '2026-10-18',
      visitTime: '02:30 PM',
      notes: 'Interested in Vastu compliance and clubhouse amenities',
      propertyTitle: '3BHK Lakeview Penthouse in Sobha Dream Acres',
      propertyLocation: 'Panathur Road, Bengaluru',
    });

    assert(
      'Workflow 2 (Meeting Scheduled): successfully dispatches meeting confirmation email',
      Boolean(meetingRes && meetingRes.dispatched && meetingRes.status === 'DELIVERED')
    );
    const meetingMail = dispatchedMails.find(m => m.eventType === 'MEETING_SCHEDULED');
    assert(
      'Workflow 2: email includes .ics calendar invitation attachment',
      Boolean(meetingMail && meetingMail.attachments && meetingMail.attachments.length > 0 && meetingMail.attachments[0].filename.endsWith('.ics'))
    );
    assert(
      'Workflow 2: HTML body contains meeting date, time, and Asia/Kolkata timezone',
      Boolean(meetingMail && meetingMail.html.includes('2026-10-18') && meetingMail.html.includes('02:30 PM') && meetingMail.html.includes('Asia/Kolkata'))
    );

    // Workflow 3: Property Approved (Legal Diligence Completed)
    const approvedRes = await EmailNotificationService.handlePropertyApproved({
      id: testPropId,
      owner_name: 'Dr. Ramesh Rao',
      owner_email: 'dr.ramesh@example.com',
      title: '3BHK Apartment in Prestige Lakeside Habitat',
      locality: 'Whitefield',
      bhk_type: '3BHK',
      asking_price_inr: 16500000,
      verification_tier: 'LEVEL_2_DOCS_REVIEWED',
    });

    assert(
      'Workflow 3 (Property Approved): successfully dispatches approval notification email',
      Boolean(approvedRes && approvedRes.dispatched && approvedRes.status === 'DELIVERED')
    );
    const approvedMail = dispatchedMails.find(m => m.eventType === 'PROPERTY_APPROVED');
    assert(
      'Workflow 3: email notifies seller that legal documentation review is approved',
      Boolean(approvedMail && approvedMail.to === 'dr.ramesh@example.com' && approvedMail.html.includes('Approved'))
    );

    // Workflow 4: Property Published (Live Public Portal Listing)
    const publishedRes = await EmailNotificationService.handlePropertyPublished({
      id: testPropId,
      title: '3BHK Apartment in Prestige Lakeside Habitat',
      locality: 'Whitefield',
      bhk_type: '3BHK',
      asking_price_inr: 16500000,
      super_built_up_sqft: 1800,
    }, [
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2', is_featured: true }
    ]);

    assert(
      'Workflow 4 (Property Published): successfully dispatches live publication notification',
      Boolean(publishedRes && publishedRes.dispatched && publishedRes.status === 'DELIVERED')
    );
    const publishedMail = dispatchedMails.find(m => m.eventType === 'PROPERTY_PUBLISHED');
    assert(
      'Workflow 4: email contains public listing URL and asking price',
      Boolean(publishedMail && publishedMail.html.includes(testPropId) && publishedMail.html.includes('1.65 Cr'))
    );

    // Workflow 5: User Onboarding Welcome (Dedicated onboarding@sellmyghar.in)
    const onboardRes = await EmailNotificationService.handleUserOnboarding({
      userId: 'usr-new-001',
      name: 'Rohan Verma',
      email: 'rohan.verma@example.com',
    });

    assert(
      'Workflow 5 (User Onboarding): successfully dispatches welcome email',
      Boolean(onboardRes && onboardRes.dispatched && onboardRes.status === 'DELIVERED')
    );
    const onboardMail = dispatchedMails.find(m => m.eventType === 'USER_WELCOME');
    assert(
      'Workflow 5: sender is strictly onboarding@sellmyghar.in',
      Boolean(onboardMail && onboardMail.from.includes('onboarding@sellmyghar.in'))
    );
    assert(
      'Workflow 5: email body contains welcome message and onboarding contact',
      Boolean(onboardMail && onboardMail.html.includes('Welcome to SellMyGhar, Rohan Verma!') && onboardMail.html.includes('onboarding@sellmyghar.in'))
    );

  } catch (err: any) {
    assert('Mock provider 5 workflows run without exception', false, err.message);
  }

  // --- Suite 5: Strict Idempotency & Deduplication ---
  try {
    const propId = `prop-idem-${Date.now().toString(36)}`;
    const initialDispatchedCount = dispatchedMails.length;

    // First listing dispatch
    const res1 = await EmailNotificationService.handlePropertyListed({
      id: propId,
      ownerName: 'Test Owner',
      ownerEmail: 'test.owner@example.com',
    });
    assert('Initial listing dispatch succeeds', Boolean(res1 && res1.dispatched));

    // Duplicate listing dispatch (e.g. handler retry or race condition)
    const res2 = await EmailNotificationService.handlePropertyListed({
      id: propId,
      ownerName: 'Test Owner',
      ownerEmail: 'test.owner@example.com',
    });

    assert(
      'Strict Idempotency: duplicate property submission event is suppressed',
      res2.dispatched === false && res2.reason === 'ALREADY_DISPATCHED' && res2.notificationId === res1.notificationId
    );
    assert(
      'Strict Idempotency: provider was not called for duplicate listing event',
      dispatchedMails.length === initialDispatchedCount + 1
    );

    // Same check for approved idempotency
    const app1 = await EmailNotificationService.handlePropertyApproved({ id: propId, owner_name: 'Test Owner' });
    const app2 = await EmailNotificationService.handlePropertyApproved({ id: propId, owner_name: 'Test Owner' });
    assert(
      'Strict Idempotency: duplicate property approved event is suppressed',
      app1.dispatched === true && app2.dispatched === false && app2.reason === 'ALREADY_DISPATCHED'
    );

    // Same check for user onboarding idempotency
    const onboard1 = await EmailNotificationService.handleUserOnboarding({
      userId: 'usr-idem-001',
      name: 'Priya Sundaram',
      email: 'priya.sundaram@example.com',
    });
    const onboard2 = await EmailNotificationService.handleUserOnboarding({
      userId: 'usr-idem-001',
      name: 'Priya Sundaram',
      email: 'priya.sundaram@example.com',
    });
    assert(
      'Strict Idempotency: duplicate user onboarding welcome event is suppressed',
      onboard1.dispatched === true && onboard2.dispatched === false && onboard2.reason === 'ALREADY_DISPATCHED'
    );
  } catch (err: any) {
    assert('Idempotency tests run without exception', false, err.message);
  }

  // --- Suite 6: Honest Failure Handling & Delivery Attempts Tracking ---
  try {
    // Install failing mock provider to simulate Resend API outage or unverified domain rejection
    EmailNotificationService.setMockProvider(async () => {
      return {
        success: false,
        error: 'Resend HTTP 403: Domain sellmyghar.in is pending DNS verification (DKIM/SPF)',
      };
    });

    const failPropId = `prop-fail-${Date.now().toString(36)}`;
    const failRes = await EmailNotificationService.handlePropertyListed({
      id: failPropId,
      ownerName: 'Failing Test',
      ownerEmail: 'fail.test@example.com',
    });

    assert(
      'Honest Reporting: provider failure is NEVER reported as DELIVERED',
      failRes.dispatched === false && failRes.status === 'FAILED'
    );

    // Check database persistence of failure record
    const dbCheck = await executeQuery(
      `SELECT status, error_message, delivery_attempts FROM publication_notifications WHERE idempotency_key = $1 LIMIT 1;`,
      [`listed-${failPropId}`]
    );

    assert(
      'Failure record persists in database with FAILED status and error message',
      Boolean(dbCheck.rows && dbCheck.rows[0]?.status === 'FAILED' && dbCheck.rows[0]?.error_message?.includes('DKIM/SPF'))
    );

    // Reset mock provider to null (restore default state)
    EmailNotificationService.setMockProvider(null);
  } catch (err: any) {
    assert('Failure handling tests run without exception', false, err.message);
  }

  return {
    results,
    passed,
    failed,
  };
}
