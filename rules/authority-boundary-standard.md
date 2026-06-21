# Authority Boundary Standard

Use this rule when a Judgment workflow mixes Markdown instructions, HTML/UI surfaces, Codex execution, scripts/tests, bridge queues, automations, or review/acceptance claims.

The purpose is to prevent authority confusion. A visible page, Markdown plan, model response, bridge request, or agent self-report must not be treated as execution permission or acceptance evidence by itself.

## Boundary Model

```text
Markdown can guide.
HTML can display and request.
Codex can execute.
Scripts, tests, schemas, Browser checks, and CI can verify.
User, QA, verifier, or 555 can accept.
```

## Authority Levels

| Surface | May Do | Must Not Do |
|---|---|---|
| Markdown | Define rules, skills, contracts, plans, schemas, acceptance gates, and handoffs. | Execute commands, grant permissions, or prove completion alone. |
| HTML / Agent Office | Display state, collect structured requests, show evidence, show blockers, and present Controller decisions. | Execute shell/Git/install/deploy/delete actions directly or bypass Codex approval. |
| Bridge queue | Store request packets and event packets for Codex to inspect. | Convert a free-text request into automatic execution without Controller routing. |
| Codex thread | Read state, route, edit files, run tools, collect evidence, and update state within permissions. | Treat UI clicks or self-attestation as acceptance without an oracle/review gate. |
| Scripts/tests/schemas | Validate data, run deterministic checks, produce machine-readable evidence. | Replace human review for product, architecture, safety, release, or user-facing acceptance. |
| User / QA / 555 | Approve, reject, request more evidence, or stop a loop. | Hide required technical evidence from future handoff or Agent Office state. |

## Controller Rule

The `Judgment Controller` is the only role that can promote an item from one authority level to the next.

Required promotion statements:

```text
from:
to:
reason:
oracle:
review owner:
stop condition:
state update:
```

Examples:

- HTML request -> Codex task: allowed only after Controller routing and request packet validation.
- Markdown plan -> implementation: allowed only after user/write gate and allowed file/action scope.
- Codex implementation -> accepted node: allowed only after oracle evidence and required review.
- Bridge event -> Agent Office state: allowed only after schema validation or explicit mock/demo labeling.

## Required Checks

Before executing or accepting an action that crossed surfaces, record:

- source surface;
- target surface;
- permission basis;
- allowed actions;
- forbidden actions;
- validation method;
- evidence location;
- review owner;
- stop condition.

## Forbidden

- Do not let HTML execute local commands directly.
- Do not let a Markdown plan count as permission to edit, install, push, deploy, or delete.
- Do not let a bridge queue auto-run free-text requests.
- Do not let an implementer accept their own milestone, release, backend/shared-surface, AI/Agent safety, or done claim.
- Do not hide live state only in chat when an Agent Office or future handoff is expected.
