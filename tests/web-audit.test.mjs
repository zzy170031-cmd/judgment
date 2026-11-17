import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync, execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {runWebAudit, exitCode} from '../skills/555/scripts/audit-web.mjs';

let origin;
let server;
let mutations = 0;
let afterVersion = false;
const page = (body, extra = '') => '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width"><title>创作者报名</title>' +
  '<style>body{font:18px Arial,sans-serif;color:#111;background:#fff;margin:20px}main{max-width:60rem}' +
  'input,button{font:inherit;padding:10px}a{color:#153fa0}.eyebrow{text-transform:uppercase;letter-spacing:.1em}</style>' +
  extra + '</head><body><main>' + body + '</main></body></html>';
const form = '<form id="join" method="post" action="/mutate"><label for="email">邮箱</label>' +
  '<input id="email" name="email" type="email" required><button type="button">提交</button></form>';
const healthy = page('<p class="eyebrow">OFFICIAL CREATOR</p><h1>游戏创作者报名</h1>' +
  '<p>规则与日期以活动说明为准。这是一段可自动换行的中文长文案。</p>' +
  '<a id="rules" href="/rules">阅读活动规则</a>' + form);

before(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://fixture.invalid');
    if (req.method === 'POST') { mutations++; res.end('mutation'); return; }
    if (url.pathname === '/redirect') {
      res.writeHead(302, {Location: 'http://example.invalid/not-authorized'});
      res.end(); return;
    }
    if (url.pathname === '/redirect-local') {
      res.writeHead(302, {Location: '/'});
      res.end(); return;
    }
    if (url.pathname === '/slow') {
      const timer = setTimeout(() => { res.end(healthy); }, 5000);
      res.on('close', () => clearTimeout(timer)); return;
    }
    if (url.pathname === '/missing.png') { res.writeHead(404); res.end(); return; }
    let content = healthy;
    if (url.pathname === '/broken') content = page('<h1>活动</h1><div id="wide" style="width:720px">过宽内容</div>' +
      '<button id="empty"></button><input id="unnamed"><img src="/missing.png" width="80" height="80" alt="玩法截图">');
    if (url.pathname === '/writes') content = page('<h1>活动说明</h1><p>读取说明。</p>' +
      '<script>fetch("/mutate",{method:"POST",body:"private-input"}).catch(()=>{});</script>');
    if (url.pathname === '/raf-stall') content = page('<h1>活动说明</h1><p>绘制等待反例。</p>' +
      '<script>window.requestAnimationFrame=()=>0;</script>');
    if (url.pathname === '/preservation') content = afterVersion
      ? page('<h1>游戏创作者报名</h1><p>奖励一千元</p><a id="rules" href="/changed">阅读活动规则</a>' +
        '<form id="join" method="post" action="/mutate"><button type="button">提交</button></form>')
      : page('<h1>游戏创作者报名</h1><p>奖励一百元</p><a id="rules" href="/rules">阅读活动规则</a>' + form);
    if (url.pathname === '/private') content = page('<h1>输入资料</h1><form><label for="secret">口令</label>' +
      '<input id="secret" name="secret" type="password" value="INPUT_VALUE_MUST_STAY_PRIVATE"></form>');
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(content);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
});

after(async () => {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
});

const options = route => ({url: origin + route, viewports: [{width: 390, height: 844}], timeout: 15000});

test('invalid or unauthorized target is rejected before browser work', async () => {
  for (const url of ['file:///private/file', 'https://example.invalid', 'http://user:password@localhost']) {
    const report = await runWebAudit({url});
    assert.equal(report.status, 'invalid-input');
    assert.equal(exitCode(report), 3);
  }
});

