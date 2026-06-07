# Work Planner Plugin

`work-planner` is a local Codex plugin package for turning fuzzy work into an execution-ready Codex plan.

It combines:

- `slash-work-planner`: `/` launcher. Normalizes slash-prefixed user input and routes it to `work-planner`, `666`, or `555` when appropriate.
- `work-planner`: main entrypoint. Aligns needs clarification, Codex Plan mode, work splitting, XA/XB gates, thread strategy, and 555 escalation.
- `needs-solution-designer`: clarifies fuzzy needs, separates confirmed facts from assumptions, checks reuse, and produces a solution blueprint.
- `work-splitter`: splits clear work into lanes, Agent groups, subtask contracts, thread strategy, and 555-prep packets.

## What It Does

- Lets the user launch planning with `/`, such as `/我要做一个产品，先帮我规划`.
- Clarifies fuzzy ideas before decomposition.
- Maps unresolved choices to Codex Plan mode behavior.
- Routes work into `XA`, `XB`, or general workflow.
- Identifies the active `G0-G6` development gate.
- Chooses a decomposition level from `D0` to `D5`.
- Splits work into lanes, Agent groups, and thread strategy.
- Produces subtask contracts with inputs, allowed actions, forbidden actions, expected output, verification, and next receiver.
- Decides whether `555` is needed for milestone, release, architecture, backend/shared-surface, or AI/Agent safety review.

## What It Does Not Do

- It does not implement code by itself.
- It does not replace `666`.
- It does not replace `555`.
- It does not perform market research, competitor research, advertising, or commercial sizing unless explicitly requested.

## Relationship

```text
666 = decides whether work-planner is needed.
work-planner = main planning entrypoint.
needs-solution-designer = clarifies fuzzy needs and stabilizes the solution blueprint.
work-splitter = decomposes clear work into lanes, gates, contracts, and thread strategy.
XA/XB = provides the development standards.
555 = reviews high-risk gates, milestones, release readiness, backend/shared surface, and AI/Agent safety.
```

## Complete Flow

```text
P0 Intake
  -> P1 Need clarity check
  -> P2 Codex Plan mode preflight
  -> P3 Work split
  -> P4 Route to current thread / worker thread / 555
  -> P5 Evidence and next gate
```

## Boundary Table

| Layer | Main Job | Use When | Output |
|---|---|---|---|
| Codex Plan mode | collect choices and produce a non-mutating plan | user needs planning/approval before edits | plan, questions, assumptions |
| `needs-solution-designer` | clarify fuzzy need and solution shape | need is not stable enough to restate | confirmed need, assumptions, reuse decision, solution blueprint |
| `work-splitter` | split clear work into lanes and contracts | need is clear enough but execution is broad | lanes, gates, owners, thread strategy, subtask contracts |
| `666` | route skills and workflow level | decide which skill/gate/route is needed | routing decision |
| `555` | adversarial assurance and evidence closure | milestone, release, backend/shared surface, AI safety, done claim | go/conditional go/no-go, evidence verdict |

## Install Source

The plugin manifest is:

```text
.codex-plugin/plugin.json
```

The main skill entrypoint is:

```text
skills/work-planner/SKILL.md
```

Supporting skills:

```text
skills/slash-work-planner/SKILL.md
skills/needs-solution-designer/SKILL.md
skills/work-splitter/SKILL.md
```
