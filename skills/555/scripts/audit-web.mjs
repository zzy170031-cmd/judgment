import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const VERSION = '1.1.0';
const KIND = 'judgment-web-observation';
const LIMIT = 500;
const hash = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const isLoopback = host => ['localhost', '127.0.0.1', '[::1]', '::1'].includes(host) || host.endsWith('.localhost');
async function within(promise, ms, label) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label + ' timed out')), ms);
    })]);
  } finally { clearTimeout(timer); }
}
const location = value => {
  const u = new URL(value);
  return u.origin + u.pathname;
};
const gap = (report, message) => {
  if (!report.coverageGaps.includes(message)) report.coverageGaps.push(message);
};
const message = (error, url) => String(error?.message ?? error)
  .split('\n')[0].replaceAll(url ?? '', url ? location(url) : '')
  .replaceAll(os.homedir(), '<home>').replace(/(https?:\/\/[^\s?]+)\?[^\s]*/g, '$1?<redacted>').slice(0, 400);

function inputError(text) {
  const error = new Error(text);
  error.auditInput = true;
  return error;
}

export function validateOptions(options) {
  let url;
  try { url = new URL(options.url); } catch { throw inputError('--url must be an HTTP(S) URL'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw inputError('Use an HTTP(S) URL without embedded credentials');
  }
  const local = isLoopback(url.hostname);
  if (!local && !options.allowRemote) throw inputError('A non-loopback target requires --allow-remote and actual authority');
  const viewports = options.viewports?.length ? options.viewports : [{width: 390, height: 844}, {width: 1440, height: 900}];
  if (viewports.length > 12 || viewports.some(v => !Number.isInteger(v.width) || !Number.isInteger(v.height) || v.width < 240 || v.height < 240 || v.width > 4096 || v.height > 4096)) {
    throw inputError('Use 1-12 viewports with integer dimensions from 240 to 4096');
  }
  if (new Set(viewports.map(v => v.width + 'x' + v.height)).size !== viewports.length) throw inputError('Duplicate viewports');
  const timeout = options.timeout ?? 15000;
  if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 60000) throw inputError('Timeout must be 1000-60000 ms');
  return {...options, url: url.href, timeout, viewports, targetId: options.targetId ?? location(url.href)};
}

function validateBaseline(baseline, options) {
  if (!baseline || baseline.schemaVersion !== 1 || baseline.kind !== KIND || baseline.target?.id !== options.targetId ||
      !Array.isArray(baseline.snapshots) || baseline.status !== 'checked' && baseline.status !== 'findings') {
    throw inputError('Baseline must be a completed observation of the same target id');
  }
  const expected = options.viewports.map(v => v.width + 'x' + v.height).sort();
  const actual = baseline.snapshots.map(s => s.viewport).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw inputError('Baseline viewport scope differs');
  for (const snapshot of baseline.snapshots) {
    if (!snapshot.contract || !/^[a-f0-9]{64}$/.test(snapshot.contentHash ?? '') ||
        ['links', 'controls', 'forms', 'headings'].some(key => !Array.isArray(snapshot.contract[key]) ||
          snapshot.contract[key].length > 20000 || snapshot.contract[key].some(value => !/^[a-f0-9]{64}$/.test(value)))) {
      throw inputError('Baseline has malformed DOM preservation fingerprints');
    }
  }
}

function defaultBrowser() {
  if (process.env.JUDGMENT_BROWSER_PATH) return {executablePath: process.env.JUDGMENT_BROWSER_PATH};
  if (process.platform === 'win32') {
    const candidates = [
      path.join(process.env.PROGRAMFILES ?? 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] ?? 'C:/Program Files (x86)', 'Microsoft/Edge/Application/msedge.exe'),
      path.join(process.env.PROGRAMFILES ?? 'C:/Program Files', 'Microsoft/Edge/Application/msedge.exe')
    ];
    const executablePath = candidates.find(existsSync);
    return executablePath ? {executablePath} : {channel: 'chrome'};
  }
  return {channel: 'chrome'};
}

