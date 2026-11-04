import { hashEmail, hashPhone, mapCrmStageToMetaEvent, MetaConversionsApiService } from '../src/server/integrations/meta-conversions-api';
import crypto from 'crypto';

function assert(condition: any, msg: string) {
  if (!condition) {
    console.error(`  [FAIL] ${msg}`);
    throw new Error(msg);
  }
  console.log(`  [PASS] ${msg}`);
}

export async function runMetaConversionsApiTests(): Promise<{ passed: number; failed: number; results: string[] }> {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function recordPass(desc: string) {
    passed++;
    results.push(`[PASS] ${desc}`);
    console.log(`  [PASS] ${desc}`);
  }

  function recordFail(desc: string, err: any) {
    failed++;
    const errMsg = err?.message || String(err);
    results.push(`[FAIL] ${desc} -> ${errMsg}`);
    console.error(`  [FAIL] ${desc} -> ${errMsg}`);
  }

  console.log('\n--- Running Meta Conversions API & CRM Conversion Leads Suite ---');

  // Test 1: Email hashing matches Meta standard SHA-256
  try {
    const rawEmail = ' Test.User@example.com ';
    const hashed = hashEmail(rawEmail);
    const expected = crypto.createHash('sha256').update('test.user@example.com').digest('hex');
    assert(hashed === expected, 'Customer email properly hashed');
    recordPass('1. Customer email properly lowercased, trimmed, and hashed with SHA-256');
  } catch (err) {
    recordFail('1. Email hashing', err);
  }

  // Test 2: Phone number normalization and hashing
  try {
    const rawPhone = '+91 98765-43210';
    const hashed = hashPhone(rawPhone);
    const expected = crypto.createHash('sha256').update('919876543210').digest('hex');
    assert(hashed === expected, 'Phone number properly normalized and hashed');
    recordPass('2. Indian phone number normalized to country code (91XXXXXXXXXX) and SHA-256 hashed');
  } catch (err) {
    recordFail('2. Phone hashing', err);
  }

  // Test 3: Stage mapping to Meta Conversion Leads standard names
  try {
    assert(mapCrmStageToMetaEvent('NEW') === 'Lead', 'NEW -> Lead');
    assert(mapCrmStageToMetaEvent('CONTACTED') === 'Contacted', 'CONTACTED -> Contacted');
    assert(mapCrmStageToMetaEvent('FOLLOW_UP') === 'Contacted', 'FOLLOW_UP -> Contacted');
    assert(mapCrmStageToMetaEvent('SITE_VISIT') === 'Schedule', 'SITE_VISIT -> Schedule');
    assert(mapCrmStageToMetaEvent('NEGOTIATION') === 'QualifiedLead', 'NEGOTIATION -> QualifiedLead');
    assert(mapCrmStageToMetaEvent('CONVERTED') === 'Conversion', 'CONVERTED -> Conversion');
    assert(mapCrmStageToMetaEvent('LOST') === 'ClosedLost', 'LOST -> ClosedLost');
    recordPass('3. SellMyGhar CRM funnel stages mapped accurately to Meta standard events');
  } catch (err) {
    recordFail('3. Stage mapping', err);
  }

  // Test 4: Default dataset resolution points to 1501343261902642
  try {
    const datasetId = MetaConversionsApiService.getDatasetId();
    assert(datasetId === '1501343261902642', `Expected dataset ID 1501343261902642, got ${datasetId}`);
    recordPass('4. Meta Dataset ID defaults to 1501343261902642');
  } catch (err) {
    recordFail('4. Dataset ID resolution', err);
  }

  // Test 5: Graceful fallback when no access token configured
  try {
    const savedToken = process.env.META_ACCESS_TOKEN;
    const savedCapiToken = process.env.META_CONVERSIONS_API_TOKEN;
    delete process.env.META_ACCESS_TOKEN;
    delete process.env.META_CONVERSIONS_API_TOKEN;

    const res = await MetaConversionsApiService.sendLeadEvent({
      eventName: 'Lead',
      phone: '9876543210',
      email: 'user@example.com',
    });
    assert(res.skipped === true, 'Expected skipped: true when token unconfigured');
    recordPass('5. Safe non-blocking execution when access token is not set');

    if (savedToken) process.env.META_ACCESS_TOKEN = savedToken;
    if (savedCapiToken) process.env.META_CONVERSIONS_API_TOKEN = savedCapiToken;
  } catch (err) {
    recordFail('5. Token fallback', err);
  }

  console.log(`\nMeta Conversions API Suite Complete: ${passed} passed, ${failed} failed.`);
  return { passed, failed, results };
}

if (process.argv[1]?.endsWith('test-meta-conversions-api.ts')) {
  runMetaConversionsApiTests().then((res) => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
