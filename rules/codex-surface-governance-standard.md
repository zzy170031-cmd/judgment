# Codex Surface Governance Standard

Use this rule when deciding where a Codex capability, habit, instruction, workflow, automation, integration, or agent boundary should live.

This rule is Codex-execution scoped, not Codex-idea scoped. Study strong patterns from Claude Code, Gemini CLI, ChatGPT/OpenAI agents, GLM/Z.ai, Git, GitHub, and similar agent systems, then translate the useful part into Codex surfaces that exist in this environment. Do not create a multi-model runtime, compatibility layer, or model-specific command set unless the user explicitly opens that separate design gate.

## Core Rule

Choose the smallest Codex surface that gives the right scope, persistence, evidence, and permission boundary.

Do not turn every improvement into a skill, plugin, automation, memory, or global rule. Prefer a narrow durable artifact only when the workflow is repeated, risky, expensive to reconstruct, or must survive thread/context loss.

## External Pattern Intake

When borrowing from another model tool or agent ecosystem, extract the pattern before changing Judgment:

```text
source_pattern:
source_trust: official / upstream-repo / research / known-community / unknown
problem_it_solves:
codex_equivalent_surface:
existing_judgment_surface:
evidence_needed:
permission_or_safety_boundary:
what_to_import:
what_not_to_import:
decision:
```

Good imports:

- Persistent project instructions -> `AGENTS.md`, repo rules, or a skill trigger.
- Reusable command/workflow -> skill, script, quick launcher, or plugin command.
- Custom subagent/specialist role -> worker packet, work-splitter lane, 555 seat, Core Challenger, or Audit Specialist.
- Hooks/lifecycle policy -> explicit Codex hook/config only when available and approved; otherwise a rule, script, or verification gate.
- MCP/app integration -> existing Codex connector/plugin/MCP surface before custom integration.
- Headless or non-interactive runs -> scriptable command, structured output, ledger, and verification oracle.
- Checkpoints or long-task memory -> durable evidence ledger, handoff packet, worktree state, or visible artifact.
- Sandbox/permissions/trusted folders -> explicit allowed/forbidden actions, approval points, and security gate.
- Browser/desktop operation -> Browser, Chrome, or Computer Use according to the real evidence surface.
- Preserved reasoning state -> inspectable plan, decision record, ledger, evidence, or handoff; never hidden chain-of-thought storage.

Do not import:

- model-specific names, pricing, availability, benchmarks, or release claims without current verification;
- hidden chain-of-thought capture or replay;
- broad auto-approval, bypass-sandbox, or always-on daemon behavior;
- external account side effects without connector auth, approval, and a security gate;
- another tool's full runtime when a Codex rule, skill, script, connector, automation, or worker packet covers the job.

## Surface Map

| Surface | Use when | Avoid when |
|---|---|---|
| Current prompt/thread | One-off instruction, local decision, temporary constraint. | It must survive future threads. |
| `AGENTS.md` | Repo or device convention, command, verification, ownership rule. | It is task-specific or too procedural. |
| Codex config / hook | Trusted-repo settings, lifecycle enforcement, command gating, or repeatable tool-call policy. | A documented rule or normal approval gate is enough, or the hook would bypass user approval. |
| `rules/*.md` | Reusable governance standard used by Judgment skills. | It is just an example or one-off note. |
| `Skill` | Repeatable reasoning workflow with triggers, steps, gotchas, and optional references/scripts. | It mainly needs live external data or hooks. |
| `Plugin` | Bundle of skills plus MCP servers, apps/connectors, hooks, assets, or marketplace metadata. | A single narrow skill is enough. |
| MCP / connector / app | Structured access to private or external systems such as GitHub, Notion, Figma, browser, docs, or work apps. | Static docs, local files, or shell commands are enough. |
| Script | Deterministic local operation that should not be rewritten each time. | The work is judgment-heavy or varies by context. |
| Automation / heartbeat | Recurring monitor, reminder, follow-up, or scheduled artifact refresh. | The user only asked for a one-time action. |
| Browser | Codex-controlled local web, preview, DOM, screenshot, or unauthenticated web flow. | The user's real browser session/cookies are required. |
| Chrome | User-profile browser state, logged-in sessions, extensions, or existing tabs matter. | The in-app Browser can verify the target. |
| Computer Use | Windows GUI/desktop app is the real surface and no structured API/browser route fits. | CLI, connector, Browser, or file APIs can do it. |
| Git worktree | Parallel worker edits/tests, clean review, hotfix, dirty-state preservation. | A narrow current-tree edit is enough. |
| `555` / Core Challenger / Audit | Milestone, release, done, architecture, backend/shared surface, AI/Agent safety, dirty ownership, or evidence-sensitive closure. | A small low-risk task has direct evidence. |

