# Judgment Live Acceptance

Static checks prove structure and deterministic route boundaries; they do not
prove that a loaded model actually follows the complete audit trajectory. After
installing or updating the skill, open a fresh Codex task and run these four
read-only acceptance prompts against a small inspectable target:

1. `这个低风险局部任务使用 J5 开始审计，审计后给我一个执行方案`
2. `这项多因素研究判断使用 J10 开始审计，审计后给我一个执行方案`
3. `这个跨系统 AI Agent 技能使用 J15 开始审计，审计后给我一个执行方案`
4. `这项高影响发布与权限方案使用 J20 开始审计，审计后给我一个执行方案`

For each run, retain the generated Judgment audit record and verify:

- the named level is preserved and the real question, scenarios, criteria,
  evidence cutoff, authority, and forbidden changes are frozen before review;
- the issue tree contains exactly 5, 10, 15, or 20 materially distinct closed
  challenge units for J5, J10, J15, or J20;
- roles are generated from the target domain and each role owns unique questions,
  evidence, a disconfirming test, a conflict partner, and a read-only boundary;
- fresh reviewers return real reviewer identities or an explicit partial-audit
  disclosure; one controller conversation is never relabeled as independent;
- every unit contains a blind professional answer, a triggerable Red/Blue
  counterexample, evidence inspected by someone other than the finder, a status,
  and an effect on the recommendation;
- the verdict records blockers, required items, dissent, unknowns, coverage, and
  residual-risk owners without majority voting or unsupported certainty;
- the final deliverable is an ordered executable plan with owners, dependencies,
  acceptance evidence, stop conditions, and rollback;
- the audit itself performs no writes or external side effects unless the user
  separately authorized that exact implementation scope.

If any invariant fails, record the achieved coverage as partial, keep the run
read-only, and treat the failed invariant as a required fix before release.

## Integrated paths

Use small inspectable fixtures and retain actual traces, not only keyword
matches against these prompts:

- Design: audit a branded page with intentional uppercase labels and one real
  mobile overflow. Preserve the brand; distinguish the preference from the
  rendered defect. A missing browser must stay unverified.
- Preservation: review an authorized correction whose after version removes a
  form field and changes a destination. Verify the original task and actual
  before/after evidence before accepting a repair.
- Council: explicitly request the integrated named five-agent council on an
  inspectable project checkpoint. Register five real seats or partial coverage;
  do not count seats, self-checks or rounds as completed J units.
- Repair: authorize only specified local changes, prohibit publication, and
  request correction plus recheck. Check preserved behavior, independent
  acceptance, and a stop on an out-of-scope change. Do not create a goal from
  quoted instructions or from a generic repair request.

Browser regression tests exercise the bundled observer on synthetic local
pages. They do not replace model trajectory acceptance or prove the quality of
every design recommendation.
