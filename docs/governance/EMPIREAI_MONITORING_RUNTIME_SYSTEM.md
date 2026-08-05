# EmpireAI Monitoring Runtime

PILLOW-MONRT-001 / Q10-10 provides the Monitoring Runtime inside Pillow.

The Monitoring Runtime is the enterprise monitoring and health aggregation service for EmpireAI. It registers monitored components, collects heartbeats, monitors workers / factories / runtime services / APIs / queues / missions / tools from observed probe and metric evidence only, detects anomalies against deterministic thresholds, generates alerts (critical alerts are never suppressed), calculates health scores deterministically, aggregates enterprise health, and produces Monitoring Runtime Reports consumable by Q10-11 Recovery Runtime.

The Monitoring Runtime reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never fabricates health information, never suppresses critical alerts, never automatically repairs failures, never replaces recovery systems, never exposes secrets (auditReference only), and never bypasses Pillow or Grand King governance.

## Component Types

worker, factory, runtime_service, api, queue, mission, tool, enterprise_service, custom_extension.

## Health Statuses

healthy, degraded, warning, critical, unavailable, standby, unknown.

## Alert Severities

info, warning, critical.

## Seed Components

Seeded as standby/unknown until heartbeats are recorded — never fabricated healthy:

- Workers: `wkr-alpha`, `wkr-beta`
- Factories: `factory-pillow`, `factory-capital`
- Runtime services: `runtime-srtc`, `runtime-por`, `runtime-msr`, `runtime-qrt`
- API: `api-supplier-01`
- Queue: `queue-default-01`
- Mission: `mission-demo-01`
- Tool: `tool-cursor-01`

## Workflow

1. Connect and bootstrap monitoring services (component registry, heartbeat collector, category monitors, anomaly detector, alert generator, health calculator, enterprise aggregator, metrics collector, report builder).
2. Register monitored components deterministically by componentId + componentType.
3. Record heartbeats from observed probe evidence; update lastSuccessfulHeartbeat and supportingEvidence.
4. Monitor workers, factories, runtime services, APIs, queues, missions, and tools from stored evidence only.
5. Detect anomalies from deterministic thresholds (errorCount, latency, availability).
6. Generate alerts; critical alerts are always retained in history and reports — never suppressed.
7. Calculate health deterministically (same inputs → same health score).
8. Produce Monitoring Runtime Reports (`MONRT-RPT-v1` / `MONRT-001-v1`) with `consumableByQ1011: true`.
9. Expose Q1011ConsumableContract for Q10-11 and preserve complete monitoring and audit history.

## Health Calculation

Deterministic formula documented in `health-calculator.ts`:

- base = availability
- subtract min(40, errorCount * 5)
- subtract min(20, floor(latencyMs / 100))
- subtract min(30, criticalAlertCount * 15)
- clamp 0–100
- status bands: >=80 healthy, >=60 degraded, >=40 warning; lower scores map to critical/unavailable; 0 with no evidence → standby/unknown

## Integrations

- Shared Runtime Core (topology, routing, Q1002 contract)
- Pillow Orchestration Runtime (structural dispatch signals, Q1003 contract)
- Mission Runtime (Q1004 contract consumption)
- Queue Runtime (Q1005 contract consumption)
- Memory Runtime (Q1006 contract consumption)
- API Runtime (Q1007 contract consumption)
- Tool Runtime (Q1008 contract consumption)
- Communication Runtime (Q1009 contract consumption)
- Approval Runtime (Q1010 contract consumption)
- Executive Reporting Runtime
- Audit Runtime
- Worker Registry / Factory Registry
- Worker Recovery System / Recovery (presence probes only — Monitoring Runtime never calls repair/recover methods)

## Boundaries

The Monitoring Runtime:

- DOES register components and collect observed heartbeat / probe / metric evidence.
- DOES calculate health deterministically from stored evidence.
- DOES retain critical alerts in history and reports without suppression.
- DOES produce Monitoring Runtime Reports for downstream Q10-11 consumption.
- DOES NOT fabricate health information or invent healthy status without evidence.
- DOES NOT suppress critical alerts.
- DOES NOT automatically repair failures.
- DOES NOT replace recovery systems or call repair/recover methods.
- DOES NOT execute business logic.
- DOES NOT expose secrets — auditReference strings only.
- DOES NOT bypass Pillow governance or Grand King approval.
- DOES NOT implement Q10-11 Recovery Runtime or later.
