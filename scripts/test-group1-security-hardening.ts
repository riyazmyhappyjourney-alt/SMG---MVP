import { app, isOriginAllowed } from '../server';
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

export async function runGroup1SecurityHardeningTests() {
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

  console.log('\n--- 18. Group 1: Core API & HTTP Header Hardening Suite ---');

  // ====================================================================
  // TEST SECTION 1: Clickjacking & Essential Security Headers
  // ====================================================================
  try {
    const res = await dispatchRequest(app, '/api/health', { method: 'GET' });
    const xFrame = res.headers['x-frame-options'];
    const csp = res.headers['content-security-policy'] as string;
    const xContentType = res.headers['x-content-type-options'];
    const referrerPolicy = res.headers['referrer-policy'];

    assert('X-Frame-Options header is strictly DENY (Anti-Clickjacking)', xFrame === 'DENY');
    assert('CSP defines frame-ancestors none (Anti-Clickjacking defense-in-depth)', typeof csp === 'string' && csp.includes("frame-ancestors 'none'"));
    assert('X-Content-Type-Options is nosniff (MIME sniffing defense)', xContentType === 'nosniff');
    assert('Referrer-Policy is strict-origin-when-cross-origin', referrerPolicy === 'strict-origin-when-cross-origin');
  } catch (err: any) {
    assert('Security headers check encountered exception', false, err.message);
  }

  // ====================================================================
  // TEST SECTION 2: CORS Allowlist & Preflight Controls
  // ====================================================================
  try {
    // 2.1 Origin verification logic
    assert('Production primary domain sellmyghar.in is trusted', isOriginAllowed('https://sellmyghar.in'));
    assert('Production www.sellmyghar.in is trusted', isOriginAllowed('https://www.sellmyghar.in'));
    assert('Untrusted malicious domain is rejected', !isOriginAllowed('https://malicious-attacker.com'));
    assert('Untrusted subverted domain is rejected', !isOriginAllowed('https://sellmyghar.in.attacker.org'));

    // 2.2 Allowed origin CORS preflight
    const allowedPreflight = await dispatchRequest(app, '/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://sellmyghar.in',
        'access-control-request-method': 'POST',
      },
    });
    assert('OPTIONS preflight for trusted origin returns 204 No Content', allowedPreflight.status === 204);
    assert('Allowed origin sets Access-Control-Allow-Origin header', allowedPreflight.headers['access-control-allow-origin'] === 'https://sellmyghar.in');
    assert('Allowed origin sets Access-Control-Allow-Credentials true', allowedPreflight.headers['access-control-allow-credentials'] === 'true');

    // 2.3 Untrusted origin CORS preflight
    const untrustedPreflight = await dispatchRequest(app, '/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://malicious-attacker.com',
        'access-control-request-method': 'POST',
      },
    });
    assert('OPTIONS preflight for untrusted origin returns 403 Forbidden', untrustedPreflight.status === 403);
    const untrustedJson = await untrustedPreflight.json();
    assert('Untrusted preflight returns CORS_FORBIDDEN error code', untrustedJson?.error === 'CORS_FORBIDDEN');
  } catch (err: any) {
    assert('CORS test section encountered exception', false, err.message);
  }

  // ====================================================================
  // TEST SECTION 3: Anti-CSRF Defense on Mutating API Endpoints
  // ====================================================================
  try {
    // 3.1 Cross-site Sec-Fetch-Site rejection
    const crossSiteRes = await dispatchRequest(app, '/api/leads', {
      method: 'POST',
      headers: {
        'sec-fetch-site': 'cross-site',
      },
      body: { name: 'Evil Spammer', phone: '9999999999' },
    });
    assert('Mutating request with Sec-Fetch-Site cross-site is rejected with 403', crossSiteRes.status === 403);
    const crossSiteJson = await crossSiteRes.json();
    assert('Cross-site rejection specifies CSRF_REJECTED error code', crossSiteJson?.error === 'CSRF_REJECTED');

    // 3.2 Untrusted Origin rejection
    const untrustedOriginRes = await dispatchRequest(app, '/api/contact', {
      method: 'POST',
      headers: {
        origin: 'https://phishing-site.example.com',
      },
      body: { name: 'Attacker', email: 'test@phishing.com', message: 'CSRF payload' },
    });
    assert('Mutating request from untrusted origin is rejected with 403', untrustedOriginRes.status === 403);
    const untrustedOriginJson = await untrustedOriginRes.json();
    assert('Untrusted origin rejection specifies CSRF_REJECTED error code', untrustedOriginJson?.error === 'CSRF_REJECTED');

    // 3.3 Untrusted Referer rejection when origin is absent
    const untrustedRefererRes = await dispatchRequest(app, '/api/leads', {
      method: 'POST',
      headers: {
        referer: 'https://evil-phishing.org/hidden-form',
      },
      body: { name: 'Victim Triggered', phone: '9888888888' },
    });
    assert('Mutating request with untrusted referer is rejected with 403', untrustedRefererRes.status === 403);
    const untrustedRefererJson = await untrustedRefererRes.json();
    assert('Untrusted referer rejection specifies CSRF_REJECTED error code', untrustedRefererJson?.error === 'CSRF_REJECTED');

    // 3.4 Malformed Referer rejection
    const malformedRefererRes = await dispatchRequest(app, '/api/leads', {
      method: 'POST',
      headers: {
        referer: '::not-a-valid-uri::',
      },
      body: { name: 'Malformed Test', phone: '9777777777' },
    });
    assert('Mutating request with malformed referer is rejected with 403', malformedRefererRes.status === 403);

    // 3.5 Legitimate trusted request passes CSRF layer
    const legitimateRes = await dispatchRequest(app, '/api/leads', {
      method: 'POST',
      headers: {
        origin: 'https://sellmyghar.in',
      },
      body: { name: 'Legitimate Buyer', phone: '9123456789' },
    });
    assert('Mutating request with trusted origin passes CSRF layer (not 403)', legitimateRes.status !== 403);

    // 3.6 Non-mutating GET requests are safe and not blocked by CSRF
    const safeGetRes = await dispatchRequest(app, '/api/health', {
      method: 'GET',
      headers: {
        origin: 'https://external-crawler.com',
        'sec-fetch-site': 'cross-site',
      },
    });
    assert('Safe GET requests are not blocked by CSRF protection (status 200)', safeGetRes.status === 200);
  } catch (err: any) {
    assert('Anti-CSRF test section encountered exception', false, err.message);
  }

  return { passed, failed, results };
}
