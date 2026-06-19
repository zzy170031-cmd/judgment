---
name: "555"
description: Unified Codex project five-agent operating mode for live Git anchoring, XA/XB development-gate assurance, AI/Agent safety review, lane routing, adversarial review, backend delegation, evidence verification, progress-watch escalation, context-pressure protection, and copy-ready controller/worker reporting. Use when the user says 五代理, 五代理闭环, 对抗审查, 红队, Core Challenger, 后端代码委派, 总控分线程, milestone/release confidence, XA/XB release gate, AI开发安全, Agent安全审查, or asks to combine project workflow skills into one execution loop.
---

# 555

## Purpose

Run Codex project work as one closed governance loop: anchor live state, assign the right seat, execute or review within scope, verify from actual evidence, and report in a paste-ready format.

This skill supersedes scattered five-agent instructions for the current task. Use the older narrow skills only as supporting references when needed.

Use the local XA/XB standard as the default development gate reference when product, game, AI, Agent, release, QA, or operations work is involved:

- Local standard: `~/.codex/rules/xa-xb-standard.md`
- Durable evidence standard: `rules/durable-evidence-ledger-standard.md` when present in the current repo, or the equivalent local rule path when installed.
- Tool portfolio standard: `rules/tool-portfolio-standard.md` when choosing, installing, enabling, or reviewing plugins, skills, MCP servers, connectors, scripts, or automations.
- Security review standard: `rules/security-review-standard.md` for auth, permissions, payments, user data, secrets, external-send, production, AI/Agent tools, and destructive actions.
- Browser flow testing standard: `rules/browser-flow-testing-standard.md` for web UI, local previews, visual artifacts, responsive layout, and interaction flows.
- `XA`: non-game product development and launch.
- `XB`: game development and launch.
- Gates: `G0 Intake`, `G1 Ready for Build`, `G2 Technical Design`, `G3 Implementation Ready for Test`, `G4 Quality`, `G5 Release`, `G6 Operate`.

## The Five Seats

Use exactly five seats for non-trivial project work:

1. `A0 总控架构席`: main decision-maker, route owner, scope controller, final acceptor.
2. `A1 实现委派席`: implementation worker for backend multi-file or bounded lane work.
3. `A2 红队审查席`: first adversarial reviewer; read-only by default.
4. `A3 二轮裁定席`: fresh adjudicator; reviews rebuttals and finds new critiques.
5. `A4 证据验证席`: general-purpose verifier / Audit Specialist; must inspect real files, logs, tests, or artifacts with read/search before final categorization.

Core Challenger behavior belongs mainly to `A2` and `A3`; Audit Specialist behavior belongs mainly to `A4`. The main thread never treats its own judgment as sufficient for a milestone claim.

## First Gate: Live State

Before planning, reviewing, delegating, or claiming readiness:

```powershell
git -C <repo> status -sb
git -C <repo> worktree list --porcelain
git -C <repo> log -1 --oneline --decorate
git -C <repo> rev-parse HEAD
git -C <repo> rev-parse --git-dir --git-common-dir
git -C <repo> branch -vv
```

If remote freshness matters and mutation is not allowed:

```powershell
git -C <repo> ls-remote origin refs/heads/<branch>
git -C <repo> cat-file -t <remote_sha>
```

Rules:

- Trust actual Git/file/process/artifact state over packets, screenshots, prior reports, or local tracking refs.
- If a live remote commit is absent locally, report stale tracking refs.
- Do not clean, reset, stash, commit, push, or edit unrelated dirty files unless the user explicitly opens that gate.
- If a ledger exists, treat it as a clue, not authority. Re-check the underlying files, commands, artifacts, and Git state before closure.
- When `git worktree`, parallel worker lanes, hotfixes during dirty work, clean review/test worktrees, or branch ownership conflicts matter, load `rules/git-worktree-standard.md`; include current worktree path, worktree list, branch owner, base ref, setup state, shared-file policy, integration owner, verification output, commit/push policy, force policy, and cleanup policy in controller/worker reports.
- Do not accept a worker's worktree report as closed until the target worktree has a fresh `status -sb`, `HEAD`, changed-file list, verification evidence, and an explicit integration or handoff state.

## Context Pressure Before Loop

Before starting a full five-agent loop, check whether the current thread is too context-heavy for reliable execution.

If the user mentions high context, background load, compression, handoff, new thread, thread switch, `7.5/10`, `70%`, or `75%`:

- do not start new five-agent work yet;
- finish or report the state of any running command;
- produce a copy-ready handoff/checkpoint first;
- include goal, workspace, branch, HEAD, dirty state, worktree path/list when relevant, completed work, unfinished work, commands/tests, decisions, constraints, risks, and next gate;
- tell the next thread to trust live Git/file state over the handoff packet.

