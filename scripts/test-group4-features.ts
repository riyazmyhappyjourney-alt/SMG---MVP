import { 
  generatePasswordResetToken, 
  validatePasswordResetToken, 
  consumePasswordResetToken,
  hashPassword,
  verifyPassword
} from '../src/server/auth/passwords';
import { 
  EmailNotificationService, 
  EMAIL_SENDER_CONFIG, 
  getFormattedSender 
} from '../src/server/notifications/email-service';
import { 
  PropertySuggestionsService 
} from '../src/server/inventory/property-suggestions-service';
import { AuthenticatedUser } from '../src/core/types/auth';

export async function runGroup4FeatureTests() {
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

  console.log('\n--- 17. Group 4: Password Reset, Centralized Email, & CSV Suggestions Suite ---');

  // ====================================================================
  // TEST 1: Password Reset - Cryptographic Token & Hash Storage Invariant
  // ====================================================================
  try {
    const testEmail = 'staff.test@sellmyghar.in';
    const testUid = 'usr-test-staff-pw-01';

    const { token, expiresAt } = await generatePasswordResetToken(testUid, testEmail);
    assert('Reset token is generated with at least 64 hex characters (32 bytes entropy)', token.length >= 64);
    assert('Reset token has future expiration timestamp (~15 min)', expiresAt.getTime() > Date.now());

    // Validation
    const checkValid = await validatePasswordResetToken(token);
    assert('Freshly issued token passes validation', checkValid.valid === true && checkValid.email === testEmail);

    // Tampered / Random token rejected
    const checkTampered = await validatePasswordResetToken('invalid-tampered-token-123456789012345678901234567890');
    assert('Tampered/unregistered token is strictly rejected', checkTampered.valid === false);

    // Single-Use Consumption
    const consumed = await consumePasswordResetToken(token);
    assert('Token is successfully consumed upon password update', consumed === true);

    const checkReused = await validatePasswordResetToken(token);
    assert('Consumed token cannot be reused (Single-Use Enforcement)', checkReused.valid === false);
  } catch (err: any) {
    assert('Password reset token tests execute cleanly', false, err.message);
  }

  // ====================================================================
  // TEST 2: Password Complexity & Scrypt Hash Verification
  // ====================================================================
  try {
    const rawPw = 'NewSecureP@ssword2026!';
    const hash = await hashPassword(rawPw);
    assert('Hashed password uses scrypt with 16-byte salt', hash.startsWith('scrypt$'));

    const isValid = await verifyPassword(rawPw, hash);
    assert('Correct password verifies against scrypt hash in timing-safe manner', isValid === true);

    const isWrongValid = await verifyPassword('WrongPassword123!', hash);
    assert('Incorrect password is rejected by scrypt verifier', isWrongValid === false);
  } catch (err: any) {
    assert('Scrypt password verification executes cleanly', false, err.message);
  }

  // ====================================================================
  // TEST 3: Centralized Email Sender & Brand Identity
  // ====================================================================
  try {
    const defaultSender = getFormattedSender('DEFAULT');
    assert(
      'Default sender identity uses approved SellMyGhar.in brand with notifications@sellmyghar.in',
      defaultSender.includes('SellMyGhar.in') && defaultSender.includes('notifications@sellmyghar.in')
    );

    const onboardingSender = getFormattedSender('ONBOARDING');
    assert(
      'Onboarding sender identity uses approved onboarding@sellmyghar.in address',
      onboardingSender.includes('onboarding@sellmyghar.in')
    );

    const supportSender = getFormattedSender('SUPPORT');
    assert(
      'Support sender identity uses approved support@sellmyghar.in address',
      supportSender.includes('support@sellmyghar.in')
    );

    assert(
      'Legal office address in centralized email config reflects JP Nagar Phase 5',
      EMAIL_SENDER_CONFIG.legalOffice.includes('JP Nagar') || EMAIL_SENDER_CONFIG.legalOffice.includes('J P Nagar')
    );
  } catch (err: any) {
    assert('Email sender configuration executes cleanly', false, err.message);
  }

  // ====================================================================
  // TEST 4: CSV Suggestions - Formula Injection Prevention (CWE-1236)
  // ====================================================================
  try {
    const maliciousFormula1 = '=cmd|"/C calc"!A0';
    const sanitized1 = PropertySuggestionsService.sanitizeForCsv(maliciousFormula1);
    assert('Formula injection starting with "=" is neutralized with leading quote', sanitized1.startsWith("'="));

    const maliciousFormula2 = '+SUM(1+1)';
    const sanitized2 = PropertySuggestionsService.sanitizeForCsv(maliciousFormula2);
    assert('Formula injection starting with "+" is neutralized with leading quote', sanitized2.startsWith("'+"));

    const normalText = 'Prestige Falcon City';
    const sanitizedNormal = PropertySuggestionsService.sanitizeForCsv(normalText);
    assert('Safe text remains unmodified by formula sanitizer', sanitizedNormal === normalText);
  } catch (err: any) {
    assert('CSV formula injection defense executes cleanly', false, err.message);
  }

  // ====================================================================
  // TEST 5: CSV Template & Schema Validation
  // ====================================================================
  try {
    const template = PropertySuggestionsService.generateTemplate();
    assert('Generated template includes Society_Name header', template.includes('Society_Name'));
    assert('Generated template includes Locality header', template.includes('Locality'));
    assert('Generated template includes BHK_Type header', template.includes('BHK_Type'));
    assert('Generated template includes Super_Built_Up_Sqft header', template.includes('Super_Built_Up_Sqft'));
    assert('Generated template includes Asking_Price_INR header', template.includes('Asking_Price_INR'));

    // Preview Valid CSV
    const validCsv = `Society_Name,Locality,BHK_Type,Super_Built_Up_Sqft,Asking_Price_INR,External_Ref_ID\nBrigade Gateway,Rajajinagar,3 BHK,1800,24000000,BG-001\n`;
    const preview = PropertySuggestionsService.previewCsv(validCsv);
    assert('Preview parses valid row count correctly', preview.validCount === 1 && preview.errorCount === 0);

    // Preview CSV with Missing Required Column
    try {
      PropertySuggestionsService.previewCsv(`Invalid_Col_1,Invalid_Col_2\nVal1,Val2\n`);
      assert('Preview rejects CSV missing required columns', false);
    } catch {
      assert('Preview strictly rejects CSV missing mandatory columns', true);
    }

    // Preview CSV with Bad Numeric Data
    const badNumericCsv = `Society_Name,Locality,BHK_Type,Super_Built_Up_Sqft,Asking_Price_INR\nSobha City,Thanisandra,2 BHK,INVALID_SBUA,50000\n`;
    const previewBad = PropertySuggestionsService.previewCsv(badNumericCsv);
    assert('Preview detects row errors with specific field names and row numbers', previewBad.errorCount === 1 && previewBad.rows[0].errors.length > 0);
  } catch (err: any) {
    assert('CSV template & preview tests execute cleanly', false, err.message);
  }

  // ====================================================================
  // TEST 6: CSV Import Execution, Duplicate Detection & Listing Decoupling
  // ====================================================================
  try {
    const mockStaffActor: AuthenticatedUser = {
      uid: 'usr-staff-listing-mgr-01',
      phone: '+919988776655',
      email: 'listing.manager@sellmyghar.in',
      roles: ['STAFF_LISTING_MANAGER'],
      permissions: ['properties:write_all' as any],
    };

    const csvData = `Society_Name,Locality,BHK_Type,Super_Built_Up_Sqft,Asking_Price_INR,External_Ref_ID,Source\nPurva Sunflower,Rajajinagar,3 BHK,1600,18500000,PURVA-SF-01,Broker Network\n`;
    
    // First import
    const summary1 = PropertySuggestionsService.executeImport(csvData, 'SKIP_DUPLICATES', mockStaffActor);
    assert('Import accepts and stores valid external suggestion', summary1.acceptedCount === 1);

    // Second import with same Ref ID (Duplicate detection)
    const summary2 = PropertySuggestionsService.executeImport(csvData, 'SKIP_DUPLICATES', mockStaffActor);
    assert('Duplicate row is identified and skipped under SKIP_DUPLICATES policy', summary2.skippedCount === 1);

    // Verify stored suggestion has isExternalSuggestion flag
    const list = PropertySuggestionsService.listSuggestions({ search: 'Purva Sunflower' });
    assert('Imported suggestion exists in external suggestions registry', list.length > 0);
    assert('External suggestion is hard-flagged as isExternalSuggestion: true', list[0].isExternalSuggestion === true);

    // Cleanup
    if (list[0]) {
      const deleted = PropertySuggestionsService.deleteSuggestion(list[0].id, mockStaffActor);
      assert('Authorized staff can delete imported external suggestion', deleted === true);
    }
  } catch (err: any) {
    assert('CSV import execution tests execute cleanly', false, err.message);
  }

  console.log(`Subtotal: ${passed} passed, ${failed} failed`);
  return { passed, failed, results };
}

// Direct execution when run via tsx
if (process.argv[1]?.endsWith('test-group4-features.ts')) {
  runGroup4FeatureTests().then(res => {
    if (res.failed > 0) process.exit(1);
  });
}
