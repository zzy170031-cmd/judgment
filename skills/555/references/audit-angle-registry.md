# Judgment Audit Angle Registry

Use this registry after the Controller freezes the user's real question,
decision boundary, use scenarios, evidence set, assurance level, and applicable
audit Profile(s). A level counts completed **challenge units**, not agents,
simultaneous slots, chat turns, or repeated wording.

## Challenge Unit Contract

Each `Qxx` unit counts only when it contains:

- one materially unique angle and one concrete question;
- one frozen criterion and materiality reason from the selected audit Profile;
- a primary domain role working from a fresh, read-only packet;
- an opposing role's counter-question or disconfirming case;
- evidence pointers to real files, commands, artifacts, data, or current
  primary sources, or an explicit `missing evidence` marker;
- a verified status and its effect on the recommendation.

Changing role names does not create a new unit. The tested claim, failure mode,
and decisive evidence must differ.

## Four Assurance Levels

| Level | Completed units | Typical use | Suggested independent specialist roles |
|---|---:|---|---:|
| `J5` | 5 | bounded, reversible, narrow question or first-pass audit | 3-4 |
| `J10` | 10 | normal multi-factor decision, design, plan, or deliverable | 4-6 |
| `J15` | 15 | deep architecture, uncertain evidence, cross-system impact | 5-8 |
| `J20` | 20 | critical, high-impact, hard-to-reverse, or explicitly requested | 6-10 |

The Controller is not counted as a specialist. Physical concurrency is never
part of the level. Run fresh roles in batches when active slots are limited. If
the required units or independent roles cannot be completed, report achieved
coverage and do not label the run as the requested level.

## Twenty Lens Families

These cumulative lenses seed different questions; they are not generic
personas. Turn every selected lens into a professional identity appropriate to
the actual domain and scenario.

| ID | Lens family | Required professional question |
|---|---|---|
| `A01` | Landing / real use | Will it work in the user's concrete environment and scenario? |
| `A02` | Counterexample | What realistic case, input, or actor breaks the central claim? |
| `A03` | Route / end-to-end path | Are every dependency, handoff, path, and downstream consumer connected? |
| `A04` | History / baseline | What prior behavior, source history, precedent, or regression changes the judgment? |
| `A05` | Evidence / oracle | What observable evidence could prove or falsify completion? |
| `A06` | Domain correctness | Does it satisfy the field's actual technical or professional rules? |
| `A07` | Security / abuse | How can a hostile, careless, or confused actor misuse or bypass it? |
| `A08` | Data / privacy / authority | Are lineage, permissions, confidentiality, and decision authority sound? |
| `A09` | Test / evaluation quality | Do the tests or measures exercise the claim without grading leakage? |
| `A10` | Integration / blast radius | What compatibility, consumer, migration, or shared-surface impact is missing? |
| `A11` | Architecture / invariants | Which contracts, state rules, or structural assumptions must remain true? |
| `A12` | Reliability / recovery | What happens on partial failure, retry, cancellation, duplicate action, or resume? |
| `A13` | Performance / resources | Are latency, cost, capacity, tool, and human-effort budgets realistic? |
| `A14` | Concurrency / ordering | Can races, stale state, reordering, or simultaneous actors invalidate the result? |
| `A15` | Operations / observability | Can operators detect, explain, contain, and repair failure in practice? |
| `A16` | User / accessibility | Is the outcome understandable, usable, inclusive, and safe for affected people? |
| `A17` | Source / supply chain / compliance | Are dependencies, citations, licenses, policies, and external claims trustworthy and current? |
| `A18` | Alternative hypothesis / path | What genuinely different explanation or solution could outperform the favored path? |
| `A19` | Correlated failure / judge bias | Are roles repeating assumptions, rewarding eloquence, or suppressing a correct minority? |
| `A20` | Release / rollback / accountability | Who owns the decision, acceptance, monitoring, rollback, and residual risk? |

## Dynamic Role Generation

Derive roles from the target instead of copying a fixed roster. Freeze this
card before dispatch:

```text
Role card:
- role_id:
- professional_role:
- primary / secondary audit profile:
- why this role is needed:
- owned challenge_units:
- applicable criteria / materiality:
- concrete scenario or user path:
- evidence required:
- disconfirming test:
- prior involvement / shared-source / independence limits:
- read scope:
- forbidden actions: write, delegate, approve own finding
- conflict partner:
```

Adaptation examples:

- Paper: replication methodologist, data-provenance analyst, competing-literature
  researcher, deployment practitioner, citation verifier.
- Code: runtime integrator, exploit hunter, call-path analyst, regression
  historian, test-oracle verifier.
- Business process: operator, affected-user advocate, dependency mapper,
  pre-mortem challenger, metric auditor.

Do not reuse these examples when a more precise professional identity exists.

## Selection And Substitution

- Start with the cumulative lens family for the chosen level, then specialize
  each selected lens through the primary audit Profile.
- Replace an inapplicable lens only with a more relevant domain lens. Record the
  original, replacement, and why it tests a materially different risk.
- A secondary Profile may change a criterion or evidence path, but it does not
  create another unit unless the tested claim and decisive evidence are unique.
- Never count `N/A`, an unanswered question, duplicate wording, summary-only
  output, or the Controller's own opinion.
- Preserve landing, counterexample, route, history, and evidence coverage at
  every level.
- Prefer the smallest level that covers the decision. More units increase
  coverage and cost; they do not guarantee a more correct verdict.