If context pressure is elevated but not critical, keep the loop narrow and avoid adding side investigations or extra worker threads.

## Mode Selection

Use the smallest matching mode:

- `只读锚定`: branch/HEAD/dirty/remote status only.
- `总控分派`: produce copy-ready worker instructions or reports.
- `后端委派`: backend multi-file implementation or shared runtime/contract/storage/schema changes.
- `对抗审查`: strict quality review of a plan, task, artifact, or milestone claim.
- `巡检升级`: progress-watch finds milestone/release claims, stale evidence, dirty drift, or explicit review request.

Do not run the full closed loop for trivial single-file edits, small docs-only updates, or status-only checks unless the user asks for `对抗审查` or `五代理闭环`.

## Development Skill Handoff

Use narrower project-specific skills when they match the task:

- Runtime/implementation repair skill: runtime paths, validators, fallback reasons, row materialization, or targeted verification gates.
- Contract/spec gate skill: docs-only contract, schema, field-boundary, API, or downstream checklist work.
- UI, packaging, QA, documentation, or repository-specific skills when they are narrower than this generic five-agent loop.

Return to `555` when the task needs multi-agent review, backend delegation, red-team critique, or controller/worker dispatch.

If the user is primarily asking how to clarify a fuzzy need, align with Codex Plan mode, split work, assign lanes, decide thread strategy, or separate implementation/QA/audit rounds, use `work-planner` first. Use `needs-solution-designer` for unclear requirements and `work-splitter` for already-clear decomposition. Start `555` only after the planning result identifies a milestone, release gate, architecture/backend/shared-surface risk, AI/Agent safety risk, or adversarial assurance need.

## XA / XB Gate Assurance

Use this section for milestone, release-readiness, architecture, backend/shared-contract, or AI/Agent safety-sensitive work.

Before executing or reviewing, `A0` must identify:

```text
flow: XA / XB
gate: G0 / G1 / G2 / G3 / G4 / G5 / G6
AI/Agent requirements: none / behavior contract / tool boundary / guardrails-evals / human approval / monitoring / incident
release impact: none / local artifact / internal test / production / store submission / external user impact
```

Seat responsibilities under XA/XB:

- `A0 总控架构席`: map the task to XA/XB, state the active gate, enforce scope, define acceptance evidence, and decide go/conditional go/no-go.
- `A1 实现委派席`: implement only inside the active gate boundary; do not broaden scope, publish, deploy, submit, or change production/user data without explicit authorization.
- `A2 红队审查席`: challenge assumptions, missing acceptance criteria, security/privacy/AI/tool risks, release-readiness claims, and rollback gaps.
- `A3 二轮裁定席`: adjudicate disputes and look for missed cross-gate risks, especially AI/Agent failure modes and operational blind spots.
- `A4 证据验证席`: verify actual files, tests, builds, previews, logs, artifacts, release status, monitor state, and source references.

Gate-specific closure:

- `G0/G1`: close only when route, non-goals, acceptance criteria, and completion oracle are explicit.
- `G2`: close only when architecture/contracts/security/privacy/observability/rollback and AI guardrails/evals are covered where relevant.
- `G3`: close only when a running implementation or artifact plus verification steps exists.
- `G4`: close only with test/security/privacy/accessibility/AI evidence and a `go`, `conditional go`, or `no-go`.
- `G5`: close only with exact release artifact, release notes, monitoring, rollback/hotfix, support path, and explicit authorization for external effects.
- `G6`: close only when incidents/feedback are triaged with owner, severity, evidence, and next gate.

## Durable Evidence And Independent Review

Use a durable evidence ledger when the task is long-running, crosses workers/threads, claims a milestone or release, or needs temporary artifact cleanup tracking.

Minimum ledger-backed closure:

- objective and active gate are recorded;
- allowed scope and forbidden actions are recorded;
- command, file, artifact, test, or reviewer evidence is listed with result and limitation;
- temporary harnesses or generated artifacts are marked `keep` or `cleanup`;
- risks and next gate are explicit.

Independent review requirement:

- Implementer self-review is acceptable only for small `G0-G3` tasks with low risk.
- `G4`, `G5`, milestone confidence, release readiness, architecture acceptance, AI/Agent safety, backend/shared-surface changes, and done claims require independent review evidence.
- Independent review can be `A2/A3/A4`, a QA lane, a named verifier, or a worker report that is separate from the implementer.
- A non-clean review returns the work to the smallest relevant earlier gate. Do not close by relabeling the issue as polish.

If review evidence is missing, classify the result as blocked or conditional, not complete.

## Security Threat Model Review

Trigger this section whenever auth, permissions, payments, user data, secrets, external sends, production systems, AI/Agent tool use, or destructive actions are involved.

