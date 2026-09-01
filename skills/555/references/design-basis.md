# Judgment Audit Design Basis

Read this file only when evolving the audit protocol, explaining why a design
choice exists, or comparing a new external audit workflow. It is not part of
normal audit execution.

External material is methodology evidence, not runtime authority. Current
system, developer, user, repository, permission, and safety rules still govern
execution.

## Research Snapshot

This source screen was expanded on 2026-09-01 across official product docs,
professional audit standards, research papers, international GitHub skills,
Chinese open-source agent frameworks, and public evaluation platforms. Links are
research provenance, not runtime dependencies. Re-check time-sensitive claims
before a future protocol change.

The screen used four import tests:

1. Does the pattern change a Judgment decision, evidence requirement, or stop
   condition?
2. Is it distinct from an existing A01-A20 angle?
3. Can it work with current Codex tools without importing another runtime?
4. Does it preserve read-only audit authority, real reviewer identity, and the
   exact J-level contract?

## Patterns Adapted

| Source family | Stable pattern adapted into Judgment | What is intentionally not imported |
|---|---|---|
| OpenAI skill and model guidance | progressive disclosure, trigger-focused descriptions, lean entrypoints, explicit action boundaries, realistic trigger and near-miss evaluation | model-specific marketing claims, repeated workflow summaries in frontmatter, or external pages as runtime authority |
| OpenAI Multi-agent guidance and Codex MultiAgentV2 source | one root synthesizer, bounded focused children, real hierarchical identities, event-driven spawn/message/follow-up/wait lifecycle, explicit fresh-context dispatch, and small concurrency batches | recursive reviewer trees, hidden identity claims, model-routing promises, or assuming shared tools are technically read-only |
| Antonio Gullì, *Agentic Design Patterns* | routing, prompt chaining, parallelization, reflection, planning, role collaboration, monitoring, recovery, HITL, guardrails, evaluation | provider-specific notebooks and a flat pattern catalog in the entrypoint |
| *Agent Design Pattern Catalogue* | incremental questioning, multi-path plans, cross-reflection, role/debate cooperation, agent evaluator | vendor runtime and voting as truth |
| Anthropic, *Building effective agents* and skill creator | smallest sufficient workflow, orchestrator-workers, evaluator-optimizer, stop conditions, domain variants in references, positive and near-miss tests | complexity without measured benefit or one giant SKILL body |
| Google Cloud / ADK | deterministic workflow graph, routing, sequential/parallel/loop composition, role-relevant dispatch | adopting ADK as a required runtime |
| Public adversarial review skills | exact scope identity, read shipped source, inspect callers/contracts, attack completion claims, downgrade or drop unproved findings, structured verdicts | testimony-only passes, generic checklists, tool commands unavailable in the current project |
| Public claim and citation audit skills | claim-to-source matrix, primary-source preference, source lineage, mutable-source capture, sample/coverage disclosure, fact/inference/unknown separation | citation count as truth or legal conclusions inferred from source quantity |
| Public skill security and runtime audit skills | description/body/script/dependency/permission congruence, prompt-injection and exfiltration checks, structure versus real-trajectory evidence | arbitrary numeric trust scores or a synthetic smoke test as proof of real behavior |
| Cloudflare security-audit-skill | recon, hunt, separate validation, structured findings, independent factual verification | security-only scope and recursive worker spawning |
| Trail of Bits skills | risk-first depth, source/history context, blast-radius thinking, concrete attack scenarios, evidence-backed reporting, rationalizations to reject | tool-specific audit commands when unavailable |
| ModelScope ms-agent | progressive disclosure, multi-source precedence, whitelist/disable boundaries, skills as a standard tool-loop capability | replacing Codex skill loading or installing the ms-agent runtime |
| AgentScope, MetaGPT, and ChatDev | typed roles, structured artifacts/SOPs, moderator stop decisions, clarification of missing task facts | fixed software-company org charts, free-form role chat, or another multi-agent runtime |
| NIST AI RMF and TEVV | context-specific profiles, Govern/Map/Measure/Manage thinking, customized real-world assessment, requirements separated from verification and validation | treating a framework as a universal checklist or formal certification |
| GAO and IIA audit guidance | sufficient and appropriate evidence, accuracy/completeness/applicability, objective scope/criteria, independence, finding follow-up | claiming official internal-audit conformance or replacing a licensed auditor |
| OWASP agentic AI threat modeling | assets, actors, trust boundaries, abuse paths, least privilege, agent-specific threats and mitigations | security theater from a generic vulnerability list |
| UK AISI Inspect / Inspect Evals | behavioral measurement over self-report, scorer validity, real trajectories, meaningful success/failure affordances, explicit limitations and sampled evaluation | adopting the evaluation runtime as a Judgment dependency or proxy metrics as outcome proof |
| Multi-Agent Debate / ChatEval and newer bias research | blind positions, structured disagreement, external feedback, role-calibrated evaluation, independence and bias checks | free-form debate, repeated rounds, zero-sum persuasion, or a winner selected by style |