test('real browser checks responsive Chinese page without imposing house-style bans', async () => {
  const report = await runWebAudit({...options('/'), viewports: [{width: 390, height: 844}, {width: 1440, height: 900}]});
  assert.equal(report.status, 'checked', JSON.stringify(report.coverageGaps));
  assert.deepEqual(report.coverage.completedViewports, ['390x844', '1440x900']);
  assert.equal(report.observations.length, 0);
  assert.ok(report.tool.axe);
  assert.ok(report.tool.browser);
  assert.equal(report.tool.cleanup, 'browser-closed');
  assert.equal(exitCode(report), 0);
});

test('rendered defects produce actual overflow, broken-image and accessible-name findings', async () => {
  const report = await runWebAudit(options('/broken'));
  const rules = new Set(report.observations.map(item => item.rule));
  assert.ok(rules.has('layout.document-overflow'));
  assert.ok(rules.has('asset.broken-image'));
  assert.ok(rules.has('axe.button-name'));
  assert.ok(rules.has('axe.label'));
  assert.equal(report.status, 'findings', JSON.stringify(report.coverageGaps));
  assert.equal(exitCode(report), 1);
});

test('before/after detects removed fields, changed link and changed approved copy', async () => {
  afterVersion = false;
  const beforeReport = await runWebAudit(options('/preservation'));
  assert.equal(beforeReport.status, 'checked', JSON.stringify(beforeReport.coverageGaps));
  afterVersion = true;
  const afterReport = await runWebAudit({...options('/preservation'), preserveCopy: true}, beforeReport);
  const rules = new Set(afterReport.observations.map(item => item.rule));
  assert.ok(rules.has('preservation.controls'));
  assert.ok(rules.has('preservation.links'));
  assert.ok(rules.has('preservation.copy'));
  assert.equal(afterReport.status, 'findings');
  assert.equal(afterReport.baseline.scopeMatched, true);
  const wrongScope = await runWebAudit({...options('/preservation'), targetId: 'another-target'}, beforeReport);
  assert.equal(wrongScope.status, 'invalid-input');
  const malformed = structuredClone(beforeReport);
  malformed.snapshots[0].contract.links = [{not: 'a fingerprint'}];
  assert.equal((await runWebAudit(options('/preservation'), malformed)).status, 'invalid-input');
});

test('site POST is blocked, not executed or silently presented as fully checked', async () => {
  mutations = 0;
  const report = await runWebAudit(options('/writes'));
  assert.equal(mutations, 0);
  assert.ok(report.blockedRequests >= 1);
  assert.equal(report.status, 'incomplete');
  assert.equal(exitCode(report), 2);
});

test('different state-bearing URLs require manual binding instead of automatic scope acceptance', async () => {
  const beforeReport = await runWebAudit(options('/?mode=public#step1'));
  assert.equal(beforeReport.status, 'checked', JSON.stringify(beforeReport.coverageGaps));
  const compared = await runWebAudit(options('/?mode=admin#step2'), beforeReport);
  assert.equal(compared.baseline.identifierAndViewportMatched, true);
  assert.equal(compared.baseline.locationFingerprintMatched, false);
  assert.equal(compared.baseline.scopeMatched, false);
  assert.equal(compared.status, 'incomplete');
  assert.ok(compared.coverageGaps.some(item => item.includes('URL fingerprint changed')));
});

test('page-owned RAF cannot hang the observer or bypass browser cleanup', async () => {
  const cli = fileURLToPath(new URL('../skills/555/scripts/audit-web.mjs', import.meta.url));
  const result = await new Promise((resolve, reject) => {
    execFile(process.execPath, [cli, '--url', origin + '/raf-stall', '--viewport', '390x844', '--timeout', '1000'],
      {encoding: 'utf8', windowsHide: true, timeout: 8000}, (error, stdout, stderr) => {
        if (error?.killed || error?.signal) return reject(new Error('Observer exceeded independent 8s process deadline'));
        if (error && error.code !== 2) return reject(new Error('Unexpected CLI failure: ' + stderr));
        resolve({code: error?.code ?? 0, report: JSON.parse(stdout)});
      });
  });
  assert.equal(result.code, 2);
  assert.equal(result.report.status, 'incomplete');
  assert.ok(result.report.coverageGaps.some(item => item.includes('Paint settlement timed out')));
  assert.equal(result.report.tool.cleanup, 'browser-closed');
});

