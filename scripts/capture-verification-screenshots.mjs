import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
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

const ARTIFACT_DIR = '/Users/apple/.gemini/antigravity/brain/6ac9f238-88c9-4888-900a-b159ac365a45';

async function main() {
  console.log('--- Launching Chrome for Verification Screenshots ---');
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const port = 9224;
  const userDataDir = '/tmp/smg-chrome-verify-' + Date.now();

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
    ws.on('message', data => {
      const msg = JSON.parse(data);
      if (msg.id && callbacks.has(msg.id)) {
        const { resolve, reject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
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

    async function captureScreenshot(url, outputPath, clipOptions = null, delay = 2500) {
      console.log(`Navigating to: ${url}`);
      await send('Page.navigate', { url });
      await wait(delay);

      const params = { format: 'png' };
      if (clipOptions) {
        params.clip = clipOptions;
      }

      const res = await send('Page.captureScreenshot', params);
      const buffer = Buffer.from(res.data, 'base64');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Saved screenshot: ${outputPath} (${buffer.length} bytes)`);
    }

    // 1. Homepage Hero & Calculator
    await captureScreenshot(
      'http://127.0.0.1:3000/',
      path.join(ARTIFACT_DIR, 'homepage_hero_and_calculator.png'),
      null,
      3000
    );

    // 2. Locality SEO Detail Page (Hebbal)
    await captureScreenshot(
      'http://127.0.0.1:3000/#/sell-flat-in-hebbal-bangalore',
      path.join(ARTIFACT_DIR, 'locality_detail_page_hebbal.png'),
      null,
      3000
    );

    // 3. Locality SEO Detail Page (Whitefield)
    await captureScreenshot(
      'http://127.0.0.1:3000/#/sell-flat-in-whitefield-bangalore',
      path.join(ARTIFACT_DIR, 'locality_detail_page_whitefield.png'),
      null,
      3000
    );

    // 4. CRM Dashboard Settings (Hero CMS & Email Template tabs)
    // Setup staff session in sessionStorage first
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/#/crm' });
    await wait(2000);

    // Inject super admin staff session into sessionStorage
    await send('Runtime.evaluate', {
      expression: `
        sessionStorage.setItem('sellmyghar_staff_session', JSON.stringify({
          token: 'simulated-token',
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

    // Navigate to SETTINGS tab in CRM and open HERO_CMS subtab
    await send('Runtime.evaluate', {
      expression: `
        // Click on Settings navigation button if available
        const buttons = Array.from(document.querySelectorAll('button'));
        const settingsBtn = buttons.find(b => b.textContent && b.textContent.includes('Settings'));
        if (settingsBtn) settingsBtn.click();
      `
    });
    await wait(1500);

    // Switch to Hero Banner CMS tab
    await send('Runtime.evaluate', {
      expression: `
        const buttons = Array.from(document.querySelectorAll('button'));
        const heroTab = buttons.find(b => b.textContent && b.textContent.includes('Hero Banner CMS'));
        if (heroTab) heroTab.click();
      `
    });
    await wait(1500);

    await captureScreenshot(
      'http://127.0.0.1:3000/#/crm',
      path.join(ARTIFACT_DIR, 'crm_hero_banner_cms_view.png'),
      null,
      1500
    );

    // Switch to Publication Email tab
    await send('Runtime.evaluate', {
      expression: `
        const buttons = Array.from(document.querySelectorAll('button'));
        const emailTab = buttons.find(b => b.textContent && b.textContent.includes('Publication Email & SMTP'));
        if (emailTab) emailTab.click();
      `
    });
    await wait(1500);

    await captureScreenshot(
      'http://127.0.0.1:3000/#/crm',
      path.join(ARTIFACT_DIR, 'crm_publication_email_template_view.png'),
      null,
      1500
    );

    // Switch to Partner Logos CMS tab
    await send('Runtime.evaluate', {
      expression: `
        const buttons = Array.from(document.querySelectorAll('button'));
        const partnerTab = buttons.find(b => b.textContent && (b.textContent.includes('Partner Logos') || b.textContent.includes('Partner')));
        if (partnerTab) partnerTab.click();
      `
    });
    await wait(1500);

    await captureScreenshot(
      'http://127.0.0.1:3000/#/crm',
      path.join(ARTIFACT_DIR, 'crm_partner_logos_cms_view.png'),
      null,
      1500
    );

    // Return to homepage and capture full scroll
    await captureScreenshot(
      'http://127.0.0.1:3000/',
      path.join(ARTIFACT_DIR, 'homepage_refined_pass1.png'),
      null,
      2500
    );

    console.log('--- All screenshots successfully captured! ---');
    ws.close();
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    try {
      chrome.kill('SIGTERM');
    } catch {}
  }
}

main().catch(console.error);
