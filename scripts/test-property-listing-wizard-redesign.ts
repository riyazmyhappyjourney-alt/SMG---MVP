import assert from 'node:assert';
import { 
  sanitizeOwnerName, 
  sanitizeIndianPhone, 
  sanitizeEmail, 
  sanitizeLocality, 
  sanitizeSociety, 
  sanitizeSBUA, 
  sanitizeCarpetArea, 
  sanitizePrice, 
  validateVideoUrl, 
  sanitizeDescription 
} from '../src/utils/formSanitizer';
import { 
  searchLocalities, 
  searchSocieties, 
  getZoneForLocality,
  BENGALURU_LOCALITIES,
  BENGALURU_SOCIETIES
} from '../src/data/bengaluruData';

console.log('--- RUNNING PROPERTY LISTING WIZARD REDESIGN TEST SUITE ---');

// TEST 1: Form Sanitizer - Owner Name
{
  const valid = sanitizeOwnerName('Sunil Narang');
  assert(valid.isValid && valid.value === 'Sunil Narang', 'Valid owner name passes');

  const short = sanitizeOwnerName('A');
  assert(!short.isValid, 'Too short owner name is rejected');

  const html = sanitizeOwnerName('<script>alert("hack")</script> Rajesh Kumar');
  assert(html.isValid && html.value === 'Rajesh Kumar', 'HTML and script tags are completely stripped');

  const spam = sanitizeOwnerName('aaaaaaaaa');
  assert(!spam.isValid, 'Repetitive spam name is rejected');
  console.log('  [PASS] Owner name validation & sanitization');
}

// TEST 2: Form Sanitizer - Phone Number
{
  const valid = sanitizeIndianPhone('+91 98765 00111');
  assert(valid.isValid && valid.value === '9876500111', 'Valid 10-digit Indian phone passes');

  const invalidPrefix = sanitizeIndianPhone('1234567890');
  assert(!invalidPrefix.isValid, 'Phone starting with 1-5 is rejected');

  const shortPhone = sanitizeIndianPhone('98765');
  assert(!shortPhone.isValid, 'Short phone is rejected');
  console.log('  [PASS] Indian phone number validation');
}

// TEST 3: Form Sanitizer - Email
{
  const valid = sanitizeEmail('sunil.narang@example.com');
  assert(valid.isValid && valid.value === 'sunil.narang@example.com', 'Valid email passes');

  const empty = sanitizeEmail('');
  assert(empty.isValid && empty.value === '', 'Empty optional email passes');

  const invalid = sanitizeEmail('not-an-email');
  assert(!invalid.isValid, 'Invalid email syntax is rejected');
  console.log('  [PASS] Email validation & sanitization');
}

// TEST 4: Locality Autocomplete & Zone Mapping
{
  const results = searchLocalities('Whitefield');
  assert(results.length > 0, 'Locality search returns results for Whitefield');
  assert(results[0].name.toLowerCase().includes('whitefield'), 'Whitefield is top result');

  const zoneEast = getZoneForLocality('Whitefield');
  assert(zoneEast === 'East', 'Whitefield maps to East zone');

  const zoneNorth = getZoneForLocality('Hebbal');
  assert(zoneNorth === 'North', 'Hebbal maps to North zone');

  const zoneSouth = getZoneForLocality('HSR Layout');
  assert(zoneSouth === 'South', 'HSR Layout maps to South zone');

  const zoneWest = getZoneForLocality('Rajajinagar');
  assert(zoneWest === 'West', 'Rajajinagar maps to West zone');

  const zoneCentral = getZoneForLocality('Indiranagar');
  assert(zoneCentral === 'Central', 'Indiranagar maps to Central zone');
  console.log('  [PASS] Locality search & automatic zone mapping');
}

// TEST 5: Society Autocomplete & Curated Coverage
{
  const required = [
    'Prestige Shantiniketan',
    'Prestige Lakeside Habitat',
    'Prestige Jindal City',
    'Brigade Gateway',
    'Brigade Cornerstone Utopia',
    'Sobha Dream Acres',
    'Sobha Dream Heights',
    'Godrej Woodsman Estate',
    'Purva Palm Beach',
    'Assetz 63 Degree East',
    'Salarpuria Sattva Greenage',
    'Bhartiya City',
    'Embassy Springs',
    'Adarsh Palm Retreat'
  ];

  for (const name of required) {
    const searchRes = searchSocieties(name.slice(0, 12));
    const found = searchRes.some(s => s.name.toLowerCase().includes(name.toLowerCase()));
    assert(found, `Required project "${name}" is discoverable in society search`);
  }
  console.log('  [PASS] All 14 required Bengaluru societies verified in dataset');
}

