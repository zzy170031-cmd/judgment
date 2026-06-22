const http = require("node:http");

const args = process.argv.slice(2);

function argValue(name, fallback) {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

function safeId(value) {
  const base = String(value || "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  if (base) return base;
  return `evt-${new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14)}`;
}

const host = argValue("--host", "127.0.0.1");
const port = Number(argValue("--port", "8787"));
const event = {
  id: safeId(argValue("--id", "")),
  source: argValue("--source", "Codex"),
  agentId: argValue("--agent-id", "controller"),
  agent: argValue("--agent", "Controller"),
  lane: argValue("--lane", "controller"),
  module: argValue("--module", "Agent Office"),
  node: argValue("--node", "codex-thread"),
  status: argValue("--status", "running"),
  progress: Number(argValue("--progress", "10")),
  text: argValue("--text", "Codex event posted from local helper."),
  tag: argValue("--tag", "codex-event"),
  tone: argValue("--tone", "cyan"),
  requestId: argValue("--request-id", ""),
  evidenceId: argValue("--evidence-id", "")
};

const body = Buffer.from(JSON.stringify(event), "utf8");
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
      console.error(text);
      process.exitCode = 1;
      return;
    }
    console.log(text);
  });
});

request.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

request.end(body);
