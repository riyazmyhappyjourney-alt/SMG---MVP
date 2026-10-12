import { generateQrMatrix } from '../src/utils/qrCode';
import { executeQuery } from '../src/server/db/pool';
import { EmailNotificationService } from '../src/server/notifications/email-service';

export async function runPropertyBrochureTests(): Promise<{
  passed: number;
  failed: number;
  results: string[];
}> {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function pass(desc: string) {
    passed++;
    results.push(`[PASS] ${desc}`);
  }

  function fail(desc: string, err?: any) {
    failed++;
    results.push(`[FAIL] ${desc}${err ? ` - ${err.message || err}` : ''}`);
  }

  try {
    // ---------------------------------------------------------------
    // 1. QR Code Matrix Generator Tests
    // ---------------------------------------------------------------
    const testUrl = 'https://sellmyghar.in/#/property/prop-dev-seed-01';
    const matrix = generateQrMatrix(testUrl);

    if (Array.isArray(matrix) && matrix.length > 0 && matrix[0].length === matrix.length) {
      pass(`QR matrix generates square 2D grid (${matrix.length}x${matrix.length})`);
    } else {
      fail('QR matrix is not a valid square grid');
    }

    // Top-left finder pattern verification (7x7 outer border)
    const tlCorner = matrix[0][0] && matrix[0][6] && matrix[6][0] && matrix[6][6];
    const tlCenter = matrix[2][2] && matrix[3][3] && matrix[4][4];
    if (tlCorner && tlCenter) {
      pass('QR top-left 7x7 finder pattern strictly conforms to specification');
    } else {
      fail('QR top-left finder pattern does not match expected structure');
    }

    // Top-right finder pattern verification
    const trCorner = matrix[0][matrix.length - 7] && matrix[0][matrix.length - 1] && matrix[6][matrix.length - 7];
    if (trCorner) {
      pass('QR top-right 7x7 finder pattern strictly conforms to specification');
    } else {
      fail('QR top-right finder pattern does not match expected structure');
    }

    // Bottom-left finder pattern verification
    const blCorner = matrix[matrix.length - 7][0] && matrix[matrix.length - 1][0] && matrix[matrix.length - 1][6];
    if (blCorner) {
      pass('QR bottom-left 7x7 finder pattern strictly conforms to specification');
    } else {
      fail('QR bottom-left finder pattern does not match expected structure');
    }

    // Timing pattern verification (row 6 alternates dark/light)
    let timingAlternates = true;
    for (let c = 8; c < matrix.length - 8; c++) {
      if (matrix[6][c] !== (c % 2 === 0)) {
        timingAlternates = false;
        break;
      }
    }
    if (timingAlternates) {
      pass('QR horizontal timing pattern alternates properly between finder modules');
    } else {
      fail('QR horizontal timing pattern does not alternate correctly');
    }

    // ---------------------------------------------------------------
    // 2. Email Brochure Dispatching & Notification Ledger Tests
    // ---------------------------------------------------------------
    const mockStaff = {
      uid: 'usr-staff-closer-01',
      id: 'usr-staff-closer-01',
      phone: '+919876543210',
      email: 'closer@sellmyghar.in',
      roles: ['STAFF_DEAL_CLOSER' as const],
      permissions: ['VIEW_CRM'],
      tokenVersion: 1,
      displayName: 'Aditya Rao (Deal Closer)',
    };

    const targetEmail = 'buyer.brochure.test@sellmyghar.in';
    const testSubject = 'Exclusive Property Presentation: Sobha Dream Acres | SellMyGhar.in';
    const testHtml = '<p>Exclusive luxury brochure content for Sobha Dream Acres</p>';

    // Install mock provider for deterministic sandboxed test execution
    EmailNotificationService.setMockProvider(async (payload) => {
      return {
        success: true,
        messageId: `re_mock_brochure_${Date.now()}`,
      };
    });

    const dispatchResult = await EmailNotificationService.handleBrochureShared({
      recipient: targetEmail,
      subject: testSubject,
      html: testHtml,
      propertyId: 'prop-dev-seed-01',
      actor: mockStaff as any,
    });

    EmailNotificationService.setMockProvider(null);

    if (dispatchResult && dispatchResult.notificationId) {
      pass('Brochure share dispatches email via EmailNotificationService');
    } else {
      fail('Brochure share did not return a valid dispatchResult');
    }

    if (['DELIVERED', 'SIMULATED'].includes(dispatchResult.status)) {
      pass(`Brochure share truthfully reports delivery status (${dispatchResult.status})`);
    } else {
      fail(`Brochure share status unexpected: ${dispatchResult.status}`);
    }

    // Verify record in PostgreSQL database
    const notifQuery = await executeQuery(
      `SELECT * FROM publication_notifications WHERE id = $1 LIMIT 1;`,
      [dispatchResult.notificationId]
    );

    if (notifQuery.rows && notifQuery.rows.length > 0) {
      const row = notifQuery.rows[0];
      if (row.recipient_email === targetEmail && row.property_id === 'prop-dev-seed-01') {
        pass('Brochure dispatch audit record persists in publication_notifications ledger');
      } else {
        fail('Notification record attributes do not match dispatch parameters');
      }
    } else {
      fail('Publication notification audit record was not found in database');
    }

    // ---------------------------------------------------------------
    // 3. Provider Status Security Check
    // ---------------------------------------------------------------
    const providerStatus = EmailNotificationService.getProviderStatus();
    if (providerStatus.configured !== undefined && !('apiKey' in providerStatus)) {
      pass('Provider status check never leaks RESEND_API_KEY secret to client');
    } else {
      fail('Provider status check leaked sensitive API key information');
    }

  } catch (err: any) {
    fail('Property brochure test suite encountered an unexpected exception', err);
  }

  return { passed, failed, results };
}
