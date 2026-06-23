# 555 Micro Review

Use this template when a full five-seat loop would be too heavy, but the task still needs adversarial pressure and evidence verification.

```text
555 micro review:
- scope:
- active gate:
- decision at risk:

A2 Core Challenger:
1. risk:
   severity:
   evidence:
   required check:
2. risk:
   severity:
   evidence:
   required check:
3. risk:
   severity:
   evidence:
   required check:

A4 Audit Specialist:
- files/sources inspected:
- commands/tests/artifacts inspected:
- claims downgraded:
- must-fix:
- acceptable residual risk:

A0 close:
- decision: go / conditional go / no-go / user decision
- next action:
- stop condition:
```

## When To Use

- skill evolution, rule edits, route changes, or source adoption;
- small milestone or done claims;
- one-lane project changes with non-trivial evidence risk;
- claims that should not rely on implementer self-attestation.

## Escalate To Full 555 When

- release, production, user data, security, payments, external send, or destructive actions are involved;
- multiple lanes disagree;
- backend/shared contracts or AI/Agent tool behavior are material;
- the micro review finds unresolved blocker-severity risk.
