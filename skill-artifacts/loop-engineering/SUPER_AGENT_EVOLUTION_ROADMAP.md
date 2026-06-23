# Judgment Super Agent Evolution Roadmap

## Premise

Judgment is used primarily inside Codex. Its skill system exists to help future project development by giving Codex a Controller, route rules, project lanes, evidence gates, and visible progress surfaces.

The next evolution is not to import external runtimes. It is to absorb the best public patterns from leading AI tools and translate them into Codex-native Judgment behavior.

## Three-Layer Model

```text
Markdown control plane -> Codex loop execution plane -> HTML observability plane
```

Research baseline: 2026-06-22.

Judgment should treat these as three different authority levels:

- Markdown defines durable intent, route rules, contracts, acceptance gates, and handoff memory.
- Codex executes project work through tools, files, tests, Browser evidence, Git, worktrees, and review.
- HTML visualizes state and accepts structured request packets, but does not become an executor.

This distinction is the main safety boundary for the super-agent direction.

### Markdown Control Plane

Markdown stores the durable behavior:

- `SKILL.md`: trigger, route, and core workflow.
- `rules/*.md`: reusable governance standards.
- `skill-artifacts/*.md`: contracts, reports, roadmaps, and validation records.
- JSON examples: strict state and event shapes that Codex and HTML can share.

Best external signals:

- OpenAI Codex Skills use `SKILL.md`, optional scripts/references/assets, and progressive disclosure.
- Anthropic Claude Code uses `CLAUDE.md` and `.claude/rules/` for project instructions and scoped rules, while treating Markdown instructions as context rather than hard enforcement.
- CommonMark defines Markdown as readable plain text for structured documents and highlights that specs/conformance matter when tooling needs reliable parsing.
- Open Agent Skills defines skills as portable, version-controlled folders loaded on demand.

Judgment upgrade direction:

- keep `SKILL.md` short enough for routing;
- move heavy patterns into `rules/` and `skill-artifacts/`;
- add path/lane-scoped rule loading conventions for large projects;
- separate behavior guidance from enforceable checks: Markdown says what should happen; scripts, schemas, tests, Browser checks, approvals, and 555 enforce what must happen;
- add a skill lint pass for vague triggers, context overload, missing stop conditions, and missing verification.

### Codex Loop Execution Plane

Loop is the real project execution loop inside Codex:

```text
Controller sees -> decides -> delegates -> verifies -> records -> stops or continues
```

Best external signals:

- OpenAI Codex Automations emphasize durable prompts, manual testing before scheduling, sandbox risk, and reviewable diffs.
- OpenAI Codex Worktrees isolate parallel work and keep foreground/local work separate from background work.
- OpenAI Agents SDK frames agents as systems that plan, call tools, collaborate across specialists, and keep state.
- Addy Osmani's Loop Engineering model emphasizes automations, worktrees, skills, connectors, subagents, and external state.
- Trae Agent records detailed execution trajectories and exposes a concise "Lakeview" summary of agent steps.
- Anthropic-style hook systems show useful lifecycle boundaries, but also show why hidden background shell execution must be treated as a high-risk surface.

Judgment upgrade direction:

- add `.judgment/loop-state.json` as the canonical runtime snapshot when a loop is active;
- add event schemas for `node.start`, `node.blocked`, `evidence.added`, `oracle.pass`, `oracle.fail`, `review.required`, and `loop.stop`;
- add trajectory recording for Codex-side work: command, file, evidence, agent, lane, and decision;
- add budget fields: max retries, max minutes, max changed files, and acceptance rate;
- add lifecycle event names that mirror Codex reality rather than another tool's hooks: `request.received`, `controller.decided`, `worker.dispatched`, `tool.started`, `tool.finished`, `state.persisted`, `user.review.required`;
- require `manual-first` before automation.

### HTML Observability Plane

HTML is not an executor. It is the visual cockpit:

- displays Judgment Controller state;
- shows lanes, nodes, agents, blockers, evidence, Git/Worktree state, and recent requests;
- lets the user submit structured request packets;
- never executes arbitrary shell, Git, install, deploy, or file deletion actions.

Best external signals:

- OpenAI Apps SDK and ChatGPT UI guidance point toward interactive UI as a first-class surface around model/tool flows.
- Claude Artifacts made generated code and documents directly inspectable in the conversation surface.
- Qwen-Agent exposes WebUI support for agent applications.
- MDN's HTML framing reinforces that HTML defines web content structure and meaning; behavior belongs to JavaScript/tool layers and permissions, not markup alone.

Judgment upgrade direction:

