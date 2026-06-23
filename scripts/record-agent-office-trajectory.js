const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);

function argValue(name, fallback) {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

function listArg(name) {
  const value = argValue(name, "");
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function writeJsonl(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${JSON.stringify(value)}\n`, "utf8");
}

const root = path.resolve(argValue("--root", process.cwd()));
const output = path.resolve(argValue("--output", path.join(root, "agent-office", "runtime", "trajectory.jsonl")));
const now = new Date().toISOString();

const entry = {
  time: argValue("--time", now),
  controllerDecision: argValue("--controller-decision", "Record Codex-side progress in the Agent Office trajectory ledger."),
  agent: argValue("--agent", "Judgment Controller"),
  lane: argValue("--lane", "controller"),
  action: argValue("--action", "record trajectory"),
  tool: argValue("--tool", "scripts/record-agent-office-trajectory.js"),
  files: listArg("--files"),
  evidence: listArg("--evidence"),
  result: argValue("--result", "trajectory entry recorded"),
  next: argValue("--next", "continue Controller route"),
  requestId: argValue("--request-id", ""),
  runId: argValue("--run-id", "")
};

writeJsonl(output, entry);
console.log(JSON.stringify({ ok: true, output, entry }, null, 2));
