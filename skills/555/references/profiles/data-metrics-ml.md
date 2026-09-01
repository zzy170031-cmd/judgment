# P05 Data / Metrics / ML Evaluation

Use for datasets, metrics, reports, experiments, statistical conclusions, model
evaluations, or data migrations.

## Criteria And Required Evidence

- Freeze target population, sample method, sample size, time window,
  inclusions/exclusions, and uncovered subgroups.
- Check accuracy, completeness, consistency, applicability, lineage,
  deduplication, and reproducibility.
- Test missingness, outliers, label leakage, train/eval contamination, drift,
  selection bias, and fragile random-seed or time-window effects.
- Confirm the metric measures the real outcome rather than a convenient proxy;
  each sample must have meaningful success and failure affordances.
- Inspect relevant subgroup and tail failures instead of allowing an average to
  hide high-impact cases.

## Role Seeds

Data owner, statistician/methodologist, evaluation engineer, business
interpreter, affected-subgroup representative.

## Boundary

Sample results only support the declared population and coverage. Keep formal
model validation, data governance, and production acceptance separate.
