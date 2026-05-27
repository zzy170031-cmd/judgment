---
name: "666"
description: General Codex project workflow router for choosing the smallest useful combination of skills, roles, threads, gates, and Git checks. Use when the user says 666, 技能融合, 工作流提效, 封装工作流, 总控路由, 如何推进, 是否开555, 是否审计, 是否核心质疑者, or asks to coordinate multiple Codex project skills, repos, gates, dirty worktrees, or worker threads.
---

# 666

## Purpose

Use `666` as the upstream Codex project workflow router. It decides what should happen next before the work becomes heavy:

- whether to answer directly, stay read-only, edit, dispatch a worker, run an audit, challenge a claim, or escalate to `555`;
- which existing skill should be loaded next;
- which gate and Git boundaries apply;
- how to avoid overusing full five-agent flow on small tasks.

`666` does not replace `555`. It decides whether `555` is needed.

## Trigger Policy

Strong trigger:

- User explicitly says `666`.
- User asks for skill fusion, workflow efficiency, packaging workflows, route selection, or how to proceed.
- User asks whether to use `555`, Core Challenger, Audit Specialist, automation, handoff, or a custom worker.
- The task spans multiple project repos, threads, gates, or workstreams.

Medium trigger:

- A progress report exposes stale evidence, dirty drift, owner-decision blockers, or live Git contradictions.
- A milestone, release-readiness, done claim, architecture claim, or acceptance claim needs routing.
- There are competing lanes such as runtime, contract, UI, KB, QA, packaging, audit, or handoff.
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
- 禁止事项：
- 下一步最小 gate：
```

For controller-ready cross-thread text, use the available thread-dispatch or handoff skill and follow the active copy-ready format.

## Forbidden

- Do not treat `666` as permission to widen scope.
- Do not run full `555` for every small task.
- Do not create subagents or automations unless the task genuinely requires them.
- Do not turn audits into cleanup.
- Do not mutate Git state unless the user explicitly opens that gate.
- Do not paste secrets, raw knowledge-base rows, raw model prompts, private source registers, or sensitive overlay JSON.
