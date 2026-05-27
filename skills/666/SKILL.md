---
name: "666"
description: General Codex project workflow router for choosing the smallest useful combination of skills, roles, threads, gates, Git checks, context-pressure handoff, and packaging candidates. Use when the user says 666, 技能融合, 工作流提效, 封装工作流, 总控路由, 如何推进, 是否开555, 是否审计, 是否核心质疑者, 上下文高, 接力, 切线程, 压缩, 是否值得封装, or asks to coordinate multiple Codex project skills, repos, gates, dirty worktrees, or worker threads.
---

# 666

## Purpose

Use `666` as the upstream Codex project workflow router. It decides what should happen next before the work becomes heavy:

- whether to answer directly, stay read-only, edit, dispatch a worker, run an audit, challenge a claim, or escalate to `555`;
- which existing skill should be loaded next;
- which gate and Git boundaries apply;
- whether context pressure requires a handoff before more work;
- whether repeated work deserves packaging as a skill, automation, subagent, extension, or skip;
- how to avoid overusing full five-agent flow on small tasks.

`666` does not replace `555`. It decides whether `555` is needed.

## Trigger Policy

Strong trigger:

- User explicitly says `666`.
- User asks for skill fusion, workflow efficiency, packaging workflows, route selection, or how to proceed.
- User asks whether to use `555`, Core Challenger, Audit Specialist, automation, handoff, or a custom worker.
- User mentions high context, background load, compression, compacting, handoff, new thread, thread switch, `7.5/10`, `70%`, or `75%`.
- User asks whether repeated work should be packaged, evolved, automated, delegated, or skipped.
- The task spans multiple project repos, threads, gates, or workstreams.

Medium trigger:

- A progress report exposes stale evidence, dirty drift, owner-decision blockers, or live Git contradictions.
- A milestone, release-readiness, done claim, architecture claim, or acceptance claim needs routing.
- There are competing lanes such as runtime, contract, UI, KB, QA, packaging, audit, or handoff.
- A long task is about to start in a thread with substantial history or prior compaction.
- A workflow appears repeated, time-consuming, error-prone, context-heavy, or in need of consistent output.
- The user asks to combine local memory, current Git state, and prior thread decisions.

Do not auto-trigger for:

- trivial single-file edits;
- simple command output;
- a clearly scoped docs-only or runtime-only task;
- a task where the user explicitly names a narrower skill and no routing decision is needed.

## First Gate

Before selecting a path, establish the smallest needed facts:

1. Current user gate: read-only, docs-only, runtime-only, package-only, review-only, or write-open.
2. Workspace and repo ownership.
3. Live branch, HEAD, and dirty state when Git matters.
4. Whether remote freshness matters.
5. Whether the newest user message narrows or overrides older handoff text.
6. Whether context pressure should block new large work.
7. Whether the task is asking for packaging candidate evaluation rather than immediate implementation.

Trust actual file, Git, process, and artifact state over memory, screenshots, reports, or handoff packets.

## Routing Levels

Choose the smallest level that can complete the task:

- `L0 direct`: answer directly; no repo work and no extra skill body.
- `L1 anchor`: use a project-specific Git anchor skill when available; otherwise run live branch, HEAD, dirty-file, and remote-freshness checks directly.
- `L2 narrow skill`: use one focused skill, such as runtime repair, contract/spec gate, progress watch, thread handoff, packaging, QA, or a project-specific skill.
- `L3 specialist`: activate Core Challenger or Audit Specialist behavior for falsification, evidence review, or dirty ownership classification.
- `L4 555`: escalate to full five-agent loop for major claims, backend multi-file delegation, release confidence, cross-module contracts, or adversarial review.
- `L5 dispatch`: use an available thread-dispatch skill for copy-ready controller/worker routing, restart, standby, archive, or handoff packets.

If a lower level is enough, do not escalate.

## Context Pressure Guard

Codex may compact context outside the skill's control. `666` protects continuity before that happens.

Use this scale before starting large work:

- `C0 normal`: continue normally.
- `C1 elevated`: keep the task narrow; avoid opening new long work unless the user explicitly asks.
- `C2 high`: produce a checkpoint or handoff before continuing; prefer a fresh thread for major work.
- `C3 critical`: stop starting new tasks; report any running command state and generate a copy-ready handoff.

Trigger `C2` or `C3` when the user says context is high, background is high, thread is near limit, compression happened, handoff is needed, or usage is around `7.5/10`, `70%`, or `75%`.

At `C2` or `C3`, the handoff must include:

- current goal;
- workspace path;
- branch, HEAD, and dirty state when Git matters;
- completed work;
- unfinished work;
- commands/tests and results;
- decisions and constraints;
- risks or blockers;
- next smallest gate;
- reminder to trust live Git/file state over the handoff packet.

Do not start `555`, long audits, broad refactors, packaging, release review, or cross-repo sync at `C2` or `C3` until the handoff/checkpoint is complete.

