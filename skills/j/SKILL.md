---
name: "j"
description: One-letter alias for professional Judgment audits. Use when the user writes $j, J:, j:, or "任务使用 J5/J10/J15/J20 开始审计，审计后给我一个执行方案". Preserve the selected level and route to the sibling judgment skill; do not authorize implementation.
---

# J

Keep this skill as an alias only. Read `../judgment/SKILL.md` and follow it as
the source of truth.

```text
$j <question>                 -> $judgment <question>
J: <question>                 -> $judgment <question>
$j 5|10|15|20 <question>      -> matching Judgment level
$j J5|J10|J15|J20 <question>  -> matching Judgment level
<task> 使用 J5|J10|J15|J20 开始审计，审计后给我一个执行方案
```

The selected level is exact. The requested deliverable is a professional
verdict and executable plan; it is not implementation authorization.

Do not copy Judgment rules into this alias, invent a level, weaken evidence or
approval gates, route unrelated workflow modes, or create separate state.
If the sibling skill is unavailable, report the blocker instead of improvising
a fallback.
