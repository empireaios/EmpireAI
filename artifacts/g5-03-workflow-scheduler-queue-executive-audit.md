# G5-03 — Workflow Scheduler & Queue · Executive Audit

**Mission:** G5-03 — Workflow Scheduler & Queue  
**Authority:** G5-00 Business Automation Architecture · G5-01 Registry Foundation · G5-02 Trigger Engine · Pillow §17 · EKLS  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** Canonical scheduling and queue layer — **no workflow execution, no Business Engine execution, G5-04 not started**  
**Prerequisites:** G5-01 Automation Registry Foundation ✅ · G5-02 Automation Trigger Engine ✅

---

## Executive Summary

G5-03 implements the **Workflow Scheduler** and **Automation Queue** as the canonical timing and delivery layer for Business Automation. Every approved automation request from the Trigger Engine passes through Pillow governance, registry-driven schedule resolution, queue persistence with full contract fields, and orchestrator handoff in `waiting` state — **without executing workflows or Business Engines**.

Scheduling behaviour is resolved exclusively from `REG-AUTOMATION-SCHEDULE`, `REG-AUTOMATION-POLICY`, and `REG-AUTOMATION-RECOVERY`. No execution frequency, retry timing, or priority logic is hardcoded in scheduler core.

---

## 1. Completed Work

| Capability | Status |
|------------|--------|
| Workflow Scheduler (`WorkflowScheduler`) | ✅ |
| Automation Queue (`AutomationQueue`) | ✅ |
| Immediate / scheduled / recurring / deferred / retry / recovery / manual / plugin modes | ✅ |
| Twelve execution states (pending → archived lifecycle) | ✅ |
| Full queue contract (queueId, workflowId, triggerId, workspace, company, brand, priority, state, correlationId, decision/approval refs, registry refs, timestamps, retryCount) | ✅ |
| REG-AUTOMATION-SCHEDULE / POLICY / RECOVERY resolution | ✅ |
| Pillow scheduler governance (policy, eligibility, approval, workspace isolation) | ✅ |
| EKLS scheduler audit recorder | ✅ |
| Brain integration (trigger → scheduler → queue) | ✅ |
| Brain tools: `queue_status`, `process_scheduler_due`, `dispatch_queued` | ✅ |
| Scheduler plugin registry (schedulers, priority, queue providers, delay/retry/calendar) | ✅ |
| Orchestrator handoff (`queued` → `waiting`) — G5-04 pickup only | ✅ |
| Distributed-worker-ready queue provider registration surface | ✅ |

---

## 2. Files Created

| File | Purpose |
|------|---------|
| `backend/src/orchestration/business-automation/contracts/scheduler-types.ts` | Queue contract, execution states, schedule modes |
| `backend/src/orchestration/business-automation/scheduler/schedule-policy-resolver.ts` | Registry-driven timing and policy resolution |
| `backend/src/orchestration/business-automation/scheduler/workflow-scheduler.ts` | Canonical Workflow Scheduler |
| `backend/src/orchestration/business-automation/scheduler/scheduler-plugin-registry.ts` | Plugin registration for schedulers, strategies, providers |
| `backend/src/orchestration/business-automation/queue/automation-queue.ts` | Priority-ordered automation queue |
| `backend/src/orchestration/business-automation/governance/scheduler-pillow-governance.ts` | Pillow governance for scheduling decisions |
| `backend/src/orchestration/business-automation/audit/scheduler-audit-recorder.ts` | EKLS-governed scheduler audit events |
| `backend/src/orchestration/business-automation/services/scheduler-service.ts` | Service layer for Brain scheduler tools |
| `backend/src/validation/tests/g5-03-workflow-scheduler-queue.test.ts` | 11 validation tests |
| `artifacts/g5-03-workflow-scheduler-queue-executive-audit.md` | This audit |

---

## 3. Files Modified

| File | Change |
|------|--------|
| `backend/src/orchestration/business-automation/scheduler/workflow-scheduler-dispatch.ts` | Upgraded from G5-02 stub to canonical G5-03 intake bridge |
| `backend/src/orchestration/business-automation/triggers/trigger-engine.ts` | Passes actorId and governance to scheduler intake |
| `backend/src/orchestration/business-automation/contracts/trigger-types.ts` | Added `queueId` on `AutomationRequest` |
| `backend/src/orchestration/business-automation/data/automation-registry-seed.ts` | Schedule configuration (`scheduleMode`, `intervalMs`) on foundation slot |
| `backend/src/orchestration/business-automation/index.ts` | Exported scheduler, queue, audit, resolver |
| `backend/src/orchestration/business-automation/contract/business-automation-module.ts` | Mission G5-03 + three new capabilities |
| `backend/src/orchestration/business-automation/tools/business-automation-tools.ts` | Added scheduler/queue Brain tools |
| `backend/src/agents/routes/module-routes.ts` | Added scheduler/queue dispatch routes |

---

## 4. Execution States

