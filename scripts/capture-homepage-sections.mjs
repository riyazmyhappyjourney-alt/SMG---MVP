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
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const port = 9225;
  const userDataDir = '/tmp/smg-chrome-sections-' + Date.now();

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,1100',
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

    console.log('Navigating to homepage...');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
    await wait(2500);

    // Full page screenshot capturing all sections from top to bottom
    const fullRes = await send('Page.captureScreenshot', { 
      format: 'png',
      captureBeyondViewport: true
    });
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, 'homepage_fullpage_render.png'),
      Buffer.from(fullRes.data, 'base64')
    );
    console.log('Saved homepage_fullpage_render.png');

    // 3. Scroll to Footer & open first FAQ
    await send('Runtime.evaluate', {
      expression: `
        const footer = document.querySelector('footer');
        if (footer) footer.scrollIntoView();
        // Click the first FAQ button
        const faqBtn = footer.querySelector('button');
        if (faqBtn) faqBtn.click();
      `
    });
    await wait(1200);

    const footerRes = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, 'homepage_footer_and_faq_view.png'),
      Buffer.from(footerRes.data, 'base64')
    );
    console.log('Saved homepage_footer_and_faq_view.png');

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    try {
      chrome.kill('SIGTERM');
    } catch {}
  }
}

main().catch(console.error);
