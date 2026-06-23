const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);

function argValue(name, fallback) {
  for (let index = args.length - 2; index >= 0; index -= 1) {
    if (args[index] === name && args[index + 1]) return args[index + 1];
  }
  return fallback;
}

const root = path.resolve(argValue("--root", process.cwd()));
const statusFilter = argValue("--status", "");
const limit = Number(argValue("--limit", "20"));
const asJson = args.includes("--json");
const requestsDir = path.join(root, "agent-office", "runtime", "requests");

function readRequests() {
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
      } catch (error) {
        return {
          file: path.relative(root, file).replace(/\\/g, "/"),
          status: "unreadable",
          statusText: error.message
        };
      }
    })
    .filter((item) => !statusFilter || item.status === statusFilter)
    .sort((a, b) => String(b.receivedAt || "").localeCompare(String(a.receivedAt || "")))
    .slice(0, Number.isFinite(limit) && limit > 0 ? limit : 20);
}

const requests = readRequests();

if (asJson) {
  console.log(JSON.stringify({ root, requestsDir: path.relative(root, requestsDir), count: requests.length, requests }, null, 2));
} else {
  if (!requests.length) {
    console.log("No Agent Office requests found.");
  }
  for (const request of requests) {
    console.log([
      request.id || "(no id)",
      request.status || "(no status)",
      request.actionType || "freeform-request",
      request.actionLabel || "",
      request.module || "",
      request.selectedAgent?.name || request.selectedAgent || "",
      request.statusText || "",
      request.file
    ].filter(Boolean).join(" | "));
  }
}
