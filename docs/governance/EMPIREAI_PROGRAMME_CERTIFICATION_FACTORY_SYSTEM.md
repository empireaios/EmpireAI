# EmpireAI Programme Certification Factory System

PILLOW-PCFCT-001 / Q13-06 provides governed programme certification across the constitutional programme catalog — repository evidence only; never auto-modifies production.

Programme Certification Factory **consumes** the `Q1306ConsumableContract` from injected `implementationRecoveryPlanner` (via `getQ1306ConsumableContract()`). It **integrates** with `cursorSpecificationGenerator`, `missionPlanningEngine`, `repositoryIntelligenceEngine`, `implementationSpecificationEngine`, and optionally `qSeriesCertification`, `qSeriesCompletion`, `productionCertificationCore`, `empireKnowledgeEngine`. It **emits** `getQSeriesConstitutionalCompletionContract` as the FINAL Q Series completion signal — NOT a Q13-07 consumer.

## Workflow

1. Discover approved programmes from constitutional catalog (G, P, E, K, T, R, X, Q).
2. Audit programme repository from phase audit packs and pillow Q audit folders.
3. Compare findings against roadmap evidence.
4. Classify missions: Completed, Partially Implemented, Missing, Broken/Deviating, Duplicate, Intentionally Deferred.
5. Produce programme gap analysis and completion recommendations (recommendations ONLY — never auto-apply).
6. Certify each programme individually into ProgrammeCertification records.
7. Produce Final Repository Constitutional Certification only after all individual certifications (including K as Intentionally Deferred).
8. Emit `QSeriesConstitutionalCompletionContract` — final Q Series mission stop boundary.

## Constitutional Programme Catalog

Fixed programmes — never invent missions:

- **G Series** — `docs/audits/g-phase/`
- **P Series** — `docs/audits/p-phase/`
- **E Series** — `docs/audits/e-phase/`
- **K Series** — Intentionally Deferred (no k-phase pack in repository)
- **T Series** — `docs/audits/t-phase/`
- **R Series** — `docs/audits/r-phase/`
- **X Series** — `docs/audits/x-phase/`
- **Q Series** — `docs/audits/pillow/q*/`, pillow Q modules

## Integrations

- Implementation Recovery Planner (IRPLN) — consumes `getQ1306ConsumableContract()`; required prerequisite
- Cursor Specification Generator (CSGEN) — optional specification context
- Repository Intelligence Engine (RIENG) — read-only repository snapshot
- Mission Planning Engine (MPENG) — optional planning context
- Implementation Specification Engine (ISENG) — optional specifications
- Q Series Certification (QSCRT) — optional certification handle
- Q Series Completion (QSCPT) — optional completion handle
- Production Certification Core — optional probe handle
- Empire Knowledge Engine — optional knowledge context
- Pillow Orchestration Runtime — workflow topology
- Audit Runtime — audit signals
- Executive Reporting Runtime — `submitWorkerReport`

## Boundaries

Programme Certification Factory:

- **does** discover and certify programmes from repository evidence
- **does** consume Q1306 contract from Implementation Recovery Planner
- **does** emit `QSeriesConstitutionalCompletionContract` as FINAL series completion
- does **not** auto-modify production or apply recommendations
- does **not** certify from claims alone — repository evidence only
- does **not** fabricate findings or invent mission IDs
- does **not** bypass Pillow/Grand King governance
- does **not** implement Q13-07 or any future programme

## Stop Boundary

Q13-06 is the **FINAL Q Series mission**. Do not implement Q13-07 or later. PCFCT emits constitutional completion contract as a structural signal only.

## Distinctness

Programme Certification Factory (`pillow/src/programme-certification-factory/`, PCFCT, Q13-06) is distinct from:

- Implementation Recovery Planner (IRPLN, Q13-05) — recovery planning; PCFCT consumes its Q1306 contract
- Q Series Certification (QSCRT, Q11-12) — Q11 factory certification; soft collision, reused as optional handle
- Q Series Completion (QSCPT, Q11-13) — Q11 completion; soft collision, reused as optional handle
- Production Certification Core — preserved unchanged; optional injected probe handle
