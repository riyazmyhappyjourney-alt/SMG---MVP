import { safeParseJson } from '../src/utils/safeApi';
import { PartnerCmsService } from '../src/server/cms/partner-service';
import assert from 'assert';

async function runTests() {
  console.log('--- Running Partner CMS JSON & Document Validation Tests ---');

  // Test 1: Empty response (204 No Content) does NOT throw "Unexpected end of JSON input"
  const empty204Response = new Response(null, { status: 204 });
  const parsed204 = await safeParseJson(empty204Response);
  assert.strictEqual(parsed204.ok, true, '204 should be treated as ok');
  assert.strictEqual(parsed204.data, null, '204 should have null data');
  assert.strictEqual(parsed204.error, null, '204 should have no error');
  console.log('✓ TEST 1: Status 204 No Content safely handled without JSON parse exception');

  // Test 2: Empty 200 response does NOT throw "Unexpected end of JSON input"
  const empty200Response = new Response('', { status: 200, headers: { 'content-type': 'application/json' } });
  const parsedEmpty200 = await safeParseJson(empty200Response);
  assert.strictEqual(parsedEmpty200.ok, true);
  assert.strictEqual(parsedEmpty200.data, null);
  console.log('✓ TEST 2: Empty string response safely handled without "Unexpected end of JSON input"');

  // Test 3: HTML / <!DOCTYPE html> response does NOT throw syntax error, returns descriptive error
  const htmlResponse = new Response('<!DOCTYPE html><html><body>Error 404</body></html>', {
    status: 404,
    headers: { 'content-type': 'text/html' }
  });
  const parsedHtml = await safeParseJson(htmlResponse);
  assert.strictEqual(parsedHtml.ok, false);
  assert(parsedHtml.error && parsedHtml.error.includes('404'), 'Should report 404 error cleanly');
  assert(!parsedHtml.error.includes('Unexpected token'), 'Should NOT expose raw JSON parser exception');
  console.log('✓ TEST 3: <!DOCTYPE html> response cleanly intercepted without syntax / document type crash');

  // Test 4: Document files (PDF, Word, etc.) are strictly rejected by PartnerCmsService
  try {
    PartnerCmsService.saveUploadedLogo('data:application/pdf;base64,JVBERi0xLjQKJ...', 'contract.pdf');
    assert.fail('Should have thrown an error for PDF document upload');
  } catch (err: any) {
    assert(err.message.includes('Unsupported document format') || err.message.includes('image file'), 'Should reject document format');
    console.log('✓ TEST 4: Document upload (PDF/Word/Docs) strictly rejected with descriptive error');
  }

  // Test 5: Dangerous script in SVG is rejected
  try {
    const maliciousSvgBase64 = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString('base64');
    PartnerCmsService.saveUploadedLogo(`data:image/svg+xml;base64,${maliciousSvgBase64}`, 'malicious.svg');
    assert.fail('Should have rejected malicious SVG');
  } catch (err: any) {
    assert(err.message.includes('Security violation') || err.message.includes('script'), 'Should block scripts');
    console.log('✓ TEST 5: SVG containing executable scripts correctly blocked by security validator');
  }

  // Test 6: Valid SVG upload succeeds and returns relative path
  const validSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><rect width="100" height="40" fill="#244B8F"/></svg>';
  const validSvgBase64 = Buffer.from(validSvg).toString('base64');
  const savedSvg = PartnerCmsService.saveUploadedLogo(`data:image/svg+xml;base64,${validSvgBase64}`, 'test-partner.svg');
  assert(savedSvg.relativeUrl.startsWith('/images/partners/test-partner-'), 'Should return safe relative URL');
  assert(savedSvg.relativeUrl.endsWith('.svg'), 'Should preserve .svg extension');
  console.log('✓ TEST 6: Valid SVG partner logo uploaded and saved to /images/partners/');

  // Test 7: Valid PNG upload succeeds and returns relative path
  // Minimal 1x1 transparent PNG:
  const png1x1Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAA=';
  const savedPng = PartnerCmsService.saveUploadedLogo(`data:image/png;base64,${png1x1Base64}`, 'prestige-group.png');
  assert(savedPng.relativeUrl.startsWith('/images/partners/prestige-group-'));
  assert(savedPng.relativeUrl.endsWith('.png'));
  console.log('✓ TEST 7: Valid PNG partner logo uploaded and saved to /images/partners/');

  // Test 8: Partner section settings get and update
  const settings = await PartnerCmsService.getSectionSettings();
  assert(typeof settings.heading === 'string');
  assert(['slow', 'normal', 'fast'].includes(settings.scroll_speed));
  console.log('✓ TEST 8: Partner section settings retrieved successfully:', settings.heading);

  // Test 9: Partner logos list
  const logos = await PartnerCmsService.listPartners(false);
  assert(Array.isArray(logos) && logos.length > 0, 'Should return initialized partner logos');
  console.log(`✓ TEST 9: Partner logos retrieved from database (${logos.length} partners loaded)`);

  console.log('\n======================================================');
  console.log('ALL PARTNER CMS TESTS PASSED SUCCESSFULLY! (9/9)');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Test failure:', err);
  process.exit(1);
});
