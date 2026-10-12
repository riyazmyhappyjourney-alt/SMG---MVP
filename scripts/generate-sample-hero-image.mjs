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

async function generateSampleImage() {
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1920px;
      height: 800px;
      overflow: hidden;
      background: linear-gradient(135deg, #172033 0%, #1e2e4b 50%, #244B8F 100%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #ffffff;
      position: relative;
    }
    .grid-lines {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 80px 80px;
    }
    .container {
      position: relative;
      z-index: 10;
      width: 1920px;
      height: 800px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 80px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .badge {
      display: inline-block;
      padding: 8px 18px;
      background: rgba(182, 138, 74, 0.25);
      border: 1px solid #B68A4A;
      color: #F1D49B;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 42px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 12px;
    }
    .subtitle {
      font-size: 18px;
      color: #94A3B8;
      max-width: 600px;
      line-height: 1.5;
    }
    .dim-badge {
      text-align: right;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      padding: 18px 28px;
      border-radius: 12px;
    }
    .dim-val {
      font-size: 36px;
      font-weight: 900;
      color: #38BDF8;
      font-family: monospace;
    }
    .dim-sub {
      font-size: 13px;
      color: #CBD5E1;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .zones-grid {
      display: grid;
      grid-template-columns: 2fr 3fr;
      gap: 30px;
      margin: 40px 0;
      flex: 1;
    }
    .zone-card {
      border: 2px dashed rgba(255,255,255,0.25);
      border-radius: 16px;
      padding: 30px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: rgba(255,255,255,0.02);
    }
    .zone-card.primary {
      border-color: #38BDF8;
      background: rgba(56, 189, 248, 0.05);
    }
    .zone-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .zone-desc {
      font-size: 14px;
      color: #CBD5E1;
      line-height: 1.6;
    }
    .footer-specs {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.12);
      font-size: 14px;
      color: #94A3B8;
    }
    .spec-item strong {
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="grid-lines"></div>
  <div class="container">
    <div class="header">
      <div>
        <div class="badge">SellMyGhar Official Banner Specification</div>
        <h1>Recommended Hero Image Reference</h1>
        <p class="subtitle">Use this master template for desktop and mobile responsive hero banners across Bengaluru resale landing pages.</p>
      </div>
      <div class="dim-badge">
        <div class="dim-val">1920 × 800 px</div>
        <div class="dim-sub">Aspect Ratio 2.40 : 1 • Landscape</div>
      </div>
    </div>

    <div class="zones-grid">
      <div class="zone-card">
        <div class="zone-title" style="color: #F1D49B;">
          <span>Zone A: Text & Form Safe Zone (40%)</span>
        </div>
        <p class="zone-desc">Keep this area relatively uncluttered with low visual noise. On the live website, the headline, value propositions, and homeowner intake search card overlay this area.</p>
      </div>

      <div class="zone-card primary">
        <div class="zone-title" style="color: #38BDF8;">
          <span>Zone B: Focal Architectural Subject (60%)</span>
        </div>
        <p class="zone-desc">Position key architectural photography here: apartment elevations, township landscapes, balconies, society clubhouses, or landscaped amenities. Focal center should be around 65% width and 35% height.</p>
      </div>
    </div>

    <div class="footer-specs">
      <div class="spec-item">Format: <strong>WebP (Recommended), JPEG, or PNG</strong></div>
      <div class="spec-item">Max File Size: <strong>5.0 MB</strong></div>
      <div class="spec-item">Color Profile: <strong>sRGB</strong></div>
      <div class="spec-item">Mobile Responsive Crop: <strong>Auto-centers on middle 35-40% viewport</strong></div>
      <div class="spec-item">SellMyGhar Tech Specs: <strong>v2.6 Enterprise</strong></div>
    </div>
  </div>
</body>
</html>`;

  const htmlPath = '/tmp/sample-hero-spec.html';
  fs.writeFileSync(htmlPath, htmlContent);

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const port = 9223;
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--window-size=1920,800',
    '--user-data-dir=/tmp/smg-sample-img-' + Date.now(),
    `file://${htmlPath}`
  ]);

  await wait(1500);

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
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await wait(800);

    const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const targetDir = path.resolve('public/images');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const outputPath = path.join(targetDir, 'sample-hero-banner-1920x800.png');
    fs.writeFileSync(outputPath, Buffer.from(shot.data, 'base64'));
    console.log(`Successfully generated sample hero image at: ${outputPath} (${shot.data.length} bytes)`);
    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

generateSampleImage().catch(console.error);
