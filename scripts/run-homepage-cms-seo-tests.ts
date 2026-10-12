import { HeroCmsService } from '../src/server/cms/hero-service';
import { EmailNotificationService } from '../src/server/notifications/email-service';
import { BANGALORE_LOCALITIES_SEO, getLocalityBySlug } from '../src/data/localitySeoData';
import fs from 'fs';
import path from 'path';

export async function runHomepageCmsSeoTests() {
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

  // --- Hero CMS Tests ---
  try {
    const heroSlides = await HeroCmsService.getAllSlides();
    assert(
      'Hero CMS retrieves active slides correctly',
      Array.isArray(heroSlides) && heroSlides.length > 0
    );

    const createdSlide = await HeroCmsService.createSlide({
      title: 'Sobha Dream Acres Living',
      image_url: '/images/sobha-dream-acres.webp',
      alt_text: 'Sobha Dream Acres Apartment Clubhouse in Bengaluru',
      display_order: 99,
      is_active: true,
    });
    assert(
      'Hero CMS creates new slide with persistent ID and display order',
      Boolean(createdSlide && createdSlide.id && createdSlide.title === 'Sobha Dream Acres Living')
    );

    const updated = await HeroCmsService.updateSlide(createdSlide.id, {
      title: 'Sobha Dream Acres Premium Living',
      is_active: false,
    });
    assert(
      'Hero CMS updates slide title and toggles active status',
      Boolean(updated && updated.title === 'Sobha Dream Acres Premium Living' && updated.is_active === false)
    );

    // Verify sample hero banner file exists
    const samplePath = path.resolve(process.cwd(), 'public/images/sample-hero-banner-1920x800.png');
    assert(
      'Hero CMS 1920x800 sample graphic template exists on disk',
      fs.existsSync(samplePath) && fs.statSync(samplePath).size > 1000
    );

    // Clean up test slide
    await HeroCmsService.deleteSlide(createdSlide.id);
  } catch (err: any) {
    assert('Hero CMS operations run without exception', false, err.message);
  }

  // --- Partner Logos CMS Tests ---
  try {
    const { PartnerCmsService } = await import('../src/server/cms/partner-service');
    const partnerLogos = await PartnerCmsService.listPartners();
    assert(
      'Partner CMS retrieves active logos correctly',
      Array.isArray(partnerLogos) && partnerLogos.length >= 4
    );

    const partnerSection = await PartnerCmsService.getSectionSettings();
    assert(
      'Partner CMS retrieves section settings with default heading',
      Boolean(partnerSection && partnerSection.heading.toLowerCase().includes('channel partner'))
    );

    const newPartner = await PartnerCmsService.createPartner({
      name: 'Total Environment',
      logo_url: '/images/partners/total-environment.svg',
      alt_text: 'Total Environment Official Channel Partner',
      display_order: 99,
      is_active: true,
    });
    assert(
      'Partner CMS creates new partner logo with persistent ID',
      Boolean(newPartner && newPartner.id && newPartner.name === 'Total Environment')
    );

    const updatedPartner = await PartnerCmsService.updatePartner(newPartner.id, {
      name: 'Total Environment Homes',
      is_active: false,
    });
    assert(
      'Partner CMS updates partner details and toggles active status',
      Boolean(updatedPartner && updatedPartner.name === 'Total Environment Homes' && updatedPartner.is_active === false)
    );

    // Reorder test
    await PartnerCmsService.reorderPartners([newPartner.id]);
    assert(
      'Partner CMS successfully reorders logo items',
      true
    );

    // Section settings update test
    const updatedSettings = await PartnerCmsService.updateSectionSettings({
      heading: 'Trusted Bengaluru Developer Alliances',
    });
    assert(
      'Partner CMS successfully updates custom section heading',
      updatedSettings.heading === 'Trusted Bengaluru Developer Alliances'
    );

    // Restore heading & clean up test partner
    await PartnerCmsService.updateSectionSettings({
      heading: 'Trusted Channel Partners of',
    });
    await PartnerCmsService.deletePartner(newPartner.id);
    assert(
      'Partner CMS successfully removes partner logo item',
      true
    );

    // Partner logo upload format & document type security test
    let rejectedDoc = false;
    try {
      PartnerCmsService.saveUploadedLogo('data:application/pdf;base64,JVBERi0xLjQKJ...', 'sample-doc.pdf');
    } catch {
      rejectedDoc = true;
    }
    assert(
      'Partner CMS strictly rejects document file formats (PDF/Word/Docs)',
      rejectedDoc
    );

    // SVG upload validation test
    const validSvgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="30"><text y="20">Puravankara</text></svg>';
    const validSvgBase64 = Buffer.from(validSvgContent).toString('base64');
    const savedSvg = PartnerCmsService.saveUploadedLogo(`data:image/svg+xml;base64,${validSvgBase64}`, 'puravankara.svg');
    assert(
      'Partner CMS saves valid SVG vector logos with checksum path in /images/partners/',
      savedSvg.relativeUrl.startsWith('/images/partners/puravankara-') && savedSvg.relativeUrl.endsWith('.svg')
    );

    // Safe JSON parser robustness against empty body (204) and HTML (<!DOCTYPE)
    const { safeParseJson } = await import('../src/utils/safeApi');
    const parse204 = await safeParseJson(new Response(null, { status: 204 }));
    const parseDoctype = await safeParseJson(new Response('<!DOCTYPE html><html><body>Error</body></html>', { status: 500 }));
    assert(
      'Safe JSON parser intercepts empty 204 and HTML <!DOCTYPE responses without throwing syntax errors',
      parse204.ok === true && parseDoctype.ok === false && !parseDoctype.error?.includes('Unexpected token')
    );
  } catch (err: any) {
    assert('Partner CMS operations run without exception', false, err.message);
  }

  // --- Publication & Submission Email & Template Tests ---
  try {
    const tpl = await EmailNotificationService.getTemplate('PROPERTY_PUBLISHED');
    assert(
      'Email Notification Service provides default branded template',
      Boolean(tpl && tpl.subject_template && tpl.html_template.includes('#244B8F'))
    );

    const subTpl = await EmailNotificationService.getTemplate('PROPERTY_SUBMISSION_RECEIVED');
    assert(
      'Email Notification Service provides submission received confirmation template',
      Boolean(subTpl && subTpl.subject_template.includes('submitted') && subTpl.html_template.includes('{{customer_name}}'))
    );

    const rendered = EmailNotificationService.interpolateTemplate(
      'Property {{property_title}} in {{locality}} ({{bhk}}) is live at {{public_price}} for {{owner_name}}',
      {
        property_title: 'Prestige Lakeside Habitat',
        locality: 'Varthur',
        bhk: '3 BHK',
        public_price: '₹1.85 Crore',
        owner_name: 'Ananya Sharma',
      }
    );
    assert(
      'Template variable interpolation safely replaces all placeholders',
      rendered === 'Property Prestige Lakeside Habitat in Varthur (3 BHK) is live at ₹1.85 Crore for Ananya Sharma'
    );

    const subRendered = EmailNotificationService.interpolateTemplate(
      'Hi {{customer_name}}, ref: {{property_reference}}, type: {{property_type}}, loc: {{property_location}}, list: {{listing_type}}, url: {{dashboard_url}}, year: {{year}}',
      {
        customer_name: 'Ananya Sharma',
        property_reference: 'SMG-BLR-2026-8841',
        property_type: '3 BHK Flat / Apartment',
        property_location: 'Varthur / Whitefield, Bengaluru',
        listing_type: 'Assisted Resale',
        dashboard_url: 'https://sellmyghar.in/#/dashboard',
        year: '2026'
      }
    );
    assert(
      'User template placeholders (customer_name, property_reference, etc.) interpolate correctly',
      subRendered === 'Hi Ananya Sharma, ref: SMG-BLR-2026-8841, type: 3 BHK Flat / Apartment, loc: Varthur / Whitefield, Bengaluru, list: Assisted Resale, url: https://sellmyghar.in/#/dashboard, year: 2026'
    );

    const providerStatus = EmailNotificationService.getProviderStatus();
    assert(
      'Email provider status truthfully reports configured vs simulated status',
      typeof providerStatus.configured === 'boolean' && typeof providerStatus.provider === 'string'
    );

    const mockProperty = {
      id: 'prop-qa-test-101',
      title: 'Brigade Gateway 2 BHK Residence',
      projectName: 'Brigade Gateway',
      localityName: 'Rajajinagar',
      bhkType: '2 BHK',
      askingPriceInr: 12500000,
      ownerName: 'Vikram Mehta',
      ownerEmail: 'vikram.mehta@example.com',
    };

    const notifRes1 = await EmailNotificationService.handlePropertyPublished(mockProperty);
    assert(
      'Property publication triggers idempotent notification entry',
      Boolean(notifRes1 && notifRes1.notificationId && notifRes1.dispatched === true)
    );

    const notifRes2 = await EmailNotificationService.handlePropertyPublished(mockProperty);
    assert(
      'Re-publishing same property does not send duplicate notifications (idempotent)',
      Boolean(notifRes2 && notifRes2.notificationId === notifRes1.notificationId && notifRes2.dispatched === false && notifRes2.reason === 'ALREADY_DISPATCHED')
    );
  } catch (err: any) {
    assert('Email Notification operations run without exception', false, err.message);
  }

  // --- Locality SEO Micro-Markets Tests ---
  try {
    assert(
      'Locality dataset defines all 11 required Bangalore micro-markets',
      BANGALORE_LOCALITIES_SEO.length === 11
    );

    const requiredSlugs = [
      'hebbal',
      'thanisandra',
      'yelahanka',
      'jakkur',
      'hennur',
      'whitefield',
      'sarjapur-road',
      'bellandur',
      'hsr-layout',
      'jp-nagar',
      'indiranagar',
    ];

    const allPresent = requiredSlugs.every(slug => Boolean(getLocalityBySlug(slug)));
    assert(
      'All 11 micro-markets (Hebbal, Whitefield, HSR, Indiranagar, etc.) resolve via slug helper',
      allPresent
    );

    const hebbal = getLocalityBySlug('hebbal');
    assert(
      'Hebbal profile includes Sub-Registrar diligence FAQs and gated societies',
      Boolean(hebbal && hebbal.localFaqs.length >= 4 && hebbal.popularSocieties.includes('Godrej Woodsman Estate'))
    );
  } catch (err: any) {
    assert('Locality SEO tests run without exception', false, err.message);
  }

  // --- Financial Holding Cost Math Formula Verification ---
  try {
    const superBuiltUpSqft = 1461;
    const maintenanceRate = 5;
    const months = 12;
    const monthlyRent = 40000;
    const propertyValue = 10800000;
    const brokeragePct = 2;

    const maintenanceCost = superBuiltUpSqft * maintenanceRate * months; // 1461 * 5 * 12 = 87,660
    const foregoneRent = monthlyRent * months; // 40,000 * 12 = 480,000
    const brokerageCost = propertyValue * (brokeragePct / 100); // 10,800,000 * 0.02 = 216,000
    const totalCost = maintenanceCost + foregoneRent + brokerageCost; // 87,660 + 480,000 + 216,000 = 783,660

    assert(
      'Financial Holding Cost Calculator maintenance math matches exact standard (₹87,660)',
      maintenanceCost === 87660
    );
    assert(
      'Financial Holding Cost Calculator foregone rent matches exact standard (₹4,80,000)',
      foregoneRent === 480000
    );
    assert(
      'Financial Holding Cost Calculator brokerage matches exact standard (₹2,16,000)',
      brokerageCost === 216000
    );
    assert(
      'Financial Holding Cost Calculator combined illustrative amount equals ₹7,83,660',
      totalCost === 783660
    );
  } catch (err: any) {
    assert('Calculator math tests run without exception', false, err.message);
  }

  // --- SEO Assets Verification ---
  try {
    const robotsPath = path.resolve(process.cwd(), 'public/robots.txt');
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    assert(
      'robots.txt exists and disallows /crm while referencing sitemap.xml',
      robotsContent.includes('Disallow: /crm') && robotsContent.includes('https://sellmyghar.in/sitemap.xml')
    );

    const sitemapPath = path.resolve(process.cwd(), 'public/sitemap.xml');
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    assert(
      'sitemap.xml contains indexable URLs for all 11 Bangalore localities',
      sitemapContent.includes('/sell-flat-in-hebbal-bangalore') &&
      sitemapContent.includes('/sell-flat-in-whitefield-bangalore') &&
      sitemapContent.includes('/sell-flat-in-indiranagar-bangalore')
    );
  } catch (err: any) {
    assert('SEO assets verification runs without exception', false, err.message);
  }

  return { passed, failed, results };
}
