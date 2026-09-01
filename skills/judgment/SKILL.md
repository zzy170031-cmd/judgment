---
name: "judgment"
description: Front door for professional Judgment audits. Use when the user writes $judgment, judgment:, Judgment审计, 专业评判, or "<task> 使用 J5/J10/J15/J20 开始审计，审计后给我一个执行方案". Preserve the named level and return an evidence-backed executable plan; audit is read-only unless implementation is separately authorized.
---

# Judgment

Use this as the short front door to the professional audit system.

```text
$judgment <question>
judgment: <question>
```

Both read and route to the unique [666 audit router](../../SKILL.md), which
decomposes the question and chooses a `J5/J10/J15/J20` audit. A normal
multi-factor question defaults to `J10`; a clearly narrow low-risk question
may use `J5`.

## Primary Natural-Language Invocation

```text
<task> 使用 J5 开始审计，审计后给我一个执行方案
<task> 使用 J10 开始审计，审计后给我一个执行方案
<task> 使用 J15 开始审计，审计后给我一个执行方案
<task> 使用 J20 开始审计，审计后给我一个执行方案
```

Treat matching `j5/j10/j15/j20` case-insensitively. Everything before the
activation phrase is the audit target. The named level wins; do not silently
upgrade or downgrade it. "给我一个执行方案" requests the plan as the audit
deliverable, not permission to execute it.

## Explicit Levels

```text
$judgment 5 <question>     -> J5
$judgment 10 <question>    -> J10
$judgment 15 <question>    -> J15
$judgment 20 <question>    -> J20
$judgment J5|J10|J15|J20 <question>
```

Chinese forms such as 五次质询、十次质询、十五次质询、二十次质询 map to the
same levels. The number means completed closed challenge units, not agents or
chat turns.

## Default Behavior

1. Decompose the user's real question, scenarios, constraints, success criteria,
   evidence, and risk.
2. Select the smallest sufficient level.
3. Generate professional roles from the actual domain and use cases.
4. Use real independent read-only reviewers when available.
5. Run blind review, Red/Blue cross-examination, and independent evidence checks.
6. Return a professional verdict and an ordered executable plan.
7. Ask only for unresolved human decisions or separate implementation authority.

Each challenge unit must contain a professional answer, opposing
counter-question, evidence check, and finding. If independent reviewers or
required evidence are unavailable, report partial coverage instead of
simulating completion.

## Boundary

Judgment audit is read-only by default. A plan or pass verdict does not authorize
file changes, Git mutation, installation, messaging, deployment, deletion,
production access, user-data actions, or other external effects. Risk and
approval gates outrank the selected level.

## Compact Output

```text
Judgment：
- 真实问题：
- 审计档位 / 覆盖：
- 专业角色：
- 关键质询与证据：
- 裁决：
- 可执行方案：
- 风险 / 停止条件 / 回退：
- 需要用户决定：
```

## Forbidden

- Do not solve a Judgment invocation as one unchallenged opinion.
- Do not use fixed generic personas when domain-specific roles can be generated.
- Do not count duplicate questions, summaries, or votes as evidence.
- Do not claim a J-level without its required completed challenge units.
- Do not load or restate the old full 666 workflow catalog.
- Do not route `direct`, `plan`, `split`, or `loop` as old Judgment modes.