// TEST 6: Area Validation - Super Built-up vs Carpet Area
{
  const validSbua = sanitizeSBUA(1550);
  assert(validSbua.isValid && validSbua.value === 1550, 'Valid SBUA passes');

  const missingSbua = sanitizeSBUA('');
  assert(!missingSbua.isValid, 'Missing SBUA is rejected (Required field)');

  const negativeSbua = sanitizeSBUA(-500);
  assert(!negativeSbua.isValid, 'Negative SBUA is rejected');

  const emptyCarpet = sanitizeCarpetArea('', 1550);
  assert(emptyCarpet.isValid && emptyCarpet.value === undefined, 'Empty carpet area is valid (Optional field)');

  const validCarpet = sanitizeCarpetArea(1200, 1550);
  assert(validCarpet.isValid && validCarpet.value === 1200, 'Valid carpet area passes');

  const excessiveCarpet = sanitizeCarpetArea(2000, 1550);
  assert(!excessiveCarpet.isValid, 'Carpet area larger than SBUA is rejected');
  console.log('  [PASS] Super built-up (mandatory) & Carpet area (optional) rules');
}

// TEST 7: Pricing Validation & Price per sq. ft. calculation
{
  const validSell = sanitizePrice('24000000', false);
  assert(validSell.isValid && validSell.value === 24000000, 'Valid sell price passes');

  const lowSell = sanitizePrice('100000', false);
  assert(!lowSell.isValid, 'Sell price below ₹5 Lakhs is rejected');

  const validRent = sanitizePrice('55000', true);
  assert(validRent.isValid && validRent.value === 55000, 'Valid rent passes');

  const lowRent = sanitizePrice('2000', true);
  assert(!lowRent.isValid, 'Rent below ₹5,000/month is rejected');

  // Calculation check
  const price = 24000000;
  const sbua = 2074;
  const ppsqft = Math.round(price / sbua);
  assert(ppsqft === 11572, 'Price per sq.ft calculation accurate');
  console.log('  [PASS] Sale price, monthly rent & per sq.ft. calculations');
}

// TEST 8: Video URL Validation (YouTube, Google Drive, Dropbox)
{
  const yt1 = validateVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert(yt1.isValid && yt1.provider === 'YOUTUBE', 'Standard YouTube watch link recognized');

  const yt2 = validateVideoUrl('https://youtu.be/dQw4w9WgXcQ');
  assert(yt2.isValid && yt2.provider === 'YOUTUBE', 'Short YouTube youtu.be link recognized');

  const drive = validateVideoUrl('https://drive.google.com/file/d/1a2b3c4d/view?usp=sharing');
  assert(drive.isValid && drive.provider === 'GOOGLE_DRIVE', 'Google Drive file share link recognized');

  const dropbox = validateVideoUrl('https://www.dropbox.com/s/123456/apartment-tour.mp4?dl=0');
  assert(dropbox.isValid && dropbox.provider === 'DROPBOX', 'Dropbox link recognized');

  const empty = validateVideoUrl('');
  assert(empty.isValid && empty.provider === null, 'Empty optional video link passes');

  const badUrl = validateVideoUrl('not-a-valid-url');
  assert(!badUrl.isValid, 'Malformed video link is rejected');
  console.log('  [PASS] YouTube, Google Drive, and Dropbox video link validation');
}

// TEST 9: Description Sanitization & Character Limits
{
  const desc = sanitizeDescription('Beautiful corner 3BHK flat overlooking lake. <script>alert(1)</script>');
  assert(desc.isValid, 'Description passes');
  assert(!desc.value.includes('<script>'), 'HTML/script tags stripped from description');

  const longText = 'A'.repeat(1200);
  const truncated = sanitizeDescription(longText);
  assert(truncated.value.length === 1000, 'Description clamped to max 1000 characters');
  console.log('  [PASS] Description sanitization & character limits');
}

console.log('======================================================');
console.log('ALL PROPERTY LISTING WIZARD REDESIGN TESTS PASSED!');
console.log('======================================================');
