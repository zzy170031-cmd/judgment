const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const args = process.argv.slice(2);

function argValue(name, fallback) {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

function safeId(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 96);
}

function inferLane(request) {
  const text = `${request.actionType || ""} ${request.actionLabel || ""} ${request.module || ""}`.toLowerCase();
  if (text.includes("review") || text.includes("555") || text.includes("审查")) return "review";
  if (text.includes("evidence") || text.includes("qa") || text.includes("证据") || text.includes("测试")) return "qa";
  if (text.includes("frontend") || text.includes("ui")) return "frontend";
  if (text.includes("backend") || text.includes("api")) return "backend";
  if (text.includes("split")) return "splitter";
  if (text.includes("plan") || text.includes("规划")) return "planning";
  return "controller";
}

function readRequests(root, statuses, limit) {
  const requestsDir = path.join(root, "agent-office", "runtime", "requests");
  if (!fs.existsSync(requestsDir)) return [];
  return fs.readdirSync(requestsDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const file = path.join(requestsDir, name);
      return {
        file,
        ...JSON.parse(fs.readFileSync(file, "utf8"))
      };
    })
    .filter((request) => statuses.has(request.status))
    .sort((a, b) => String(a.receivedAt || "").localeCompare(String(b.receivedAt || "")))
    .slice(0, limit);
}

function readAllRequestSummaries(root) {
  const requestsDir = path.join(root, "agent-office", "runtime", "requests");
  if (!fs.existsSync(requestsDir)) return [];
  return fs.readdirSync(requestsDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const file = path.join(requestsDir, name);
      try {
        const request = JSON.parse(fs.readFileSync(file, "utf8"));
        return {
          id: request.id,
          status: request.status,
          statusText: request.statusText,
          module: request.module,
          receivedAt: request.receivedAt
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => String(b.receivedAt || "").localeCompare(String(a.receivedAt || "")))
    .slice(0, 12);
}

function refreshBridgeStatus(root, lastRequest) {
  const runtimeDir = path.join(root, "agent-office", "runtime");
  const statusPath = path.join(runtimeDir, "bridge-status.json");
  const recentRequests = readAllRequestSummaries(root);
  let status = {};
  if (fs.existsSync(statusPath)) {
    try {
      status = JSON.parse(fs.readFileSync(statusPath, "utf8"));
    } catch {
      status = {};
    }
  }
  const currentLast = lastRequest || recentRequests[0] || status.lastRequest;
  fs.writeFileSync(statusPath, JSON.stringify({
    ...status,
    status: status.status || "running",
    updatedAt: new Date().toISOString(),
    lastRequest: currentLast,
    recentRequests
  }, null, 2), "utf8");
}

function postEvent({ host, port, event }) {
  const body = Buffer.from(JSON.stringify(event), "utf8");
  return new Promise((resolve, reject) => {
    const request = http.request({
      host,
      port,
      path: "/codex/event",
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": body.length
      }
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(text || `HTTP ${response.statusCode}`));
          return;
        }
        resolve(JSON.parse(text));
      });
    });
    request.on("error", reject);
    request.end(body);
  });
}

async function main() {
  const root = path.resolve(argValue("--root", process.cwd()));
  const host = argValue("--host", "127.0.0.1");
  const port = Number(argValue("--port", "8787"));
  const limit = Number(argValue("--limit", "200"));
  const statuses = new Set(argValue("--statuses", "queued,accepted").split(",").map((item) => item.trim()).filter(Boolean));
  const dryRun = args.includes("--dry-run");
  const requests = readRequests(root, statuses, Number.isFinite(limit) && limit > 0 ? limit : 200);
  const results = [];

  for (const request of requests) {
    const lane = inferLane(request);
    const actionLabel = request.actionLabel || request.actionType || "HTML request";
    const event = {
      id: safeId(`codex-read-${request.id}`),
      source: "Codex",
      agentId: "controller",
      agent: "Judgment Controller",
      lane,
      module: request.module || request.payload?.activeNav || "Agent Office",
      node: request.actionType || request.target?.id || "codex-queue",
      status: "completed",
      progress: 100,
      requestId: request.id,
      text: `Codex 已读取并闭环 HTML 请求：${actionLabel}。如需真实代码/Git/测试执行，请继续在 Codex 需求入口写明具体目标。`,
      tag: "codex-read",
      tone: "green"
    };
    if (dryRun) {
      results.push({ id: request.id, actionType: request.actionType, status: request.status, event });
      continue;
    }
    const response = await postEvent({ host, port, event });
    results.push({ id: request.id, actionType: request.actionType, before: request.status, after: response.request?.status || event.status });
  }

  if (!dryRun) {
    const latest = results[results.length - 1];
    refreshBridgeStatus(root, latest ? {
      id: latest.id,
      status: latest.after || "completed",
      statusText: "Codex read and closed HTML request"
    } : undefined);
  }

  console.log(JSON.stringify({
    ok: true,
    root,
    matched: requests.length,
    dryRun,
    results
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
