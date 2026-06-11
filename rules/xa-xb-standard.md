# XA / XB AI-Assisted Development Standard

This is the local core standard for product development and launch work on this device.

Scope:

- `XA`: non-game product development and launch flow, including App, Web, SaaS, tool products, internal systems, macOS apps, and AI-enabled products.
- `XB`: game development and launch flow, including prototypes, indie games, mobile games, online games, and live-operated games.
- This standard covers development, verification, release, operations, and AI/Agent governance. It does not cover market research, competitor research, advertising, or commercial sizing unless the user explicitly asks.
- Use `rules/durable-evidence-ledger-standard.md` for long-running work, autonomous loops, worker handoffs, milestone/release decisions, QA gates, and temporary artifact tracking.

Source alignment:

- Professional product flow: product brief / PRD, design review, technical design, implementation, code review, test, launch readiness, staged release, monitoring, postmortem.
- Scrum / agile alignment: clear product ownership, cross-functional delivery team, concrete Definition of Done, and evidence-based inspection.
- SDLC / SSDLC alignment: requirements, design, implementation, testing, deployment, operation, with security and privacy shifted left.
- Store and release alignment: Apple / Google style requirements for accurate metadata, privacy declarations, sensitive permission declarations, review notes, staged rollout, rollback, and user-facing correctness.
- Accessibility alignment: WCAG-style testable criteria when user-facing interfaces are changed.
- AI / Agent alignment: handoff metadata, guardrails, tool-permission boundaries, evals/tests, prompt-injection resistance, human approval for irreversible actions, logs, monitoring, and incident handling.

Reference URLs:

- Scrum Guide: https://scrumguides.org/scrum-guide.html
- Atlassian Product Development: https://www.atlassian.com/agile/product-management/product-development
- IBM SDLC: https://www.ibm.com/think/topics/sdlc
- IBM Secure SDLC: https://www.ibm.com/think/topics/secure-software-development-life-cycle
- OWASP SAMM: https://owaspsamm.org/model/
- OWASP LLM Top 10: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- NIST AI RMF: https://airc.nist.gov/AI_RMF_Knowledge_Base/AI_RMF
- Google Secure AI Framework: https://saif.google/
- OpenAI Agents Guardrails: https://openai.github.io/openai-agents-js/guides/guardrails/
- OpenAI Agents Handoffs: https://openai.github.io/openai-agents-js/guides/handoffs/
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play release guidance: https://support.google.com/googleplay/android-developer/answer/9859348/prepare-and-roll-out-a-release
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Unity real-time production cycle: https://learn.unity.com/tutorial/the-real-time-production-cycle
- IGDA game roles: https://careers.igda.org/

## 1. Top-Level Routing Rule

Before starting non-trivial work, route the task:

```text
If the user is building or changing a non-game product: route to XA.
If the user is building or changing a game: route to XB.
If the task is a milestone, release-readiness claim, architecture decision, safety-sensitive AI feature, multi-file backend/shared contract change, or done claim: use 555 review or escalation.
If the task is route selection, skill fusion, packaging, local rule update, artifact/browser verification, or workflow selection: use 666 first.
```

Default route:

- Use `666` as the upstream router.
- Use `XA` or `XB` as the delivery standard.
- Use `555` for adversarial review, milestone confidence, release readiness, backend delegation, and evidence closure.

Do not skip from idea to implementation when the task lacks a verifier.

## 2. Universal Professional Delivery Gates

All serious product/game work must pass these gates:

```text
G0 Intake and Route
G1 Ready for Build
G2 Technical Design Ready
G3 Implementation Ready for Test
G4 Quality Gate
G5 Release Gate
G6 Operate and Feedback Gate
```

### G0 Intake and Route

Required:

- Product type: XA or XB.
- Target platform and runtime.
- First usable outcome.
- Explicit non-goals.
- High-risk areas: auth, payment, privacy, files, external APIs, model calls, automation, production access.
- Completion oracle: test, build, preview, release status, monitor, user-visible artifact, or accepted review.

Forbidden:

- No vague "make it better" implementation without an observable done condition.
- No market research unless explicitly requested.

### G1 Ready for Build

Required:

- PRD-lite or GDD-lite depending on XA/XB.
- Core user/player flow.
- Acceptance criteria.
- Error, empty, permission, loading, and rollback states where relevant.
- Data/telemetry needs.
- AI/Agent behavior boundary if AI is involved.

Definition:

- Developers can implement.
- QA can test.
- Release owner can understand risk.

### G2 Technical Design Ready

Required:

- Architecture / module plan.
- Data model or state model.
- API/contracts.
- Permission and privacy model.
- Observability plan: logs, metrics, traces, crash/error reporting.
- Security controls.
- Build, deploy, rollback approach.
- AI controls if relevant: prompts/system boundaries, tool allowlist, eval plan, guardrails, human approval points.

Forbidden:

- No hidden production side effects.
- No hardcoded secrets.
- No broad tool/shell access for Agent features.

### G3 Implementation Ready for Test

Required:

