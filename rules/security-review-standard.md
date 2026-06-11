# Security Review Standard

Use this rule when Judgment work touches auth, permissions, payments, user data, secrets, external sends, production systems, legal/compliance surfaces, AI/Agent tool use, or destructive actions.

This is a lightweight threat-model gate. It can be satisfied by a focused local review, a dedicated security skill if installed, or `555` when the risk is high. Do not require a new external security tool for every task.

## Trigger

Require this gate when any of these are true:

- authentication, authorization, roles, permissions, or session handling changes;
- payments, billing, refunds, credits, entitlements, or account state changes;
- user data, private data, files, secrets, tokens, keys, cookies, or logs are read, written, stored, transmitted, or displayed;
- external publication, upload, email, chat, webhook, API call, or message send is possible;
- production, deploy, app-store, database, migration, or support tooling is involved;
- AI/Agent behavior can call tools, modify files, browse, send data, or act on behalf of a user;
- delete, reset, clean, mass-edit, permission grant, or irreversible operation is possible.

## Threat Model Checklist

```text
security_scope:
assets:
trust_boundaries:
entry_points:
actors:
abuse_cases:
data_flow:
secrets_or_private_data:
permissions:
external_side_effects:
guardrails:
tests_or_evidence:
residual_risks:
decision: pass / conditional / block / user-decision
```

Minimum review questions:

- What assets or user rights can be harmed?
- Where does untrusted input enter?
- Which trust boundaries are crossed?
- What can an attacker, confused user, prompt injection, or compromised integration do?
- What data leaves the local system or product boundary?
- What requires human approval before action?
- What logs or evidence prove the risk was checked without leaking secrets?

## Closure Rules

- Never reclassify missing auth, payment, permission, user-data, external-send, production, or destructive-action controls as ordinary polish.
- Missing approval for external or irreversible action is `user-decision`, not `pass`.
- Missing evidence for a serious risk is `conditional` or `block`.
- Use independent review or `555` for release, milestone, backend/shared-surface, production, or AI/Agent safety decisions.
- Do not paste secrets, raw private data, tokens, cookies, private prompts, or sensitive logs into reports.
