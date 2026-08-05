# Q1-10 Worker Monitoring

**Status:** FINAL PASS  
**Doctrine:** PILLOW-WMO-001  
**Programme:** Q1 — Workforce Factory Foundation  
**Mission:** Q1-10 Worker Monitoring  
**Primary Deliverable:** Monitor worker health, availability, progress, errors, drift and performance.

> Doctrine ID uses **PILLOW-WMO-001**. Worker Monitoring observes and reports only; it never executes worker tasks, restarts workers automatically, replaces Workforce Certification Monitor, overrides Pillow, or overrides Grand King.

## How Q1-10 works

1. The authoritative Worker Monitoring service is defined (`WMO-MON-v1`).
2. Workers register into the monitoring pool; observations update health signals.
3. Active workers are scanned continuously for stall, overload, drift, offline and degradation.
4. Critical and warning alerts are reported to Pillow.
5. Machine-readable monitoring records are produced (`WMO-001-v1`) for Executive Reporting Runtime integration.

## Prerequisites

- Q0 Unified Workforce Certification (`PILLOW-UWC-001` / Q0-30)
- Q1-01 through Q1-09 (Worker Constitution → Worker Assignment Engine)

## Health states

`healthy`, `warning`, `critical`, `recovering`, `offline`, `unknown`

## Monitoring events

`worker_started`, `worker_completed`, `worker_failed`, `worker_stalled`, `worker_overloaded`, `worker_recovered`, `worker_suspended`, `worker_offline`, `performance_degraded`

## Mandatory monitoring rules

`continuously_monitor_active_workers`, `detect_abnormal_behaviour`, `detect_execution_drift`, `detect_performance_degradation`, `report_critical_events_to_pillow`, `preserve_monitoring_history`, `support_executive_reporting_runtime_integration`

## Verification

`npx --yes tsx --test "src/validation/tests/worker-monitoring.test.ts"` — 10 passing, 0 failing.
