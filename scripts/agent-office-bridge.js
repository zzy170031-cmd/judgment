const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const url = require("node:url");
const vm = require("node:vm");

const args = process.argv.slice(2);

function argValue(name, fallback) {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

const root = path.resolve(argValue("--root", process.cwd()));
const port = Number(argValue("--port", "8787"));
const host = argValue("--host", "127.0.0.1");
const runtimeDir = path.join(root, "agent-office", "runtime");
const requestsDir = path.join(runtimeDir, "requests");
const eventsPath = path.join(runtimeDir, "events.jsonl");
const statePath = path.join(runtimeDir, "runtime-state.json");
const statusPath = path.join(runtimeDir, "bridge-status.json");

fs.mkdirSync(requestsDir, { recursive: true });

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/markdown; charset=utf-8"
  }[ext] || "application/octet-stream";
}

function sendJson(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload, null, 2), "utf8");
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}

function sendText(res, status, text) {
  const body = Buffer.from(text, "utf8");
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": body.length,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function readBody(req, limitBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > limitBytes) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function safeId(value) {
  const base = String(value || "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  if (base) return base;
  const stamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  return `codex-${stamp}-${Math.random().toString(16).slice(2, 8)}`;
}

function appendEvent(event) {
  fs.appendFileSync(eventsPath, `${JSON.stringify(event)}\n`, "utf8");
}

function defaultRuntimeState() {
  return {
    status: "running",
    activeRun: null,
    currentNode: "controller",
    currentLane: "controller",
    laneProgress: {},
    blockers: [],
    evidence: [],
    updatedAt: new Date().toISOString()
  };
}

function loadRuntimeState() {
  if (!fs.existsSync(statePath)) return defaultRuntimeState();
  try {
    return { ...defaultRuntimeState(), ...JSON.parse(fs.readFileSync(statePath, "utf8")) };
  } catch {
    return defaultRuntimeState();
  }
}

function saveRuntimeState(state) {
  const next = { ...state, updatedAt: new Date().toISOString() };
  fs.writeFileSync(statePath, JSON.stringify(next, null, 2), "utf8");
  return next;
}

function canonicalLane(value) {
  const raw = String(value || "").trim().toLowerCase();
  const map = {
    "agent office": "frontend",
    "agent-office": "frontend",
    "\u4ee3\u7406\u529e\u516c\u5ba4": "frontend",
    "\u529e\u516c\u5ba4": "frontend",
    overview: "controller",
    "\u603b\u89c8": "controller",
    topology: "splitter",
    "\u9879\u76ee\u62d3\u6251": "splitter",
    split: "splitter",
    splitter: "splitter",
    "\u5de5\u4f5c\u62c6\u5206": "splitter",
    planning: "planning",
    plan: "planning",
    "\u89c4\u5212\u4e2d\u5fc3": "planning",
    frontend: "frontend",
    ui: "frontend",
    ux: "frontend",
    backend: "backend",
    api: "backend",
    db: "backend",
    qa: "qa",
    test: "qa",
    "\u6d4b\u8bd5\u8bc1\u636e": "qa",
    review: "review",
    "555": "review",
    "555 review": "review",
    "555 \u5ba1\u67e5": "review",
    release: "release",
    worktree: "backend",
    git: "backend",
    controller: "controller"
  };
  return map[raw] || raw || "controller";
}
function writeStatus(status) {
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), "utf8");
}