test('local navigation cannot silently redirect to an unapproved remote target', async () => {
  const report = await runWebAudit(options('/redirect'));
  assert.equal(report.status, 'incomplete');
  assert.equal(report.coverage.completedViewports.length, 0);
  assert.ok(report.blockedRequests >= 1);
});

test('redirect handling is explicit, including authorized final local navigation', async () => {
  const blocked = await runWebAudit(options('/redirect-local'));
  assert.equal(blocked.status, 'incomplete');
  assert.ok(blocked.blockedRequests >= 1);
  const allowed = await runWebAudit({...options('/redirect-local'), allowRemote: true});
  assert.equal(allowed.status, 'checked', JSON.stringify(allowed.coverageGaps));
  assert.equal(allowed.snapshots[0].location, origin + '/');
});

test('failed browser setup and navigation timeout cannot return checked', async () => {
  const missing = await runWebAudit({...options('/'), browserPath: path.join(os.tmpdir(), 'judgment-browser-does-not-exist.exe')});
  assert.equal(missing.status, 'setup-error');
  assert.equal(exitCode(missing), 2);
  const timeout = await runWebAudit({...options('/slow'), timeout: 1000});
  assert.equal(timeout.status, 'incomplete');
  assert.equal(timeout.coverage.completedViewports.length, 0);
  assert.equal(timeout.tool.cleanup, 'browser-closed');
});

test('observations omit query credentials, HTML and input values', async () => {
  const report = await runWebAudit(options('/private?token=QUERY_MUST_STAY_PRIVATE'));
  const text = JSON.stringify(report);
  assert.ok(!text.includes('QUERY_MUST_STAY_PRIVATE'));
  assert.ok(!text.includes('INPUT_VALUE_MUST_STAY_PRIVATE'));
  assert.ok(!text.includes('<input'));
  assert.equal(report.target.location, origin + '/private');
  assert.match(report.target.locationHash, /^[a-f0-9]{64}$/);
});

test('CLI rejects malformed baseline JSON without echoing its contents', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'judgment-malformed-'));
  const evidence = path.join(directory, 'before.json');
  const sentinel = 'BASELINE_CONTENT_MUST_STAY_PRIVATE';
  await fs.writeFile(evidence, sentinel);
  try {
    const cli = fileURLToPath(new URL('../skills/555/scripts/audit-web.mjs', import.meta.url));
    const result = spawnSync(process.execPath, [cli, '--url', origin, '--compare', evidence], {encoding: 'utf8', windowsHide: true, timeout: 5000});
    assert.equal(result.status, 3);
    const report = JSON.parse(result.stdout);
    assert.equal(report.status, 'invalid-input');
    assert.equal(report.error, 'Baseline must contain valid JSON');
    assert.ok(!result.stdout.includes(sentinel));
    assert.ok(!result.stderr.includes(sentinel));
    assert.equal(await fs.readFile(evidence, 'utf8'), sentinel);
  } finally {
    await fs.unlink(evidence);
    await fs.rmdir(directory);
  }
});

test('CLI preserves an existing evidence file and emits a structured invalid-input result', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'judgment-evidence-'));
  const evidence = path.join(directory, 'before.json');
  const bytes = '{"preserve":"original evidence"}\n';
  await fs.writeFile(evidence, bytes);
  try {
    const cli = fileURLToPath(new URL('../skills/555/scripts/audit-web.mjs', import.meta.url));
    const result = spawnSync(process.execPath, [cli, '--url', origin, '--out', evidence], {encoding: 'utf8', windowsHide: true});
    assert.equal(result.status, 3);
    assert.equal(JSON.parse(result.stdout).status, 'invalid-input');
    assert.equal(await fs.readFile(evidence, 'utf8'), bytes);
  } finally {
    await fs.unlink(evidence);
    await fs.rmdir(directory);
  }
});
