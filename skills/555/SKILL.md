---
name: "555"
description: Unified Hope five-agent operating mode for live Git anchoring, lane routing, adversarial review, backend delegation, evidence verification, progress-watch escalation, and copy-ready controller/worker reporting. Use when the user says 五代理, 五代理闭环, 对抗审查, 红队, Core Challenger, 后端代码委派, 总控分线程, milestone/release confidence, or asks to combine Hope workflow skills into one execution loop.
---

# 555

## Purpose

Run Hope work as one closed governance loop: anchor live state, assign the right seat, execute or review within scope, verify from actual evidence, and report in a paste-ready format.

This skill supersedes scattered five-agent instructions for the current task. Use the older narrow skills only as supporting references when needed.

## The Five Seats

Use exactly five seats for non-trivial Hope work:

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
git -C <repo> log -1 --oneline --decorate
git -C <repo> rev-parse HEAD
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

## Mode Selection

Use the smallest matching mode:

- `只读锚定`: branch/HEAD/dirty/remote status only.
- `总控分派`: produce copy-ready worker instructions or reports.
- `后端委派`: backend multi-file implementation or shared runtime/contract/storage/schema changes.
- `对抗审查`: strict quality review of a plan, task, artifact, or milestone claim.
- `巡检升级`: progress-watch finds milestone/release claims, stale evidence, dirty drift, or explicit review request.

Do not run the full closed loop for trivial single-file edits, small docs-only updates, or status-only checks unless the user asks for `对抗审查` or `五代理闭环`.

## Development Skill Handoff

Use these narrower development skills when they match the task:

- `hope-runtime-repair`: runtime.rs, validator, fallback, storyboard row materialization, source-role/person fidelity, and targeted Rust verification gates.
- `hope-contract-gate`: docs-only contract/schema/field-boundary gates and implementation handoff checklists.

Return to `555` when the task needs multi-agent review, backend delegation, red-team critique, or controller/worker dispatch.

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
- Refresh `C:\Users\Administrator\.codex\automations\hope-progress-watch\memory.md` only when the watch deliverable requires it.

## Acceptance Standard

A0 may close the loop only after:

- Live branch/HEAD/dirty state is known.
- The active route and allowed scope are stated.
- Delegated jobs have returned actual results, not pending notifications.
- Review claims were checked against files/tests/artifacts.
- Remaining user decisions are explicit and minimal.
- The final report states changed files, verification results, risks, and the next gate.
