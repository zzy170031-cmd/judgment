const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
const REQUIRED_FIELDS = ["time", "controllerDecision", "agent", "lane", "action", "tool", "files", "evidence", "result", "next"];

function argValue(name, fallback) {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

function hasArg(name) {
  return args.includes(name);
}

function countBy(items) {
  const counts = new Map();
  for (const item of items) {
    const key = String(item || "unknown");
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));
}

function uniqueFlat(entries, field) {
  return [...new Set(entries.flatMap((entry) => Array.isArray(entry[field]) ? entry[field] : []))]
    .filter(Boolean)
    .sort();
}

function validateEntry(entry, lineNumber) {
  const errors = [];
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return [`line ${lineNumber}: trajectory entry must be an object`];
  }
  for (const field of REQUIRED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(entry, field)) {
      errors.push(`line ${lineNumber}: ${field} is required`);
    }
  }
  for (const field of ["files", "evidence"]) {
    if (Object.prototype.hasOwnProperty.call(entry, field) && !Array.isArray(entry[field])) {
      errors.push(`line ${lineNumber}: ${field} must be an array`);
    }
  }
  return errors;
}

function readJsonl(file, explicitInput) {
  if (!fs.existsSync(file)) {
    if (explicitInput) {
      throw new Error(`trajectory input not found: ${file}`);
    }
    return [];
  }

  const entries = [];
  const errors = [];
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch (error) {
      errors.push(`line ${index + 1}: invalid JSON (${error.message})`);
      return;
    }
    errors.push(...validateEntry(entry, index + 1));
    entries.push(entry);
  });

  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
  return entries.sort((a, b) => String(a.time).localeCompare(String(b.time)));
}

function latestValue(entries, field) {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index][field]) return entries[index][field];
  }
  return "";
}

function buildSummary(entries, input, limit) {
  const recent = entries.slice(-limit).reverse();
  return {
    generatedAt: new Date().toISOString(),
    source: input,
    totalEntries: entries.length,
    firstTime: entries[0]?.time || "",
    lastTime: entries[entries.length - 1]?.time || "",
    lanes: countBy(entries.map((entry) => entry.lane)),
    agents: countBy(entries.map((entry) => entry.agent)),
    tools: countBy(entries.map((entry) => entry.tool)),
    files: uniqueFlat(entries, "files"),
    evidence: uniqueFlat(entries, "evidence"),
    latestControllerDecision: latestValue(entries, "controllerDecision"),
    latestResult: latestValue(entries, "result"),
    latestNext: latestValue(entries, "next"),
    recent
  };
}

function listLines(items, formatter) {
  if (!items.length) return "- none";
  return items.map(formatter).join("\n");
}

function text(value) {
  return String(value || "").replace(/\r?\n/g, " ").trim();
}

function toMarkdown(summary) {
  const span = summary.totalEntries
    ? `${summary.firstTime} -> ${summary.lastTime}`
    : "no entries";
  const recentTrail = summary.recent.map((entry, index) => {
    const evidence = Array.isArray(entry.evidence) && entry.evidence.length
      ? `\n   - evidence: ${entry.evidence.join(", ")}`
      : "";
    const files = Array.isArray(entry.files) && entry.files.length
      ? `\n   - files: ${entry.files.join(", ")}`
      : "";
    return `${index + 1}. ${text(entry.time)} | ${text(entry.agent)} | ${text(entry.lane)} | ${text(entry.action)}
   - decision: ${text(entry.controllerDecision)}
   - result: ${text(entry.result)}
   - next: ${text(entry.next)}${evidence}${files}`;
  }).join("\n");

  return `# Agent Office Trajectory Summary

Source: ${summary.source}
Generated: ${summary.generatedAt}
Entries: ${summary.totalEntries}
Time span: ${span}

## Controller Focus

- latest decision: ${text(summary.latestControllerDecision) || "none"}
- latest result: ${text(summary.latestResult) || "none"}
- next action: ${text(summary.latestNext) || "none"}

## Lanes

${listLines(summary.lanes, (item) => `- ${item.name}: ${item.count}`)}

## Agents

${listLines(summary.agents, (item) => `- ${item.name}: ${item.count}`)}

## Tools

${listLines(summary.tools, (item) => `- ${item.name}: ${item.count}`)}

## Evidence

${listLines(summary.evidence, (item) => `- ${item}`)}

## Files

${listLines(summary.files, (item) => `- ${item}`)}

## Recent Trail

${recentTrail || "- none"}
`;
}

function writeOutput(output, content) {
  if (!output) {
    console.log(content);
    return;
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, content.endsWith("\n") ? content : `${content}\n`, "utf8");
  console.log(JSON.stringify({ ok: true, output }, null, 2));
}

function main() {
  const root = path.resolve(argValue("--root", process.cwd()));
  const explicitInput = hasArg("--input");
  const input = path.resolve(argValue("--input", path.join(root, "agent-office", "runtime", "trajectory.jsonl")));
  const output = argValue("--output", "");
  const format = argValue("--format", "markdown");
  const limit = Math.max(1, Number(argValue("--limit", "8")) || 8);
  const entries = readJsonl(input, explicitInput);
  const summary = buildSummary(entries, input, limit);

  if (format === "json") {
    writeOutput(output, JSON.stringify(summary, null, 2));
    return;
  }
  if (format !== "markdown") {
    throw new Error("--format must be markdown or json");
  }
  writeOutput(output, toMarkdown(summary));
}

module.exports = {
  buildSummary,
  readJsonl,
  toMarkdown,
  validateEntry
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
