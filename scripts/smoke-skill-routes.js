const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const root = path.resolve(__dirname, "..");
const absolute = (rel) => path.join(root, rel);
const read = (rel) => fs.readFileSync(absolute(rel), "utf8");
const failures = [];

function linksToFile(markdown, label, fromDirectory, expectedFile) {
  const links = [...markdown.matchAll(/\[([^\]\r\n]+)\]\(([^\)\r\n]+)\)/g)]
    .filter((match) => match[1] === label);
  return links.length > 0 && links.every((match) => {
    let href = match[2].trim();
    if (href.startsWith("<") && href.endsWith(">")) href = href.slice(1, -1);
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) && !path.isAbsolute(href) || href.startsWith("//")) return false;
    try {
      const target = path.resolve(fromDirectory, decodeURIComponent(href.split("#")[0]));
      return fs.realpathSync(target) === fs.realpathSync(expectedFile);
    } catch { return false; }
  });
}

for (const [file, label, target] of [
  ["SKILL.md", "555 professional audit engine", "skills/555/SKILL.md"],
  ["skills/judgment/SKILL.md", "666 audit router", "SKILL.md"],
]) {
  if (!linksToFile(read(file), label, path.dirname(absolute(file)), absolute(target))) {
    failures.push(`${file}: ${label} must resolve to the canonical ${target}`);
  }
}

const linkFixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "judgment-link-check-"));
const linkExpected = path.join(linkFixtureDirectory, "expected.md");
const linkWrong = path.join(linkFixtureDirectory, "wrong.md");
fs.writeFileSync(linkExpected, "canonical target\n");
fs.writeFileSync(linkWrong, "different target\n");
const linkFixtures = [
  ["relative", "[engine](expected.md)", true],
  ["absolute", `[engine](${linkExpected.replace(/\\/g, "/")})`, true],
  ["wrapped absolute", `[engine](<${linkExpected.replace(/\\/g, "/")}>)`, true],
  ["missing", "[engine](missing.md)", false],
  ["wrong existing file", "[engine](wrong.md)", false],
  ["remote", "[engine](https://example.com/expected.md)", false],
  ["wrong label", "[another](expected.md)", false],
  ["one wrong duplicate", "[engine](expected.md) [engine](wrong.md)", false],
];
try {
  for (const [name, markdown, expected] of linkFixtures) {
    if (linksToFile(markdown, "engine", linkFixtureDirectory, linkExpected) !== expected) {
      failures.push(`canonical link fixture failed: ${name}`);
    }
  }
} finally {
  fs.unlinkSync(linkExpected);
  fs.unlinkSync(linkWrong);
  fs.rmdirSync(linkFixtureDirectory);
}