Review checklist:

- Assets and user rights at risk.
- Trust boundaries and untrusted inputs.
- Actors and abuse cases, including prompt injection or confused-user paths.
- Data flow, storage, logs, secrets, private data, and external transmission.
- Permission model and least-privilege controls.
- Human approval requirements for external or irreversible actions.
- Tests, logs, code evidence, or reviewer evidence that prove the risk was checked.

Gate effects:

- Missing controls for auth, payment, permission, user data, external-send, production, or destructive action are `must fix`, `block`, or `user-decision`, not polish.
- Do not paste secrets, tokens, cookies, raw private data, or sensitive logs into reports.
- Release/milestone/backend/shared-surface/AI safety decisions require independent review evidence.

## Browser Flow Review

Trigger this section whenever a web UI, local app, HTML artifact, visual state, responsive layout, design-to-code result, or interaction flow is changed or used as acceptance evidence.

Review checklist:

- Browser target and how it was launched or accessed.
- Viewport/device when layout risk exists.
- Primary flow steps, expected result, actual result, and visible evidence.
- Screenshot, DOM snapshot, console/log signal, or manual Browser observation.
- Design-source comparison when Figma/screenshot/design implementation is involved.

Gate effects:

- Do not close browser-visible behavior from code inspection alone when a Browser target is available.
- Blank, broken, overlapped, inaccessible, stale, or unreachable UI is `conditional` or `block`.
- Auth/payment/external-send/upload/file/production browser flows must also pass the security threat model gate.

## Tool Portfolio And External Integration Review

Trigger this section when the task involves installing, enabling, authenticating, packaging, or relying on a plugin, skill, MCP server, connector, lifecycle hook, external documentation provider, or third-party tool recommendation.

Review checklist:

- Tool form: skill, plugin, MCP/connector, script, automation, or no-install.
- Source trust: official, curated, known-community, private, or unknown.
- Manifest and scope: requested permissions, hooks, external services, filesystem writes, browser automation, production/deploy access, account authorization, and external sends.
- Existing coverage: whether an installed skill, connector, script, or repo command already covers the job.
- Freshness: whether framework/API/plugin/marketplace facts were checked against current official or upstream sources.
- Verification: command, dry run, focused test, Browser flow, CI log, threat model, design fidelity check, or review artifact.

Gate effects:

- Do not approve broad tool stacks because a public list recommends them.
- Do not treat installation commands, availability claims, dates, or counts from public articles as authoritative without current verification.
- Require explicit user approval before install, enable, auth, publish, deploy, external send, or new scope grant.
- If hooks, account-connected connectors, production access, external sends, or destructive tools are involved, classify missing review as blocked or user-decision, not minor risk.

Do not include market research, competitor research, advertising, or commercial sizing in XA/XB reviews unless explicitly requested.

## AI / Agent Safety Review

Trigger this section whenever AI, LLMs, autonomous Agents, tool calling, generated code, or automation could affect files, users, external systems, production, payments, permissions, privacy, or legal state.

Review checklist:

- Behavior contract: purpose, allowed inputs, expected outputs, forbidden actions, escalation conditions, and handoff format.
- Tool boundary: allowlist, least privilege, read/write separation, production/external-send controls, destructive-action defaults.
- Guardrails/evals: prompt injection, malicious instructions, sensitive data, out-of-scope tasks, unsafe tool calls, hallucinated claims, known failure regressions.
- Human approval: external publication/upload, production deploy, app-store submission, sending messages, payment/refund/billing, permission changes, user-data operations, legal actions, deletion/reset/mass modification.
- Observability: logs, model/tool decisions, failure modes, refusals, user overrides, incident response, without exposing secrets or raw private data.

If any required AI/Agent control is missing at a release or external-effect gate, classify as `必须改` or `用户拍板`, not as ordinary polish.

## Direct Work Versus Delegation

Direct work is allowed for:

- Single-file creation or modification.
- Narrow bug fixes.
- `.md` documentation.
- Frontend code when the current frontend workflow applies.

Delegate instead of editing directly when:

- The task is backend and touches multiple files.
- The change affects shared runtime paths, contracts, storage, schemas, validators, runners, evidence, or cross-module behavior.
- The user asks for five-agent / closed-loop / adversarial assurance.

Delegation instructions must include purpose, constraints, relevant `.md` paths, allowed files/modules, forbidden actions, and verification commands. Do not give concrete code blocks for the worker to copy.

## Backend Delegation Runtime

When using external Codex companion from Bash on Windows:

- Use `--background`.
- Use `--fresh` for new reviewers/workers.
- Use `--write` only for implementation delegates, never for red-team review.
- Do not use foreground mode.
- Prefer direct `codex-companion.mjs` invocation over a Skill wrapper when the script exists.

