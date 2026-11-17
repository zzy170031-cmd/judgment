# Design and Interface Audit

Read for P07 interface/design work. Use the shared Judgment issue tree, evidence
matrix, severities, and authority. Do not start an additional Impeccable,
Hallmark, or Taste audit on top of the same review.

## Freeze the actual brief

Bind the artifact/source revision, audience, primary task, target sizes and
states, brand/design system, copy and functional constraints, and intended
change depth. A critique is read-only; polish preserves the system and layout;
a restyle preserves the layout; a redesign may change layout only within the
user's actual authority. These are change scopes, not new Judgment modes.

Read an existing project design contract before reference themes. Preserve
approved facts, names, prices, dates, quotes, routes, field identifiers, and
test hooks. Record deliberate changes rather than silently dropping them.
Original fiction remains creative work; a rule against invented marketing
evidence is not a ban on user-authorized story invention.

## Keep three kinds of finding distinct

| Kind | Evidence | Disposition |
|---|---|---|
| Reproducible defect | Current interaction/render/code demonstrates a violated applicable criterion | Assign Judgment severity from actual impact |
| Usability/design hypothesis | A task or audience-specific difficulty with an inspectable example | Recommend a bounded alternative and a way to compare it |
| Style preference | A palette, typeface, density, theme, or motion preference | Advisory unless the project made it a requirement |

A familiar font, gradient, card, uppercase label, quiet scene, or dense table is
not inherently a defect. Do not import a source project's house style as a
universal release blocker. A heuristic hit needs context; a user/brand
exception needs a specific reason and applicable evidence, not a hidden waiver.
Do not average design scores into evidence sufficiency or WCAG conformance.

## Independent review and browser evidence

1. Freeze a task-based visual/usability position before exposing that reviewer
   to detector results. Use fresh independent reviewers when permitted by the
   host and the chosen Judgment contract. A deterministic checker is one tool
   origin, not an independent specialist or another J unit.
2. Inspect the real target size and relevant states. Capture what actually ran:
   source-only, rendered Chromium, synthetic touch, physical device, screen
   reader, or an original-size media/artifact inspection. A resized desktop
   viewport does not prove touch, keyboard flow, backend actions, or native UI.
3. Run relevant available checks and independently confirm material findings.
   Missing tools, inaccessible state, timeouts, and omitted samples remain gaps.
   An empty source shell or missing browser is not a clean page.

Use checks that fit the brief:

- Information hierarchy, readable grouping, task clarity, errors/empty/loading
  states, and real feedback from controls.
- Keyboard focus/order and traps; control labels, semantics, alt text and
  screen-reader behavior where applicable. Automated accessibility is a subset.
- Actual text contrast and backgrounds; scalable text, overflow, mobile layout,
  long Chinese text, mixed scripts, numbers/units, and font fallback.
- Reduced-motion alternatives that retain useful state feedback; interruptible
  motion and flicker where relevant. Do not require motion on every page.
- Theming/tokens when the project has that contract; brand and cross-page
  consistency. No automatic dark-mode or token rewrite for a one-off artifact.
- Performance measured on the relevant route/environment when it changes the
  decision. CSS suspicion alone does not prove slow interaction.
- Real links, forms and workflows. Navigation/DOM evidence does not prove a
  successful submission or payment; exercise mutations only when authorized.

## Optional local web observer

`scripts/audit-web.mjs` under the `555` skill uses installed Chrome/Edge,
Playwright Core and axe-core. It observes specified HTTP(S) pages in fresh
browser contexts; it does not download a browser, click, submit, repair, or
reuse the user's login. Non-read HTTP methods and WebSockets are blocked.
Page navigation still executes site code and GET requests; use only an
authorized target. A state affected by blocked requests is incomplete.
Non-loopback subresource GETs can still load: the target/navigation flag is
not an egress firewall. Apply the actual environment's network/data policy.

Prepare the optional dependency set only when installation is authorized:

```text
npm ci --prefix <555-skill-root> --ignore-scripts
node <555-skill-root>/scripts/audit-web.mjs --url http://127.0.0.1:3000 --viewport 390x844 --viewport 1440x900
```

Use `--allow-remote` for an authorized non-loopback target. Use `--browser-path`
for a nonstandard installed browser. Node 22.12+ is needed only for this helper.
Without `--allow-remote`, navigation redirects are blocked before following;
provide the authorized final loopback URL directly. This also avoids relying
on a browser's initial-request-only interception for redirect chains.
The default output is JSON on stdout; `--out <file>` or `--baseline <file>`
persists evidence only in an already authorized task location.

The report records tool/browser identity, viewports, source fingerprints,
accessibility violations and incomplete rules, document overflow, visible
broken images, blocked requests, and DOM preservation fingerprints. It omits
raw HTML, input values, and URL queries from displayed locations. It is not a
full source review, usability test, performance benchmark, or backend test.

| Status | Exit | Meaning |
|---|---:|---|
| `checked` | 0 | Selected observable checks completed without findings |
| `findings` | 1 | Observations require contextual review; not a release verdict |
| `incomplete` / `setup-error` | 2 | Needed execution/evidence is missing |
| `invalid-input` | 3 | Target, options, or baseline is invalid |

## Before, repair, and after

For authorized changes, retain a bound before snapshot and expected preserved
content/actions. `--compare <before.json>` reports removed links, controls,
forms and headings; `--preserve-copy` also compares visible text fingerprints.
Use the same target id, selected scope and viewports. A changed route may use
an explicit stable `--target-id` when both versions are known to be that target.
The helper observes DOM contracts, not handlers or server behavior.
If requested URL fingerprints differ, automatic scope matching stays
unconfirmed and the report requires manual source/state binding. An explicit
stable target id permits comparison, not automatic acceptance of equivalence.

Review before/after at the actual sizes, exercise the authorized user path,
and recheck affected Judgment findings. A repaired contrast issue cannot
silently remove a field, change approved copy or break a destination. For
DOCX, sheets, slides, images and video, use their native render/readback tools;
this HTML observer cannot establish their original-size acceptance.
Confirm the intended application-ready state before accepting selected checks:
load/fonts/paint alone cannot distinguish every loading shell from ready UI.

Apply [repair and recheck](repair-and-recheck.md) for existing repair authority.
Method provenance and unadopted source mechanisms are in
[integration sources](integration-sources.md).