const required = [
  {
    file: "SKILL.md",
    patterns: [
      /666 Professional Audit Router/,
      /J5[\s\S]*J10[\s\S]*J15[\s\S]*J20/,
      /Bare `555` maps to `J5`/,
      /Bare `666` or `judgment` normally maps to[\s\S]*`J10`/,
      /Route Into 555/,
      /<task> 使用 J5\|J10\|J15\|J20 开始审计，审计后给我一个执行方案/,
      /requested execution plan is the audit deliverable, not execution authority/,
      /Red\/Blue cross-examination/,
      /ordered executable plan/,
    ],
  },
  {
    file: "skills/555/SKILL.md",
    patterns: [
      /555 Professional Audit Engine/,
      /audit-angle-registry\.md/,
      /audit-profiles\.md/,
      /evidence-standard\.md/,
      /对抗审查\.md/,
      /design-basis\.md/,
      /Freeze The Real Question/,
      /Generate Professional Roles/,
      /Blind Review Before Discussion/,
      /Red\/Blue Cross-Examination/,
      /Independent Evidence Verification/,
      /claim-evidence[\s\S]*provenance or shared origin/,
      /Never infer whole-scope coverage from a sample/,
      /blocker \| required \| advisory \| observation/,
      /Do not decide by eloquence or majority vote/,
      /real independent review only when the delegation tool returned a real/,
      /audit ends at an executable plan/,
    ],
  },
  {
    file: "skills/judgment/SKILL.md",
    patterns: [
      /\$judgment 5 <question>[\s\S]*J5/,
      /\$judgment 10 <question>[\s\S]*J10/,
      /\$judgment 15 <question>[\s\S]*J15/,
      /\$judgment 20 <question>[\s\S]*J20/,
      /Primary Natural-Language Invocation/,
      /<task> 使用 J5 开始审计，审计后给我一个执行方案/,
      /named level wins; do not silently[\s\S]*upgrade or downgrade/,
      /professional verdict and an ordered executable plan/,
      /not permission to execute it/,
    ],
  },
  {
    file: "skills/j/SKILL.md",
    patterns: [
      /\$j J5\|J10\|J15\|J20/,
      /\$j 5\|10\|15\|20 <question>[\s\S]*matching Judgment level/,
      /<task> 使用 J5\|J10\|J15\|J20 开始审计，审计后给我一个执行方案/,
      /not implementation authorization/,
    ],
  },
  {
    file: "skills/555/references/audit-angle-registry.md",
    patterns: [
      /Challenge Unit Contract/,
      /Dynamic Role Generation/,
      /Selection And Substitution/,
    ],
  },
  {
    file: "skills/555/references/audit-profiles.md",
    patterns: [
      /Progressive Loading Rule/,
      /一个主 Profile/,
      /最多两个/,
      /只读取对应的 Profile 文件/,
      /profiles\/code-change\.md/,
      /profiles\/research-claim-paper\.md/,
      /profiles\/ai-agent-skill\.md/,
      /profiles\/security-privacy-authority\.md/,
      /profiles\/data-metrics-ml\.md/,
      /profiles\/product-business-process\.md/,
      /profiles\/content-design-accessibility\.md/,
      /profiles\/operations-release-incident\.md/,
      /profiles\/regulated-high-stakes\.md/,
    ],
  },
  {
    file: "skills/555/references/profiles/code-change.md",
    patterns: [/P01 Code \/ Change Review/, /base, candidate, diff range/, /real target-environment observation/],
  },
  {
    file: "skills/555/references/profiles/research-claim-paper.md",
    patterns: [/P02 Research \/ Claim \/ Paper/, /origin group/, /search cutoff/],
  },
  {
    file: "skills/555/references/profiles/ai-agent-skill.md",
    patterns: [/P03 AI \/ Agent \/ Skill/, /near-miss/, /real trajectory/, /prompt injection/],
  },
  {
    file: "skills/555/references/profiles/security-privacy-authority.md",
    patterns: [/P04 Security \/ Privacy \/ Authority/, /trust boundaries/, /least[\s\S]*privilege/],
  },
  {
    file: "skills/555/references/profiles/data-metrics-ml.md",
    patterns: [/P05 Data \/ Metrics \/ ML Evaluation/, /target population/, /label leakage/],
  },
  {
    file: "skills/555/references/profiles/product-business-process.md",
    patterns: [/P06 Product \/ Business \/ Process/, /current baseline/, /acceptance[\s\S]*evidence/],
  },
  {
    file: "skills/555/references/profiles/content-design-accessibility.md",
    patterns: [/P07 Content \/ Design \/ Accessibility/, /original assets/, /full versus sampled review/],
  },
  {
    file: "skills/555/references/profiles/operations-release-incident.md",
    patterns: [/P08 Operations \/ Release \/ Incident/, /rollback/, /post-release observation window/],
  },
  {
    file: "skills/555/references/profiles/regulated-high-stakes.md",
    patterns: [/P09 Regulated \/ Legal \/ Financial \/ Medical Decision/, /jurisdiction/, /licensed/],
  },
  {
    file: "skills/555/references/evidence-standard.md",
    patterns: [
      /Claim-Evidence Matrix/,
      /E0 testimony/,
      /E3 reproducible outcome/,
      /origin group/,
      /总体、抽样与覆盖/,
      /blocker/,
      /Finding Lifecycle/,
      /AI \/ Skill 行为证据附加门/,
      /near-miss/,
      /Evidence Sufficiency And Stop/,
    ],
  },
  {
    file: "skills/555/references/对抗审查.md",
    patterns: [
      /红蓝交叉质询/,
      /独立/,
      /证据/,
      /audit-profiles\.md/,
      /evidence-standard\.md/,
      /共同补齐证据/,
      /私有事件核/,
      /Codex Multi-Agent V2 一层运行适配/,
      /fork_turns=none/,
      /spawn_agent \/ send_message \/ followup_task \/ wait_agent/,
      /通常最多三席一批/,
      /single-controller pre-audit/,
    ],
  },
  {
    file: "skills/555/references/design-basis.md",
    patterns: [
      /Agentic Design Patterns/,
      /Agent Design Pattern Catalogue/,
      /Anthropic/,
      /Google Cloud \/ ADK/,
      /Cloudflare/,
      /Trail of Bits/,
      /Multi-Agent Debate \/ ChatEval/,
      /OpenAI skill and model guidance/,
      /OpenAI Multi-agent guidance and Codex MultiAgentV2 source/,
      /ModelScope ms-agent/,
      /NIST AI RMF and TEVV/,
      /OWASP agentic AI threat modeling/,
      /UK AISI Inspect \/ Inspect Evals/,
      /never let majority vote replace/,
    ],
  },
  {
    file: "templates/555-micro-review.md",
    patterns: [
      /Judgment Audit Record/,
      /Dynamic Role Roster/,
      /Issue Tree/,
      /Blind Review And Cross-Examination/,
      /Claim-Evidence Matrix/,
      /Finding Register/,
      /Dissent Register/,
      /Professional Verdict/,
      /Executable Plan/,
      /Final Boundary/,
    ],
  },
  {
    file: "skills/judgment/agents/openai.yaml",
    patterns: [/^interface:/m, /Judgment Professional Audit/, /allow_implicit_invocation: true/],
  },
  {
    file: "skills/555/agents/openai.yaml",
    patterns: [/^interface:/m, /555 Professional Audit/, /allow_implicit_invocation: false/],
  },
];

