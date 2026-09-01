# Judgment Audit Profile Index

本索引把通用 A01-A20 角度路由到领域专用准则。它不是固定专家名单，也不会增加
`J5/J10/J15/J20` 的质询数量。

## Progressive Loading Rule

1. 每次选择一个主 Profile；只有次要领域会改变证据或裁决时，才增加最多两个
   Secondary Profile。
2. 选择后只读取对应的 Profile 文件，不批量加载其余领域卡。
3. Profile 是“考什么、凭什么判”的适配器，不是一个角色、一次投票或一个
   `Qxx`。没有独占问题和独立证据路径的角色不创建。
4. 通用落地、反例、链路、历史和证据职责仍从 `audit-angle-registry.md` 选择。
5. 正式合规、医疗、法律、财务、发布或安全验收仍保留真实签字人和验证器。

```text
Audit profile card:
- primary profile:
- secondary profiles:
- why each profile changes the decision:
- applicable criteria:
- required evidence:
- excluded domains:
- formal validator or human owner still required:
```

## Profile Routes

| ID | Choose when | Read only this file after selection |
|---|---|---|
| `P01` | code, config, dependency, API, migration, infrastructure change | [profiles/code-change.md](profiles/code-change.md) |
| `P02` | paper, report, public research, factual or policy claim | [profiles/research-claim-paper.md](profiles/research-claim-paper.md) |
| `P03` | AI Agent, skill, prompt, evaluator, tool workflow, multi-agent system | [profiles/ai-agent-skill.md](profiles/ai-agent-skill.md) |
| `P04` | auth, permission, secrets, privacy, payments, external or destructive action | [profiles/security-privacy-authority.md](profiles/security-privacy-authority.md) |
| `P05` | dataset, metric, experiment, statistics, model evaluation, data migration | [profiles/data-metrics-ml.md](profiles/data-metrics-ml.md) |
| `P06` | product decision, business process, organization, cost, adoption | [profiles/product-business-process.md](profiles/product-business-process.md) |
| `P07` | writing, image, video, interface, presentation, brand, accessibility | [profiles/content-design-accessibility.md](profiles/content-design-accessibility.md) |
| `P08` | deployment, release, SRE, monitoring, incident, long-running automation | [profiles/operations-release-incident.md](profiles/operations-release-incident.md) |
| `P09` | regulated legal, financial, medical, contractual, or high-stakes advice | [profiles/regulated-high-stakes.md](profiles/regulated-high-stakes.md) |

## Selection Test

某个 Profile 只有同时满足以下条件才进入本次审计：

- 它改变至少一条适用准则、必需证据、严重度或正式签字边界；
- 它能生成一个与现有单元不同的可证 Claim 或失败路径；
- 它不会仅用新的职业名称重复同一个观点。

如果第三个以上 Profile 仍然“看起来相关”，先检查它是否只是通用角度的重复。
只在它比现有次 Profile 更能改变裁决时进行替换。

## Combination Examples

- 审计会调用外部工具的 Codex skill：`P03` 主 Profile，`P04` 次 Profile；只有
  涉及真实发布才再加 `P08`。
- 审计论文支持的产品决策：`P02` 主 Profile，`P06` 次 Profile；核心结论来自
  数据集时再加 `P05`。
- 审计视觉生产交付：`P07` 主 Profile；只有批量生产或发布风险才加 `P08`。
