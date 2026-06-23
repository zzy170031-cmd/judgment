const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const errors = [];

function fail(message) {
  errors.push(message);
}

function abs(rel) {
  return path.join(root, rel);
}

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function readBuffer(relPath) {
  return fs.readFileSync(abs(relPath));
}

function assertJson(relPath) {
  try {
    JSON.parse(fs.readFileSync(abs(relPath), "utf8"));
  } catch (error) {
    fail(`${relPath}: invalid JSON (${error.message})`);
  }
}

function assertSame(left, right, message) {
  const leftPath = abs(left);
  const rightPath = abs(right);
  if (!fs.existsSync(leftPath)) {
    fail(`${left}: missing`);
    return;
  }
  if (!fs.existsSync(rightPath)) {
    fail(`${right}: missing`);
    return;
  }
  if (!readBuffer(left).equals(readBuffer(right))) fail(message);
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(file, files);
    } else {
      files.push(file);
    }
  }
  return files;
}

assertJson("plugins/work-splitter/.codex-plugin/plugin.json");

assertSame(
  "SKILL.md",
  "skills/666/SKILL.md",
  "root SKILL.md must match skills/666/SKILL.md"
);
assertSame(
  "agents/openai.yaml",
  "skills/666/agents/openai.yaml",
  "root agents/openai.yaml must match skills/666/agents/openai.yaml"
);

for (const skill of [
  "slash-work-planner",
  "work-planner",
  "needs-solution-designer",
  "work-splitter",
]) {
  assertSame(
    `skills/${skill}/SKILL.md`,
    `plugins/work-splitter/skills/${skill}/SKILL.md`,
    `plugin copy for ${skill}/SKILL.md is out of sync; run scripts/sync-plugin-skills.sh`
  );
  assertSame(
    `skills/${skill}/agents/openai.yaml`,
    `plugins/work-splitter/skills/${skill}/agents/openai.yaml`,
    `plugin copy for ${skill}/agents/openai.yaml is out of sync; run scripts/sync-plugin-skills.sh`
  );
}

const scanRoots = [
  "AGENTS.md",
  "README.md",
  "SKILL.md",
  "agents",
  "plugins",
  "rules",
  "skills",
  "scripts",
  "templates",
  ".github",
  "package.json",
  "package-lock.json",
];

const windowsUsers = new RegExp("[A-Za-z]:[\\\\/]+Users[\\\\/]+[^\\\\/\\s'\"`]+");
const posixUsers = new RegExp("(?:^|[^A-Za-z0-9_])/(?:Users|home)/[^/\\s'\"`]+");
const allowedExamples = [
  /\/home\/user\b/,
  /\/home\/you\b/,
  /\/Users\/you\b/,
  /\/Users\/example\b/,
  /C:[\\/]Users[\\/]you\b/i,
  /C:[\\/]Users[\\/]example\b/i,
];

function isAllowedExample(match) {
  return allowedExamples.some((pattern) => pattern.test(match));
}

for (const scanRoot of scanRoots) {
  const scanPath = abs(scanRoot);
  const files = fs.existsSync(scanPath) && fs.statSync(scanPath).isDirectory()
    ? walk(scanPath)
    : [scanPath];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    const matches = [
      ...text.matchAll(new RegExp(windowsUsers.source, "g")),
      ...text.matchAll(new RegExp(posixUsers.source, "g")),
    ].map((match) => match[0].trim());
    const actionable = matches.filter((match) => !isAllowedExample(match));
    if (actionable.length) {
      fail(`${rel(file)}: maintainer-local absolute path leak: ${actionable[0]}`);
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log("Consistency checks passed.");
