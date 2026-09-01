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

function assertAbsent(relPath, message) {
  if (fs.existsSync(abs(relPath))) fail(message);
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

assertAbsent(
  "skills/666",
  "skills/666 must stay absent; the repository root is the unique 666 entrypoint"
);

const scanRoots = [
  "README.md",
  "SKILL.md",
  "agents",
  "skills",
  "scripts",
  "templates",
  "tests",
  ".github",
  "package.json",
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