function normalizeEvent(payload) {
  const now = new Date().toISOString();
  const event = {
    id: safeId(payload.id || `event-${now}`),
    time: now,
    source: String(payload.source || "Codex"),
    agentId: String(payload.agentId || payload.agent || "controller"),
    agent: String(payload.agent || payload.agentName || payload.agentId || "Controller"),
    lane: canonicalLane(payload.lane || payload.module || "controller"),
    module: String(payload.module || "Overview"),
    node: String(payload.node || payload.agentId || payload.lane || "controller"),
    status: String(payload.status || "running"),
    progress: Number.isFinite(Number(payload.progress)) ? Math.max(0, Math.min(100, Number(payload.progress))) : null,
    text: String(payload.text || payload.message || "Codex runtime event updated"),
    tag: String(payload.tag || "runtime-event"),
    tone: String(payload.tone || "cyan"),
    evidenceId: payload.evidenceId ? String(payload.evidenceId) : null,
    requestId: payload.requestId ? String(payload.requestId) : null,
    controller: payload.controller && typeof payload.controller === "object" ? payload.controller : null,
    loop: payload.loop && typeof payload.loop === "object" ? payload.loop : null
  };
  return event;
}
function applyRuntimeEvent(event) {
  const state = loadRuntimeState();
  if (event.status === "blocked" || event.status === "failed") {
    state.status = event.status;
  } else if (["completed", "executed", "resolved", "pass", "passed"].includes(event.status)) {
    state.status = "completed";
  } else {
    state.status = "running";
  }
  state.currentNode = event.node;
  state.currentLane = event.lane;
  state.activeRun = {
    requestId: event.requestId || state.activeRun?.requestId || null,
    agent: event.agent,
    agentId: event.agentId,
    module: event.module,
    node: event.node,
    lane: event.lane,
    status: event.status,
    progress: event.progress,
    text: event.text,
    time: event.time
  };
  if (event.progress !== null) {
    state.laneProgress[event.lane] = {
      progress: event.progress,
      status: event.status,
      tone: event.tone,
      updatedAt: event.time
    };
  }
  if (event.status === "blocked") {
    state.blockers = [
      {
        id: event.id,
        lane: event.lane,
        node: event.node,
        agent: event.agent,
        text: event.text,
        time: event.time
      },
      ...(state.blockers || []).filter((item) => item.id !== event.id)
    ].slice(0, 8);
  } else if (["completed", "executed", "resolved", "pass", "passed"].includes(event.status)) {
    state.blockers = (state.blockers || []).filter((item) => (
      item.lane !== event.lane || (event.node && item.node !== event.node)
    ));
  }
  if (event.evidenceId) {
    state.evidence = [
      {
        id: event.evidenceId,
        sourceEvent: event.id,
        agent: event.agent,
        text: event.text,
        time: event.time
      },
      ...(state.evidence || []).filter((item) => item.id !== event.evidenceId)
    ].slice(0, 12);
  }
  return saveRuntimeState(state);
}

function updateRequestFromEvent(event) {
  if (!event.requestId) return null;
  const requestPath = path.join(requestsDir, `${safeId(event.requestId)}.json`);
  if (!fs.existsSync(requestPath)) return null;
  try {
    const record = JSON.parse(fs.readFileSync(requestPath, "utf8"));
    record.status = event.status || record.status;
    record.statusText = event.text || record.statusText;
    record.lastEventAt = event.time;
    record.lastEvent = {
      id: event.id,
      status: event.status,
      agent: event.agent,
      lane: event.lane,
      module: event.module,
      node: event.node,
      progress: event.progress,
      tag: event.tag
    };
    fs.writeFileSync(requestPath, JSON.stringify(record, null, 2), "utf8");
    return record;
  } catch {
    return null;
  }
}

function recentEvents(limit = 20) {
  if (!fs.existsSync(eventsPath)) return [];
  return fs.readFileSync(eventsPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-limit)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();
}

function runCheck(label, file) {
  const startedAt = Date.now();
  try {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    new vm.Script(source, { filename: file, displayErrors: true });
    return {
      label,
      command: `vm.Script ${file}`,
      status: "pass",
      durationMs: Date.now() - startedAt,
      output: "syntax parsed"
    };
  } catch (error) {
    return {
      label,
      command: `vm.Script ${file}`,
      status: "fail",
      durationMs: Date.now() - startedAt,
      output: String(error.message || error).trim()
    };
  }
}

function runStaticChecks() {
  const indexPath = path.join(root, "agent-office", "index.html");
  const appPath = path.join(root, "agent-office", "app.js");
  const mockPath = path.join(root, "agent-office", "mockData.js");
  const stylesPath = path.join(root, "agent-office", "styles.css");
  const checks = [
    runCheck("app.js syntax", path.relative(root, appPath)),
    runCheck("mockData.js syntax", path.relative(root, mockPath))
  ];
  const resources = [indexPath, appPath, mockPath, stylesPath].map((file) => ({
    label: path.relative(root, file).replace(/\\/g, "/"),
    status: fs.existsSync(file) ? "pass" : "fail"
  }));
  const index = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : "";
  checks.push({
    label: "resource version",
    command: "index.html contains office-v10",
    status: index.includes("office-v10") ? "pass" : "fail",
    durationMs: 0,
    output: index.includes("office-v10") ? "office-v10 present" : "office-v10 missing"
  });
  return {
    kind: "agent-office-validation",
    status: checks.every((item) => item.status === "pass") && resources.every((item) => item.status === "pass") ? "pass" : "fail",
    checks,
    resources
  };
}

