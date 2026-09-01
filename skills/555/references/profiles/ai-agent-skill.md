# P03 AI / Agent / Skill

Use for AI Agents, Codex/Claude skills, prompts, evaluators, tool workflows,
multi-agent systems, or model-authored results.

## Criteria And Required Evidence

- Compare name/description, body, scripts, dependencies, permissions, tools,
  installation method, and surrounding repository context for congruence.
- Test representative `should-trigger`, boundary, and `near-miss
  should-not-trigger` prompts.
- Separate structure, synthetic smoke checks, real trajectory, and actual
  outcome; none may impersonate a stronger evidence class.
- Check whether the scorer measures task completion rather than wording,
  verbosity, keywords, self-report, or evaluator leakage.
- Threat-model prompt injection, data exfiltration, persistence, authority
  expansion, tool abuse, supply chain, no-progress, and recovery.
- Declare shared model, source, context, judge, or prior-involvement correlation
  across roles. Stop debate that adds persuasion but no evidence.

## Role Seeds

Skill designer, behavioral evaluator, tool/permission security reviewer,
trajectory verifier, target user.

## Boundary

Static conformance and synthetic tests do not prove real tool behavior or user
outcome; retain the product's formal evaluator and approval boundary.