function collectDom() {
  const visible = element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  };
  const selector = element => {
    if (element.id) return '#' + CSS.escape(element.id);
    const parts = [];
    let current = element;
    for (let n = 0; current && current.nodeType === 1 && n < 5; n++, current = current.parentElement) {
      let part = current.tagName.toLowerCase();
      const siblings = current.parentElement ? [...current.parentElement.children].filter(e => e.tagName === current.tagName) : [];
      if (siblings.length > 1) part += ':nth-of-type(' + (siblings.indexOf(current) + 1) + ')';
      parts.unshift(part);
    }
    return parts.join(' > ');
  };
  const text = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const elements = query => [...document.querySelectorAll(query)].filter(visible);
  const content = document.body?.innerText ?? '';
  const root = document.documentElement;
  return {
    content: text(content).slice(0, 1000000),
    truncated: content.length > 1000000,
    title: document.title,
    overflow: root.scrollWidth > root.clientWidth + 1 ? {scrollWidth: root.scrollWidth, clientWidth: root.clientWidth} : null,
    brokenImages: elements('img').filter(e => {
      const r = e.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0 && e.complete && e.naturalWidth === 0 && e.getAttribute('src');
    }).map(selector),
    pendingImages: elements('img').filter(e => {
      const r = e.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0 && !e.complete;
    }).length,
    links: elements('a[href]').map(e => [e.id, text(e.innerText || e.getAttribute('aria-label')), e.href]),
    controls: elements('input:not([type=hidden]),select,textarea,button,[role=button]').map(e =>
      [e.tagName, e.id, e.getAttribute('name'), e.getAttribute('type'), e.getAttribute('role'), e.hasAttribute('required')]),
    forms: elements('form').map(e => [e.id, e.getAttribute('name'), e.action, e.method]),
    headings: elements('h1,h2,h3,h4,h5,h6').map(e => [e.tagName, text(e.innerText)])
  };
}

function addObservation(report, observation) {
  if (report.observations.length < LIMIT) report.observations.push(observation);
  else gap(report, 'Observation limit reached; additional results omitted');
}

function missingItems(before, after) {
  const available = new Map();
  for (const item of after) available.set(item, (available.get(item) ?? 0) + 1);
  return before.filter(item => {
    const count = available.get(item) ?? 0;
    if (count) { available.set(item, count - 1); return false; }
    return true;
  });
}

function compareSnapshots(report, baseline, preserveCopy) {
  for (const current of report.snapshots) {
    const before = baseline.snapshots.find(s => s.viewport === current.viewport);
    for (const key of ['links', 'controls', 'forms', 'headings']) {
      const missing = missingItems(before.contract[key], current.contract[key]);
      if (missing.length) addObservation(report, {
        rule: 'preservation.' + key, viewport: current.viewport, kind: 'preservation-candidate',
        impact: 'context-required', missingCount: missing.length, fingerprints: missing.slice(0, 10),
        note: 'Removed or changed DOM contracts; verify authorized changes and actual behavior'
      });
    }
    if (preserveCopy && before.contentHash !== current.contentHash) addObservation(report, {
      rule: 'preservation.copy', viewport: current.viewport, kind: 'preservation-candidate',
      impact: 'context-required', beforeHash: before.contentHash, afterHash: current.contentHash,
      note: 'Visible text changed; dynamic state and authorized edits require contextual review'
    });
  }
  const locationMatched = baseline.target.locationHash === report.target.locationHash;
  report.baseline = {targetId: baseline.target.id, observedAt: baseline.observedAt,
    locationHash: baseline.target.locationHash, identifierAndViewportMatched: true,
    locationFingerprintMatched: locationMatched, scopeMatched: locationMatched};
  if (!locationMatched) gap(report, 'Requested URL fingerprint changed; manual source/state binding is required');
}

