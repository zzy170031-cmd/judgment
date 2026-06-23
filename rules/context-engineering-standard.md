# Context Engineering Standard

Use this rule when a task depends on selecting, compressing, refreshing, preserving, or handing off context across Codex turns, skills, workers, repos, or long-running project gates.

The goal is not to maximize context. The goal is to give the next action the smallest sufficient, current, verifiable context package.

## Trigger

Load this rule when:

- the user asks for broad research, deep learning from sources, or skill evolution;
- a task spans multiple files, skills, gates, repos, workers, or sessions;
- context pressure is medium or high;
- work will be delegated, resumed, summarized, or turned into a skill/rule/script;
- prior conversation, HTML dashboards, markdown plans, screenshots, source docs, Git state, or external articles may conflict;
- stale facts, stale screenshots, stale branch state, or older summaries could mislead the next action.

## Context Packet

Before routing substantial work, build or update this packet:

```text
Context packet:
- user objective:
- newest user constraint:
- current mode: read-only / write-open / review / research / release / blocked
- active repo/workspace:
- active gate or lifecycle stage:
- loaded local sources:
- loaded external sources:
- stale or unverified sources:
- decisions already made:
- assumptions:
- open questions:
- hard boundaries:
- next action:
- stop condition:
```

Only include details that affect the next action. Do not copy entire histories when a decision record is enough.

## Context Operations

Use these operations explicitly:

- `select`: choose the files, rules, docs, logs, screenshots, or sources needed for the next decision.
- `refresh`: re-check drift-prone facts such as branch state, latest docs, prices, APIs, release status, current browser view, and user-provided recent material.
- `compress`: replace long history with decisions, evidence, risks, and next action.
- `separate`: keep facts, assumptions, inferences, decisions, and user preferences distinct.
- `discard`: drop obsolete screenshots, superseded plans, stale branch state, and unneeded source detail.
- `persist`: write durable artifacts only when future turns or workers need them.

## Source Freshness

Classify source freshness:

- `live`: just inspected in this turn.
- `current-source`: official or primary source checked recently enough for the decision.
- `user-provided`: supplied by the user; treat as relevant but not automatically verified.
- `memory-derived`: from local memory or prior summaries; may be stale.
- `stale`: known or likely outdated.
- `unknown`: provenance or timestamp is unclear.

When freshness matters, prefer `live` or `current-source`.

## Handoff Packet

When handing off to another thread, worker, skill, or future turn, use:

```text
Handoff packet:
- objective:
- current state:
- completed evidence:
- changed files:
- commands/tests run:
- unresolved risks:
- next exact step:
- forbidden actions:
- context to reload:
- context to ignore:
```

## Skill Evolution Packet

When improving Judgment itself, add:

```text
Skill evolution packet:
- source problem:
- existing Judgment surface:
- gap:
- proposed local surface: rule / template / script / skill edit / no change
- verification:
- rollback:
```

## Interaction With Other Rules

- Use `rules/claim-calibration-standard.md` for any decision-impacting claim inside the packet.
- Use `rules/codex-surface-governance-standard.md` when external sources inspire new local behavior.
- Use `rules/durable-evidence-ledger-standard.md` when the packet must survive long-running project work.
- Use `rules/loop-engineering-standard.md` before turning repeated context work into an automation or loop.
- Use `555` when context ambiguity affects milestone, release, safety, or done claims.

## Forbidden

- Do not treat more context as automatically better.
- Do not mix stale screenshots, prior branch state, or old plans into a current decision without labeling them.
- Do not preserve hidden chain-of-thought. Preserve decisions, evidence, assumptions, and next actions.
- Do not create durable memory, files, or automations unless the user asked for persistence or the project gate requires it.
