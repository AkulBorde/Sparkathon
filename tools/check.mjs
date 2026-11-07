// Automated smoke test: loads the site in headless Edge/Chrome, reports JS errors + stats and
// saves screenshots of every camera view.   Usage:  node tools/check.mjs [outDir] [url]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const outDir = process.argv[2] || 'screenshots';
const url = process.argv[3] || 'http://localhost:5173/';
const only = process.argv[4] ? process.argv[4].split(',') : null;
fs.mkdirSync(outDir, { recursive: true });

const candidates = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const executablePath = candidates.find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({
  executablePath, headless: 'new',
  args: ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--window-size=1600,900'],
  defaultViewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => { if (!r.url().includes('fonts.g')) errors.push(`[requestfailed] ${r.url()}`); });

const t0 = Date.now();
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction('window.__ready || window.__error', { timeout: 180000 });
const err = await page.evaluate('window.__error');
if (err) { console.log('BUILD ERROR:', err); console.log(errors.join('\n')); await browser.close(); process.exit(1); }
console.log(`ready in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log('stats', JSON.stringify(await page.evaluate('window.app.stats'), null, 1));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function shot(name, js, ms = 3200) {
  if (only && !only.includes(name)) return;
  if (js) await page.evaluate(js);
  await wait(ms);
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  const info = await page.evaluate('window.app.info()');
  console.log(`${name}: calls=${info.calls} tris=${info.triangles} fps=${info.fps?.toFixed?.(1)}`);
}

await shot('01-overview', null, 2500);
await shot('02-plan', `(() => { const a = window.app; a.ui.cancelFly(); a.stage.camera.position.set(0, 820, 1); a.stage.controls.target.set(0, 0, 0); a.stage.controls.maxPolarAngle = Math.PI; })()`, 1500);
await shot('03-park', `window.app.stage.controls.maxPolarAngle = Math.PI*0.47; window.app.goTo('park')`);
await shot('04-courtyards', `window.app.goTo('courtyards')`);
await shot('05-solar', `window.app.goTo('solar')`);
await shot('06-center', `window.app.goTo('center')`);
await shot('07-street1', `window.app.goTo('street')`);
await shot('08-street2', `window.app.goTo('street')`);
await shot('09-street3', `window.app.goTo('street')`);
await shot('10-street4', `window.app.goTo('street')`);
await shot('11-select-court', `window.app.goTo('overview'); window.app.select('court-C4')`, 3500);
await shot('12-select-solar', `window.app.select('solar-ev')`, 3500);
await shot('13-tour-sustain', `window.app.tour('sustainability')`, 3500);
await shot('14-tour-community', `window.app.tour('community')`, 3500);
await shot('15-diagram', `window.app.ui.endTour(); window.app.goTo('overview'); document.getElementById('t-diagram').click()`, 3000);
await shot('16-homes', `document.getElementById('t-diagram').click(); window.app.select('homes-B2-n')`, 3500);

console.log(errors.length ? `\nCONSOLE ISSUES (${errors.length}):\n` + [...new Set(errors)].join('\n') : '\nNo console errors.');
await browser.close();