export async function runWebAudit(rawOptions, baseline) {
  let options;
  try {
    options = validateOptions(rawOptions);
    if (baseline !== undefined) validateBaseline(baseline, options);
  } catch (error) { return {schemaVersion: 1, kind: KIND, status: 'invalid-input', error: String(error.message)}; }
  const report = {
    schemaVersion: 1, kind: KIND, observedAt: new Date().toISOString(),
    tool: {name: 'judgment-web-observer', version: VERSION},
    target: {id: options.targetId, location: location(options.url), locationHash: hash(options.url)},
    coverage: {requestedViewports: options.viewports, completedViewports: [], scope: 'specified page and rendered viewport states',
      accessibility: 'automated subset; not WCAG certification', interaction: 'no clicks, submissions, touch or screen-reader test',
      readiness: 'load/fonts/paint only; expected application-ready state needs manual confirmation',
      independence: 'one tool origin; no J units or independent reviewer seats'},
    observations: [], manualReview: [], coverageGaps: [], snapshots: [], blockedRequests: 0
  };
  let browser;
  try {
    const {chromium} = await import('playwright-core');
    const axeModule = await import('@axe-core/playwright');
    const AxeBuilder = axeModule.default;
    browser = await chromium.launch({headless: true, chromiumSandbox: true, timeout: options.timeout,
      ...(options.browserPath ? {executablePath: options.browserPath} : defaultBrowser())});
    report.tool.browser = browser.version();
    for (const viewport of options.viewports) {
      const key = viewport.width + 'x' + viewport.height;
      const context = await browser.newContext({viewport, serviceWorkers: 'block', acceptDownloads: false});
      let blocked = 0;
      try {
        await context.route('**/*', async route => {
          if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) { blocked++; return route.abort('blockedbyclient'); }
          if (route.request().isNavigationRequest() && !options.allowRemote && !isLoopback(new URL(route.request().url()).hostname)) {
            blocked++;
            return route.abort('blockedbyclient');
          }
          if (route.request().isNavigationRequest() && !options.allowRemote) {
            try {
              const response = await route.fetch({maxRedirects: 0, timeout: options.timeout});
              if (response.status() >= 300 && response.status() < 400 && response.headers().location) {
                blocked++;
                gap(report, key + ': navigation redirect blocked; inspect an authorized final URL directly');
                return route.abort('blockedbyclient');
              }
              return route.fulfill({response});
            } catch { return route.abort('failed'); }
          }
          return route.continue();
        });
        await context.routeWebSocket('**/*', socket => { blocked++; socket.close(); });
        const page = await context.newPage();
        page.setDefaultTimeout(options.timeout);
        page.setDefaultNavigationTimeout(options.timeout);
        const response = await page.goto(options.url, {waitUntil: 'load'});
        if (!response?.ok()) throw new Error('Target returned an unsuccessful navigation response');
        const finalUrl = new URL(page.url());
        if (!options.allowRemote && !isLoopback(finalUrl.hostname)) {
          throw new Error('Local target redirected outside loopback; state not accepted');
        }
        await page.waitForFunction(() => document.fonts.status === 'loaded');
        await within(page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))),
          options.timeout, 'Paint settlement');
        const dom = await within(page.evaluate(collectDom), options.timeout, 'DOM observation');
        if (dom.truncated) gap(report, key + ': text fingerprint was truncated');
        if (dom.pendingImages) gap(report, key + ': visible images were still loading');
        if (dom.overflow) addObservation(report, {rule: 'layout.document-overflow', viewport: key, kind: 'technical-observation',
          impact: 'context-required', ...dom.overflow, note: 'Confirm intended horizontal scrolling and task impact'});
        for (const selector of dom.brokenImages) addObservation(report, {
          rule: 'asset.broken-image', viewport: key, kind: 'technical-observation', impact: 'context-required', target: [selector]
        });
        report.snapshots.push({viewport: key, location: location(page.url()), locationHash: hash(page.url()),
          titleHash: hash(dom.title), contentHash: hash(dom.content), contract: {
          links: dom.links.map(item => hash(JSON.stringify(item))),
          controls: dom.controls.map(item => hash(JSON.stringify(item))),
          forms: dom.forms.map(item => hash(JSON.stringify(item))),
          headings: dom.headings.map(item => hash(JSON.stringify(item)))
        }});
        const axe = await within(new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze(),
          options.timeout, 'Accessibility observation');
        report.tool.axe = axe.testEngine.version;
        for (const violation of axe.violations) addObservation(report, {
          rule: 'axe.' + violation.id, viewport: key, kind: 'technical-observation',
          impact: violation.impact, description: violation.description, helpUrl: violation.helpUrl,
          nodeCount: violation.nodes.length, targets: violation.nodes.slice(0, 10).map(n => n.target)
        });
        for (const item of axe.incomplete) {
          if (report.manualReview.length < LIMIT) report.manualReview.push({
            rule: 'axe.' + item.id, viewport: key, reason: item.description, nodeCount: item.nodes.length
          });
          gap(report, key + ': automated accessibility rules need manual review');
        }
        report.coverage.completedViewports.push(key);
      } catch (error) {
        gap(report, key + ': ' + message(error, options.url));
      } finally {
        report.blockedRequests += blocked;
        if (blocked) gap(report, key + ': non-read requests or WebSockets blocked; dependent states unverified');
        try { await within(context.close(), 5000, 'Context cleanup'); }
        catch { gap(report, key + ': context cleanup unverified'); }
      }
    }
    if (baseline !== undefined && report.snapshots.length === options.viewports.length) {
      compareSnapshots(report, baseline, options.preserveCopy);
    }
    report.status = report.coverageGaps.length ? 'incomplete' : report.observations.length ? 'findings' : 'checked';
  } catch (error) {
    report.status = browser ? 'incomplete' : 'setup-error';
    gap(report, message(error, options.url));
  } finally {
    if (browser) {
      try {
        await within(browser.close(), 10000, 'Browser cleanup');
        report.tool.cleanup = 'browser-closed';
      } catch {
        report.status = 'incomplete';
        report.tool.cleanup = 'unverified';
        gap(report, 'Browser cleanup failed; check remaining tool process');
      }
    }
  }
  return report;
}