| State | G5-03 Role |
|-------|------------|
| `pending` | Entry created, schedule computed |
| `scheduled` | Awaiting registry-computed scheduled time |
| `queued` | Ready for orchestrator dispatch |
| `waiting` | Handed off to G5-04 orchestrator (no execution in G5-03) |
| `running` | Reserved for G5-04 |
| `paused` | Reserved for G5-04 |
| `retrying` | Transient state during retry scheduling |
| `completed` | Scheduler state closure (audit only) |
| `failed` | Retry limit reached |
| `cancelled` | Pillow-governed cancellation |
| `recovered` | Recovery path initiated via REG-AUTOMATION-RECOVERY |
| `archived` | Reserved for post-run archival |

---

## 5. Scheduling Flow

```
Trigger Engine (G5-02) — accepted automation request
    → Pillow scheduler governance (eligibility, approval, workspace)
    → Resolve REG-AUTOMATION-SCHEDULE / POLICY / RECOVERY
    → Compute scheduledTime + executionDeadline (registry-driven)
    → Enqueue with priority ordering + correlation ID
    → EKLS audit: workflow_scheduled / workflow_queued
    → processDue: scheduled → queued
    → dispatchNextToOrchestrator: queued → waiting (G5-04 handoff)
```

---

## 6. Queue Contract Compliance

Every queued request includes:

- Queue ID, Workflow ID, Trigger ID  
- Workspace, Company, Brand  
- Priority, Execution State, Correlation ID  
- Decision Reference, Approval Reference  
- Registry References  
- Created Time, Scheduled Time, Execution Deadline  
- Retry Count  

---

## 7. Registry Integration

| Registry | Usage |
|----------|-------|
| `REG-AUTOMATION-SCHEDULE` | Schedule kind, expression, intervalMs, scheduleMode |
| `REG-AUTOMATION-POLICY` | Retry maxAttempts, backoffMs, SLA deadline |
| `REG-AUTOMATION-RECOVERY` | Recovery scheduling and maxAttempts override |

Foundation seed row `sch-foundation-hourly-slot` carries `configuration.scheduleMode: recurring` and `configuration.intervalMs: 3600000`. Policy row `pol-foundation-default` supplies retry and SLA. Recovery row `rec-foundation-default` supplies recovery strategies.

---

## 8. EKLS Audit Events

| Event | When Recorded |
|-------|---------------|
| `workflow_scheduled` | Intake with computed schedule |
| `workflow_queued` | Immediate queue or due promotion / dispatch |
| `workflow_delayed` | Retry/recovery deferral |
| `workflow_retried` | Retry count incremented |
| `workflow_cancelled` | Pillow-governed cancel |
| `workflow_completed` | Scheduler state closure |

All events pass through `enforceEklsAccess` before recording.

---

## 9. Brain Tools

| Tool | Authority | Purpose |
|------|-----------|---------|
| `business_automation.queue_status` | L1 | Queue snapshot by workspace |
| `business_automation.process_scheduler_due` | L2 | Promote due scheduled entries |
| `business_automation.dispatch_queued` | L2 | Hand off to orchestrator waiting state |

Existing G5-02 tools (`evaluate_triggers`, `receive_trigger`, `trigger_status`) unchanged; `receive_trigger` now populates canonical queue with `queueId`.

---

## 10. Hardcode Governance

| Prohibited | Status |
|------------|--------|
| Execution frequency | ✅ Resolved from schedule registry configuration |
| Retry count / backoff | ✅ Resolved from policy + recovery registries |
| Queue priority ranks | ✅ Structural ordering only; business priority from trigger context |
| Worker count | ✅ Not implemented (future distributed workers via plugin queue providers) |
| Delay intervals | ✅ Registry + optional plugin delay strategies |
| Business workflow timing | ✅ No domain-specific timing in core |

---

## 11. Validation Results

| Suite | Tests | Result |
|-------|-------|--------|
| G5-01 Automation Registry Foundation | 13 | ✅ Pass |
| G5-02 Automation Trigger Engine | 15 | ✅ Pass |
| G5-03 Workflow Scheduler & Queue | 11 | ✅ Pass |
| **Total** | **39** | **✅ Pass** |
| Typecheck (`npm run typecheck`) | — | ✅ Pass |

### G5-03 Test Coverage

- Registry resolution tests  
- Queue contract field tests  
- Priority ordering tests  
- State transition tests (scheduled → queued → waiting)  
- Retry scheduling tests (registry backoff)  
- Recovery scheduling tests  
- Pillow/EKLS audit tests  
- Brain integration tests  
- Plugin scheduler registration tests  
- Cancellation tests  

---

## 12. Future Compatibility

| Capability | G5-03 Preparation |
|------------|-------------------|
| Distributed workers | Queue provider plugin registry |
| Cluster / cloud execution | Orchestrator handoff contract (`waiting` state) |
| Priority queues | Priority strategy plugin registry |
| Event / message brokers | Queue provider `broker` kind registration |
| Calendar providers | Calendar provider plugin registry |

No architectural redesign required for G5-04 orchestrator pickup.

---

## 13. Stop Conditions

| Condition | Status |
|-----------|--------|
| Typecheck pass | ✅ |
| Tests pass | ✅ (39/39) |
| Executive audit artifact | ✅ |
| G5-04 not started | ✅ |

---

## 14. Sign-Off

**G5-03 Workflow Scheduler & Queue is COMPLETE.**

The canonical scheduling layer determines **when** automation runs. The Automation Queue delivers approved requests to the orchestrator handoff point. Workflow execution remains exclusively in G5-04 scope.
