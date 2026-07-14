# G5-04 — Workflow Orchestrator & Execution Broker · Executive Audit

**Mission:** G5-04 — Workflow Orchestrator & Execution Broker  
**Authority:** G5-00 Business Automation Architecture · G5-01–G5-03 · Pillow §17 · EKLS  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** Canonical execution orchestration layer — **coordinates execution, dispatches through Brain only, no Business Engine logic embedded**  
**Prerequisites:** G5-01 ✅ · G5-02 ✅ · G5-03 ✅

---

## Executive Summary

G5-04 implements the **Workflow Orchestrator** and **Execution Broker** as the canonical execution coordination layer for Business Automation. Approved automation requests in `waiting` state are picked up, workflow definitions are loaded from registry, dependencies are validated, execution sequence is computed, and each step is dispatched exclusively through the Brain Orchestrator — **without embedding business logic or calling Business Engines directly**.

**G5-05 not started** per mission directive.

---

## 1. Completed Work

| Capability | Status |
|------------|--------|
| Workflow Orchestrator (`WorkflowOrchestrator`) | ✅ |
| Execution Broker (`ExecutionBroker`) | ✅ |
| Pickup from G5-03 `waiting` queue state | ✅ |
| Registry workflow DAG resolution (`REG-AUTOMATION-WORKFLOW`) | ✅ |
| Executor binding resolution (`REG-AUTOMATION-EXECUTOR`) | ✅ |
| Policy / recovery registry integration | ✅ |
| Full workflow lifecycle states | ✅ |
| Full execution context contract | ✅ |
| Brain dispatch adapter (wired in `createBrain()`) | ✅ |
| Business engine dispatch via Brain (no direct engine calls) | ✅ |
| Pillow orchestrator governance | ✅ |
| EKLS orchestrator audit recorder | ✅ |
| Orchestrator plugin registry | ✅ |
| Brain tools: pickup, advance, run_to_completion, status, cancel, pause | ✅ |
| Foundation executor Brain routes (`execution-broker`, `decision-gate`) | ✅ |

---

## 2. Files Created

| File | Purpose |
|------|---------|
| `contracts/orchestrator-types.ts` | Run, step, lifecycle, execution context types |
| `orchestrator/workflow-orchestrator.ts` | Canonical Workflow Orchestrator |
| `orchestrator/dag-resolver.ts` | Registry DAG load, dependency validation, topo sort |
| `orchestrator/orchestrator-plugin-registry.ts` | Executor, adapter, validator, observer, enricher plugins |
| `broker/execution-broker.ts` | Brain-only step dispatch broker |
| `broker/executor-resolver.ts` | REG-AUTOMATION-EXECUTOR binding resolution |
| `broker/brain-dispatch-adapter.ts` | Brain Orchestrator dispatch injection |
| `state/automation-run-store.ts` | In-memory run state (distributed-ready interface) |
| `governance/orchestrator-pillow-governance.ts` | Pillow execution governance |
| `audit/orchestrator-audit-recorder.ts` | EKLS-governed orchestrator audit events |
| `services/orchestrator-service.ts` | Brain tool handler layer |
| `validation/tests/g5-04-workflow-orchestrator-execution-broker.test.ts` | 9 validation tests |
| `artifacts/g5-04-workflow-orchestrator-execution-broker-executive-audit.md` | This audit |

---

## 3. Files Modified

| File | Change |
|------|--------|
| `data/automation-registry-seed.ts` | G3 refresh route fix, marketplace business_engine executor |
| `tools/business-automation-tools.ts` | Orchestrator Brain tools + foundation executor ack |
| `contract/business-automation-module.ts` | Mission G5-04 + new capabilities |
| `agents/routes/module-routes.ts` | Orchestrator routes + foundation executor routes |
| `brain/index.ts` | Wired `setAutomationBrainDispatch(orchestrator.dispatch)` |
| `index.ts` | Exported orchestrator, broker, run store, reset harness |

---

## 4. Workflow Lifecycle

