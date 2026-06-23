# Source Pattern Card

Use this template when Judgment imports, rejects, or adapts an external pattern from an article, official doc, company practice, prompt, agent workflow, tool, benchmark, or open-source project.

```text
Source pattern card:
- source name:
- source URL or local evidence:
- source type: official / primary / user-provided / secondary / repost / unknown
- checked date:
- freshness risk: low / medium / high
- import mode: one-shot / ongoing-explicit-only
- problem it solves:
- source assumption:
- Codex equivalent surface:
- existing Judgment surface:
- gap in Judgment:
- what to import:
- what not to import:
- safety or permission boundary:
- claim calibration:
  - label:
  - confidence:
  - evidence:
  - missing evidence:
- proposed asset: none / AGENTS / rule / template / script / skill edit / plugin / connector / automation / 555
- verification:
- rollback:
- closure: imported / adapted / rejected / defer-now
- decision: import / adapt / reject / defer-now
```

## Rules

- Prefer official or primary sources for current facts.
- Treat reposts, screenshots, and social snippets as user-provided or secondary unless independently verified.
- Import stable problem-solving patterns, not vendor-specific runtime assumptions.
- Default to one-shot import. Do not leave future-fill placeholders unless the user explicitly opens a maintained knowledge-base or recurring-refresh gate.
- Treat `defer-now` as closed for the current pass; it is not permission to keep filling later.
- Do not import hidden chain-of-thought capture, unattended destructive automation, bypass-sandbox behavior, or authority that belongs to the user.
- If the source is only a framework or prompt, keep it as `FRAME` unless evidence proves it as a real-world fact.