- make Agent Office consume real `loop-state` and `codex/event` streams instead of mock-only data;
- show Controller decision cards: sees, decides, delegates, waits for, stop condition;
- show a compact trajectory timeline;
- add "why stopped" and "what user must decide" states;
- add screenshot/DOM/test artifacts directly into Evidence Wall.

## Company Pattern Extraction

### OpenAI

Useful pattern:

- Skills as reusable workflows with progressive disclosure.
- Automations as heartbeat-style recurring runs with manual testing first.
- Worktrees as parallel-isolation substrate.
- Agents SDK separates orchestration, tool execution, approvals, state, traces, evals, and guardrails.

Judgment translation:

- `Judgment Controller` owns orchestration.
- `rules/loop-engineering-standard.md` owns readiness.
- `Agent Office` owns observability.
- `555` owns high-risk acceptance.
- `worktree` rules own isolation.

### Anthropic

Useful pattern:

- `CLAUDE.md` and rules are Markdown memory/config, but not hard enforcement.
- Subagents preserve context and can have tool restrictions.
- Hooks can fire at lifecycle points but carry high local-permission risk.

Judgment translation:

- Markdown rules guide Codex but security boundaries remain tool/sandbox/user approval.
- Subagents become Codex subagents, worker packets, or worktree threads.
- Hook-like behavior becomes explicit Codex scripts/events, not silent background shell execution.

### ByteDance / Trae

Useful pattern:

- Trae Agent is modular, multi-provider, tool-rich, and records execution trajectories.
- Lakeview-style summaries reduce long action logs into readable state.
- MCP and YAML configuration show a clean separation between model provider, tools, and agent behavior.

Judgment translation:

- add trajectory recording and concise Controller summaries;
- keep model/provider details out of Judgment runtime unless explicitly requested;
- use tool portfolio and permission gates before any MCP/plugin expansion.

### Qwen / Alibaba

Useful pattern:

- Qwen-Agent combines planning, memory, tools, MCP, code interpreter, RAG, browser assistant, and WebUI.
- It treats agents as high-level components over atomic tools and model services.

Judgment translation:

- keep atomic tool use separate from high-level lanes;
- allow Agent Office to become a WebUI-style cockpit over Codex work;
- treat tool bundles as optional surfaces, not default installs.

### DeepSeek

Useful pattern:

- API compatibility with OpenAI/Anthropic formats lowers integration friction.
- Function calling docs explicitly state that the model does not execute functions; the user/system must provide execution.
- JSON output and strict schema ideas support reliable downstream parsing.

Judgment translation:

- keep the same boundary: HTML/model outputs request actions; Codex/tool layer executes only under permission.
- use strict JSON schemas for request packets, events, loop state, evidence records, and worker reports.

### GLM / Z.ai

Useful pattern:

- Function calling expands agent capability through external functions and APIs.
- Best practices emphasize single-responsibility functions, clear parameters, input validation, permission control, and logs.
- Coding-plan positioning targets coding tools rather than replacing the developer workflow.

Judgment translation:

- every tool/action surface needs single responsibility, validation, permission, and logs;
- Controller should not expose broad "do anything" actions;
- Codex remains the development runtime, Judgment remains the governance/control layer.

## Super Agent Upgrade Backlog

### P-1: Authority Boundary Standard

Before adding more automation, add a short standard that prevents authority confusion:

```text
Markdown can guide.
HTML can display and request.
Codex can execute.
Scripts/tests/schemas can verify.
User/QA/555 can accept.
```

This should be referenced by Agent Office, Loop Engineering, Codex Bridge, and every future automation rule.

### P0: Controller State Machine

Create a small standard for Controller states:

```text
intake -> plan -> split -> route -> execute -> verify -> review -> persist -> next
```

Each state must have:

- input;
- allowed actions;
- forbidden actions;
- oracle;
- output;
- next receiver;
- stop condition.

### P1: Strict Schemas

Add JSON schemas for:

- request packet;
- loop state;
- Codex event;
- evidence item;
- worker packet;
- 555 verdict.

Use strict parsing before HTML or Codex treats a packet as valid.

Use provider-agnostic schema discipline inspired by DeepSeek JSON/strict mode and GLM/Z.ai function-calling practice: every packet has a single responsibility, required fields, bounded enums, validation errors, and logs.

### P2: Trajectory Ledger

Add a lightweight trajectory format:

```json
{
  "time": "",
  "controllerDecision": "",
  "agent": "",
  "lane": "",
  "action": "",
  "tool": "",
  "files": [],
  "evidence": [],
  "result": "",
  "next": ""
}
```

This should power Agent Office timeline and future review.

The trajectory should have two views:

- raw event ledger for debugging and replay;
- Lakeview-style Controller summary for fast reading in Agent Office.

