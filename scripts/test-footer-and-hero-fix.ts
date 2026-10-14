import fs from 'fs';
import path from 'path';

export async function runFooterAndHeroFixTests(): Promise<{ passed: number; failed: number; results: string[] }> {
  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  function record(description: string, condition: boolean, details?: string) {
    if (condition) {
      passed++;
      results.push(`[PASS] ${description}`);
    } else {
      failed++;
      results.push(`[FAIL] ${description} ${details ? `(${details})` : ''}`);
    }
  }

  // 1. Hero Image Flash Fix Verification
  const heroPath = path.resolve('src/components/home/Hero.tsx');
  const heroContent = fs.readFileSync(heroPath, 'utf8');

  record(
    'Hero component does NOT include sample-hero-banner in DEFAULT_HERO_SLIDES',
    !heroContent.includes("url: '/images/sample-hero-banner-1920x800.png'")
  );

  record(
    'Hero component sets first default slide to production asset luxury-apartment-township-sunset.webp',
    heroContent.includes("url: '/images/luxury-apartment-township-sunset.webp'")
  );

  record(
    'Hero component filters out sample-hero-banner from remote CMS responses',
    heroContent.includes("!s.image_url?.includes('sample-hero-banner')")
  );

  record(
    'Hero first slide image sets loading="eager" and fetchPriority="high"',
    heroContent.includes("loading={idx === 0 ? 'eager' : 'lazy'}") &&
    heroContent.includes("fetchPriority={idx === 0 ? 'high' : 'low'}")
  );

  // 2. Footer Redesign & Background Image Verification
  const skylinePath = path.resolve('public/images/bengaluru-skyline-footer.png');
  record(
    'Footer skyline background asset exists in public/images/',
    fs.existsSync(skylinePath) && fs.statSync(skylinePath).size > 100000
  );

  const footerPath = path.resolve('src/components/home/Footer.tsx');
  const footerContent = fs.readFileSync(footerPath, 'utf8');

  record(
    'Footer references /images/bengaluru-skyline-footer.png',
    footerContent.includes('/images/bengaluru-skyline-footer.png')
  );

  record(
    'Footer displays exact RERA registration number: PRM/KA/RERA/1251/309/AG/221108/003210',
    footerContent.includes('RERA Approved: PRM/KA/RERA/1251/309/AG/221108/003210')
  );

  record(
    'Footer includes Karnataka RERA Approved Real Estate Resale Platform pill',
    footerContent.includes('Karnataka RERA Approved Real Estate Resale Platform')
  );

  record(
    'Footer applies animate-rera-sweep for lighting sweep animation',
    footerContent.includes('animate-rera-sweep')
  );

  record(
    'Footer includes verified Bengaluru office address and contacts',
    footerContent.includes('100 Feet Road, Indiranagar, Bengaluru, KA 560038') &&
    footerContent.includes('+91 80 4719 3200') &&
    footerContent.includes('support@sellmyghar.in')
  );

  record(
    'Footer includes Company column links (About Us, Contact Us, Careers, Terms, Feedback, Privacy, Grievances, Cookie)',
    footerContent.includes('About us') &&
    footerContent.includes('Contact us') &&
    footerContent.includes('Careers with us') &&
    footerContent.includes('Terms & Conditions') &&
    footerContent.includes('Feedback') &&
    footerContent.includes('Privacy Policy') &&
    footerContent.includes('Grievances') &&
    footerContent.includes('Cookie Policy')
  );

  record(
    'Footer includes Resale Services column links (Buy Resale, Sell My Flat, Holding Cost, FAQs, Manage Consent)',
    footerContent.includes('Buy Resale Homes') &&
    footerContent.includes('Sell My Flat (Free)') &&
    footerContent.includes('Holding Cost Calculator') &&
    footerContent.includes('Frequently Asked Questions') &&
    footerContent.includes('Manage Consent')
  );

  // 3. CSS Animation & prefers-reduced-motion Verification
  const cssPath = path.resolve('src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  record(
    'CSS defines @keyframes reraLightSweep',
    cssContent.includes('@keyframes reraLightSweep')
  );

  record(
    'CSS defines .animate-rera-sweep',
    cssContent.includes('.animate-rera-sweep')
  );

  record(
    'CSS respects prefers-reduced-motion for .animate-rera-sweep',
    cssContent.includes('@media (prefers-reduced-motion: reduce)') &&
    cssContent.includes('.animate-rera-sweep')
  );

  return { passed, failed, results };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- Footer Redesign & Hero Image Flash Fix Suite ---');
  runFooterAndHeroFixTests().then(({ passed, failed, results }) => {
    results.forEach(r => console.log(' ', r));
    console.log(`Subtotal: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  });
}
