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
      /one-shot/,
    ],
  },
  {
    file: "skills/666/SKILL.md",
    patterns: [
      /claim-calibration-standard\.md/,
      /context-engineering-standard\.md/,
      /source-pattern-card\.md/,
      /555-micro-review\.md/,
      /one-shot/,
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
    file: "rules/codex-surface-governance-standard.md",
    patterns: [
      /Codex Pluginization And Super-Agentization/,
      /Codex is the platform boundary/,
      /Codex super-agent pattern/,
      /HTML and dashboards are visibility\/request surfaces/,
    ],
  },
  {
    file: "rules/tool-portfolio-standard.md",
    patterns: [
      /Plugin And Super-Agent Gate/,
      /Codex super-agent pattern/,
      /external daemon/,
      /plugin as packaging and the super-agent pattern as runtime governance/,
    ],
  },
  {
    file: "rules/project-agent-topology-standard.md",
    patterns: [
      /Super-Agent Boundary/,
      /separate runtime outside Codex/,
      /proof that subagents are running when no Codex delegation tool returned an id/,
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
      /one-shot/,
      /what to import/,
      /what not to import/,
      /decision: import \/ adapt \/ reject \/ defer-now/,
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
  ["Codex plugin packaging", /Plugin/],
  ["Codex super-agent topology", /project-agent-topology-standard\.md/],
];

for (const [name, pattern] of routeCases) {
  if (!pattern.test(rootSkill)) failures.push(`route case not represented: ${name}`);
}

const textByFile = {
  rootSkill,
  surface: read("rules/codex-surface-governance-standard.md"),
  authority: read("rules/authority-boundary-standard.md"),
  topology: read("rules/project-agent-topology-standard.md"),
  toolPortfolio: read("rules/tool-portfolio-standard.md"),
  loop: read("rules/loop-engineering-standard.md"),
  fiveAgent: read("skills/555/SKILL.md"),
};

const scenarioCases = [
  {
    name: "small task does not auto-trigger 555",
    text: textByFile.rootSkill,
    patterns: [/Do not auto-trigger for:[\s\S]*trivial single-file edits/, /Do not run full `555` for every small task/],
  },
  {
    name: "HTML is not a shell or Git executor",
    text: `${textByFile.authority}\n${textByFile.loop}`,
    patterns: [/HTML can display and request/, /Do not let HTML execute local commands directly/, /Do not use an HTML page, bridge queue, or dashboard as an executor/],
  },
  {
    name: "external runtimes are translated to Codex surfaces",
    text: `${textByFile.surface}\n${textByFile.loop}\n${textByFile.rootSkill}`,
    patterns: [/Codex-execution scoped/, /Do not create a multi-model runtime/, /Do not import external workflow runtimes/],
  },
  {
    name: "pluginization stays a Codex surface decision",
    text: `${textByFile.rootSkill}\n${textByFile.surface}\n${textByFile.toolPortfolio}`,
    patterns: [/`Plugin` \| Bundle of skills/, /multiple bundled skills\? Consider `Plugin`/],
  },
  {
    name: "super-agentization requires real Codex agents and evidence",
    text: `${textByFile.topology}\n${textByFile.fiveAgent}`,
    patterns: [/Do not claim real agents were created unless a real subagent\/thread tool was used successfully/, /A4.*files, logs, tests, or artifacts/s],
  },
];

for (const scenario of scenarioCases) {
  for (const pattern of scenario.patterns) {
    if (!pattern.test(scenario.text)) failures.push(`scenario not protected: ${scenario.name} missing ${pattern}`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}

console.log("Skill route smoke tests passed.");