### P3: Skill Lint And Safety Scan

Add a script or rule that checks:

- vague descriptions;
- overloaded SKILL.md files;
- missing readiness gate for loops;
- missing oracle;
- missing stop condition;
- broad permissions;
- secret leakage patterns;
- stale external vendor claims.

### P4: Real Agent Office State

Move from mock-only display to real state consumption:

- bridge queue;
- active loop state;
- event stream;
- Evidence Wall;
- Git/Worktree snapshot;
- Controller decision card.

Agent Office should prioritize "where Codex is now, why it is there, what evidence exists, and what is blocking the next step" over generic dashboard metrics.

### P5: Verifier Separation

For any `loop-ready` project work:

- implementation lane cannot self-accept;
- verifier lane must inspect actual files/tests/artifacts;
- `555` required for milestone, release, backend/shared-surface, architecture, AI/Agent safety, or done claims.

### P6: Tool Portfolio Registry

Create a local registry of allowed tools and connectors:

- name;
- purpose;
- permissions;
- allowed projects;
- install status;
- risk level;
- review date;
- owner.

Do not add broad MCP/tool stacks by default.

## Immediate Next Upgrade Recommendation

Implemented in this upgrade:

- `rules/authority-boundary-standard.md`.
- `rules/controller-state-machine-standard.md`.
- `skill-artifacts/loop-engineering/schemas/`.
- `scripts/validate-loop-state.py`.
- Controller/authority references in `666`, `work-planner`, `work-splitter`, `555`, README, and Codex Bridge contract.
- Runtime-state, worker-packet, 555-verdict, and trajectory schemas with checked examples.
- `scripts/validate-runtime-contract.js` and `npm run check:runtime-contract` for Python-free runtime validation.
- `scripts/record-agent-office-trajectory.js` for Codex-side trajectory ledger entries.
- `scripts/summarize-agent-office-trajectory.js` and `npm run agent-office:trajectory:summary` for compact Controller-readable trajectory summaries.
- `scripts/lint-skills.js` and `npm run check:skills` for skill boundary and evidence lint.
- `skills/judgment` as an explicit alias over the canonical Judgment router stack.
- `/codex/state` now includes `trajectorySummary`, and Agent Office renders it as a right-rail Controller trajectory panel with a detail modal.
- GitHub Actions now runs consistency, skill lint, runtime-contract validation, and Agent Office syntax checks.
- `agent-office/templates/project-session.template.json` plus `agent-office:session:new:template` provide clean project-session defaults for starting the next independent project.

The remaining concrete implementation needs real runtime interfaces beyond the static HTML surface:

1. Add Browser-visible evidence capture into Evidence Wall for every UI-facing node once the Browser/Chrome evidence source is standardized.
2. Add a transcript mirror contract for real Codex subagent outputs without allowing HTML to launch agents directly.
3. Wire those real evidence and transcript streams into the same `/codex/event` and trajectory path used by Agent Office.

This turns Judgment from a strong workflow skill into a Codex-native project Controller that can supervise planning, execution, evidence, UI visibility, and review without losing safety boundaries.

## Sources

- OpenAI Codex Skills: https://developers.openai.com/codex/skills
- OpenAI Codex Automations: https://developers.openai.com/codex/app/automations
- OpenAI Codex Worktrees: https://developers.openai.com/codex/app/worktrees
- OpenAI Agents SDK: https://developers.openai.com/api/docs/guides/agents
- OpenAI Apps SDK UX: https://developers.openai.com/apps-sdk/concepts/ux-principles
- Anthropic Claude Code Memory: https://code.claude.com/docs/en/memory
- Anthropic Claude Code Subagents: https://code.claude.com/docs/en/sub-agents
- Anthropic Claude Code Hooks: https://code.claude.com/docs/en/hooks
- CommonMark Spec: https://spec.commonmark.org/0.31.2/
- MDN HTML: https://developer.mozilla.org/en-US/docs/Web/HTML
- Agent Skills standard: https://agentskills.io/
- Addy Osmani Loop Engineering: https://addyosmani.com/blog/loop-engineering/
- ByteDance Trae Agent: https://github.com/bytedance/trae-agent
- Qwen-Agent: https://github.com/QwenLM/Qwen-Agent
- DeepSeek Function Calling: https://api-docs.deepseek.com/guides/function_calling
- DeepSeek JSON Output: https://api-docs.deepseek.com/guides/json_mode
- Z.ai Quick Start: https://docs.z.ai/guides/overview/quick-start
- Z.ai Function Calling: https://docs.z.ai/guides/capabilities/function-calling
- tap file-based collaboration paper: https://arxiv.org/abs/2606.14445