## Decision Gate

Before creating, extending, installing, enabling, or dispatching a Codex surface, answer:

```text
job_to_be_done:
scope: current-thread / repo / device / project-family / external-service
external_pattern_used: none / source + pattern
codex_translation:
surface_candidate:
existing_coverage:
persistence_needed: none / thread / repo / global / scheduled
permission_surface: none / filesystem / browser / account / production / external-send / destructive
evidence_or_oracle:
restart_or_new_thread_needed:
security_gate:
browser_gate:
ledger_gate:
human_approval_needed:
decision:
```

## Automation Rules

Create or update an automation only when the user has asked for ongoing watch, reminder, monitor, follow-up, recurring report, or scheduled refresh behavior.

Before automation, define:

- source to watch;
- cadence or trigger;
- action to take;
- draft-only versus external side effect;
- what requires user approval;
- stop condition;
- failure notification path;
- evidence the automation should report.

Default automation posture:

- draft, summarize, notify, or prepare artifacts by default;
- do not send messages, publish, deploy, spend money, change permissions, delete, reset, or modify production/user data without explicit authorization;
- route auth, user data, external-send, production, destructive, or AI/Agent tool behavior through `rules/security-review-standard.md`;
- route long-running or multi-step automation evidence through `rules/durable-evidence-ledger-standard.md`;
- prefer structured output and visible artifacts for headless or scheduled automation so a later Codex thread can inspect what happened.

## Agent And Worker Rules

For any Codex worker, subagent, or delegated lane, define:

```text
objective:
assigned_surface:
allowed_tools:
allowed_files_or_systems:
forbidden_actions:
data_boundary:
approval_points:
verification:
evidence_or_ledger:
report_format:
stop_condition:
handoff_receiver:
```

Do not create a broad autonomous agent when a prompt, checklist, narrow skill, script, or one-time worker packet is enough. Do not let implementation agents self-approve milestone, release, backend/shared-surface, production, or AI/Agent safety outcomes.

## Safety Defaults

- Use existing installed Codex surfaces before adding new ones.
- Prefer explicit files and rules over hidden memory for project state.
- Use connectors for private external workspace data instead of web search or model memory.
- Use Browser/Chrome/Computer Use only when that visible surface is the real evidence path.
- Prefer structured output for automation, CI, GitHub, repeated checks, and worker reports.
- If a surface grants account access, production access, filesystem writes, browser actions, hooks, external sends, or destructive actions, classify it as side-effecting and require explicit approval.
- If a surface change may not be visible until restart or a new thread, state that before claiming it is active.
- If live file/Git/tool state contradicts a handoff, report, ledger, or memory, trust live state.
- Preserve inspectable decisions and evidence, not hidden chain-of-thought.

## Output Shape

```text
Codex surface decision:
- job:
- borrowed pattern, if any:
- Codex translation:
- chosen surface:
- why this surface:
- existing coverage:
- persistence:
- permissions / side effects:
- approval needed:
- security gate:
- browser gate:
- ledger gate:
- verification:
- not using:
- next gate:
```