| State | Role |
|-------|------|
| `workflow_loaded` | Registry workflow resolved |
| `workflow_validated` | Dependencies validated |
| `workflow_ready` | Ready for execution |
| `execution_started` | Run created from waiting queue entry |
| `step_executing` | Active step dispatch in progress |
| `step_completed` | Step succeeded via Brain |
| `step_failed` | Step failed — recovery evaluated |
| `step_waiting` | Step awaiting approval/async Brain response |
| `workflow_completed` | All forward DAG steps complete |
| `workflow_failed` | Unrecoverable failure |
| `workflow_cancelled` | Pillow-governed cancellation |
| `workflow_recovered` | Recovery rollback initiated |

---

## 5. Execution Flow

```
G5-03 Queue (waiting)
    → WorkflowOrchestrator.pickupWaiting()
    → Load REG-AUTOMATION-WORKFLOW + validate DAG
    → Create AutomationRun + execution context
    → WorkflowOrchestrator.advanceRun()
    → ExecutionBroker.executeStep()
    → Brain dispatch adapter → Brain Orchestrator
    → Step result → lifecycle transition → next step or completion
```

---

## 6. Registry Integration

| Registry | Usage |
|----------|-------|
| `REG-AUTOMATION-WORKFLOW` | Step DAG, dependencies, rollback refs |
| `REG-AUTOMATION-EXECUTOR` | Module:action bindings, capability tags |
| `REG-AUTOMATION-POLICY` | Policy refs on workflow/run context |
| `REG-AUTOMATION-RECOVERY` | Rollback map, recovery scheduling |

Rollback-only steps (e.g. `compensate-action`) are excluded from forward execution order and activated only via recovery.

---

## 7. Brain Integration

- Execution Broker **never** calls Business Engines directly
- All dispatch via `OrchestratorDispatchRequest` through Brain Orchestrator
- `createBrain()` wires `setAutomationBrainDispatch((req) => orchestrator.dispatch(req))`
- Foundation executor routes registered for registry `executorRef` targets

---

## 8. EKLS Audit Events

| Event | When |
|-------|------|
| `workflow_execution` | Run pickup and start |
| `step_completion` | Step succeeds |
| `execution_outcome` | Run completes, fails, or cancels |
| `failure_event` | Step failure |
| `recovery_event` | Recovery rollback triggered |
| `execution_evidence` | Brain dispatch evidence recorded |

---

## 9. Brain Tools Added

| Tool | Purpose |
|------|---------|
| `business_automation.pickup_waiting` | Pick up waiting queue entry, start run |
| `business_automation.advance_run` | Execute next workflow step |
| `business_automation.run_to_completion` | Advance until terminal/waiting |
| `business_automation.run_status` | Run/step status snapshot |
| `business_automation.run_snapshot` | Workspace run snapshot |
| `business_automation.cancel_run` | Cancel run |
| `business_automation.pause_run` | Pause run |
| `business_automation.foundation_executor_ack` | Foundation executor route target |

---

## 10. Hardcode Governance

| Prohibited | Status |
|------------|--------|
| Workflow sequences | ✅ From REG-AUTOMATION-WORKFLOW |
| Business processes | ✅ Not in orchestrator/broker core |
| Business engine mappings | ✅ From REG-AUTOMATION-EXECUTOR |
| Execution order | ✅ Topological sort from registry deps |
| Marketplace/supplier/product behaviour | ✅ Not embedded |

---

## 11. Validation Results

| Suite | Tests | Result |
|-------|-------|--------|
| G5-01 Automation Registry Foundation | 13 | ✅ Pass |
| G5-03 Workflow Scheduler & Queue | 11 | ✅ Pass |
| G5-04 Workflow Orchestrator & Execution Broker | 9 | ✅ Pass |
| Typecheck (`npm run typecheck`) | — | ✅ Pass |

### G5-04 Test Coverage

- Registry workflow resolution  
- DAG topological sort / dependency validation  
- Queue pickup + execution context  
- Brain dispatch via Execution Broker  
- EKLS audit events  
- Registry executor route targets  
- Plugin execution validators  
- Business engine Brain-mediated dispatch  

---

## 12. Stop Conditions

| Condition | Status |
|-----------|--------|
| Typecheck pass | ✅ |
| Tests pass | ✅ |
| Executive audit artifact | ✅ |
| G5-05 not started | ✅ |

---

## 13. Sign-Off

**G5-04 Workflow Orchestrator & Execution Broker is COMPLETE.**

Business Automation coordinates execution. Brain executes. No Business Engine logic is embedded in the orchestration layer.
