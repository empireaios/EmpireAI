# EmpireAI Worker Readiness Audit

PILLOW-WRART-001 / Q11-02 provides the Worker Readiness Audit — the second acceptance gate of the Q11 Production Certification series.

The Worker Readiness Audit **discovers, verifies, and classifies** the structural production readiness of every registered worker from observed evidence only. It discovers every registered worker strictly from an injected Worker Registry `listWorkers()` call — never inventing workers. For each discovered worker it verifies registration (workerId, factory, role/department), reachability (injected runtime probe when available, otherwise the registry-reported `operationalStatus`), configuration (`skillProfile`, `approvedTools`, `authorityLevel`), governance (`certificationStatus`, `governingAuthority`/`reportingLine` to Pillow), permissions (`authorityLevel` + `approvedTools`), runtime connectivity (`sharedRuntimeCore`/`pillowOrchestrationRuntime` presence plus factory membership against the `FACTORY_KEYS` catalog), and operational capability (`operationalStatus` + non-empty `skillProfile`). It classifies each worker's readiness deterministically from this evidence — `Ready`, `Partially Ready`, `Failed`, `Missing`, `Blocked`, or `Deferred` — and it never marks a worker Ready when unreachable. It aggregates every finding into a `WorkerReadinessAssessment` matrix, calculates a deterministic overall readiness score, tracks immutable audit history, and produces a machine-readable Worker Readiness Audit Report.

The Worker Readiness Audit reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It preserves complete traceability and immutable audit history. It is the second acceptance gate of the Q11 series — it never implements Q11-03 (Pillow Command Audit) or later. It exposes a `Q1103ConsumableContract` (via `getQ1103ConsumableContract()`) that Q11-03 may consume; it never implements Q11-03 itself. It consumes the `Q1102ConsumableContract` exposed by Q11-01 (Production Certification Core) when the `productionCertificationCore` dependency is injected — it never re-implements that certification authority.

## Workflow

1. Discover every registered worker strictly from an injected `workerRegistry.listWorkers()` call. Absence of an injected registry is reported as zero discovered workers — workers are never invented.
2. Verify worker registration: `workerId` present, `factory` set, `role`/`department` present.
3. Verify worker reachability: probe an injected per-worker runtime handle when available (`getState`, `getEngineRecord`, `getCockpitSnapshot`, or `validateForSupervisorSync`); otherwise fall back to the registry-reported `operationalStatus` as structural evidence. A worker is never marked Ready when unreachable.
4. Verify worker configuration: `skillProfile`, `approvedTools`, `authorityLevel` present.
5. Verify worker governance: `certificationStatus`, `reportingLine`, `governingAuthority` — Pillow governance is required.
6. Verify worker permissions: `authorityLevel` + `approvedTools` structural checks.
7. Verify worker runtime connectivity: `sharedRuntimeCore` / `pillowOrchestrationRuntime` presence when bound, plus factory membership against the `FACTORY_KEYS` catalog when available.
8. Verify worker operational capability: `operationalStatus` + non-empty `skillProfile`. Capability signal is drawn from the registry record only.
9. Classify each worker's readiness deterministically from the seven dimensions above: `Ready`, `Partially Ready`, `Failed`, `Missing`, `Blocked`, or `Deferred`.
10. Produce a machine-readable Worker Readiness Audit Report (`WRART-RPT-v1` / `WRART-001-v1`) documenting every worker assessment, governance/runtime/capability summaries, outstanding issues, and confidence score, plus `consumableByQ1103` and the `Q1103ConsumableContract` exposed for Q11-03.
11. Submit findings through the Executive Reporting Runtime and preserve complete, immutable audit history.

## Worker Readiness Assessment model

Each row of the `readinessMatrix` records: `workerId`, `workerName`, `factory`, `registrationStatus`, `runtimeStatus`, `reachabilityStatus`, `governanceStatus`, `permissionStatus`, `dependencyStatus`, `capabilityStatus`, `readinessClassification`, `supportingEvidence`, `auditReference`, `auditTimestamp`.

## Integrations

The worker integrates with:

- Production Certification Core (Q11-01) — consumes `getQ1102ConsumableContract()`
- Worker Registry — `listWorkers()` (sole authoritative worker discovery source)
- Shared Runtime Core — runtime connectivity + factory membership evidence
- Pillow Orchestration Runtime
- Monitoring Runtime
- Audit Runtime
- Executive Reporting Runtime — `submitWorkerReport`
- Worker Lifecycle
- Optional per-worker runtime handles for direct reachability probes

## Boundaries

The Worker Readiness Audit:

- **does** discover every registered worker strictly from the injected Worker Registry
- **does** verify registration, reachability, configuration, governance, permissions, runtime connectivity, and operational capability from observed evidence only
- **does** classify worker readiness deterministically and calculate an overall readiness score
- **does** expose a `Q1103ConsumableContract` for Q11-03 (Pillow Command Audit) to consume
- **does** consume the `Q1102ConsumableContract` exposed by Q11-01 (Production Certification Core) when injected
- does **not** fabricate audit evidence
- does **not** certify missing workers
- does **not** certify unreachable workers
- does **not** assume implementation
- does **not** modify worker implementations
- does **not** repair failed workers
- does **not** bypass Pillow governance
- does **not** bypass Grand King approval
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** implement Q11-03 (Pillow Command Audit) or later

## Stop Boundary

Q11-02 is the second acceptance gate of the Production Certification series. Q11-03 (Pillow Command Audit) is explicitly out of scope; Worker Readiness Audit only exposes the `Q1103ConsumableContract` for that future mission to consume.

## Distinctness

Worker Readiness Audit (`pillow/src/worker-readiness-audit/`, Q11-02) is distinct from:

- The Worker Registry (`pillow/src/worker-registry/`, WRG, Q1-07), which registers and stores worker records — Worker Readiness Audit only reads from it via `listWorkers()` and never writes worker records into it beyond provisioning its own identity.
- Worker Recovery System (WRS), which recovers failed workers — Worker Readiness Audit never repairs failed workers, it only reports on them.
- Production Certification Core (`pillow/src/production-certification-core/`, PCCRT, Q11-01), which certifies overall production readiness (programmes, factories, runtimes) — Worker Readiness Audit consumes its `Q1102ConsumableContract` but focuses exclusively on per-worker readiness.
- The backend production-readiness helper utilities, which are separate, unrelated backend concerns.
