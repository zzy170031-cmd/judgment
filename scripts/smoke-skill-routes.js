const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const checks = [
  {
    file: "SKILL.md",
    patterns: [
      /claim-calibration-standard\.md/,
      /context-engineering-standard\.md/,
      /source-pattern-card\.md/,
      /555-micro-review\.md/,
      /Claim calibration/,
      /Context engineering/,
    ],
  },
  {
    file: "skills/666/SKILL.md",
    patterns: [
      /claim-calibration-standard\.md/,
      /context-engineering-standard\.md/,
      /source-pattern-card\.md/,
      /555-micro-review\.md/,
    ],
  },
  {
    file: "skills/555/SKILL.md",
    patterns: [
      /claim-calibration-standard\.md/,
      /context-engineering-standard\.md/,
      /555-micro-review\.md/,
      /Decision Claim Calibration/,
    ],
  },
  {
    file: "rules/claim-calibration-standard.md",
    patterns: [
      /KNOWN/,
      /COMPUTED/,
      /INFERRED/,
      /FRAME/,
      /GUESS/,
      /UNKNOWN/,
      /Rules I broke/,
      /555 Integration/,
    ],
  },
  {
    file: "rules/context-engineering-standard.md",
    patterns: [
      /Context packet/,
      /Handoff packet/,
      /Skill evolution packet/,
      /Source Freshness/,
    ],
  },
  {
    file: "templates/source-pattern-card.md",
    patterns: [
      /Source pattern card/,
      /what to import/,
      /what not to import/,
      /decision: import \/ adapt \/ reject \/ defer/,
    ],
  },
  {
    file: "templates/555-micro-review.md",
    patterns: [
      /555 micro review/,
      /A2 Core Challenger/,
      /A4 Audit Specialist/,
      /Escalate To Full 555/,
    ],
  },
];

const failures = [];

for (const check of checks) {
  const abs = path.join(root, check.file);
  if (!fs.existsSync(abs)) {
    failures.push(`${check.file}: missing`);
    continue;
  }
  const text = read(check.file);
  for (const pattern of check.patterns) {
    if (!pattern.test(text)) failures.push(`${check.file}: missing ${pattern}`);
  }
}

const rootSkill = read("SKILL.md");
const nestedSkill = read("skills/666/SKILL.md");
if (rootSkill !== nestedSkill) {
  failures.push("SKILL.md and skills/666/SKILL.md differ");
}

const routeCases = [
  ["search external AI company practices", /codex-surface-governance-standard\.md/],
  ["context pressure handoff", /context-engineering-standard\.md/],
  ["anti sycophancy claim review", /claim-calibration-standard\.md/],
  ["lightweight adversarial skill edit", /555-micro-review\.md/],
];

for (const [name, pattern] of routeCases) {
  if (!pattern.test(rootSkill)) failures.push(`route case not represented: ${name}`);
}

if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}

console.log("Skill route smoke tests passed.");