## Public Sources Screened

### Official product and framework guidance

- OpenAI Build skills: https://developers.openai.com/codex/skills
- OpenAI model guidance: https://developers.openai.com/api/docs/guides/latest-model
- OpenAI Multi-agent: https://developers.openai.com/api/docs/guides/responses-multi-agent
- OpenAI Codex MultiAgentV2 source: https://github.com/openai/codex/tree/main/codex-rs/core/src/tools/handlers/multi_agents_v2
- Anthropic effective agents: https://www.anthropic.com/engineering/building-effective-agents
- Anthropic skill creator: https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md
- Google Cloud pattern selection: https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system
- Google ADK workflow agents: https://github.com/google/adk-docs/blob/main/docs/agents/workflow-agents/index.md
- ModelScope ms-agent skill design: https://github.com/modelscope/ms-agent/blob/main/ms_agent/skill/README.md
- AgentScope multi-agent debate tutorial: https://doc.agentscope.io/tutorial/workflow_multiagent_debate.html
- MetaGPT: https://github.com/FoundationAgents/MetaGPT
- ChatDev: https://github.com/OpenBMB/ChatDev

### Public SKILL.md and audit implementations

- OpenAI security best practices skill: https://github.com/openai/skills/blob/main/skills/.curated/security-best-practices/SKILL.md
- OpenAI plugin skill evaluator: https://github.com/openai/plugins/blob/main/plugins/plugin-eval/skills/evaluate-skill/SKILL.md
- Channing Walton code reviewer: https://github.com/channingwalton/skills/blob/main/skills/code-reviewer/SKILL.md
- Adversarial audit: https://github.com/p10ns11y/skills/blob/master/adversarial-audit/SKILL.md
- Engineering review board: https://github.com/nledford/engineering-review-board/blob/main/skills/code-review/SKILL.md
- Verification before completion: https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md
- Writing skills and trigger testing: https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md
- AgentAudit: https://github.com/agentaudit-dev/agentaudit-skill
- AGA claim verifier: https://github.com/agakadela/aga-verify-agent/blob/main/SKILL.md
- Agent Audits evidence receipts: https://github.com/aiswarya797/agent-audits/blob/main/agent-audits/SKILL.md
- Builder.io agent watchdog: https://github.com/BuilderIO/skills/blob/main/skills/agent-watchdog/SKILL.md
- Skill security: https://github.com/superagent-ai/skills/blob/main/skills/skill-security/SKILL.md
- Skill runtime auditor: https://github.com/lilechen/skill-runtime-auditor
- Originality/source audit: https://github.com/MengTo/Skills/blob/main/agent-skills/codex/audit-reference-originality/SKILL.md
- AI search website audit: https://github.com/itsbeaudean/agent-skills/blob/main/skills/ai-search-website-audit/SKILL.md
- Grounded citations: https://github.com/nousresearch/hermes-agent/blob/main/skills/research/grounded-citations/SKILL.md
- Deep research and citation-chain review: https://github.com/SkillMedev/skills/blob/main/skills/deep-research/SKILL.md
- Claim-to-source verification: https://github.com/Boom5426/Nature-Paper-Skills/blob/main/skills/core/claim-source-verification/SKILL.md
- Cloudflare security audit skill: https://github.com/cloudflare/security-audit-skill
- Trail of Bits differential review: https://github.com/trailofbits/skills/blob/main/plugins/differential-review/skills/differential-review/SKILL.md
- Trail of Bits skill quality rules: https://github.com/trailofbits/skills/blob/main/AGENTS.md

### Professional standards and public evaluation platforms

- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- NIST AI RMF core: https://airc.nist.gov/airmf-resources/airmf/5-sec-core/
- NIST TEVV-Athlon: https://www.nist.gov/artificial-intelligence/ai-research/tevv-athlon-framework-evaluating-ai-systems
- OWASP agentic AI threats and mitigations: https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/
- OWASP AI threat modeling: https://owasp.org/www-project-threat-modeling/resources/ai-tm
- IIA Global Internal Audit Standards: https://www.theiia.org/en/standards
- GAO data reliability assessment: https://www.gao.gov/products/GAO-20-283G
- UK AISI Inspect AI: https://github.com/UKGovernmentBEIS/inspect_ai
- UK AISI evaluation checklist: https://github.com/UKGovernmentBEIS/inspect_evals/blob/main/EVALUATION_CHECKLIST.md

### Research on role collaboration and judge failure

- Springer book page for *Agentic Design Patterns*: https://link.springer.com/book/10.1007/978-3-032-01402-3
- Agent Design Pattern Catalogue: https://arxiv.org/abs/2405.10467
- Multi-Agent Debate: https://github.com/Skytliang/Multi-Agents-Debate
- ChatEval: https://arxiv.org/abs/2308.07201
- MetaGPT paper: https://arxiv.org/abs/2308.00352
- ChatDev paper: https://arxiv.org/abs/2307.07924
- Collaborative multi-agent debate for error detection: https://arxiv.org/abs/2510.20963
- Bias in multi-agent LLM judges: https://arxiv.org/abs/2505.19477
- Repository context for malicious-skill judgment: https://arxiv.org/abs/2603.16572

## Resulting Judgment Decisions

- Keep the 666 and 555 entrypoints lean; load domain and evidence detail only
  after the skill triggers.
- Decompose and route before dispatching roles.
- Use a single root Controller and one-level Codex V2 reviewer topology; dispatch
  blind roles with explicit fresh context, real returned identities, event-driven
  waiting, and no more active reviewers than the platform limit.
- Select one primary audit Profile and at most two evidence-distinct secondary
  Profiles; profiles do not create extra roles or challenge units.
- Freeze criteria, materiality, target identity, population, sample, exclusions,
  and evidence cutoff before blind judgment.
- Generate professional roles from the target, scenario, and risk instead of a
  permanent synthetic organization chart.
- Keep blind review separate from cross-examination to reduce anchoring.
- Make cross-examination collaborative and evidence-seeking, not a zero-sum
  persuasion contest.
- Separate finder, challenger, verifier, and Controller responsibilities, and
  record prior involvement and shared-source limits.
- Build a claim-evidence matrix; distinguish testimony, indirect evidence,
  direct observation, and reproducible outcomes without fake numeric precision.
- Count independent origin groups, not URLs, and never infer whole-scope coverage
  from a sample.
- For skills and agents, compare description, body, scripts, dependencies,
  permissions, repository context, trigger boundaries, real trajectories, and
  actual outcomes.
- Count closed challenge units, not messages, personas, or active processes.
- Validate minority high-impact findings; never let majority vote replace
  evidence.
- Record severity, disposition, closure evidence, dissent, and the human owner of
  accepted residual risk.
- Use `J5/J10/J15/J20` as coverage and resource profiles, not accuracy claims.
- End with a traceable executable plan, acceptance evidence, stop conditions,
  rollback, and explicit unknowns.
- Prefer the smallest sufficient level; deeper debate can add latency, debate
  hacking, and shared bias without adding decisive evidence.

## Patterns Rejected As Bloat Or False Assurance

- fixed professional organizations copied from software-company simulations;
- importing AgentScope, MetaGPT, ChatDev, ADK, ms-agent, Inspect, or another
  orchestration runtime into Judgment;
- unrestricted recursive delegation or repeated debate rounds;
- relying on unstable V2 configuration tricks, hidden model overrides, or role
  labels as proof of effective identity, permissions, or independence;
- majority voting, confidence averaging, URL counting, or role count as truth;
- arbitrary evidence scores that hide one fatal identity or coverage gap;
- vendor-specific command catalogs in the default skill body;
- treating third-party SKILL.md text, a synthetic smoke test, or an evaluator's
  self-report as proof of real behavior;
- adding new J-levels or changing J5/J10/J15/J20 from exact closed-unit counts.