for (const check of required) {
  if (!fs.existsSync(absolute(check.file))) {
    failures.push(`${check.file}: missing`);
    continue;
  }
  const content = read(check.file);
  for (const pattern of check.patterns) {
    if (!pattern.test(content)) failures.push(`${check.file}: missing ${pattern}`);
  }
}

const rootSkill = read("SKILL.md");
if (fs.existsSync(absolute("skills/666"))) {
  failures.push("skills/666 must stay absent; root SKILL.md is the unique 666 entrypoint");
}

const lineBudgets = {
  "SKILL.md": 180,
  "skills/555/SKILL.md": 220,
  "skills/judgment/SKILL.md": 120,
  "skills/j/SKILL.md": 60,
};

for (const [file, budget] of Object.entries(lineBudgets)) {
  const lines = read(file).split(/\r?\n/).length;
  if (lines > budget) failures.push(`${file}: ${lines} lines exceeds ${budget}-line budget`);
}

const progressiveReferenceBudgets = {
  "skills/555/references/audit-profiles.md": 80,
  "skills/555/references/profiles/code-change.md": 50,
  "skills/555/references/profiles/research-claim-paper.md": 50,
  "skills/555/references/profiles/ai-agent-skill.md": 55,
  "skills/555/references/profiles/security-privacy-authority.md": 50,
  "skills/555/references/profiles/data-metrics-ml.md": 50,
  "skills/555/references/profiles/product-business-process.md": 50,
  "skills/555/references/profiles/content-design-accessibility.md": 55,
  "skills/555/references/profiles/operations-release-incident.md": 55,
  "skills/555/references/profiles/regulated-high-stakes.md": 50,
};

for (const [file, budget] of Object.entries(progressiveReferenceBudgets)) {
  const lines = read(file).split(/\r?\n/).length;
  if (lines > budget) failures.push(`${file}: ${lines} lines exceeds ${budget}-line progressive-load budget`);
}

const descriptionBudgets = {
  "SKILL.md": 420,
  "skills/555/SKILL.md": 360,
  "skills/judgment/SKILL.md": 420,
  "skills/j/SKILL.md": 360,
};

