import { spawn } from 'child_process';
import http from 'http';
import WebSocket from 'ws';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const port = 9226;
  const userDataDir = '/tmp/smg-chrome-diagnose-' + Date.now();

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,900',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await wait(1800);

  try {
    const targets = await getJson(`http://127.0.0.1:${port}/json`);
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();
    const networkResponses = [];
    const consoleMessages = [];

    ws.on('message', data => {
      const msg = JSON.parse(data);
      if (msg.id && callbacks.has(msg.id)) {
        const { resolve, reject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }

      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        consoleMessages.push({ type: msg.params.type, text });
      }

      if (msg.method === 'Log.entryAdded') {
        consoleMessages.push({ type: msg.params.entry.level, text: msg.params.entry.text });
      }

      if (msg.method === 'Network.responseReceived') {
        networkResponses.push({
          requestId: msg.params.requestId,
          url: msg.params.response.url,
          status: msg.params.response.status,
          mimeType: msg.params.response.mimeType,
          headers: msg.params.response.headers,
        });
      }
    });

    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });

    const send = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const callId = id++;
        callbacks.set(callId, { resolve, reject });
        ws.send(JSON.stringify({ id: callId, method, params }));
      });
    };

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');
    await send('Log.enable');
    await send('Network.enable');

    console.log('--- Navigating to CRM ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/#/crm' });
    await wait(2000);

    // Set staff session and reload
    await send('Runtime.evaluate', {
      expression: `
        sessionStorage.setItem('sellmyghar_staff_session', JSON.stringify({
          user: {
            id: 'usr-admin-01',
            displayName: 'Lead Operations Super Admin',
            email: 'admin@sellmyghar.in',
            roles: ['STAFF_SUPER_ADMIN'],
            module_permissions: ['OVERVIEW', 'LEADS', 'PROPERTIES', 'VISITS', 'OFFERS', 'TASKS', 'CALENDAR', 'TEAM', 'REPORTS', 'AUDIT', 'SETTINGS']
          }
        }));
        window.location.hash = '/crm';
        window.location.reload();
      `
    });
    await wait(2500);

    // Click Settings
    await send('Runtime.evaluate', {
      expression: `
        const buttons = Array.from(document.querySelectorAll('button'));
        const settingsBtn = buttons.find(b => b.textContent && b.textContent.includes('Settings'));
        if (settingsBtn) settingsBtn.click();
      `
    });
    await wait(1500);

    // Click Partner Logos CMS tab
    await send('Runtime.evaluate', {
      expression: `
        const buttons = Array.from(document.querySelectorAll('button'));
        const partnerTab = buttons.find(b => b.textContent && (b.textContent.includes('Partner Logos') || b.textContent.includes('Partner')));
        if (partnerTab) partnerTab.click();
      `
    });
    await wait(2500);

    // Get response bodies for all CMS requests
    for (const res of networkResponses) {
      if (res.url.includes('/api/cms/')) {
        try {
          const bodyData = await send('Network.getResponseBody', { requestId: res.requestId });
          res.body = bodyData.body;
        } catch (e) {
          res.body = `<could not get body: ${e.message}>`;
        }
      }
    }

    console.log('\n--- NETWORK RESPONSES FOR CMS ---');
    for (const r of networkResponses) {
      if (r.url.includes('/api/cms/')) {
        console.log(`URL: ${r.url}`);
        console.log(`Status: ${r.status}`);
        console.log(`MimeType: ${r.mimeType}`);
        console.log(`Body (first 200 chars): ${r.body ? r.body.slice(0, 200) : 'none'}\n`);
      }
    }

    console.log('\n--- CONSOLE LOGS ---');
    for (const c of consoleMessages) {
      if (c.text.toLowerCase().includes('json') || c.text.toLowerCase().includes('error') || c.text.toLowerCase().includes('document') || c.text.toLowerCase().includes('fail')) {
        console.log(`[${c.type}] ${c.text}`);
      }
    }

    ws.close();
  } catch (err) {
    console.error('Error during diagnostics:', err);
  } finally {
    try {
      chrome.kill('SIGTERM');
    } catch {}
  }
}

main().catch(console.error);
