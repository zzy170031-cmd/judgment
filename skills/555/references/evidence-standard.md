# Judgment Evidence Standard

当审计依赖外部来源、抽样、动态数据、运行行为，或要做正式 `pass / hold /
release` 判断时读取本文件。目标不是制造更复杂的表格，而是让每个关键主张都能
回答：审的是什么、凭什么、覆盖到哪里、还缺什么。

## 1. 先冻结判卷标准

角色盲审前记录：

```text
Evidence contract:
- audit objective and decision:
- applicable criteria and source of criteria:
- materiality threshold:
- target identity / version / snapshot / evidence cutoff:
- population:
- sample method and sample size:
- inclusions / exclusions / untouched areas:
- evidence access limits:
- formal validator or human owner:
```

没有预先冻结的准则，角色容易按个人偏好改题；没有对象身份，旧日志、旧截图或
其他候选的测试就可能错误地替当前对象作证。

## 2. Claim-Evidence Matrix

对影响裁决的主张建立矩阵：

| claim_id | Q id | claim | criterion | bound evidence | origin group | directness | freshness | coverage | status | gap |
|---|---|---|---|---|---|---|---|---|---|---|

`bound evidence` 必须能回到当前对象、版本、时间窗或冻结快照。作者、实现者、
Worker、网页摘要和旧审计报告首先都是主张，不能仅凭身份升级成证据。

### 主张状态

- `supported`：当前绑定证据直接支持整个关键主张；
- `partially-supported`：只支持一部分，且未支持部分仍可能改变结论；
- `unsupported`：按正常情况应有证据，但当前没有或证据与对象不绑定；
- `contradicted`：当前绑定证据与主张冲突；
- `cannot-verify`：需要的环境、权限、原件或正式验证者不可取得，并明确说明缺口。

映射到质询单元时：`supported -> confirmed`，`contradicted -> refuted`，
`partially-supported -> conditional`，而 `unsupported` 或 `cannot-verify` 通常为
`unknown`；若缺口本身违反必需准则，则为 blocker，而不是柔化成未知。

## 3. 证据层级不是分数

使用有序层级描述“证据能证明到哪里”，不要把它们平均成虚假的精确分数：

- `E0 testimony`：口头说明、总结、完成声明或角色观点；只能生成待核验 Claim。
- `E1 indirect`：相关文档、静态结构、二手来源、日志摘要或代理指标；可缩小范围，
  不能单独证明真实结果。
- `E2 direct observation`：核验者亲自看到的当前文件、原始记录、原始数据、目标
  页面/资产或绑定候选的检查结果。
- `E3 reproducible outcome`：对绑定对象执行可复现验证，并取得符合验收准则的
  实际结果、命令输出、退出状态或正式记录。

证据结论受最弱的关键维度限制，而不是由证据数量平均：

- `identity`：是否属于当前对象、候选、版本和时间窗；
- `provenance`：原始来源、获取路径和是否可追溯；
- `independence`：来源是否共享作者、数据、模型、摘要或共同上游；
- `directness`：是否直接测到 Claim，而不是代理或自报；
- `freshness`：在判断时是否仍有效；
- `completeness`：是否覆盖 Claim 的全部关键部分；
- `applicability`：是否适用于当前人群、环境、版本和使用场景。

例如，lint 只证明 lint；单张截图只证明该时刻可见状态；单元测试只证明命中的
用例；一个成功样本不证明所有用户、权限、环境或回归均通过。

## 4. 来源血缘与可变证据

- 优先原始论文、官方文档、标准、代码、原始数据和第一方记录；二手内容用于导航
  或补充语境。
- 多个网页若引用同一论文、新闻稿、数据集或作者说明，记为一个 `origin group`，
  不能按 URL 数量制造“多源共识”。
- 记录发布日期与事件发生日期；说明引用的是当前版本、历史版本还是未知版本。
- 会变化的网页、数据库、日志和指标，尽量冻结只读副本、时间戳、记录数和摘要或
  哈希；不能冻结时明确标记 `mutable` 及查询截止时间。
