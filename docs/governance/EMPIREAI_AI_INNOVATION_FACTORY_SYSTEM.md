# EmpireAI AI Innovation Factory System

PILLOW-AIFRT-001 / Q12-01 provides governed AI innovation — research and recommend only from injected evidence.

AI Innovation Factory **consumes** the `Q1201ConsumableContract` from injected `qSeriesCompletion` (via `getQ1201ConsumableContract()`). It **optionally observes** GKAGT `getQ1201ConsumableContract()` for approval context — GKAGT Q1201 is **not required** for research.

`seriesCompleteActivation = true` **ONLY** when QSCPT Q1201 consumed **AND** `finalCompletionDecision === "complete"`. When the Q Series is incomplete/withhold, the factory **MAY** still research/recommend with `seriesCompleteActivation=false` and outstanding prerequisite issues — it **NEVER** claims Q Series complete or fabricates completion.

## Workflow

1. Verify series-complete prerequisite from QSCPT Q1201 contract.
2. Research emerging AI technologies (catalog-based + injected evidence — never invent external web claims).
3. Track new models and APIs (structural catalog entries with evidence refs).
4. Discover business opportunities (factory/worker topology + opportunity categories).
5. Evaluate architectural improvements (SRTC/POR health gaps — evidence only).
6. Analyse operational improvements (monitoringRuntime signals).
7. Prioritise innovation proposals (deterministic scoring: benefit/cost/risk).
8. Generate implementation recommendations (never auto-deploy).
9. Maintain innovation history (immutable audit-store).
10. Integrate Pillow governance (approvalStatus pending until Grand King/Pillow — never auto-approve).
11. Produce AiInnovationReport and submit via Executive Reporting Runtime when requested.
12. Expose `Q1301ConsumableContract` for Q13-01 without implementing Q13-01.

## InnovationProposal model

Fields: `innovationId`, `category`, `opportunity`, `description`, `expectedBenefit`, `estimatedCost`, `estimatedRisk`, `priority`, `recommendation`, `approvalStatus`, `supportingEvidence`, `auditReference`, `timestamp`.

Categories: `ai_model` | `framework` | `api` | `architecture` | `operations` | `cost_optimisation` | `business_opportunity` | `research`

approvalStatus: `pending` | `recommended` | `deferred` | `rejected` | `approved` (approved never auto — only via explicit `grandKingApproved` input)

priority: `critical` | `high` | `medium` | `low`

## Series-Complete Gate (LOCKED)

- `seriesCompleteActivation = true` only when QSCPT Q1201 consumed AND `finalCompletionDecision === "complete"`
- If series incomplete/withhold: factory MAY research/recommend with `seriesCompleteActivation=false`
- NEVER claim Q Series complete / NEVER fabricate completion

## Integrations

- Q Series Completion (QSCPT) — consumes `getQ1201ConsumableContract()`; series-complete prerequisite
- Grand King Acceptance Gate (GKAGT) — optional `getQ1201ConsumableContract()` observation for approval context
- Shared Runtime Core — factory discovery, health gaps
- Worker Registry — worker topology
- Pillow Orchestration Runtime — workflow topology
- Monitoring Runtime — operational signals
- Audit Runtime — audit signals
- Executive Reporting Runtime — `submitWorkerReport`

## Boundaries

AI Innovation Factory:

- **does** research and recommend from injected evidence and structured catalog only
- **does** produce honest reports with `seriesCompleteActivation=false` when Q Series incomplete
- **does** expose `Q1301ConsumableContract` for Q13-01 without implementing Q13-01
- does **not** fabricate research evidence or external web claims
- does **not** auto-deploy innovations
- does **not** bypass governance
- does **not** override Grand King or Pillow governance
- does **not** implement Q13-01 or later
- does **not** claim Q Series complete when incomplete

## Stop Boundary

Q12-01 stops at AI Innovation Factory research/recommend. Q13-01 is explicitly out of scope; AI Innovation Factory only exposes the `Q1301ConsumableContract` for that future mission to consume.

## Distinctness

AI Innovation Factory (`pillow/src/ai-innovation-factory/`, AIFRT, Q12-01) is distinct from:

- Empire Innovation Engine (EIN, X5-07) — separate innovation domain; no Q-series CRT contracts
- Innovation Intelligence Engine (E4-07) — lightweight assembler
- Q Series Completion (QSCPT, Q11-13) — Q Series completion gate; AIFRT consumes its Q1201 contract
- Research workers / opportunity-scanner — separate mission surfaces
