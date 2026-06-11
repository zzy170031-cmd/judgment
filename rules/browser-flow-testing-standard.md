# Browser Flow Testing Standard

Use this rule when Judgment work changes or verifies a web UI, local app preview, HTML artifact, interactive flow, visual state, Figma/design-to-code result, form, auth flow, checkout/payment flow, dashboard, or browser-visible behavior.

This is a lightweight browser-flow gate. Prefer the existing Browser plugin or an installed webapp-testing skill when available. Do not add a new browser-testing framework unless the task needs repeatable automated coverage.

## Trigger

Require browser-flow evidence when any of these are true:

- user-facing web UI or local HTML/app output changed;
- layout, visual hierarchy, responsive behavior, accessibility, or interaction changed;
- auth, onboarding, checkout, upload, export, search, filter, form, modal, navigation, or settings flows changed;
- a screenshot, Figma design, or generated artifact must match visible output;
- the user asks whether a page, preview, or artifact looks right or works end to end.

Do not require this gate for pure backend, docs-only, or non-visual changes unless they feed a browser-visible flow.

## Minimum Evidence

```text
browser_target:
viewport_or_device:
flow_tested:
steps:
expected_result:
actual_result:
evidence: screenshot / DOM snapshot / console logs / network-free smoke / manual observation
issues:
decision: pass / conditional / block / not-applicable
```

Recommended flow:

1. Start or identify the local/remote target.
2. Open it in Browser.
3. Verify the primary user path with visible evidence.
4. Check the relevant responsive viewport when layout risk exists.
5. Inspect console/log evidence only when needed.
6. Record screenshots or DOM/visible-state evidence for the gate.

## Closure Rules

- Do not claim a UI change works from code inspection alone when a browser target is available.
- Do not accept a blank, broken, overlapped, off-screen, inaccessible, or visually stale artifact as pass.
- If the app cannot run or Browser cannot access it, classify the gate as `conditional` or `block` and state the missing command, target, or permission.
- For design-to-code work, verify against the source design or screenshot when available.
- For auth/payment/external-send/browser automation flows, combine this gate with `rules/security-review-standard.md`.
