# EmpireAI Post-Launch Monitoring System

PILLOW-PLMRT-001 / Q11-11 provides Post-Launch Monitoring — evidence-only production health observation after the Grand King Acceptance Gate.

Post-Launch Monitoring **consumes** the `Q1111ConsumableContract` from injected `grandKingAcceptanceGate` (via `getQ1111ConsumableContract()`). Production-active monitoring is permitted **ONLY** when `grandKingDecision === "approve"` AND `deploymentAuthorisationStatus === "authorised"`. When not granted, status remains blocked/standby; reports may still be produced as non-production-active with honest evidence. The engine **never** fabricates live production health.

When the live path is FINART missing → EAPRT withhold → GKAGT blocked, Post-Launch Monitoring reflects that honestly with `productionActiveMonitoring=false`.

## Workflow

1. Verify Grand King acceptance gate signals from injected `grandKingAcceptanceGate`.
2. Start monitoring session (production-active or standby/blocked based on GK authorisation).
3. Monitor workers (workerRegistry + monitoringRuntime signals).
4. Monitor factories (sharedRuntimeCore listFactories / factory health).
5. Monitor workflows (pillowOrchestrationRuntime structural topology).
6. Monitor runtime services (monitoringRuntime, sharedRuntimeCore).
7. Monitor API integrations (apiRuntime if bound).
8. Detect production incidents from monitoringRuntime evidence only — never invent incidents.
9. Detect abnormal worker behaviour from monitoring evidence.
10. Generate production alerts from evidence.
11. Produce production health summaries.
12. Produce PostLaunchMonitoringReport and submit via Executive Reporting Runtime when requested.
13. Expose `Q1112ConsumableContract` for Q11-12 Q Series Certified without implementing Q11-12.

## PostLaunchMonitoring model

Fields: `monitoringSessionId`, `componentId`, `componentType`, `productionStatus`, `healthScore`, `incidentCount`, `errorCount`, `warningCount`, `alertStatus`, `businessImpact`, `supportingEvidence`, `auditReference`, `timestamp`.

Production status: `active` | `blocked` | `standby` | `degraded` | `unknown`

Alert status: `none` | `warning` | `critical` | `unknown`

## Integrations

- Grand King Acceptance Gate (Q11-10) — consumes `getQ1111ConsumableContract()` and GK decision/authorisation signals
- Shared Runtime Core — factory health via `listFactories`
- Pillow Orchestration Runtime — structural workflow topology
- Monitoring Runtime (MONRT) — worker/runtime/API monitoring, anomalies, alerts
- Recovery Runtime — recovery context (read-only)
- Audit Runtime — audit evidence
- Executive Reporting Runtime — `submitWorkerReport`
- Worker Registry — worker catalog
- API Runtime (optional) — API integration health
- Queue Runtime (optional) — queue context

## Boundaries

Post-Launch Monitoring:

- **does** monitor production evidence from injected handles when GK authorisation permits
- **does** produce honest standby/blocked reports when GK not authorised
- **does** expose `Q1112ConsumableContract` for Q11-12 to consume
- **does** consume `Q1111ConsumableContract` from Q11-10 when injected
- does **not** fabricate production evidence
- does **not** suppress critical incidents
- does **not** hide failures
- does **not** auto-modify production
- does **not** override Grand King or Pillow governance
- does **not** implement Q11-12 or later

## Stop Boundary

Q11-11 stops at Post-Launch Monitoring. Q11-12 Q Series Certified is explicitly out of scope; Post-Launch Monitoring only exposes the `Q1112ConsumableContract` for that future mission to consume.

## Distinctness

Post-Launch Monitoring (`pillow/src/post-launch-monitoring/`, PLMRT, Q11-11) is distinct from:

- Monitoring Runtime (MONRT, Q10-10) — enterprise monitoring service; PLMRT consumes it for post-launch evidence
- Guardian Monitoring — governance guardian layer, not Q11 post-launch gate
- Launch Monitoring Engine (LME, X1-13) — business launch monitoring, not production certification post-launch gate