function shouldExecuteAllowlisted(requestText) {
  const text = String(requestText || "").toLowerCase();
  return /\u9a8c\u8bc1|\u6821\u9a8c|\u68c0\u67e5|\u6d4b\u8bd5|\u9a8c\u6536|check|validate|test|syntax|resource|status|js|browser|evidence/.test(text);
}

function requestDisplayName(payload) {
  const target = payload?.target || {};
  const targetName = target.name || target.label || target.id;
  const label = payload?.actionLabel || payload?.actionType || "HTML interaction";
  return targetName ? `${label} -> ${targetName}` : label;
}

function isReadOnlyAction(payload) {
  const actionType = String(payload?.actionType || "");
  const inspectActions = new Set([
    "agent.list.inspect",
    "bridge.contract.inspect",
    "gate.inspect",
    "runtime.event.refresh",
    "worktree.list.request",
    "system.health.inspect",
    "qa.issue-review"
  ]);
  return inspectActions.has(actionType) ||
    actionType.endsWith(".inspect") ||
    actionType.endsWith(".list.inspect") ||
    actionType.endsWith(".list.request");
}

function recentRequests() {
  if (!fs.existsSync(requestsDir)) return [];
  return fs.readdirSync(requestsDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const file = path.join(requestsDir, name);
      try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => String(b.receivedAt || "").localeCompare(String(a.receivedAt || "")))
    .slice(0, 12);
}

