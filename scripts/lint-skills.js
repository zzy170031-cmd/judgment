const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const skillRoots = [
  path.join(root, "SKILL.md"),
  ...fs.readdirSync(path.join(root, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, "skills", entry.name, "SKILL.md"))
];

const errors = [];
const warnings = [];

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function frontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return Object.fromEntries(match[1].split(/\r?\n/).map((line) => {
    const index = line.indexOf(":");
    if (index < 0) return null;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^"|"$/g, "");
    return [key, value];
  }).filter(Boolean));
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

for (const file of skillRoots) {
  if (!fs.existsSync(file)) {
    errors.push(`${rel(file)} is missing`);
    continue;
  }
  const text = fs.readFileSync(file, "utf8");
  const meta = frontMatter(text);
  const name = meta.name || "";
  const description = meta.description || "";
  const id = rel(file);

  if (!name) errors.push(`${id}: front matter name is required`);
  if (description.length < 30) errors.push(`${id}: description is too short for reliable skill selection`);
  if (description.length > 1800) warnings.push(`${id}: description is long; consider moving detail into references`);
  if (!/^#\s+/m.test(text)) errors.push(`${id}: top-level heading is required`);

  const highRisk = hasAny(text, [/git/i, /worktree/i, /execute/i, /deploy/i, /delete/i, /browser/i, /tool/i, /file/i, /loop/i, /555/i]);
  const hasBoundary = hasAny(text, [/Forbidden/i, /Do not/i, /不得/, /禁止/, /安全边界/, /permission/i, /approval/i]);
  if (highRisk && !hasBoundary) {
    errors.push(`${id}: high-risk skill must state forbidden actions or permission boundary`);
  }

  const needsOracle = hasAny(text, [/loop/i, /gate/i, /555/i, /release/i, /review/i, /verify/i, /evidence/i, /上线/, /审查/, /验证/, /证据/]);
  const hasOracle = hasAny(text, [/oracle/i, /evidence/i, /verification/i, /verify/i, /review/i, /证据/, /验证/, /验收/]);
  if (needsOracle && !hasOracle) {
    errors.push(`${id}: review/gate skill must name evidence or verification closure`);
  }

  if (/C:\\Users\\|\/Users\//.test(text)) {
    errors.push(`${id}: skill must not contain maintainer-local absolute paths`);
  }
}

if (warnings.length) {
  for (const warning of warnings) console.warn(`WARN: ${warning}`);
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log(`Skill lint passed for ${skillRoots.length} skill entrypoints.`);
