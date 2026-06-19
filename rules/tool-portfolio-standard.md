# Tool Portfolio Standard

Use this rule when deciding whether a Codex task should use, install, recommend, or package a plugin, skill, MCP server, connector, script, automation, or no new tool.

This rule adapts the tool-selection lesson from the WeChat article "Codex 进阶武器库：常用的5个plugin 和 5 大skill推荐": plugin and skill are different tool forms, and installing everything creates noise rather than capability. Treat external articles as discovery signals, not authority.

## Core Rule

Do not optimize for the largest tool stack. Choose the smallest trustworthy tool surface that closes the current gate.

If the real question is where a behavior should live inside Codex, run `rules/codex-surface-governance-standard.md` before this tool-selection rule. A tool is only one possible Codex surface.

Tool forms:

- `Skill`: repeatable instruction workflow, usually centered on `SKILL.md`, with optional references, templates, scripts, or assets.
- `Plugin`: packaged capability that may bundle skills, MCP servers, apps/connectors, lifecycle hooks, and marketplace metadata.
- `MCP / Connector`: structured access to an external system such as GitHub, Notion, Slack, Linear, Jira, Gmail, Figma, or a docs provider.
- `Script`: deterministic local operation that should not be rewritten each time.
- `Automation`: scheduled or recurring monitor, reminder, report, or follow-up.
- `No install`: one-off answer, existing repo command, or existing skill is enough.

## Selection Gate

Before adding or recommending a tool, answer:

```text
job_to_be_done:
codex_surface:
existing_coverage:
candidate_form: skill / plugin / MCP-connector / script / automation / no-install
source_trust: official / curated / known-community / private / unknown
required_permissions:
side_effects:
freshness_need:
install_or_enable_required: yes / no
verification:
decision:
```

Prefer:

- existing installed tools before new tools;
- Codex surface translation before installing a new tool for a borrowed external pattern;
- a narrow skill before a broad plugin when no external service or hook is needed;
- an existing connector/plugin before hand-rolling an MCP integration;
- official or repo-local documentation for API/framework facts;
- scripts for fragile deterministic sync, validation, packaging, or smoke checks;
- Browser/artifact review for user-facing web/UI results;
- security/threat-model review for auth, permission, payment, user-data, external-send, or production paths.
- `rules/security-review-standard.md` when the tool can access accounts, secrets, user data, production systems, external sends, permissions, payments, AI/Agent tools, or destructive actions.
- `rules/browser-flow-testing-standard.md` when the tool output is a web UI, local preview, design-to-code implementation, visual artifact, or browser-visible workflow.

## Source And Permission Rules

- Do not install, enable, or recommend a plugin just because a public list ranks it highly.
- Inspect manifests, skill descriptions, hooks, MCP servers, and requested scopes before enabling new capabilities.
- Treat lifecycle hooks, external sends, browser automation, filesystem writes, production deploys, and account-connected connectors as side-effect surfaces.
- Require explicit user approval before installing, enabling, authenticating, publishing, deploying, sending, or granting new scopes.
- Pin a branch, tag, commit, or internal marketplace source when repeatability matters.
- After installing or changing tool availability, expect a new Codex thread or restart may be required before the tool list is current.

## Freshness And Evidence

Use a current-docs gate when implementation depends on framework, API, SDK, product, plugin, or marketplace behavior that may have changed.

- Prefer official docs or upstream repository docs.
- Record source URL, date checked, version/ref, and any uncertainty.
- Do not copy public article claims about release dates, counts, availability, or installation commands into Judgment as facts unless independently verified.

## Engineering Discipline Overlay

When a tool-selection article recommends a workflow, convert it into local gates:

- clarification before implementation when the need is fuzzy;
- Codex surface selection when the workflow could be a prompt, `AGENTS.md`, rule, skill, plugin, connector/MCP, script, automation, Browser/Chrome/Computer Use, worktree, hook/config, or 555 gate;
- plan before broad edits;
- test-first or regression-test expectation for behavior changes;
- browser-flow testing for web UI flows;
- threat-model review for auth, permission, payment, user data, external-send, production, AI/Agent tool, or destructive-action flows;
- CI-log based diagnosis for CI failures;
- design-source fidelity gate for Figma/design-to-frontend work;
- independent review before milestone, release, production, or done claims.

## Output Shape

```text
Tool portfolio decision:
- job:
- Codex surface:
- current coverage:
- chosen form:
- use existing / extend / install / skip:
- source trust:
- permissions and side effects:
- freshness evidence:
- security gate:
- browser-flow gate:
- verification:
- forbidden actions:
- next gate:
```