for (const [file, budget] of Object.entries(descriptionBudgets)) {
  const match = read(file).match(/^description:\s*(.+)$/m);
  if (!match) {
    failures.push(`${file}: missing one-line frontmatter description`);
    continue;
  }
  const description = match[1].replace(/^['"]|['"]$/g, "");
  if (description.length > budget) {
    failures.push(`${file}: ${description.length}-character description exceeds ${budget}-character budget`);
  }
}

const retiredDefaultSections = [
  "## Codex Maxxing Overlay",
  "## Packaging Candidate Gate",
  "## Tool Portfolio Gate",
  "## Browser Flow Testing Gate",
  "## Git Worktree Gate",
  "## Low-Frequency Routes: Explicit Only",
];

for (const heading of retiredDefaultSections) {
  if (rootSkill.includes(heading)) failures.push(`666 still bulk-loads retired default section: ${heading}`);
}

const registry = read("skills/555/references/audit-angle-registry.md");
const angleCodes = [...registry.matchAll(/^\|\s*`(A\d{2})`\s*\|/gm)].map((match) => match[1]);
const expectedAngles = Array.from({ length: 20 }, (_, index) => `A${String(index + 1).padStart(2, "0")}`);
if (JSON.stringify(angleCodes) !== JSON.stringify(expectedAngles)) {
  failures.push(`angle registry must contain A01-A20 exactly once in order; got ${angleCodes.join(", ")}`);
}

const levels = { J5: 5, J10: 10, J15: 15, J20: 20 };
for (const [level, units] of Object.entries(levels)) {
  const row = new RegExp("^\\|\\s*`" + level + "`\\s*\\|\\s*" + units + "\\s*\\|", "m");
  if (!row.test(registry)) failures.push(`registry missing exact ${level} = ${units} challenge-unit contract`);
}

const naturalEntry = read("skills/judgment/SKILL.md");
for (const level of Object.keys(levels)) {
  const phrase = `<task> 使用 ${level} 开始审计，审计后给我一个执行方案`;
  if (!naturalEntry.includes(phrase)) failures.push(`natural-language activation missing: ${phrase}`);
}

let triggerCases;
try {
  triggerCases = JSON.parse(read("tests/judgment-trigger-cases.json"));
} catch (error) {
  failures.push(`tests/judgment-trigger-cases.json: invalid JSON (${error.message})`);
}

if (triggerCases) {
  const positive = Array.isArray(triggerCases.should_trigger) ? triggerCases.should_trigger : [];
  const negative = Array.isArray(triggerCases.should_not_trigger) ? triggerCases.should_not_trigger : [];
  if (positive.length < 12) failures.push("trigger fixtures need at least 12 should-trigger cases");
  if (negative.length < 8) failures.push("trigger fixtures need at least 8 near-miss should-not-trigger cases");

  const allInputs = [...positive, ...negative].map((test) => test.input);
  if (allInputs.some((input) => typeof input !== "string" || !input.trim())) {
    failures.push("every trigger fixture needs a non-empty input");
  }
  if (new Set(allInputs).size !== allInputs.length) failures.push("trigger fixture inputs must be unique");

  const allowedExpected = new Set(["J5", "J10", "J15", "J20", "AUTO"]);
  for (const test of positive) {
    if (!allowedExpected.has(test.expected_level)) {
      failures.push(`invalid expected trigger level for: ${test.input}`);
    }
  }
  for (const test of negative) {
    if (typeof test.reason !== "string" || !test.reason.trim()) {
      failures.push(`near-miss fixture needs a reason: ${test.input}`);
    }
  }

  for (const level of Object.keys(levels)) {
    if (!positive.some((test) => test.expected_level === level)) {
      failures.push(`trigger fixtures missing explicit ${level} case`);
    }
  }

  const classifyTrigger = (input) => {
    const text = input.trim();
    const lower = text.toLowerCase();
    const optOut = [
      /不要开始审计/u,
      /不要使用\s*judgment/iu,
      /不需要重新审计/u,
      /翻译成/u,
      /只总结/u,
      /列出当前可用技能/u,
    ];
    if (optOut.some((pattern) => pattern.test(text))) return null;
    if (/红蓝配色/u.test(text) || /游戏里.*666\s*分/u.test(text)) return null;

    const explicitPatterns = [
      /使用\s*j?(5|10|15|20)\s*开始审计/iu,
      /\$judgment\s*j?(5|10|15|20)\b/iu,
      /\$j\s*j?(5|10|15|20)\b/iu,
    ];
    for (const pattern of explicitPatterns) {
      const match = text.match(pattern);
      if (match) return `J${match[1]}`;
    }

    if (/^\s*555(?:\s|[:：])/u.test(text)) return "J5";
    if (
      /(?:^|\s)666(?:\s|[:：]).*(?:审计|方案)/u.test(text) ||
      /对抗审查/u.test(text) ||
      /红蓝队.*(?:质询|审查|审计)/u.test(text) ||
      /judgment.*(?:专业评判|审计)/iu.test(text) ||
      /多角色质询.*(?:独立求证|执行方案)/u.test(text)
    ) return "AUTO";

    return null;
  };

  for (const test of positive) {
    const actual = classifyTrigger(test.input);
    if (actual !== test.expected_level) {
      failures.push(`trigger classifier mismatch: ${test.input} -> ${actual}, expected ${test.expected_level}`);
    }
  }
  for (const test of negative) {
    const actual = classifyTrigger(test.input);
    if (actual !== null) {
      failures.push(`near-miss classifier must not trigger: ${test.input} -> ${actual}`);
    }
  }
}

const metadataPrompts = {
  "agents/openai.yaml": "这个任务使用 J10 开始审计，审计后给我一个执行方案。",
  "skills/judgment/agents/openai.yaml": "这个任务使用 J10 开始审计，审计后给我一个执行方案。",
  "skills/j/agents/openai.yaml": "这个任务使用 J10 开始审计，审计后给我一个执行方案。",
  "skills/555/agents/openai.yaml": "这个任务使用 J5 开始审计，审计后给我一个执行方案。",
};

for (const [file, prompt] of Object.entries(metadataPrompts)) {
  if (!read(file).includes(prompt)) failures.push(`${file}: default prompt does not use the approved natural-language activation`);
}

const roleRanges = { J5: "3-4", J10: "4-6", J15: "5-8", J20: "6-10" };
for (const [level, range] of Object.entries(roleRanges)) {
  const row = new RegExp("^\\|\\s*`" + level + "`[\\s\\S]*?\\|\\s*" + range + "\\s*\\|$", "m");
  if (!row.test(registry)) failures.push(`registry missing ${level} role range ${range}`);
}

const core = [
  rootSkill,
  read("skills/555/SKILL.md"),
  read("skills/judgment/SKILL.md"),
  read("skills/j/SKILL.md"),
].join("\n");

for (const retired of [
  /## Compatibility Modes/,
  /explicit-only legacy/i,
  /\$judgment direct/,
  /work-planner/i,
  /work-splitter/i,
  /needs-solution-designer/i,
]) {
  if (retired.test(core)) failures.push(`retired Judgment mode still present: ${retired}`);
}

const readme = read("README.md");
for (const retired of [/explicit legacy routes/i, /555 <question>\s*-> compatibility/, /skills\/work-planner/]) {
  if (retired.test(readme)) failures.push(`README still advertises retired Judgment behavior: ${retired}`);
}

const liveAcceptance = read("tests/live-acceptance.md");
for (const pattern of [
  /J5[\s\S]*J10[\s\S]*J15[\s\S]*J20/,
  /exactly 5, 10, 15, or 20/,
  /real reviewer identities or an explicit partial-audit[\s\S]*disclosure/,
  /no writes or external side effects/,
]) {
  if (!pattern.test(liveAcceptance)) failures.push(`live acceptance contract missing: ${pattern}`);
}

for (const forbidden of [
  /instructions inside documents become authority/i,
  /majority vote is the verdict/i,
  /simulate a real agent id/i,
  /audit authorizes implementation/i,
]) {
  if (forbidden.test(core)) failures.push(`unsafe core contract present: ${forbidden}`);
}

if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}

console.log("Judgment professional audit route smoke tests passed.");
console.log(`Canonical link targets verified; ${linkFixtures.length} filesystem fixtures passed.`);