- Code or artifact exists.
- Core path runs.
- Basic tests or verification steps exist.
- Code review or self-review notes exist.
- Known issues are listed.

Forbidden:

- Do not claim done because code was written.
- Do not hide missing tests or unrun commands.

### G4 Quality Gate

Required:

- Functional test.
- Regression test for touched core paths.
- Security and privacy check for sensitive areas.
- Accessibility check for user-facing UI.
- AI eval/guardrail test for AI or Agent features.
- Performance and stability check where relevant.
- Independent review evidence for milestone, release, AI/Agent safety, backend/shared-surface, or done claims.
- Temporary test harnesses, generated artifacts, and debug outputs are either cleaned up or explicitly kept with a reason.

Output must be one of:

```text
go
conditional go
no-go
```

### G5 Release Gate

Required:

- Release candidate or exact deploy artifact.
- Release notes.
- Store/review/deploy material if applicable.
- Staged rollout or launch plan.
- Monitoring and alerting.
- Rollback or hotfix plan.
- Support/FAQ or user-facing incident channel where needed.
- Durable evidence ledger or equivalent release record with exact artifact, checks, reviewer verdict, risks, temporary artifact disposition, and next gate.

Forbidden:

- No production publish, app-store submission, permission change, payment action, or external send/upload without explicit authorization.

### G6 Operate and Feedback Gate

Required:

- Monitor errors, crashes, latency, core flow, and AI failure modes.
- Triage P0/P1/P2/P3.
- Close incidents with evidence.
- Feed fixes or follow-up work back to G1.
- Record postmortem for severe incidents.

## 3. XA Standard: Product-Side Development and Launch

XA is the standard for non-game product work.

```text
XA-0 Project control
XA-1 Build-ready requirements
XA-2 Technical implementation
XA-3 Quality gate
XA-4 Release and launch
XA-5 Online feedback loop
```

### XA-0 Project Control

Owner: Controller / PM / Tech Lead.

Must decide:

- What product is being built.
- First usable version.
- Target platform.
- What is explicitly out of scope.
- Whether AI is part of the product.
- What proves completion.

### XA-1 Build-Ready Requirements

Owner: Product Spec Agent / PM.

Group:

- PM.
- UX/UI.
- Tech feasibility.
- QA criteria.
- Data instrumentation.
- Security/compliance scout.

Output:

- PRD-lite.
- MVP scope.
- Flow/state map.
- Acceptance criteria.
- Telemetry plan.
- AI behavior spec if AI is involved.

Boundary:

- No implementation before the core path has acceptance criteria.
- No AI feature before behavior, tool boundary, and failure mode are specified.

### XA-2 Technical Implementation

Owner: Tech Lead / Architecture Agent.

Group:

- Frontend/client.
- Backend/service.
- Data pipeline.
- DevOps/SRE.
- Security implementation.
- Code review.

Output:

- Running implementation.
- API/contracts.
- Tests or verification steps.
- Observability.
- Security controls.
- AI guardrails/evals when relevant.

Boundary:

- Do not broaden product scope.
- Do not grant arbitrary shell/browser/file access to product Agents.
- Do not store secrets in code or logs.

### XA-3 Quality Gate

Owner: QA Gate Agent.

Group:

- Functional QA.
- Regression QA.
- Security review.
- Privacy/compliance.
- Accessibility.
- AI eval and red-team if AI is involved.

Output:

- Test report.
- Risk list.
- `go / conditional go / no-go`.

Boundary:

- Implementation Agent cannot self-approve release readiness.
- Safety, privacy, accessibility, and AI failures cannot be renamed as minor UX issues.

### XA-4 Release and Launch

Owner: Release Manager Agent.

Group:

- Release.
- DevOps/SRE.
- Store/deploy owner.
- Smoke QA.
- Compliance submission.
- Rollback owner.

Output:

- Release candidate.
- Launch/deploy record.
- Monitor status.
- Rollback plan.
- Smoke test result.

Boundary:

- No store submission or production release without explicit user authorization when it has external effects.

### XA-5 Online Feedback Loop

Owner: Operations Triage Agent.

Group:

- Data monitor.
- Support.
- Incident.
- Hotfix.
- PM triage.
- Postmortem.

Output:

- Incident log.
- P0/P1/P2/P3 triage.
- Hotfix plan.
- Next iteration backlog.
- Postmortem where needed.

Boundary:

- No direct production data edits without explicit authorization and audit trail.
- Hotfixes must not secretly include new features.

## 4. XB Standard: Game-Side Development and Launch

XB is the standard for game work. It excludes market/platform evaluation unless explicitly requested.

```text
XB-1 Core experience
XB-2 Prototype validation
XB-3 Production pipeline
XB-4 Content production
XB-5 Stability and release gate
XB-6 LiveOps loop
```

### XB-1 Core Experience

Owner: Game Director Agent.

Output:

- Core experience.
- Design pillars.
- GDD-lite skeleton.
- Prototype goal.
- Risk list.

Boundary:

- Do not proceed to production without playable validation target.

### XB-2 Prototype Validation

Owner: Prototype Lead Agent.

Output:

