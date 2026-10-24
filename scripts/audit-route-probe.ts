import { app } from '../server';
import http from 'http';
import { Socket } from 'net';

interface ProbeResult {
  path: string;
  status: number;
  contentType: string;
  bodyType: string;
  handledBy: string;
  isSensitiveExposed: boolean;
}

function probePath(expressApp: any, urlPath: string, host = 'sellmyghar.in'): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const socket = new Socket();
    Object.defineProperty(socket, 'remoteAddress', { value: '127.0.0.1' });
    const req = new http.IncomingMessage(socket);
    req.method = 'GET';
    req.url = urlPath;
    req.headers = { host };

    const res = new http.ServerResponse(req);
    const chunks: Buffer[] = [];
    res.write = function (chunk: any) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return true;
    };
    res.end = function (chunk?: any) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const resBody = Buffer.concat(chunks).toString('utf8');
      const contentType = (res.getHeader('content-type') as string) || '';
      
      let bodyType = 'unknown';
      let handledBy = 'unknown';
      let isSensitiveExposed = false;

      if (contentType.includes('text/html')) {
        bodyType = 'HTML (SPA / React App)';
        handledBy = 'SPA Wildcard Fallback (app.get(*))';
      } else if (contentType.includes('application/json')) {
        bodyType = 'JSON API Response';
        handledBy = 'Express API Handler';
      } else if (contentType.includes('text/plain')) {
        bodyType = 'Plain Text';
        handledBy = 'Express Static or Handler';
      }

      // Check if actual file content was leaked (e.g. key=val, json, etc)
      if (urlPath.includes('.env') && (resBody.includes('DATABASE_URL') || resBody.includes('JWT_SECRET'))) {
        isSensitiveExposed = true;
      }
      if (urlPath === '/package.json' && resBody.includes('"name": "react-example"')) {
        isSensitiveExposed = true;
      }

      resolve({
        path: urlPath,
        status: res.statusCode,
        contentType,
        bodyType,
        handledBy,
        isSensitiveExposed
      });
      return this;
    };

    expressApp.handle(req, res, (err: any) => {
      if (!res.headersSent) {
        res.statusCode = err ? 500 : 404;
        res.end(err ? err.message : 'Not Found');
      }
    });
    req.push(null);
  });
}

async function runProbe() {
  const paths = [
    '/.env',
    '/.env/',
    '/.env.bak',
    '/.env.local',
    '/.git/config',
    '/wp-login.php',
    '/wp-admin/',
    '/server.js',
    '/package.json',
    '/api/',
    '/login',
    '/#login',
    '/crm',
    '/crm/',
    '/robots.txt',
    '/favicon.ico',
    '/this-route-should-not-exist'
  ];

  console.log('\n--- PROBING PATHS ON SELLMYGHAR.IN (READ-ONLY AUDIT) ---');
  for (const p of paths) {
    const res = await probePath(app, p, 'sellmyghar.in');
    console.log(`Path: ${p.padEnd(30)} | Status: ${res.status} | Content-Type: ${res.contentType.padEnd(25)} | Handled: ${res.handledBy} | Secret Leaked: ${res.isSensitiveExposed}`);
  }

  console.log('\n--- PROBING ON CRM.SELLMYGHAR.IN (READ-ONLY AUDIT) ---');
  for (const p of ['/.env', '/.env/', '/wp-login.php', '/crm', '/crm/']) {
    const res = await probePath(app, p, 'crm.sellmyghar.in');
    console.log(`Path: ${p.padEnd(30)} | Status: ${res.status} | Content-Type: ${res.contentType.padEnd(25)} | Handled: ${res.handledBy} | Secret Leaked: ${res.isSensitiveExposed}`);
  }
}

runProbe().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
