import fs from 'fs';
import path from 'path';
import { app } from '../server';
import http from 'http';
import { Socket } from 'net';

interface DispatchResponse {
  status: number;
  headers: Record<string, any>;
  body: string;
  json: () => Promise<any>;
}

function dispatchRequest(
  expressApp: any,
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<DispatchResponse> {
  return new Promise((resolve) => {
    const socket = new Socket();
    Object.defineProperty(socket, 'remoteAddress', { value: '127.0.0.1' });
    const req = new http.IncomingMessage(socket);
    req.method = options.method || 'GET';
    const parsedPath = url.startsWith('http')
      ? new URL(url).pathname + new URL(url).search
      : url;
    req.url = parsedPath;
    req.headers = {};
    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        req.headers[k.toLowerCase()] = v;
      }
    }

    let payload: Buffer | null = null;
    if (options.body !== undefined && options.body !== null) {
      const data = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      payload = Buffer.from(data);
      req.headers['content-length'] = payload.length.toString();
      if (!req.headers['content-type']) {
        req.headers['content-type'] = 'application/json';
      }
    }

    const res = new http.ServerResponse(req);
    const chunks: Buffer[] = [];
    (res as any).write = function (chunk: any) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return true;
    };
    (res as any).end = function (chunk?: any) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const resBody = Buffer.concat(chunks).toString('utf8');
      resolve({
        status: res.statusCode,
        headers: res.getHeaders ? res.getHeaders() : {},
        body: resBody,
        json: async () => {
          try {
            return JSON.parse(resBody);
          } catch {
            return null;
          }
        },
      });
    };

    expressApp.handle(req, res);
    if (payload) {
      req.push(payload);
    }
    req.push(null);
  });
}

export async function runGroup4SeoMetadataTests() {
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

  console.log('\n--- 21. Group 4: Technical SEO, Structured Data & Metadata Suite ---');

  // ====================================================================
  // TEST SECTION 1: HTML Head Meta Tags & Open Graph Invariants
  // ====================================================================
  try {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // 1.1 Canonical URL tag
    assert('index.html defines self-referencing canonical URL link tag', html.includes('<link rel="canonical" href="https://sellmyghar.in/" />'));

    // 1.2 Open Graph & Twitter Cards
    assert('index.html defines og:image meta tag', html.includes('<meta property="og:image" content="https://sellmyghar.in/images/luxury-apartment-township-sunset.webp" />'));
    assert('index.html defines og:url meta tag', html.includes('<meta property="og:url" content="https://sellmyghar.in/" />'));
    assert('index.html defines og:site_name meta tag', html.includes('<meta property="og:site_name" content="SellMyGhar.in" />'));
    assert('index.html defines og:locale as en_IN', html.includes('<meta property="og:locale" content="en_IN" />'));
    assert('index.html defines twitter:card summary_large_image', html.includes('<meta name="twitter:card" content="summary_large_image" />'));
    assert('index.html defines twitter:image', html.includes('<meta name="twitter:image" content="https://sellmyghar.in/images/luxury-apartment-township-sunset.webp" />'));

    // 1.3 Hero LCP Image Preload Priority
    assert('index.html preloads first hero banner image for LCP optimization', html.includes('<link rel="preload" as="image" href="/images/luxury-apartment-township-sunset.webp" type="image/webp" />'));
  } catch (err: any) {
    assert('HTML meta tags section encountered exception', false, err.message);
  }

  // ====================================================================
  // TEST SECTION 2: Structured JSON-LD Schema (Organization & RealEstateAgent)
  // ====================================================================
  try {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert('index.html contains application/ld+json script block', !!jsonLdMatch);

    if (jsonLdMatch) {
      const jsonLd = JSON.parse(jsonLdMatch[1].trim());
      const graph = jsonLd['@graph'];
      assert('JSON-LD conforms to schema.org with @graph array', Array.isArray(graph) && graph.length >= 2);

      const org = graph.find((x: any) => x['@type'] === 'Organization');
      assert('JSON-LD graph contains Organization entity', !!org);
      assert('Organization defines legal business name SellMyGhar.in', org?.name === 'SellMyGhar.in');
      assert('Organization defines customer service contact telephone', org?.contactPoint?.telephone === '+91-99012-40222');
      assert('Organization defines verified Bengaluru office address in JP Nagar Phase 5', org?.address?.addressLocality === 'Bengaluru' && org?.address?.postalCode === '560078');

      const agent = graph.find((x: any) => x['@type'] === 'RealEstateAgent');
      assert('JSON-LD graph contains RealEstateAgent entity', !!agent);
      assert('RealEstateAgent lists Bengaluru served micro-markets', Array.isArray(agent?.areaServed) && agent.areaServed.length >= 10);
      assert('RealEstateAgent references Karnataka RERA registration in knowsAbout', Array.isArray(agent?.knowsAbout) && agent.knowsAbout.some((k: string) => k.includes('PRM/KA/RERA')));
    }
  } catch (err: any) {
    assert('Structured JSON-LD section encountered exception', false, err.message);
  }

  // ====================================================================
  // TEST SECTION 3: HTTP API 404 Status Handling
  // ====================================================================
  try {
    const resGet = await dispatchRequest(app, '/api/non-existent-service-endpoint', { method: 'GET' });
    assert('Unknown API GET request returns HTTP 404 status', resGet.status === 404);
    const jsonGet = await resGet.json();
    assert('Unknown API GET returns JSON error payload with NOT_FOUND', jsonGet?.error === 'NOT_FOUND');

    const resPost = await dispatchRequest(app, '/api/non-existent-action', {
      method: 'POST',
      body: { test: true },
    });
    assert('Unknown API POST request returns HTTP 404 status', resPost.status === 404);
  } catch (err: any) {
    assert('API 404 section encountered exception', false, err.message);
  }

  // ====================================================================
  // TEST SECTION 4: Robots.txt & Sitemap Coverage
  // ====================================================================
  try {
    const robotsPath = path.resolve('public', 'robots.txt');
    assert('public/robots.txt file exists', fs.existsSync(robotsPath));
    const robots = fs.readFileSync(robotsPath, 'utf8');
    assert('robots.txt disallows /crm', robots.includes('Disallow: /crm'));
    assert('robots.txt disallows /api/', robots.includes('Disallow: /api/'));
    assert('robots.txt references sitemap XML index', robots.includes('Sitemap: https://sellmyghar.in/sitemap.xml'));

    const sitemapPath = path.resolve('public', 'sitemap.xml');
    assert('public/sitemap.xml file exists', fs.existsSync(sitemapPath));
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    assert('sitemap.xml includes root URL', sitemap.includes('<loc>https://sellmyghar.in/</loc>'));
    assert('sitemap.xml includes Whitefield locality', sitemap.includes('sell-flat-in-whitefield-bangalore'));
    assert('sitemap.xml includes Hebbal locality', sitemap.includes('sell-flat-in-hebbal-bangalore'));
    assert('sitemap.xml includes Sarjapur Road locality', sitemap.includes('sell-flat-in-sarjapur-road-bangalore'));
  } catch (err: any) {
    assert('Robots and sitemap section encountered exception', false, err.message);
  }

  return { passed, failed, results };
}
