# Role Lane Responsibility Standard

Use this rule when Judgment must split product, engineering, AI/Agent, security, operations, Git/GitHub, or release work into practical lanes and responsibility boundaries.

## Core Rule

Split by responsibility and verification path, not by job title alone.

Real organizations name roles differently. A "frontend engineer", "fullstack engineer", "product engineer", "AI engineer", "QA", "SRE", "PM", or "designer" label is only a hint. Judgment must translate the work into lanes with clear inputs, allowed actions, output, reviewer, and done evidence.

## Source Pattern Intake

When borrowing role patterns from job ladders, engineering handbooks, Scrum, GitHub workflows, SRE, security standards, or domestic AI coding tools:

```text
source_role_or_pattern:
what_problem_it_solves:
lane_mapping:
responsibility_boundary:
verification_boundary:
handoff_boundary:
what_not_to_import:
decision:
```

Do not import company-specific org charts, titles, leveling, hiring criteria, compensation, model/provider claims, or tool-specific runtime assumptions as Judgment rules. Import only stable responsibility patterns.

## Responsibility Lanes

| Lane | Owns | Must hand off when |
|---|---|---|
| Product / Spec | goal, user, scope, non-goals, priority, acceptance criteria, product risks. | architecture, UX detail, implementation, security, release, or ops decisions need specialist evidence. |
| UX / Design | user flow, interaction, information architecture, accessibility expectations, design-source fidelity. | code behavior, backend contract, data/security, or release readiness is the question. |
| Frontend | UI state, client behavior, rendering, accessibility implementation, browser-visible flows, frontend tests. | API/storage/contracts, production deploy, or security-sensitive backend behavior is affected. |
| Backend | APIs, data model, persistence, auth enforcement, server-side workflows, integrations, backend tests. | UI flow, design fidelity, release operations, or cross-service reliability owns the risk. |
| Fullstack / Product Engineer | narrow vertical slice across UI, API, data, tests, and user value. | the slice crosses deep platform, security, SRE, migration, or release ownership. |
| Platform / DevOps | CI/CD, build systems, dependency/runtime setup, environments, deployment mechanics, infrastructure-as-code. | application behavior, product scope, or production incident policy is the main decision. |
| SRE / Ops | availability, latency, performance, monitoring, capacity, incident response, rollback, postmortem, toil reduction. | feature scope, application design, or business priority needs product/engineering approval. |
| QA / Test | test strategy, regression coverage, acceptance evidence, flaky-test classification, artifact checks. | tests require product judgment, security threat modeling, or release approval. |
| Security / Compliance | auth, permissions, secrets, privacy, payments, external sends, production, destructive actions, AI tool risk. | implementation or release can proceed only after security findings are accepted or mitigated. |
| Data / Analytics | metrics, instrumentation, event definitions, data quality, experiment readouts, reporting evidence. | user-facing or backend behavior must change to collect the data. |
| AI / Agent | behavior contract, tool boundary, guardrails, evals, human approval points, observability, incident handling. | the agent can affect files, users, accounts, production, money, legal state, or destructive actions. |
| Git / Integration | branch/worktree ownership, merge path, conflict policy, review state, CI status, PR readiness. | product, code, QA, security, or release evidence is incomplete. |
| Docs / Rule | durable instructions, rules, skills, runbooks, handoff packets, decision records. | the document claims implementation, safety, or release readiness without evidence. |
| Release | release candidate, changelog, deployment/store material, rollout, monitoring, rollback, support handoff. | release evidence, approvals, security, QA, or production readiness is missing. |

## Split Rules

- Keep a task in the current thread when one lane can complete it with direct evidence.
- Split lanes when outputs need different expertise, tools, permission boundaries, or verification.
- Use `rules/git-worktree-standard.md` when two writing lanes could touch the same repo concurrently.
- Use `rules/browser-flow-testing-standard.md` for frontend, UX, visual, local-preview, or interaction evidence.
- Use `rules/security-review-standard.md` for auth, permissions, payments, secrets, user data, production, external-send, destructive actions, or AI/Agent tool behavior.
- Use `rules/durable-evidence-ledger-standard.md` when lane evidence must survive context loss, handoff, or release/milestone closure.
- Escalate to `555` when lane evidence conflicts, a done/release/milestone claim is being accepted, backend/shared-surface risk is high, or AI/Agent safety is material.

## Fullstack Boundary

Fullstack is a delivery pattern, not a permission bypass.

Allow a fullstack lane when:

- the slice is narrow enough for one agent to reason across UI, API, data, and tests;
- security and production side effects are low or separately gated;
- the completion oracle includes both browser/user evidence and backend/test evidence;
- shared files and integration ownership are clear.

Split fullstack work when:

- migrations, auth, payments, user data, production, external sends, CI/CD, infrastructure, or AI tool actions are involved;
- frontend and backend can be independently verified;
- multiple workers would touch shared manifests, routes, schemas, generated files, locks, or release assets;
- the acceptance decision requires independent review.

## Output Shape

```text
Role lane decision:
- task:
- primary lane:
- supporting lanes:
- why split / why not split:
- role responsibility:
- verification owner:
- handoff receiver:
- security gate:
- browser gate:
- ledger gate:
- worktree / integration gate:
- 555 gate:
- done evidence:
```
