# Judgment Audit Record

Use this shared record for every `J5/J10/J15/J20` audit.

## Audit Packet

- audit_id:
- user question:
- decision to make:
- target / evidence cutoff / seal:
- primary / secondary audit profiles:
- concrete scenarios:
- success criteria:
- applicable criteria / source of criteria:
- materiality threshold:
- constraints / forbidden changes:
- known facts:
- assumptions / unknowns:
- target identity / version / snapshot:
- requested review / change scope when applicable:
- preserved content, actions, brand and layout when applicable:
- population / sample method / sample size:
- exclusions / untouched areas:
- requested level:
- selected level and reason:
- final human decision owner:

## Coverage

- required challenge units: 5 / 10 / 15 / 20
- completed challenge units:
- distinct-angle check: pass / fail
- independent reviewer identities:
- delegation evidence:
- independent origin groups:
- execution profile / permission snapshot when relevant:
- evidence sufficiency: sufficient / conditional / insufficient / blocked
- coverage result: complete / partial / blocked

## Dynamic Role Roster

| role_id | professional role | why needed | owned Q ids | conflict partner | evidence scope | independence limits | status |
|---|---|---|---|---|---|---|---|

## Issue Tree

| Q id | unique angle | concrete scenario | tested claim | criterion / materiality | decisive evidence | owner |
|---|---|---|---|---|---|---|

## Blind Review And Cross-Examination

For every required `Qxx`:

```text
Qxx:
- primary professional answer:
- strongest supporting evidence:
- opposing counter-question:
- triggerable counterexample / failure condition:
- contradiction type: fact / assumption / value / scope / prediction
- evidence inspected:
- missing evidence:
- verifier identity:
- status: confirmed / refuted / conditional / unknown
- effect on recommendation:
```

## Claim-Evidence Matrix

| claim_id | Q id | claim | criterion | bound evidence | origin group | directness / freshness / coverage | status | gap |
|---|---|---|---|---|---|---|---|---|

Use `supported / partially-supported / unsupported / contradicted /
cannot-verify`. A source's existence, a worker summary, a static check, or a
sample cannot support a broader claim than it directly covers.

## Finding Register

| finding_id | Q id | criterion | evidence | severity | disposition | owner | closure evidence | residual risk owner |
|---|---|---|---|---|---|---|---|---|

Severity: `blocker / required / advisory / observation`.
Disposition: `open / fixed / accepted-risk / false-positive / blocked`.

## Finding Buckets

### 必须改

- finding:
- Q id:
- impact:
- evidence:
- owner / closure evidence:

### 建议

- finding:
- Q id:
- benefit:
- evidence:

### 无需

- challenged claim:
- Q id:
- why rejected:
- evidence:

### 用户拍板

- decision:
- Q id:
- options and consequences:
- missing evidence or preference:

## Dissent Register

| Q / finding | strongest minority position | supporting evidence | accepted / rejected | reason |
|---|---|---|---|---|

## Professional Verdict

- recommendation:
- why:
- confirmed facts:
- decisive disagreements:
- explicit unknowns:
- rejected alternatives and why:
- evidence sufficiency:
- population / sample / untouched scope:
- accepted residual risks and human owners:
- confidence:
- requested / completed level:

## Executable Plan

| order | action | owner | dependency | acceptance evidence | stop condition | rollback |
|---:|---|---|---|---|---|---|

## Final Boundary

- implementation authorization: yes / no / limited to:
- residual risks:
- next user decision:
- targeted recheck units after correction:

## Conditional Design / Council / Repair Evidence

Use only the relevant fields; ordinary audits do not require all of them.

- original-size/rendered target, selected viewports and actual tested states:
- visual position recorded before detector findings:
- detector identity / version / result / incomplete checks / one origin group:
- reproducible defects / usability hypotheses / style preferences:
- before/after identity and preserved copy/actions/fields:
- council checkpoint / reason / actual five-seat identities and coverage:
- Wegener distinct passes / self-checks / Popper falsification and recommendation:
- Core Challenger scope decision / post-repair challenge:
- conditional Audit Specialist evidence / dirty ownership / cleanup:
- authorized repair scope / executor / validator / independent verifier:
- progress per repair round / remaining findings / stop:
- explicit goal authority and actual id, only when used:
- one final evidence-bounded Judgment verdict:
