import { runConfigTests } from '../src/server/config/config.test';
import { runAuthorizationTests } from '../src/server/auth/rbac.test';
import { runConsentLifecycleTests } from '../src/server/compliance/consent.test';
import { runErasureTests } from '../src/server/compliance/erasure.test';
import { runDocumentVerificationTests } from '../src/server/storage/document-verification.test';
import { runSecurityRegressionTests } from '../src/server/auth/security-regression.test';
import { runHttpIntegrationTests } from './run-http-integration-tests';
import { runCrmWorkflowTests } from './run-crm-workflow-tests';
import { runPropertyDetailTests } from './run-property-detail-tests';
import { runCrmPropertyManagementTests } from './run-crm-property-management-tests';
import { runAuthIntegrationTests } from './run-auth-integration-tests';

async function runAll() {
  console.log('====================================================');
  console.log('   SellMyGhar Full Backend & Security Regression Suite');
  console.log('====================================================\n');

  let totalPassed = 0;
  let totalFailed = 0;
  const suiteResults: { name: string; passed: number; failed: number; tests: string[] }[] = [];

  // Suite 1: Configuration & Fail-Closed Gate
  console.log('--- 1. Configuration Fail-Closed Suite ---');
  const configRes = runConfigTests();
  configRes.results.forEach(r => console.log(' ', r));
  totalPassed += configRes.passed;
  totalFailed += configRes.failed;
  suiteResults.push({ name: 'Config Fail-Closed', passed: configRes.passed, failed: configRes.failed, tests: configRes.results });
  console.log(`Subtotal: ${configRes.passed} passed, ${configRes.failed} failed\n`);

  // Suite 2: RBAC & IDOR Defense
  console.log('--- 2. RBAC & IDOR Access Control Suite ---');
  const rbacRes = runAuthorizationTests();
  rbacRes.results.forEach(r => console.log(' ', r));
  totalPassed += rbacRes.passed;
  totalFailed += rbacRes.failed;
  suiteResults.push({ name: 'RBAC & IDOR Access Control', passed: rbacRes.passed, failed: rbacRes.failed, tests: rbacRes.results });
  console.log(`Subtotal: ${rbacRes.passed} passed, ${rbacRes.failed} failed\n`);

  // Suite 3: Consent Lifecycle & Outreach Gatekeeper
  console.log('--- 3. DPDP Act Consent Lifecycle & Outreach Suite ---');
  const consentRes = await runConsentLifecycleTests();
  consentRes.results.forEach(r => console.log(' ', r));
  totalPassed += consentRes.passed;
  totalFailed += consentRes.failed;
  suiteResults.push({ name: 'Consent Lifecycle & Outreach', passed: consentRes.passed, failed: consentRes.failed, tests: consentRes.results });
  console.log(`Subtotal: ${consentRes.passed} passed, ${consentRes.failed} failed\n`);

  // Suite 4: DPDP Section 12 Data Erasure
  console.log('--- 4. DPDP Act Section 12 Data Erasure Suite ---');
  const erasureRes = await runErasureTests();
  erasureRes.results.forEach(r => console.log(' ', r));
  totalPassed += erasureRes.passed;
  totalFailed += erasureRes.failed;
  suiteResults.push({ name: 'DPDP Section 12 Erasure', passed: erasureRes.passed, failed: erasureRes.failed, tests: erasureRes.results });
  console.log(`Subtotal: ${erasureRes.passed} passed, ${erasureRes.failed} failed\n`);

  // Suite 5: Storage & Document Tamper-Proofing
  console.log('--- 5. Document Tamper-Proofing & Verification Suite ---');
  const docRes = await runDocumentVerificationTests();
  docRes.results.forEach(r => console.log(' ', r));
  totalPassed += docRes.passed;
  totalFailed += docRes.failed;
  suiteResults.push({ name: 'Document Tamper-Proofing', passed: docRes.passed, failed: docRes.failed, tests: docRes.results });
  console.log(`Subtotal: ${docRes.passed} passed, ${docRes.failed} failed\n`);

  // Suite 6: Phase 20 Security & Architectural Regression Suite
  console.log('--- 6. Security & Architectural Regression Suite ---');
  const secRes = await runSecurityRegressionTests();
  secRes.results.forEach(r => console.log(' ', r));
  totalPassed += secRes.passed;
  totalFailed += secRes.failed;
  suiteResults.push({ name: 'Security & Architectural Regression', passed: secRes.passed, failed: secRes.failed, tests: secRes.results });
  console.log(`Subtotal: ${secRes.passed} passed, ${secRes.failed} failed\n`);

  // Suite 7: Live Express HTTP Route Integration Suite
  console.log('--- 7. Live Express HTTP Route Integration Suite ---');
  const httpRes = await runHttpIntegrationTests();
  httpRes.results.forEach(r => console.log(' ', r));
  totalPassed += httpRes.passed;
  totalFailed += httpRes.failed;
  suiteResults.push({ name: 'Live Express HTTP Route Integration', passed: httpRes.passed, failed: httpRes.failed, tests: httpRes.results });
  console.log(`Subtotal: ${httpRes.passed} passed, ${httpRes.failed} failed\n`);

  // Suite 8: CRM Core Operational Workflow Suite
  console.log('--- 8. CRM Core Operational Workflow Suite ---');
  const crmRes = await runCrmWorkflowTests();
  crmRes.results.forEach(r => console.log(' ', r));
  totalPassed += crmRes.passed;
  totalFailed += crmRes.failed;
  suiteResults.push({ name: 'CRM Core Operational Workflow', passed: crmRes.passed, failed: crmRes.failed, tests: crmRes.results });
  console.log(`Subtotal: ${crmRes.passed} passed, ${crmRes.failed} failed\n`);

  // Suite 9: Public Property Detail & Enquiry Suite
  console.log('--- 9. Public Property Detail & Privacy-Safe Enquiry Suite ---');
  const propRes = await runPropertyDetailTests();
  propRes.results.forEach(r => console.log(' ', r));
  totalPassed += propRes.passed;
  totalFailed += propRes.failed;
  suiteResults.push({ name: 'Public Property Detail & Enquiry', passed: propRes.passed, failed: propRes.failed, tests: propRes.results });
  console.log(`Subtotal: ${propRes.passed} passed, ${propRes.failed} failed\n`);

  // Suite 10: Phase 2 CRM Property Management Suite
  console.log('--- 10. Phase 2 CRM Property Management & Public Sync Suite ---');
  const propMgmtRes = await runCrmPropertyManagementTests();
  propMgmtRes.results.forEach(r => console.log(' ', r));
  totalPassed += propMgmtRes.passed;
  totalFailed += propMgmtRes.failed;
  suiteResults.push({ name: 'CRM Property Management', passed: propMgmtRes.passed, failed: propMgmtRes.failed, tests: propMgmtRes.results });
  console.log(`Subtotal: ${propMgmtRes.passed} passed, ${propMgmtRes.failed} failed\n`);

  // Suite 11: Production Authentication & Session Hardening Suite
  console.log('--- 11. Production Authentication & Session Hardening Suite ---');
  const authRes = await runAuthIntegrationTests();
  authRes.results.forEach(r => console.log(' ', r));
  totalPassed += authRes.passed;
  totalFailed += authRes.failed;
  suiteResults.push({ name: 'Production Authentication Hardening', passed: authRes.passed, failed: authRes.failed, tests: authRes.results });
  console.log(`Subtotal: ${authRes.passed} passed, ${authRes.failed} failed\n`);

  console.log('====================================================');
  console.log(`FINAL RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED (TOTAL: ${totalPassed + totalFailed}/${totalPassed + totalFailed})`);
  console.log('====================================================');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAll().catch(err => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