export const exitCode = report => ({checked: 0, findings: 1, incomplete: 2, 'setup-error': 2, 'invalid-input': 3}[report.status] ?? 2);

function parseArgs(args) {
  const options = {viewports: []};
  const valued = new Map([['--url', 'url'], ['--out', 'out'], ['--baseline', 'baseline'],
    ['--compare', 'compare'], ['--browser-path', 'browserPath'], ['--target-id', 'targetId']]);
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (valued.has(key)) {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw inputError('Missing value for ' + key);
      options[valued.get(key)] = args[++i];
    } else if (key === '--viewport') {
      const match = /^(\d+)x(\d+)$/.exec(args[++i] ?? '');
      if (!match) throw inputError('Viewport format is WIDTHxHEIGHT');
      options.viewports.push({width: Number(match[1]), height: Number(match[2])});
    } else if (key === '--timeout') {
      options.timeout = Number(args[++i]);
    } else if (key === '--allow-remote') options.allowRemote = true;
    else if (key === '--preserve-copy') options.preserveCopy = true;
    else if (key === '--help') options.help = true;
    else throw inputError('Unknown option: ' + key);
  }
  return options;
}

async function main() {
  let report;
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log('Judgment web observation (not a verdict)\n--url HTTP(S) --viewport WIDTHxHEIGHT [repeat]\n--allow-remote --browser-path FILE --target-id ID --timeout MS\n--out NEW.json --baseline NEW.json --compare BEFORE.json --preserve-copy\nOptional dependencies and an installed browser are required. No browser is downloaded.');
      return;
    }
    validateOptions(options);
    let baseline;
    if (options.compare) {
      const stat = await fs.stat(options.compare);
      if (stat.size > 5 * 1024 * 1024) throw inputError('Baseline exceeds 5 MiB');
      const baselineText = await fs.readFile(options.compare, 'utf8');
      try { baseline = JSON.parse(baselineText); }
      catch { throw inputError('Baseline must contain valid JSON'); }
    }
    const outputs = [...new Set([options.out, options.baseline].filter(Boolean).map(p => path.resolve(p)))];
    if (outputs.some(p => existsSync(p) || options.compare && p === path.resolve(options.compare))) throw inputError('Evidence outputs must be new files; existing evidence is preserved');
    report = await runWebAudit(options, baseline);
    for (const output of outputs) await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  } catch (error) {
    report = {schemaVersion: 1, kind: KIND, status: 'invalid-input', error: String(error.message).slice(0, 400)};
  }
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = exitCode(report);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
