# P08 Operations / Release / Incident

Use for deployment, release, SRE, monitoring, production incidents, batch jobs,
or long-running automation.

## Criteria And Required Evidence

- Bind environment, version, configuration, dependencies, permissions, data,
  and candidate to the object being accepted.
- Verify preflight, rollout or canary, capacity, SLO/alerts, observability,
  on-call ownership, and rollback as executable paths.
- Test whether rollback itself causes data incompatibility, duplicate side
  effects, or longer interruption.
- Distinguish cause, correlation, impact, and still-changing state in logs and
  timelines; freeze dynamic evidence where possible.
- Exercise normal, degraded, retry, timeout, recovery, cancellation, and human
  takeover paths.
- Name post-release observation window, success threshold, stop condition,
  incident record, and follow-up owner.

## Role Seeds

Release owner, SRE/operator, dependency owner, incident commander, support team.

## Boundary

Judgment cannot replace the real deployment gate, production telemetry, on-call
acceptance, or the user's release authority.
