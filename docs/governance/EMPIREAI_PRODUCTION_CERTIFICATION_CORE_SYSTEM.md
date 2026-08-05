# EmpireAI Production Certification Core

PILLOW-PCCRT-001 / Q11-01 provides the Production Certification Core — the first acceptance gate of the Q11 Production Certification series.

The Production Certification Core **registers, discovers, and certifies** the structural production readiness of the Empire from observed evidence only. It registers a fixed catalog of Q11 certification programme slots (workforce, runtime, factory, governance, reporting, integration, security, performance, recovery, financial readiness, executive, and a reserved custom-extension slot), discovers factories (from the Shared Runtime Core `FACTORY_KEYS` catalog and optional `listFactories()` injection), discovers workers (strictly from an injected Worker Registry `listWorkers()` call — never invented), and discovers the Q10-01..Q10-13 Shared Runtime pipeline (from repository evidence and optional runtime probes). It aggregates every finding into a `CertificationResult` evidence model, calculates a deterministic production readiness score, tracks immutable certification history, and produces a machine-readable Production Certification Report.

The Production Certification Core reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It preserves complete traceability and immutable certification audit history. It is the first acceptance gate of the Q11 series — it never implements Q11-02 (Worker Readiness Audit) or later. It exposes a `Q1102ConsumableContract` (via `getQ1102ConsumableContract()`) that Q11-02 may consume; it never implements Q11-02 itself. It consumes the `Q1101ConsumableContract` exposed by Q10-14 (Shared Runtime Certification) when the `sharedRuntimeCertification` dependency is injected — it never re-implements that certification authority.

## Workflow

1. Register the fixed Q11 certification programme catalog: `workforce_certification`, `runtime_certification`, `factory_certification`, `governance_certification`, `reporting_certification`, `integration_certification`, `security_certification`, `performance_certification`, `recovery_certification`, `financial_readiness_certification`, `executive_certification`, and `custom_extension` (a reserved slot for future programmes, registered without redesigning the evaluation pipeline).
2. Discover factories from an injected `sharedRuntimeCore.listFactories()` call plus repository evidence (the `FACTORY_KEYS` catalog literally defined in `pillow/src/shared-runtime-core/paths.ts`). Absence from both sources is always recorded honestly — never fabricated.
3. Discover workers strictly from an injected `workerRegistry.listWorkers()` call. Absence of an injected registry is reported as zero discovered workers — workers are never invented. Seed worker counts are recorded as structural evidence only.
4. Discover the Q10-01..Q10-13 Shared Runtime pipeline from repository evidence (`engine.ts` presence per runtime) and optional injected runtime handle reachability probes (`getState`, `getEngineRecord`, `getCockpitSnapshot`, or `validateForSupervisorSync`).
5. Register per-programme structural certification requirements (evidence references and component types) deterministically.
6. Coordinate certification execution: discovery, then programme evaluation, then evidence aggregation, then readiness scoring — evidence-based only, in that fixed order.
7. Aggregate certification evidence into `CertificationResult` rows with mandatory fields: `certificationId`, `programmeId`, `componentId`, `componentType`, `certificationStatus`, `readinessScore`, `evidenceReferences`, `validationResults`, `failedChecks`, `passedChecks`, `outstandingIssues`, `auditReference`, `certificationTimestamp`.
8. Calculate a deterministic overall production readiness score (0–1) from discovered components, programme statuses, Q1101 contract consumption, and governance compliance. Never fabricated.
9. Track certification status in an immutable, append-only certification history store.
10. Produce a machine-readable Production Certification Report (`PCCRT-RPT-v1` / `PCCRT-001-v1`) documenting every finding, risk, and outstanding issue, plus `consumableByQ1102` and the `Q1102ConsumableContract` exposed for Q11-02.
11. Submit findings through the Executive Reporting Runtime and preserve complete, immutable certification audit history.

## Integrations

The worker integrates with:

- Shared Runtime Certification (Q10-14) — consumes `getQ1101ConsumableContract()`
- Shared Runtime Core (Q10-01) — `listFactories`, `getTopology`, `getQ1002ConsumableContract`
- Worker Registry — `listWorkers`
- Audit Runtime
- Monitoring Runtime
- Approval Runtime
- Recovery Runtime
- Executive Reporting Runtime — `submitWorkerReport`
- Worker Lifecycle
- Worker Recovery System
- Optional Q10-01..Q10-13 runtime handles for discovery probes

## Boundaries

The Production Certification Core:

- **does** register the fixed Q11 certification programme catalog and support registering additional programmes without redesign
- **does** discover factories, workers, and runtimes strictly from injected dependencies and repository evidence
- **does** aggregate certification evidence and calculate a deterministic production readiness score
- **does** expose a `Q1102ConsumableContract` for Q11-02 (Worker Readiness Audit) to consume
- **does** consume the `Q1101ConsumableContract` exposed by Q10-14 (Shared Runtime Certification) when injected
- does **not** fabricate certification evidence
- does **not** certify missing capabilities
- does **not** assume implementation
- does **not** implement missing capabilities
- does **not** modify production logic
- does **not** replace individual audit programmes
- does **not** bypass Pillow governance
- does **not** bypass Grand King approval
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** implement Q11-02 (Worker Readiness Audit) or later

## Stop Boundary

Q11-01 is the first acceptance gate of the Production Certification series. Q11-02 (Worker Readiness Audit) is explicitly out of scope; Production Certification Core only exposes the `Q1102ConsumableContract` for that future mission to consume.

## Distinctness

Production Certification Core (`pillow/src/production-certification-core/`, Q11-01) is distinct from:

- The backend `production-certification/` module (G6), which is a separate, unrelated backend concern.
- The `profit-calculation-engine` (`PILLOW-PC-001`), which performs financial profit calculations, not production certification.
