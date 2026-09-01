# P04 Security / Privacy / Authority

Use for authentication, authorization, secrets, user data, payments, external
messages, production access, destructive actions, or privileged tools.

## Criteria And Required Evidence

- Map assets, actors, trust boundaries, entrypoints, permissions, sensitive data
  flows, and the worst achievable consequence.
- Separate authentication from authorization; test default-deny, least
  privilege, separation of duties, and approval ownership.
- Test abuse, bypass, replay, injection, leakage, denial, confused-deputy, and
  supply-chain paths in addition to the happy path.
- Verify logs, alerts, audit records, secret rotation, incident response, and
  recovery against inspectable evidence.
- Check that the proposed audit or automation cannot cross user, policy,
  organizational, or formal-security authority.

## Role Seeds

Threat modeler, authorization reviewer, privacy owner, adversarial actor,
incident responder.

## Boundary

Fail closed on missing material authorization or data-protection evidence. A
Judgment verdict does not grant production access or replace security approval.