## Packaging Candidate Gate

Use this gate when the user asks whether a workflow can be packaged, evolved, automated, delegated, or reused.

Review available evidence in this order:

1. Recent Codex sessions, task summaries, and the current thread.
2. Codex memories and rollout summaries, if available.
3. Existing skills, custom agents, automations, and repo-local rules.
4. External activity records such as Chronicle only as discovery signals; confirm important facts in the relevant source system.

Look broadly for work that is repeated, time-consuming, error-prone, context-heavy, or benefits from a consistent process. Include coding, research, writing, planning, communication, operations, analysis, and administration.

Only create or extend a packaged asset when the candidate:

- occurred at least twice, or is clearly likely to recur and costly to repeat;
- has stable inputs, a repeatable procedure, and a clear output or stopping condition;
- materially improves speed, quality, consistency, or reliability;
- is not already adequately covered by an existing skill, automation, subagent, rule, or script.

Choose the smallest appropriate form:

- `Skill`: reusable workflow or playbook.
- `Automation`: scheduled or recurring check, report, reminder, or monitor.
- `Subagent`: bounded specialist role or investigation task suitable for delegation.
- `Extend existing`: improve a current skill, automation, script, or rule instead of duplicating it.
- `Skip`: too one-off, ambiguous, sensitive, poorly evidenced, or already covered.

First produce a compact shortlist:

```text
Packaging candidates:
- repeated workflow:
- evidence / dates:
- frequency / confidence:
- recommended form:
- why worth or not worth packaging:
```

Then create or extend only the high-confidence missing items. Keep them narrow, practical, source-aware, and easy to validate. Do not create speculative, overlapping, or overly broad assets.

## Skill Selection Map

- Git anchor skill: standby, sync, review, readiness, or handoff needs live Git truth.
- Progress-watch or monitoring skill: recurring progress reports and checkpoint comparisons.
- Thread handoff skill: high context, thread transfer, or next-thread packet.
- Thread dispatch skill: controller-to-worker instructions and worker-to-controller reports.
- Contract/spec gate skill: docs-only contract, schema, field boundary, or downstream checklist work.
- Runtime/implementation repair skill: bounded implementation fixes and targeted verification.
- Project-specific skills: prefer the current repo's established skill or rule file when it is narrower than this generic router.
- `555`: full closed loop with five seats, Core Challenger pressure, Audit Specialist verification, backend delegation, or release-confidence review.

Load only the selected downstream skill bodies. Do not bulk-load every skill just because `666` triggered.

## Dirty Ownership Gate

Before any commit, cleanup, reset, restore, package, or sync action in a dirty worktree, classify dirty paths:

- current task owned;
- user-owned or previous-thread-owned;
- generated or build side effect;
- protected by the current gate;
- unknown, therefore keep.

If ownership is unclear, stop at a report. Do not clean, reset, stash, restore, commit, or push speculative changes.

## Escalate To 555 When

- The user explicitly asks for `555`, five-agent, Core Challenger, adversarial review, or release confidence.
- The claim is a milestone, done claim, architecture direction, or release-readiness decision.
- The work crosses runtime, contracts, storage, schemas, validators, artifacts, or multiple repos.
- A watcher finds stale evidence, conflicting Git truth, owner blockers, or dirty drift that changes the route.
- A backend or shared-surface implementation should be delegated rather than edited directly.

## Use Core Challenger When

- A conclusion needs falsification, not just summary.
- The weakest evidence could overturn the current direction.
- The user asks whether something is really done, safe, ready, aligned, or correct.

Keep it read-only unless the user opens a separate implementation gate.

## Use Audit Specialist When

- The task is code-health, redundancy, cleanup-candidate ranking, dirty ownership, or artifact ownership.
- The user asks what can be cleaned, archived, kept, or deferred.

Default to Top 10 candidates, evidence first, no edits, no deletes, no commits, and one proposed follow-up gate.

## Output Shape

For routing decisions, answer compactly:

```text
666 路由结论：
- 当前 gate：
- 当前证据：
- 推荐层级：L0 / L1 / L2 / L3 / L4 / L5
- 启用技能 / 角色：
- 不启用的内容：
- 封装候选：
- 禁止事项：
- 下一步最小 gate：
```

For controller-ready cross-thread text, use the available thread-dispatch or handoff skill and follow the active copy-ready format.

## Forbidden

- Do not treat `666` as permission to widen scope.
- Do not run full `555` for every small task.
- Do not start large work when context pressure is high; checkpoint or hand off first.
- Do not package speculative, overlapping, sensitive, or poorly evidenced workflows.
- Do not create subagents or automations unless the task genuinely requires them.
- Do not turn audits into cleanup.
- Do not mutate Git state unless the user explicitly opens that gate.
- Do not paste secrets, raw knowledge-base rows, raw model prompts, private source registers, or sensitive overlay JSON.
