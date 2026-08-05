# EmpireAI Q Series Certification System

PILLOW-QSCRT-001 / Q11-12 provides Q Series Certification — constitutional Q Series rollup certification from injected evidence only.

Q Series Certification **consumes** the `Q1112ConsumableContract` from injected `postLaunchMonitoring` (via `getQ1112ConsumableContract()`). Overall certification decision **certify** is permitted **ONLY** when FINART consumable, EAPRT decision certify, Grand King approve+authorised, and PLMRT `productionActiveMonitoring === true`. When the chain is incomplete, decision remains withhold/blocked with honest evidence. The engine **never** fabricates certification success.

When the live path is FINART missing → EAPRT withhold → GKAGT blocked → PLMRT not production-active, Q Series Certification reflects that honestly with `certificationDecision=withhold`.

## Workflow

1. Discover factories from `sharedRuntimeCore.listFactories` / `FACTORY_KEYS` — never invent.
2. Verify workers from `workerRegistry`.
3. Verify runtimes from injected runtime handles.
4. Verify cross-factory orchestration (POR structural presence).
5. Verify governance (Pillow chain: PCCRT + Q11 audits + GKAGT authority signals).
6. Verify production readiness (EAPRT + GK authorised + PLMRT productionActiveMonitoring).
7. Aggregate all certification evidence from injected Q11 engines.
8. Classify overall Q Series readiness.
9. Preserve immutable certification history.
10. Produce QSeriesCertificationReport and submit via Executive Reporting Runtime when requested.
11. Expose `Q1113ConsumableContract` for Q11-13 Q Series Complete without implementing Q11-13.

## QSeriesCertification model

Fields: `certificationId`, `factoryId`, `workerSummary`, `runtimeSummary`, `integrationStatus`, `governanceStatus`, `productionStatus`, `certificationStatus`, `readinessScore`, `supportingEvidence`, `auditReference`, `certificationTimestamp`.

Classifications: `certified` | `partially_certified` | `failed` | `missing` | `blocked` | `deferred`

Decisions: `certify` | `withhold` | `escalate` | `defer`

## Honest Certify Rule (LOCKED)

Overall Certification Decision cannot be **certify** if ANY of:

- financial-readiness-audit / FINART missing or not consumable
- executiveAcceptancePack latest decision is withhold/failed/missing
- grandKingAcceptanceGate not (approve + authorised)
- postLaunchMonitoring productionActiveMonitoring !== true
- critical factory/worker/runtime evidence Missing/Failed

## Integrations

- Post-Launch Monitoring (Q11-11) — consumes `getQ1112ConsumableContract()`
- Production Certification Core (PCCRT) — governance certification evidence
- Shared Runtime Certification (SRCRT) — Q10 certification evidence
- Worker Readiness Audit, Pillow Command Audit, Business Factory Audit, Security Audit, Performance Audit, Recovery Audit — Q11 audit evidence
- Executive Acceptance Pack (EAPRT) — production readiness gate
- Grand King Acceptance Gate (GKAGT) — authority signals
- Shared Runtime Core — factory discovery via `listFactories`
- Worker Registry — worker verification
- Pillow Orchestration Runtime — cross-factory orchestration structural signal
- Executive Reporting Runtime — `submitWorkerReport`
- Monitoring, Recovery, Audit, API, Queue, Scheduling runtimes — runtime verification (optional where noted)
- Financial Readiness Audit (FINART) — **optional, not session-bound**; record missing when absent

## Boundaries

Q Series Certification:

- **does** aggregate Q Series certification evidence from injected handles only
- **does** produce honest withhold/blocked reports when chain incomplete
- **does** expose `Q1113ConsumableContract` for Q11-13 to consume
- **does** consume `Q1112ConsumableContract` from Q11-11 when injected
- does **not** fabricate certification evidence
- does **not** certify missing functionality
- does **not** bypass governance
- does **not** override Grand King or Pillow governance
- does **not** implement Q11-13 or later
- does **not** auto-green the FINART/EAPRT/GK/PLMRT chain

## Stop Boundary

Q11-12 stops at Q Series Certification. Q11-13 Q Series Complete is explicitly out of scope; Q Series Certification only exposes the `Q1113ConsumableContract` for that future mission to consume.

## Distinctness

Q Series Certification (`pillow/src/q-series-certification/`, QSCRT, Q11-12) is distinct from:

- Shared Runtime Certification (SRCRT, Q10-14) — Q10 runtime acceptance gate; QSCRT consumes its evidence
- Production Certification Core (PCCRT, Q11-01) — production component certification; QSCRT consumes its evidence
- Company Factory Certified — business factory certification layer, not Q11 constitutional rollup