Resolve the companion path dynamically:

```bash
CXC=$(ls C:/Users/*/.claude/plugins/cache/openai-codex/codex/*/scripts/codex-companion.mjs 2>/dev/null | head -1)
test -n "$CXC" || { echo CODEX_COMPANION_NOT_FOUND; exit 2; }
node "$CXC" task --background --fresh --write "任务描述"
```

If the companion path is missing, stop and report the missing tool instead of falling back to a foreground run.

## Background Polling

After starting a background job, do not end the turn waiting for notification. Poll synchronously in the same turn.

```bash
JOB="task-xxxxxxxx-xxxxxx"
END=$(($(date +%s)+300))
while :; do
  S=$(node "$CXC" status "$JOB" 2>/dev/null | grep '^- task-' | head -1 | cut -d'|' -f2 | tr -d ' ')
  echo "[$(date +%H:%M:%S)] status=$S"
  case "$S" in completed|failed) break;; esac
  [ $(date +%s) -gt $END ] && { echo TIMEOUT_5MIN; break; }
  sleep 30
done
```

Then:

- `completed` / `failed`: run `node "$CXC" result "$JOB"` immediately.
- `TIMEOUT_5MIN`: start another synchronous polling segment in the same turn, up to 3 total segments.
- Two consecutive `status` command errors: stop polling and report the tool failure.

Do not use `ScheduleWakeup`, `codex:status`, or `codex:result` wrappers for this workflow.

## 对抗审查

Trigger on `对抗审查`, `红队`, `Core Challenger`, release/milestone confidence, or a claim that needs falsification.

1. `A2 红队审查席`
   - Fresh background reviewer.
   - Read-only; forbid `--write`.
   - Require at least 6 new problems.
   - No duplicates and no soft praise.
   - Every item must include location, severity, evidence, and recommendation.
   - Severity levels: `阻塞`, `重要`, `锦上添花`.

2. `A0 总控反驳`
   - Respond to every item as `[完全接受]`, `[部分接受]`, or `[不接受]`.
   - Include source/test/artifact/user-constraint evidence.

3. `A3 二轮裁定席`
   - Fresh reviewer with Round 1 and the rebuttal.
   - Adjudicate every disputed item.
   - Find at least 3 additional new critiques.

4. `A4 证据验证席`
   - Must read/search actual files or artifacts before judging assumptions.
   - Output exactly:
     - `必须改`
     - `建议`
     - `无需`
     - `用户拍板`
     - `Critical Files`
   - End with one sentence verdict.

5. `A0 收口`
   - Ask the user only unresolved decisions.
   - If no decisions remain, give the final verdict and next actions.

## Copy-Ready Dispatch Format

Controller-to-worker instructions must be in a `text` block and start with:

```text
分线程指令：
线程动作：<新开 / 沿用 / 重启 / 待命 / 结束 / 归档>
指令发给：<新线程 or existing thread>
沿用线程：<existing thread or 无>
更名线程：<new visible name or 不更名>
替代线程：<old thread or 无>
```

Worker-to-controller reports must start with:

```text
总控回报：
目标线程：总控线程
来源线程：<reporting thread>
```

Thread names use:

```text
（status）Project-WorkstreamThread-【Chinese target action】
```

Allowed prefixes: `（运行）`, `（待命）`, `（结束）`, `（归档）`.

## Progress-Watch Escalation

For recurring progress checks:

- Keep normal watch output compact: what changed, branch status, latest commits, uncommitted changes, risks/blockers.
- Escalate to this five-agent loop only when the watch exposes a milestone claim, release-readiness claim, stale evidence contradiction, owner-decision blocker, or backend multi-file action request.
- Refresh a project-specific automation memory or checkpoint file only when the watch deliverable requires it.

## Acceptance Standard

A0 may close the loop only after:

- Live branch/HEAD/dirty state is known.
- Context pressure was checked before any large loop or handoff-sensitive action.
- The active route and allowed scope are stated.
- XA/XB flow and active gate are stated when product/game/AI/release work is involved.
- AI/Agent behavior, tool, guardrail, human-approval, and monitoring requirements are checked when relevant.
- Delegated jobs have returned actual results, not pending notifications.
- Review claims were checked against files/tests/artifacts.
- Ledger-backed tasks have final status, evidence, temporary artifact disposition, risks, and next gate recorded.
- Independent review evidence exists for `G4/G5`, milestone, release, architecture, AI/Agent safety, backend/shared-surface, or done claims.
- Security-sensitive tasks have threat-model status and residual risks recorded.
- Browser-visible tasks have Browser flow evidence or an explicit conditional/blocker reason.
- Remaining user decisions are explicit and minimal.
- The final report states changed files, verification results, risks, and the next gate.