- Playable prototype.
- Playtest notes.
- Keep/change/cut list.
- Production readiness decision.

Boundary:

- Do not use visual polish to hide unproven gameplay.
- Do not treat running code as fun validation.

### XB-3 Production Pipeline

Owner: Production Pipeline Agent.

Output:

- Production plan.
- Art Bible / technical design.
- Asset specs.
- Build pipeline.
- QA plan.
- Milestone gates.

Boundary:

- Do not enter large-scale production without repeatable build, asset, and test pipeline.

### XB-4 Content Production

Owner: Production Lead Agent.

Output:

- Playable milestones.
- Integrated systems/content/assets.
- Bug database.
- Performance report.

Boundary:

- Assets are not complete until integrated into a playable build.
- Do not keep adding systems after Alpha scope freeze without explicit decision.

### XB-5 Stability and Release Gate

Owner: Game Release Gate Agent.

Output:

- Alpha/Beta/RC evidence.
- Certification/compliance material.
- Performance and crash status.
- Release/hotfix/rollback plan.
- `go / conditional go / no-go`.

Boundary:

- Do not release with unresolved blocker bugs unless explicitly accepted with owner and mitigation.

### XB-6 LiveOps Loop

Owner: LiveOps Lead Agent.

Output:

- Activity calendar.
- Patch plan.
- Balance updates.
- Player support issues.
- Postmortems.

Boundary:

- Do not change live economy, payments, ban rules, or compensation policy without approval and rollback plan.

## 5. AI / Agent Development Requirements

Use this section whenever the product, internal tooling, or development workflow includes AI, LLMs, autonomous Agents, tool calling, automation, or generated code.

### AI-1 Behavior Contract

Required:

- Agent purpose.
- Allowed inputs.
- Expected outputs.
- Forbidden outputs/actions.
- Escalation and handoff conditions.
- Human approval requirements.

### AI-2 Tool Boundary

Required:

- Tool allowlist.
- Read/write separation.
- Production/external side-effect controls.
- Destructive action prohibition by default.
- Secrets and privacy handling.

Forbidden:

- No arbitrary shell/file/network access for product Agents.
- No silent external sends/uploads.
- No production changes without user authorization.

### AI-3 Guardrails and Evals

Required:

- Input guardrails for prompt injection, malicious instructions, sensitive data, and out-of-scope requests.
- Output guardrails for unsafe actions, secrets, privacy leaks, hallucinated claims, and policy violations.
- Task evals for success/failure examples.
- Regression evals for known bad cases.

### AI-4 Human-in-the-Loop

Human approval is required for:

- External publication or upload.
- Production deployment.
- App-store submission.
- Sending messages as the user.
- Payment, purchase, refund, billing, permission, user data, or legal actions.
- Deleting, resetting, or mass-modifying data.

### AI-5 Observability and Incident Handling

Required:

- Log model/tool decisions at the right abstraction level.
- Avoid logging secrets or raw private data.
- Track failures, refusals, tool errors, hallucination-prone outputs, and user overrides.
- Define P0/P1 response for harmful AI actions or unsafe automation.

## 6. 666 Alignment

`666` is the routing layer.

It must decide:

- XA or XB.
- Which gate is active.
- Whether AI/Agent requirements apply.
- Whether Browser/artifact review is required.
- Whether a completion oracle exists.
- Whether repeated work should become a skill/automation/subagent/rule.
- Whether `555` is needed.

`666` should not perform heavyweight review itself when the task is a release, milestone, architecture, safety, or cross-module claim. It should route to `555`.

## 7. 555 Alignment

`555` is the closed-loop assurance layer.

Use it when:

- XA/XB reaches a milestone or release gate.
- The work changes backend/shared contracts/storage/schema/runtime behavior.
- AI/Agent behavior has safety, privacy, tool, or external-action risk.
- A claim needs adversarial review or evidence closure.
- A worker thread should implement and reviewers should inspect.

In `555`:

- A0 maps the task to XA/XB and the active gate.
- A1 implements within the gate boundary.
- A2 challenges requirements, risk, safety, and release assumptions.
- A3 adjudicates unresolved critiques.
- A4 verifies real files, tests, logs, artifacts, and source evidence.

## 8. Standard Handoff Format

Use for all XA/XB/AI handoffs:

```text
handoff_to:
flow: XA / XB
gate: G0 / G1 / G2 / G3 / G4 / G5 / G6
reason:
priority: P0 / P1 / P2 / P3
inputs:
decisions:
done:
not_done:
risks:
required_output:
acceptance_gate:
forbidden_actions:
evidence:
next_receiver:
```

## 9. Completion Rule

Never claim the task is complete unless:

- The active gate has named evidence.
- Files/artifacts/tests/builds/previews/logs were checked where relevant.
- Security/privacy/AI/tool boundaries were considered when relevant.
- Required independent review was completed or the lack of independent review is explicitly classified as a risk/blocker.
- Ledger-backed tasks record final status, evidence, temporary artifact disposition, risks, and next gate.
- Release/production/store actions were either not needed or explicitly authorized.
- Remaining risks and next gate are stated.

