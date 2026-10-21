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
import { runHomepageCmsSeoTests } from './run-homepage-cms-seo-tests';
import { runEmailAutomationTests } from './run-email-automation-tests';
import { runPropertyBrochureTests } from './run-property-brochure-tests';
import { runApprovalAndImageFixTests } from './run-approval-image-fix-tests';
import { runFooterAndHeroFixTests } from './test-footer-and-hero-fix';
import { runGroup4FeatureTests } from './test-group4-features';
import { runGroup1SecurityHardeningTests } from './test-group1-security-hardening';
import { runGroup2RlsAndStorageTests } from './test-group2-rls-storage-hardening';
import { runGroup3PrivacyAnalyticsTests } from './test-group3-privacy-analytics';
import { runGroup4SeoMetadataTests } from './test-group4-seo-metadata';
import { runPropertySubmissionFixTests } from './test-property-submission-fix';
import { runSellMyGharEnhancementTests } from './test-sellmyghar-enhancements';
import { runMasterBugfixRegressionTests } from './test-master-bugfix-regression';
import { runAuthAndNotificationTests } from './test-auth-registration-and-notifications';

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

  // Suite 12: Homepage CMS, Email Notification & Locality SEO Suite
  console.log('--- 12. Homepage CMS, Email Notifications & Locality SEO Suite ---');
  const cmsSeoRes = await runHomepageCmsSeoTests();
  cmsSeoRes.results.forEach(r => console.log(' ', r));
  totalPassed += cmsSeoRes.passed;
  totalFailed += cmsSeoRes.failed;
  suiteResults.push({ name: 'Homepage CMS, Email Notifications & Locality SEO', passed: cmsSeoRes.passed, failed: cmsSeoRes.failed, tests: cmsSeoRes.results });
  console.log(`Subtotal: ${cmsSeoRes.passed} passed, ${cmsSeoRes.failed} failed\n`);

  // Suite 13: Complete Email Automation & Resale Workflows Suite
  console.log('--- 13. SellMyGhar Complete Email Automation & Resale Workflows Suite ---');
  const emailRes = await runEmailAutomationTests();
  emailRes.results.forEach(r => console.log(' ', r));
  totalPassed += emailRes.passed;
  totalFailed += emailRes.failed;
  suiteResults.push({ name: 'Complete Email Automation & Resale Workflows', passed: emailRes.passed, failed: emailRes.failed, tests: emailRes.results });
  console.log(`Subtotal: ${emailRes.passed} passed, ${emailRes.failed} failed\n`);

  // Suite 14: Property Presentation PDF Generator Suite
  console.log('--- 14. Property Presentation PDF Generator & QR Suite ---');
  const brochureRes = await runPropertyBrochureTests();
  brochureRes.results.forEach(r => console.log(' ', r));
  totalPassed += brochureRes.passed;
  totalFailed += brochureRes.failed;
  suiteResults.push({ name: 'Property Presentation PDF Generator & QR', passed: brochureRes.passed, failed: brochureRes.failed, tests: brochureRes.results });
  console.log(`Subtotal: ${brochureRes.passed} passed, ${brochureRes.failed} failed\n`);

  // Suite 15: Property Approval Email & Image Upload Reliability Suite
  console.log('--- 15. Property Approval Email & Image Upload Reliability Suite ---');
  const approvalImgRes = await runApprovalAndImageFixTests();
  approvalImgRes.results.forEach(r => console.log(' ', r));
  totalPassed += approvalImgRes.passed;
  totalFailed += approvalImgRes.failed;
  suiteResults.push({ name: 'Property Approval Email & Image Upload Reliability', passed: approvalImgRes.passed, failed: approvalImgRes.failed, tests: approvalImgRes.results });
  console.log(`Subtotal: ${approvalImgRes.passed} passed, ${approvalImgRes.failed} failed\n`);

  // Suite 16: Footer Redesign & Hero Image Flash Fix Suite
  console.log('--- 16. Footer Redesign & Hero Image Flash Fix Suite ---');
  const footerHeroRes = await runFooterAndHeroFixTests();
  footerHeroRes.results.forEach(r => console.log(' ', r));
  totalPassed += footerHeroRes.passed;
  totalFailed += footerHeroRes.failed;
  suiteResults.push({ name: 'Footer Redesign & Hero Image Flash Fix', passed: footerHeroRes.passed, failed: footerHeroRes.failed, tests: footerHeroRes.results });
  console.log(`Subtotal: ${footerHeroRes.passed} passed, ${footerHeroRes.failed} failed\n`);

  // Suite 17: Group 4 Features (Password Reset, Centralized Email Sender & CSV Suggestions)
  const group4Res = await runGroup4FeatureTests();
  group4Res.results.forEach(r => console.log(' ', r));
  totalPassed += group4Res.passed;
  totalFailed += group4Res.failed;
  suiteResults.push({ name: 'Group 4: Password Reset, Centralized Email, & CSV Suggestions', passed: group4Res.passed, failed: group4Res.failed, tests: group4Res.results });
  console.log(`Subtotal: ${group4Res.passed} passed, ${group4Res.failed} failed\n`);

  // Suite 18: Group 1 Security Hardening (Clickjacking, CORS & Anti-CSRF)
  const group1Res = await runGroup1SecurityHardeningTests();
  group1Res.results.forEach(r => console.log(' ', r));
  totalPassed += group1Res.passed;
  totalFailed += group1Res.failed;
  suiteResults.push({ name: 'Group 1: Security Hardening (Clickjacking, CORS & Anti-CSRF)', passed: group1Res.passed, failed: group1Res.failed, tests: group1Res.results });
  console.log(`Subtotal: ${group1Res.passed} passed, ${group1Res.failed} failed\n`);

  // Suite 19: Group 2 Database RLS & Storage Hardening
  const group2Res = await runGroup2RlsAndStorageTests();
  group2Res.results.forEach(r => console.log(' ', r));
  totalPassed += group2Res.passed;
  totalFailed += group2Res.failed;
  suiteResults.push({ name: 'Group 2: Database RLS & Storage Hardening', passed: group2Res.passed, failed: group2Res.failed, tests: group2Res.results });
  console.log(`Subtotal: ${group2Res.passed} passed, ${group2Res.failed} failed\n`);

  // Suite 20: Group 3 Privacy-Preserving Web Analytics
  const group3Res = await runGroup3PrivacyAnalyticsTests();
  group3Res.results.forEach(r => console.log(' ', r));
  totalPassed += group3Res.passed;
  totalFailed += group3Res.failed;
  suiteResults.push({ name: 'Group 3: Privacy-Preserving Web Analytics', passed: group3Res.passed, failed: group3Res.failed, tests: group3Res.results });
  console.log(`Subtotal: ${group3Res.passed} passed, ${group3Res.failed} failed\n`);

  // Suite 21: Group 4 Technical SEO, Structured Data & Metadata
  const group4SeoRes = await runGroup4SeoMetadataTests();
  group4SeoRes.results.forEach(r => console.log(' ', r));
  totalPassed += group4SeoRes.passed;
  totalFailed += group4SeoRes.failed;
  suiteResults.push({ name: 'Group 4: Technical SEO, Structured Data & Metadata', passed: group4SeoRes.passed, failed: group4SeoRes.failed, tests: group4SeoRes.results });
  console.log(`Subtotal: ${group4SeoRes.passed} passed, ${group4SeoRes.failed} failed\n`);

  // Suite 22: Seller Property Submission & Database Transaction Fix
  const submissionFixRes = await runPropertySubmissionFixTests();
  submissionFixRes.results.forEach(r => console.log(' ', r));
  totalPassed += submissionFixRes.passed;
  totalFailed += submissionFixRes.failed;
  suiteResults.push({ name: 'Seller Property Submission & Database Transaction Fix', passed: submissionFixRes.passed, failed: submissionFixRes.failed, tests: submissionFixRes.results });
  console.log(`Subtotal: ${submissionFixRes.passed} passed, ${submissionFixRes.failed} failed\n`);

  // Suite 23: AiSensy WhatsApp, Two-Domain & Verification Badge Tests
  console.log('--- 23. AiSensy WhatsApp, Two-Domain & Verification Badge Suite ---');
  const enhancementRes = await runSellMyGharEnhancementTests();
  enhancementRes.results.forEach(r => console.log(' ', r));
  totalPassed += enhancementRes.passed;
  totalFailed += enhancementRes.failed;
  suiteResults.push({ name: 'AiSensy WhatsApp & Enhancements', passed: enhancementRes.passed, failed: enhancementRes.failed, tests: enhancementRes.results });
  console.log(`Subtotal: ${enhancementRes.passed} passed, ${enhancementRes.failed} failed\n`);

  // Suite 24: Master Bug Fix Regression Suite
  console.log('--- 24. Master Bug Fix Regression Suite ---');
  const masterRes = await runMasterBugfixRegressionTests();
  masterRes.results.forEach(r => console.log(' ', r));
  totalPassed += masterRes.passed;
  totalFailed += masterRes.failed;
  suiteResults.push({ name: 'Master Bug Fix Regressions', passed: masterRes.passed, failed: masterRes.failed, tests: masterRes.results });
  // Suite 25: Auth UX, Registration Email & WhatsApp Suite
  console.log('--- 25. Auth UX, Registration Email & WhatsApp Suite ---');
  const authUxRes = await runAuthAndNotificationTests();
  authUxRes.results.forEach(r => console.log(' ', r));
  totalPassed += authUxRes.passed;
  totalFailed += authUxRes.failed;
  suiteResults.push({ name: 'Auth UX, Registration Email & WhatsApp', passed: authUxRes.passed, failed: authUxRes.failed, tests: authUxRes.results });
  console.log(`Subtotal: ${authUxRes.passed} passed, ${authUxRes.failed} failed\n`);

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