- 来源存在、标题相符或引用格式正确，不代表它支持当前 Claim；必须检查原文语境、
  方法、限制和反例。

## 5. 总体、抽样与覆盖

审计必须说明以下之一：

- `full`：已核对定义总体内的全部对象；
- `risk-based sample`：优先高风险、边界和已知失败对象；
- `stratified sample`：按关键子群分层；
- `random sample`：按可复现方法随机；
- `convenience sample`：只能得到有限样本，结论不得外推为全量；
- `unknown population`：总体本身无法确定，必须限制结论。

记录已审、未审、排除和无法访问的范围。任何“全站、全仓、全部素材、无回归、
完全合规”等全量表述，都需要与之匹配的总体和证据；否则降级为样本结论。

## 6. Materiality And Severity

先判断发现是否会改变用户决策，再判断修复优先级。考虑：影响、发生可能性、
影响范围、可探测性、可恢复性、可逆性和是否触碰硬性准则。

- `blocker`：违反硬性准则，或存在可实现的重大后果；关闭前不能通过。
- `required`：会实质改变正确性、可靠性或用户结果；进入执行方案并要求关闭证据。
- `advisory`：有可验证收益，但不阻塞当前目标。
- `observation`：事实或边界记录，不应伪装成整改项。

不要用多数低风险意见平均掉一个可证的 blocker；也不要因角色措辞强烈就把没有
触发条件和证据的担忧升级为 blocker。

## 7. Finding Lifecycle

每个实质发现记录：

```text
Finding:
- finding_id / Q id / claim_id:
- criterion and violated condition:
- bound evidence and origin group:
- severity and rationale:
- owner:
- disposition: open | fixed | accepted-risk | false-positive | blocked
- closure evidence:
- residual risk and human risk owner:
```

候选、证据对象或准则变化后，旧 closure evidence 失效。发现者不能验证自己提出的
发现；风险接受必须由有权限的人承担，不能由 Judgment 或多数角色代签。

保留一份简短 dissent register：记录最强少数意见、证据、最终采纳/拒绝原因。
它用于防止汇总时抹掉高影响异议，不是再开一轮辩论。

## 8. AI / Skill 行为证据附加门

对 Agent、skill、提示词、自动化或评测，至少分开验证：

1. `structure`：文件、frontmatter、引用、脚本和依赖存在且格式正确；
2. `routing`：典型触发词能触发，邻近但不应触发的 `near-miss` 不误触发；
3. `congruence`：描述、正文、脚本、权限、依赖和仓库语境没有隐藏行为冲突；
4. `trajectory`：真实执行轨迹使用了预期工具、边界和停止条件；
5. `outcome`：真实任务结果满足用户验收，而非只得到“成功”文本。

静态检查和合成烟测可以验证 structure/routing 的一部分，但不能证明真实 trajectory
或 outcome。评分器必须测真实目标，并允许模型在有意义的路径上成功或失败；只测
关键词、长度或自述行为的评分器要标为代理指标。

## 9. Evidence Sufficiency And Stop

可以给出通过结论的最低条件：

- 冻结的关键准则都有足够且适当的证据；
- 证据绑定当前对象并覆盖声称的范围；
- 没有未关闭 blocker；required 项有明确处置和关闭证据；
- 关键未知不会被隐藏在建议项里；
- 正式验证器和最终人类决策边界仍被保留。

如果做不到，输出 `conditional / blocked / partial / unknown` 以及最小缺证动作。
`J5/J10/J15/J20` 的闭合数量只能证明所选问题被完整处理，不能把不足的证据变充分。

## Rationalizations To Reject

- “链接很多，所以来源独立。”先看共同源头。
- “抽样没问题，所以全量没问题。”结论只能到抽样覆盖边界。
- “脚本返回 0，所以真实行为正确。”先确认脚本测了什么、绑定哪个对象。
- “角色很专业，所以它的说明是证据。”专业意见仍需可核验依据。
- “无法取得证据，就写低风险通过。”关键缺证应阻塞、降级或交给正式决策人。
