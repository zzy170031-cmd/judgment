# Integration Sources and Decisions

Maintainer reference, checked 2026-11-17. These sources are method/provenance
evidence, not automatically executable instructions. No external skill body or
detector implementation is vendored into Judgment.

Reviewed external source revisions:
[Impeccable d41d986](https://github.com/pbakaus/impeccable/tree/d41d9860b0094dcb68030657da63461212835aaa),
[Hallmark 04977e1](https://github.com/Nutlope/hallmark/tree/04977e15f3dfd6ee4b74c887dac3eb52665d6c92),
[Taste Skill f6b7657](https://github.com/Leonxlnx/taste-skill/tree/f6b76575f949707b4e3c37cd86cb44b0b98643e8).
The paths below name the maintained upstream documents; these revisions bind
the integration's actual source snapshot.

| Source | Adopted contribution | Kept outside the shared contract |
|---|---|---|
| [Judgment 02f782b](https://github.com/zzy170031-cmd/judgment/tree/02f782b4ba79ca6cb5244e651bb16757213d4504) | J levels, domain roles, blind review, Red/Blue, evidence, executable plan | Retired general runtime modes |
| [Five-agent governance 597cd1a](https://github.com/zzy170031-cmd/five-agent-governance-skill/tree/597cd1a9e5b915dc21dd57eb451ed446cd40966b) | Named chain, Full/Fast/Closed checkpoints, Core Challenger, conditional Audit Specialist, bounded repair | Old project-specific counts, obligatory simultaneous startup, a second final-approval authority |
| [Impeccable audit](https://github.com/pbakaus/impeccable/blob/main/skill/reference/audit.md) and [critique](https://github.com/pbakaus/impeccable/blob/main/skill/reference/critique.md) | Technical/subjective separation, unanchored visual review, applicable accessibility/responsive/performance checks | Universal design scores, live editing/CLI approval bypass, extra tool-specific permission/questions policy |
| [Hallmark gates](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/gates.md) and [redesign](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/references/redesign.md) | Inspect actual material, define change depth, preserve facts/actions, before/after record, explicit exceptions | House-style bans as universal blockers, mandatory theme selection or build/asset-generation workflow |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md) and [finish gate](https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/scripts/gate.mjs) | Multiple rendered sizes, separate setup/error/open findings, bounded correction and visible waivers | One-screen layouts, required effects, forbidden image captions, fixed retry quotas or automatic Stop hooks |

The integration deliberately uses one problem/criterion/finding record. A
detector hit is evidence to inspect, not a J unit or an independent reviewer.
Named council roles and dynamic domain roles coexist without multiplying
counts or letting a self-review verify itself.

Judgment's existing proprietary/internal license remains in force. Upstream
Impeccable is Apache-2.0; Hallmark and Taste Skill are MIT. These method-level
adaptations and links do not redistribute their software or grant rights to
their fonts/images. The optional browser helper is newly authored here and
uses separately licensed npm dependencies: Playwright Core (Apache-2.0) and
axe-core / its Playwright wrapper (MPL-2.0). Their notices remain in installed
dependencies; no browser, images, themes, models or node_modules are packaged.

The standalone governance source remains historical provenance. Its current
compatibility entry in this repository routes to the shared Judgment protocol.
Other media/production projects discussed during research are outside this
integration's requested audit scope.
