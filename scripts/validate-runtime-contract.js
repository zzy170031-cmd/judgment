const fs = require("node:fs");
const path = require("node:path");

const READINESS = new Set(["no-loop", "manual-first", "skill-ready", "loop-ready", "blocked"]);
const EVENT_STATUS = new Set(["planned", "queued", "running", "blocked", "failed", "completed", "executed", "pass", "passed", "resolved", "accepted"]);
const RUNTIME_STATUS = new Set(["running", "blocked", "failed", "completed", "closed", "stopped"]);
const REVIEW_STATUS = new Set(["pending", "not-required", "passed", "failed", "blocked"]);
const VERDICT = new Set(["go", "conditional-go", "no-go", "blocked"]);

const args = process.argv.slice(2);

function argValue(name, fallback) {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

function expect(errors, condition, message) {
  if (!condition) errors.push(message);
}

function requireKeys(errors, data, keys, prefix) {
  for (const key of keys) {
    expect(errors, Object.prototype.hasOwnProperty.call(data, key), `${prefix}.${key} is required`);
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function inferKind(file, explicit) {
  if (explicit && explicit !== "auto") return explicit;
  const name = path.basename(file).toLowerCase();
  if (name.includes("runtime")) return "runtime";
  if (name.includes("worker")) return "worker";
  if (name.includes("verdict") || name.includes("555")) return "verdict";
  if (name.includes("trajectory")) return "trajectory";
  if (name.includes("request")) return "request";
  if (name.includes("event")) return "event";
  return "loop";
}

function validateLoop(data) {
  const errors = [];
  expect(errors, isObject(data), "loop root must be an object");
  if (!isObject(data)) return errors;
  requireKeys(errors, data, ["runId", "project", "codexOnly", "purpose", "gate", "readiness", "status", "controller", "currentLane", "currentAgent", "currentNode", "upstreamInputs", "downstreamReceivers", "allowedActions", "forbiddenActions", "oracles", "budget", "worktree", "evidence", "blockers", "nextAction", "review", "metrics", "updatedAt"], "loop");
  expect(errors, data.codexOnly === true, "loop.codexOnly must be true");
  expect(errors, READINESS.has(data.readiness), "loop.readiness is invalid");
  expect(errors, ["planned", "queued", "running", "blocked", "failed", "completed", "stopped"].includes(data.status), "loop.status is invalid");
  expect(errors, Array.isArray(data.oracles) && data.oracles.length > 0, "loop.oracles must not be empty");
  return errors;
}

function validateRequest(data) {
  const errors = [];
  expect(errors, isObject(data), "request root must be an object");
  if (!isObject(data)) return errors;
  requireKeys(errors, data, ["id", "project", "branch", "gate", "module", "selectedAgent", "request", "safetyBoundary"], "request");
  expect(errors, String(data.request || "").trim().length > 0, "request.request must not be empty");
  const safety = data.safetyBoundary;
  expect(errors, isObject(safety), "request.safetyBoundary must be an object");
  if (isObject(safety)) {
    expect(errors, safety.htmlCanExecute === false, "request.safetyBoundary.htmlCanExecute must be false");
    expect(errors, safety.codexMustReview === true, "request.safetyBoundary.codexMustReview must be true");
    expect(errors, safety.gitWriteRequiresCodex === true, "request.safetyBoundary.gitWriteRequiresCodex must be true");
    expect(errors, safety.destructiveActionsRequireHumanApproval === true, "request.safetyBoundary.destructiveActionsRequireHumanApproval must be true");
  }
  return errors;
}

function validateEvent(data) {
  const errors = [];
  expect(errors, isObject(data), "event root must be an object");
  if (!isObject(data)) return errors;
  requireKeys(errors, data, ["id", "source", "agentId", "agent", "lane", "module", "node", "status", "text"], "event");
  expect(errors, EVENT_STATUS.has(data.status), "event.status is invalid");
  if (data.progress !== undefined && data.progress !== null) {
    expect(errors, typeof data.progress === "number" && data.progress >= 0 && data.progress <= 100, "event.progress must be 0..100 or null");
  }
  return errors;
}

function validateRuntime(data) {
  const errors = [];
  expect(errors, isObject(data), "runtime root must be an object");
  if (!isObject(data)) return errors;
  requireKeys(errors, data, ["status", "activeRun", "currentNode", "currentLane", "laneProgress", "blockers", "evidence", "updatedAt"], "runtime");
  expect(errors, RUNTIME_STATUS.has(data.status), "runtime.status is invalid");
  expect(errors, isObject(data.laneProgress), "runtime.laneProgress must be an object");
  expect(errors, Array.isArray(data.blockers), "runtime.blockers must be an array");
  expect(errors, Array.isArray(data.evidence), "runtime.evidence must be an array");
  if (data.activeRun !== null) {
    expect(errors, isObject(data.activeRun), "runtime.activeRun must be null or an object");
    if (isObject(data.activeRun)) {
      requireKeys(errors, data.activeRun, ["agent", "agentId", "module", "node", "lane", "status", "text", "time"], "runtime.activeRun");
    }
  }
  return errors;
}

function validateWorker(data) {
  const errors = [];
  expect(errors, isObject(data), "worker root must be an object");
  if (!isObject(data)) return errors;
  requireKeys(errors, data, ["id", "project", "lane", "agent", "goal", "inputs", "allowedActions", "forbiddenActions", "oracles", "downstreamReceiver", "stopCondition", "review"], "worker");
  for (const key of ["inputs", "allowedActions", "forbiddenActions", "oracles"]) {
    expect(errors, Array.isArray(data[key]), `worker.${key} must be an array`);
  }
  expect(errors, Array.isArray(data.oracles) && data.oracles.length > 0, "worker.oracles must not be empty");
  expect(errors, isObject(data.review), "worker.review must be an object");
  if (isObject(data.review)) {
    expect(errors, REVIEW_STATUS.has(data.review.status), "worker.review.status is invalid");
  }
  return errors;
}

function validateVerdict(data) {
  const errors = [];
  expect(errors, isObject(data), "verdict root must be an object");
  if (!isObject(data)) return errors;
  requireKeys(errors, data, ["id", "project", "gate", "verdict", "reviewer", "evidence", "risks", "requiredFollowups", "stopCondition", "issuedAt"], "verdict");
  expect(errors, VERDICT.has(data.verdict), "verdict.verdict is invalid");
  expect(errors, Array.isArray(data.evidence) && data.evidence.length > 0, "verdict.evidence must not be empty");
  expect(errors, Array.isArray(data.risks), "verdict.risks must be an array");
  expect(errors, Array.isArray(data.requiredFollowups), "verdict.requiredFollowups must be an array");
  return errors;
}

function validateTrajectory(data) {
  const errors = [];
  expect(errors, isObject(data), "trajectory root must be an object");
  if (!isObject(data)) return errors;
  requireKeys(errors, data, ["time", "controllerDecision", "agent", "lane", "action", "tool", "files", "evidence", "result", "next"], "trajectory");
  expect(errors, Array.isArray(data.files), "trajectory.files must be an array");
  expect(errors, Array.isArray(data.evidence), "trajectory.evidence must be an array");
  return errors;
}

const file = args[0];
if (!file) {
  console.error("Usage: node scripts/validate-runtime-contract.js <json-file> [--kind auto|loop|request|event|runtime|worker|verdict|trajectory]");
  process.exit(2);
}

const data = JSON.parse(fs.readFileSync(file, "utf8"));
const kind = inferKind(file, argValue("--kind", "auto"));
const validators = {
  loop: validateLoop,
  request: validateRequest,
  event: validateEvent,
  runtime: validateRuntime,
  worker: validateWorker,
  verdict: validateVerdict,
  trajectory: validateTrajectory
};
const errors = validators[kind](data);

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log(`OK: ${file} (${kind})`);
