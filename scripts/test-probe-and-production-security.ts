import { app } from '../server';
import http from 'http';
import { Socket } from 'net';

function assert(condition: any, msg: string) {
  if (!condition) {
    console.error(`  [FAIL] ${msg}`);
    throw new Error(msg);
  }
  console.log(`  [PASS] ${msg}`);
}

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
    req.headers = { host: '127.0.0.1:3000' };
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
    res.write = function (chunk: any) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return true;
    };
    res.end = function (chunk?: any) {
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
        }
      });
      return this;
    };

    expressApp.handle(req, res, (err: any) => {
      if (!res.headersSent) {
        res.statusCode = err ? 500 : 404;
        res.end(err ? err.message : 'Not Found');
      }
    });

    if (payload) {
      req.push(payload);
    }
    req.push(null);
  });
}

export async function runProbeSecurityTests() {
  console.log('\n--- 27. Sensitive Probe Shield & Production Security Suite ---');

  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  function record(fn: () => void, testDesc: string) {
    try {
      fn();
      passed++;
      results.push(`[PASS] ${testDesc}`);
    } catch (e: any) {
      failed++;
      results.push(`[FAIL] ${testDesc}`);
    }
  }

  // 1. Probing /.env returns 404 plain text, NOT 200 HTML
  const envRes = await dispatchRequest(app, '/.env');
  record(() => {
    assert(envRes.status === 404, 'Probing /.env rejected with 404');
    assert(envRes.body === 'Not Found', 'Body is plain text "Not Found"');
    assert(!envRes.body.includes('<html'), 'Body does NOT contain HTML index.html');
  }, 'Probing /.env rejected with 404 Not Found');

  // 2. Probing /.env/ (trailing slash) returns 404
  const envSlashRes = await dispatchRequest(app, '/.env/');
  record(() => {
    assert(envSlashRes.status === 404, 'Probing /.env/ rejected with 404');
    assert(!envSlashRes.body.includes('<html'), 'Body does NOT contain HTML');
  }, 'Probing /.env/ rejected with 404');

  // 3. Probing /.env.bak returns 404
  const envBakRes = await dispatchRequest(app, '/.env.bak');
  record(() => {
    assert(envBakRes.status === 404, 'Probing /.env.bak rejected with 404');
  }, 'Probing /.env.bak rejected with 404');

  // 4. Probing /.env.local returns 404
  const envLocalRes = await dispatchRequest(app, '/.env.local');
  record(() => {
    assert(envLocalRes.status === 404, 'Probing /.env.local rejected with 404');
  }, 'Probing /.env.local rejected with 404');

  // 5. Probing /.git/config returns 404
  const gitRes = await dispatchRequest(app, '/.git/config');
  record(() => {
    assert(gitRes.status === 404, 'Probing /.git/config rejected with 404');
  }, 'Probing /.git/config rejected with 404');

  // 6. Probing /wp-login.php returns 404
  const wpLoginRes = await dispatchRequest(app, '/wp-login.php');
  record(() => {
    assert(wpLoginRes.status === 404, 'Probing /wp-login.php rejected with 404');
    assert(!wpLoginRes.body.includes('login'), 'Body does not contain WordPress login');
  }, 'Probing /wp-login.php rejected with 404');

  // 7. Probing /wp-admin/ returns 404
  const wpAdminRes = await dispatchRequest(app, '/wp-admin/');
  record(() => {
    assert(wpAdminRes.status === 404, 'Probing /wp-admin/ rejected with 404');
  }, 'Probing /wp-admin/ rejected with 404');

  // 8. Probing /server.js returns 404
  const serverJsRes = await dispatchRequest(app, '/server.js');
  record(() => {
    assert(serverJsRes.status === 404, 'Probing /server.js rejected with 404');
  }, 'Probing /server.js rejected with 404');

  // 9. Probing /package.json returns 404
  const pkgRes = await dispatchRequest(app, '/package.json');
  record(() => {
    assert(pkgRes.status === 404, 'Probing /package.json rejected with 404');
  }, 'Probing /package.json rejected with 404');

  // 10. Probing /api/ returns 404 JSON
  const apiRootRes = await dispatchRequest(app, '/api/');
  const apiRootData = await apiRootRes.json();
  record(() => {
    assert(apiRootRes.status === 404, 'Probing /api/ rejected with 404');
    assert(apiRootData?.error === 'NOT_FOUND', 'Returns structured JSON error');
  }, 'Probing /api/ returns structured 404 JSON');

  // 11. Malformed URI or null byte injection rejected with 400
  const nullByteRes = await dispatchRequest(app, '/test%00.php');
  record(() => {
    assert(nullByteRes.status === 400, 'Null-byte request rejected with 400');
  }, 'Null-byte request rejected with 400');

  // 12. Dev role switcher is strictly blocked when NODE_ENV is production
  const origEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const switchRes = await dispatchRequest(app, '/api/dev/switch-role', {
      method: 'POST',
      body: { role: 'STAFF_SUPER_ADMIN' }
    });
    record(() => {
      assert(switchRes.status === 403, 'POST /api/dev/switch-role strictly blocked in production with 403');
    }, 'Dev role switcher strictly blocked in production');
  } finally {
    process.env.NODE_ENV = origEnv;
  }

  // 13. Legitimate health check endpoint /health remains operational
  const healthRes = await dispatchRequest(app, '/health');
  record(() => {
    assert(healthRes.status === 200, 'GET /health returns 200');
  }, 'Legitimate health check operational');

  console.log(`Subtotal: ${passed} passed, ${failed} failed`);
  return { passed, failed, results };
}

if (process.argv[1]?.endsWith('test-probe-and-production-security.ts')) {
  runProbeSecurityTests()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