function allRequests() {
  if (!fs.existsSync(requestsDir)) return [];
  return fs.readdirSync(requestsDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const file = path.join(requestsDir, name);
      try {
        return {
          file: path.relative(root, file).replace(/\\/g, "/"),
          ...JSON.parse(fs.readFileSync(file, "utf8"))
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => String(b.receivedAt || "").localeCompare(String(a.receivedAt || "")));
}

async function handleCodexRequest(req, res) {
  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch (error) {
    sendJson(res, 400, { ok: false, status: "bad_request", statusText: error.message });
    return;
  }

  const id = safeId(payload.id);
  const requestText = String(payload.request || "").trim();
  const record = {
    ...payload,
    id,
    request: requestText,
    receivedAt: new Date().toISOString(),
    bridge: {
      name: "judgment-agent-office-bridge",
      mode: "local-allowlist",
      endpoint: "/codex/request"
    },
    controller: payload.controller || {
      agentId: "judgment-controller",
      role: "Judgment Controller",
      expectedDecision: "intake -> orient -> plan -> route"
    },
    loop: payload.loop || {
      readiness: "manual-first",
      stopCondition: "Codex-side review required"
    }
  };

  if (!requestText) {
    record.status = "rejected";
    record.statusText = "Empty request rejected";
  } else if (isReadOnlyAction(payload)) {
    record.status = "completed";
    record.statusText = `Read-only HTML inspection recorded: ${requestDisplayName(payload)}`;
    record.execution = {
      kind: "read-only-html-inspection",
      status: "completed",
      note: `Handled in HTML and recorded for Codex/HTML trace: ${requestDisplayName(payload)}.`
    };
  } else if (shouldExecuteAllowlisted(requestText)) {
    const execution = runStaticChecks();
    record.status = execution.status === "pass" ? "executed" : "failed";
    record.statusText = execution.status === "pass" ? "Static validation executed" : "Static validation failed";
    record.execution = execution;
  } else {
    record.status = "queued";
    record.statusText = "Queued in local Codex request queue for Codex-side review";
    record.execution = {
      kind: "manual-codex-queue",
      status: "pending",
      note: "Freeform requirements are persisted for Codex-side execution instead of being run directly from HTTP."
    };
  }

  const requestPath = path.join(requestsDir, `${id}.json`);
  fs.writeFileSync(requestPath, JSON.stringify(record, null, 2), "utf8");
  const completeStatuses = ["executed", "completed"];
  const requestEvent = normalizeEvent({
    id,
    source: "HTML",
    agentId: record.selectedAgent?.id || "controller",
    agent: record.selectedAgent?.name || "Controller",
    lane: "controller",
    status: record.status,
    module: record.module,
    requestId: id,
    progress: completeStatuses.includes(record.status) ? 100 : 10,
    text: completeStatuses.includes(record.status) ? record.statusText : `${record.statusText}: ${requestText}`,
    tag: completeStatuses.includes(record.status) ? "request-complete" : "request-queued",
    tone: completeStatuses.includes(record.status) ? "green" : "purple",
    controller: record.controller,
    loop: record.loop
  });
  appendEvent(requestEvent);
  applyRuntimeEvent(requestEvent);
  writeStatus({
    status: "running",
    updatedAt: new Date().toISOString(),
    lastRequest: {
      id,
      status: record.status,
      statusText: record.statusText
    },
    recentRequests: recentRequests().map((item) => ({
      id: item.id,
      status: item.status,
      statusText: item.statusText,
      module: item.module,
      receivedAt: item.receivedAt
    }))
  });

  sendJson(res, 200, {
    ok: record.status !== "rejected",
    requestId: id,
    status: record.status,
    statusText: record.statusText,
    execution: record.execution,
    requestPath: path.relative(root, requestPath).replace(/\\/g, "/")
  });
}
async function handleCodexEvent(req, res) {
  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch (error) {
    sendJson(res, 400, { ok: false, status: "bad_request", statusText: error.message });
    return;
  }
  const event = normalizeEvent(payload);
  appendEvent(event);
  const state = applyRuntimeEvent(event);
  const request = updateRequestFromEvent(event);
  sendJson(res, 200, {
    ok: true,
    status: "accepted",
    event,
    request,
    state
  });
}

function handleStatus(_req, res) {
  sendJson(res, 200, {
    ok: true,
    service: "judgment-agent-office-bridge",
    status: "running",
    root,
    runtimeDir: path.relative(root, runtimeDir).replace(/\\/g, "/"),
    updatedAt: new Date().toISOString(),
    recentRequests: recentRequests().map((item) => ({
      id: item.id,
      status: item.status,
      statusText: item.statusText,
      actionType: item.actionType,
      actionLabel: item.actionLabel,
      module: item.module,
      selectedAgent: item.selectedAgent,
      receivedAt: item.receivedAt
    })),
    recentEvents: recentEvents(8)
  });
}

function handleRequests(req, res) {
  const parsed = url.parse(req.url || "/", true);
  const status = parsed.query.status ? String(parsed.query.status) : "";
  const limit = Number(parsed.query.limit || 50);
  const requests = allRequests()
    .filter((item) => !status || item.status === status)
    .slice(0, Number.isFinite(limit) && limit > 0 ? limit : 50);
  sendJson(res, 200, {
    ok: true,
    service: "judgment-agent-office-bridge",
    count: requests.length,
    requests
  });
}

function handleState(_req, res) {
  sendJson(res, 200, {
    ok: true,
    service: "judgment-agent-office-bridge",
    state: loadRuntimeState(),
    recentEvents: recentEvents(20),
    recentRequests: recentRequests().map((item) => ({
      id: item.id,
      status: item.status,
      statusText: item.statusText,
      actionType: item.actionType,
      actionLabel: item.actionLabel,
      module: item.module,
      selectedAgent: item.selectedAgent,
      receivedAt: item.receivedAt
    }))
  });
}

function serveStatic(req, res, pathname) {
  let relative = decodeURIComponent(pathname).replace(/^\/+/, "");
  if (!relative) relative = "agent-office/index.html";
  const target = path.resolve(root, relative);
  if (!target.startsWith(root)) {
    sendText(res, 403, "Forbidden");
    return;
  }
  let filePath = target;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendText(res, 404, "Not Found");
    return;
  }
  const body = fs.readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": contentType(filePath),
    "Content-Length": body.length,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url || "/");
  const pathname = parsed.pathname || "/";
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }
  if (req.method === "POST" && pathname === "/codex/request") {
    handleCodexRequest(req, res).catch((error) => {
      sendJson(res, 500, { ok: false, status: "error", statusText: error.message });
    });
    return;
  }
  if (req.method === "POST" && pathname === "/codex/event") {
    handleCodexEvent(req, res).catch((error) => {
      sendJson(res, 500, { ok: false, status: "error", statusText: error.message });
    });
    return;
  }
  if (req.method === "GET" && pathname === "/codex/state") {
    handleState(req, res);
    return;
  }
  if (req.method === "GET" && pathname === "/codex/requests") {
    handleRequests(req, res);
    return;
  }
  if (req.method === "GET" && pathname === "/codex/status") {
    handleStatus(req, res);
    return;
  }
  if (req.method === "GET") {
    serveStatic(req, res, pathname);
    return;
  }
  sendText(res, 405, "Method Not Allowed");
});

server.listen(port, host, () => {
  const status = {
    status: "running",
    service: "judgment-agent-office-bridge",
    root,
    url: `http://${host}:${port}/agent-office/index.html`,
    endpoint: `http://${host}:${port}/codex/request`,
    startedAt: new Date().toISOString()
  };
  writeStatus(status);
  console.log(`${status.service} listening on ${status.url}`);
});
