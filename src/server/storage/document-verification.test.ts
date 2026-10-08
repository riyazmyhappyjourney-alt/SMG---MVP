import { PostUploadVerificationWorker } from './post-upload-worker';
import { AuthenticatedUser } from '../../core/types/auth';
import { setTestQueryHandler } from '../db/pool';
import { createHash } from 'crypto';

/**
 * Document Tamper-Proofing, SHA-256 Checksum & IDOR Test Suite
 * 
 * Verifies:
 * 1. Valid PDF generates real 64-char SHA-256 checksum and passes clean scan.
 * 2. Checksum tamper attempt (mismatch) fails closed.
 * 3. Spoofed extension with invalid magic bytes fails closed.
 * 4. IDOR Defense: Cross-tenant upload attempt is rejected with IDOR_FORBIDDEN.
 * 5. Legitimate owner upload succeeds and records document hash in ledger.
 * 6. Malicious script token in PDF triggers antivirus/heuristic rejection.
 */

export async function runDocumentVerificationTests(): Promise<{ passed: number; failed: number; results: string[] }> {
  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      passed++;
      results.push(`[PASS] ${testName}`);
    } else {
      failed++;
      results.push(`[FAIL] ${testName}`);
      console.error(`Assertion failed: ${testName}`);
    }
  };

  // Mock Property Ownership Map
  const propertyOwnerMap: Record<string, string> = {
    'prop-legit-owner-101': 'usr-owner-alice',
    'prop-victim-owner-202': 'usr-owner-bob',
  };

  // Configure test double query handler
  setTestQueryHandler(async (sql, params) => {
    // 1. Intercept Property Ownership Check
    if (sql.includes('SELECT owner_id FROM properties WHERE id = $1')) {
      const [propertyId] = params as [string];
      const ownerId = propertyOwnerMap[propertyId];
      return ownerId ? { rows: [{ owner_id: ownerId }] } : { rows: [] };
    }

    // 2. Intercept Document Update
    if (sql.includes('UPDATE documents')) {
      return { rows: [{ id: 'doc-updated-ok' }] };
    }

    return null;
  });

  try {
    const ownerAlice: AuthenticatedUser = {
      uid: 'usr-owner-alice',
      phone: '+919876500111',
      email: 'alice@example.com',
      roles: ['OWNER'],
      permissions: [],
    };

    const attackerCharlie: AuthenticatedUser = {
      uid: 'usr-attacker-charlie',
      phone: '+919876599999',
      email: 'charlie@example.com',
      roles: ['OWNER'],
      permissions: [],
    };

    // Valid Sample PDF buffer with %PDF-1.4 header
    const validPdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Bengaluru Sale Deed) >>\nendobj\ntrailer\n<< /Size 1 >>\n%%EOF');
    const validPdfSha256 = createHash('sha256').update(validPdfBytes).digest('hex');

    // TEST 1: Valid PDF with correct magic bytes and matching SHA-256
    const res1 = await PostUploadVerificationWorker.processFinalizedUpload(
      'sale_deed_flat_402.pdf',
      validPdfBytes,
      {
        documentId: 'doc-8812',
        propertyId: 'prop-legit-owner-101',
        uploader: ownerAlice,
        expectedSha256: validPdfSha256,
      }
    );
    assert(
      res1.status === 'CLEAN_VERIFIED' &&
      res1.sha256Checksum === validPdfSha256 &&
      res1.documentUpdated === true,
      'TEST 1: Valid PDF generates SHA-256 checksum and updates document ledger for property owner'
    );

    // TEST 2: Tamper Detection — Mismatched expected SHA-256 checksum
    const forgedExpectedSha256 = '0000000000000000000000000000000000000000000000000000000000000000';
    const res2 = await PostUploadVerificationWorker.processFinalizedUpload(
      'sale_deed_flat_402.pdf',
      validPdfBytes,
      {
        documentId: 'doc-8812',
        propertyId: 'prop-legit-owner-101',
        uploader: ownerAlice,
        expectedSha256: forgedExpectedSha256,
      }
    );
    assert(
      res2.status === 'REJECTED' &&
      Boolean(res2.reason?.includes('CHECKSUM_MISMATCH')),
      'TEST 2: Checksum mismatch triggers immediate tamper rejection (CHECKSUM_MISMATCH)'
    );

    // TEST 3: Magic Byte Mismatch (spoofed extension)
    const fakePdfBytes = Buffer.from('Plain text file masquerading as a legal deed');
    const res3 = await PostUploadVerificationWorker.processFinalizedUpload(
      'fake_khata.pdf',
      fakePdfBytes
    );
    assert(
      res3.status === 'REJECTED' &&
      Boolean(res3.reason?.includes('Magic byte mismatch')),
      'TEST 3: Non-PDF payload with .pdf extension fails magic byte inspection'
    );

    // TEST 4: IDOR Defense — Attacker attempts to attach document to victim's property
    const res4 = await PostUploadVerificationWorker.processFinalizedUpload(
      'fraudulent_encumbrance.pdf',
      validPdfBytes,
      {
        documentId: 'doc-fraud-01',
        propertyId: 'prop-victim-owner-202', // Owned by Bob, not Charlie!
        uploader: attackerCharlie,
        expectedSha256: validPdfSha256,
      }
    );
    assert(
      res4.status === 'REJECTED' &&
      Boolean(res4.reason?.includes('IDOR_FORBIDDEN')),
      'TEST 4: Cross-tenant upload attempt is blocked by IDOR asset ownership check'
    );

    // TEST 5: Malicious Script Injection Detection
    const maliciousPdfBytes = Buffer.from('%PDF-1.4\n<script>eval(maliciousPayload)</script>\n%%EOF');
    const res5 = await PostUploadVerificationWorker.processFinalizedUpload(
      'exploit.pdf',
      maliciousPdfBytes
    );
    assert(
      res5.status === 'REJECTED' &&
      Boolean(res5.reason?.includes('Malware detected by Antivirus Engine')),
      'TEST 5: PDF containing embedded script token is rejected by antivirus/heuristic scanner'
    );
  } finally {
    setTestQueryHandler(null);
  }

  return { passed, failed, results };
}
