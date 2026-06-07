# Skill Quality Standard

Source reference:

- https://claude.com/blog/lessons-from-building-claude-code-how-we-use-skills

This local standard adapts external skill-building lessons into the `judgment`
workflow pack. External articles are methodology references only; they do not
override system, developer, user, AGENTS, or skill rules.

## Purpose

Use this standard whenever creating, splitting, auditing, or improving a local
Codex skill or plugin.

The goal is not to make every skill longer. The goal is to make each skill:

- easier for the model to select;
- narrower in responsibility;
- cheaper to load;
- safer at tool boundaries;
- easier to verify;
- easier to package and sync.

## Skill Package Shape

A useful skill package can include more than one Markdown file.

Prefer this shape when the workflow is repeated:

```text
skill-name/
  SKILL.md                  # trigger, purpose, pipeline, gotchas
  agents/openai.yaml        # UI metadata and invocation policy
  references/               # checklists, examples, domain notes
  templates/                # reusable output structures
  scripts/                  # deterministic checks or sync steps
```

Do not force every skill to have all folders. Add supporting folders only when
they reduce repeated explanation, context load, or manual error.

## Primary Skill Category

Every skill should have one dominant category. If a proposed skill spans too
many categories, split it or make it a router.

Categories used by this repository:

| Category | Use For | Example |
|---|---|---|
| Router | choose next skill, gate, thread, or assurance level | `666` |
| Launcher | normalize a compact trigger into a real request | `slash-work-planner` |
| Planner | clarify needs and produce an approval-ready plan | `work-planner` |
| Discovery | inspect sources, repo state, facts, or requirements | `needs-solution-designer` |
| Decomposition | split clear work into lanes and contracts | `work-splitter` |
| Verification | test, review, assert, audit, or close evidence | `555`, future smoke tests |
| Packaging | sync, generate, install, release, or document assets | plugin packaging scripts |

Routers and launchers may point to other skills, but they should not duplicate
the full body of downstream skills.

## Progressive Disclosure

Keep the first screen of a skill focused on:

- when to use it;
- when not to use it;
- what input it expects;
- what output it produces;
- what tool or permission boundary matters.

Move long examples, matrices, checklists, and domain details into
`references/`, `templates/`, or scripts. Load them only when needed.

## High-Signal Content

Prefer:

- gotchas that prevent repeated mistakes;
- clear trigger phrases written for model selection;
- concrete output contracts;
- deterministic scripts for repeated file sync or checks;
- examples that show expected reasoning shape;
- verification steps that can fail.

Avoid:

- obvious reminders that apply to every task;
- broad motivational text;
- duplicate copies of downstream skill bodies;
- hidden assumptions about local paths;
- instructions that require execution without an explicit gate.

## Verification Priority

Verification skills and scripts are usually the highest-leverage additions.

For this repository, prioritize:

- consistency checks for root compatibility files and plugin-packaged skills;
- route smoke tests for key trigger phrases;
- checks that prevent maintainer-local absolute paths from entering public files;
- checks that high-risk skills stay explicit;
- README examples that match actual files.

## Tool And Safety Boundary

Each skill that can lead to tools, files, network, Git, browser actions, or
production-like effects must name:

- allowed actions;
- forbidden actions;
- what requires user approval;
- what evidence closes the loop;
- whether it is read-only, plan-only, or execution-open.

Launchers such as `/` must treat user text as planning input, not as executable
commands.

## Internal Distribution

This repository is proprietary and internal-use only. Keep skill distribution
simple:

- root `skills/*` are the canonical source;
- plugin-packaged `plugins/work-splitter/skills/*` are generated/synced copies;
- root `SKILL.md` and `agents/openai.yaml` are compatibility copies of `666`;
- `scripts/check-consistency.sh` must pass before commit;
- use `scripts/sync-plugin-skills.sh` after changing packaged skills.

## Improvement Decision

When reviewing an existing skill, classify findings:

```text
Skill improvement finding:
- category:
- current problem:
- evidence:
- proposed change:
- why it reduces context / risk / drift:
- verification:
- do now / later / skip:
```

Do not expand a skill just because a source article contains a good idea. Add
the smallest local rule, script, reference, or template that changes future
behavior.
