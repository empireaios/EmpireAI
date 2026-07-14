# G5-00 — Business Automation Architecture

**Mission:** G5-00 — Business Automation Architecture  
**Authority:** Grand King · G3 suite complete · G4 Cockpit complete · Pillow §17 · EKLS · EA-003 RegistryLoader · EA-005 EPF  
**Date:** 2026-07-02  
**Status:** **ARCHITECTURE COMPLETE** — specification only; **no runtime implementation**  
**Prerequisites:** Executive Intelligence (G3) · Grand King Cockpit (G4) · Brain · Pillow · EKLS · Registry System  
**Amendment policy:** Future G5 evolution **amends this document**; implementation missions (G5-01+) cite this architecture as sole authority

---

## Executive Summary

**Business Automation (BA)** is EmpireAI’s **decision-to-execution orchestration layer**. It converts **approved executive decisions** into **executable business operations** by coordinating existing subsystems — it never duplicates them.

| Subsystem | BA relationship |
|-----------|-----------------|
| **Executive AI Engines (G3)** | Supplies decision snapshots and schedule manifests — BA consumes, never recalculates |
| **Pillow** | Governs approvals, objective discipline, and automation policy |
| **Brain** | Mandatory execution path for every automated action (`POST /brain/dispatch`) |
| **EKLS** | Institutional memory — outcomes, evidence, audit history, confidence |
| **Business Engines** | Domain execution targets — orders, listings, ads, payments, logistics |
| **Registry System** | Workflow definitions, triggers, policies, plugin manifests — **no hardcoded business** |
| **Grand King Cockpit** | Approval, monitoring, intervention, rollback UI — never owns automation logic |
| **Guardian** | Pre-dispatch safety on every Brain execution step |

**Core principle:** BA **orchestrates · schedules · gates · monitors · recovers** — it **owns no business logic**, **no intelligence scoring**, **no long-term memory**, and **no direct external API calls**.

**Target placement (Pillow §17 extension):**

```
Grand King
    │
EmpireAI
    │
Pillow
    │
    ├── … (Brain, EKLS, Registry, G3, Business Engines, Cockpit, …)
    ├── Business Automation          ← G5 (this architecture)
    └── Future Platform Services
```

---

## 1. Automation Philosophy

### 1.1 Purpose

Business Automation exists because **intelligence without execution is incomplete**. G3 answers *what should the Empire do*; G4 lets the Grand King *see and approve*; G5 *acts* — under governance.

### 1.2 Design tenets

| # | Tenet | Implication |
|---|-------|-------------|
| BA-1 | **Decision-first** | No automation run starts without a traceable executive decision or explicit Grand King authorization |
| BA-2 | **Orchestrate, never duplicate** | BA calls Brain, Business Engines, and G3 feeds — it does not reimplement them |
| BA-3 | **Registry-driven** | Workflows, triggers, steps, and policies resolve from Registry System — zero hardcoded marketplaces, suppliers, countries, or products |
| BA-4 | **Plugin-extensible** | New business capabilities register via EA-005 EPF — core BA code unchanged |
| BA-5 | **Pillow-governed** | Approvals, retention, escalation, and kill-switch authority flow through Pillow |
| BA-6 | **Fail safe** | Guardian + decision gate + rollback beat silent partial success |
| BA-7 | **Observable by default** | Every run is auditable in EKLS and visible in Cockpit |
| BA-8 | **Workspace-isolated** | No cross-workspace automation without explicit Pillow approval (EKLS policy) |
| BA-9 | **Idempotent steps** | Retries must not double-charge, double-publish, or duplicate irreversible actions |
| BA-10 | **Version every definition** | Workflow registry rows are immutable once published; changes = new version |

### 1.3 What Business Automation is NOT

- Not an AI Engine (no scoring, ranking, or domain analysis)
- Not a Business Engine (no marketplace API calls, no payment capture)
- Not Brain (no tool registry ownership, no LLM routing)
- Not Pillow (no executive reasoning, no repository mutation without approval chain)
- Not EKLS (no canonical memory ownership — contributes outcomes only)
- Not Cockpit (no UI business logic — visualises and approves only)
- Not a workflow hardcoding surface (no `if amazon-us then …` in core)

---

## 2. Automation Ownership

| Domain | Owner | BA role |
|--------|-------|---------|
| **Technical ownership** | Pillow (`EMPIREAI_PILLOW_CONSTITUTION.md` §17) | BA is a Pillow-owned subsystem |
| **Automation policy** | Pillow governance + Grand King approval | BA enforces policy; does not define it |
| **Workflow definitions** | Registry System (`REG-AUTOMATION-*`) | BA resolves definitions at runtime |
| **Execution** | Brain dispatch | BA submits dispatch requests only |
| **Domain operations** | Business Engines | BA invokes via Brain module tools |
| **Intelligence inputs** | Executive AI Engines (G3) | BA reads orchestrator consumer delivery |
| **Memory & audit** | EKLS under Pillow | BA writes run records via EKLS gateway |
| **Human intervention** | Grand King via Cockpit | BA surfaces pause/resume/rollback controls |

**Accountability chain:**

```
Grand King (final authority)
      ↓
Pillow (governance · approvals · objective filter)
      ↓
Business Automation (orchestration)
      ↓
Brain (execution dispatch)
      ↓
Business Engines + Guardian
```

---

## 3. Automation Boundaries

### 3.1 In scope (G5)

| Capability | Description |
|------------|-------------|
| Trigger evaluation | Decision gate, schedule, event, manual, registry-change |
| Workflow orchestration | DAG execution from registry-defined steps |
| Approval routing | Pillow / Cockpit approval cards before irreversible steps |
| Execution brokering | Brain dispatch envelope construction |
| State management | Run lifecycle, step status, correlation IDs |
| Monitoring & alerting | Cockpit + GC-03 notifications |
| Recovery & rollback | Compensating steps from registry rollback maps |
| Audit & reporting | EKLS outcome history + executive report hooks |

### 3.2 Out of scope (explicit non-goals — see §18)

- Intelligence calculation (G3)
- Executive UI layout (G4)
- Repository / Cursor missions (Pillow Mission System)
- Connector implementation (Business Engines + EPF runtime plugins)
- Constitutional / doctrine edits

### 3.3 Boundary diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BUSINESS AUTOMATION (G5)                              │
│  Trigger Engine · Scheduler · Workflow Orchestrator · Approval Router   │
│  Execution Broker · Monitor · Recovery · Audit Emitter                    │
└───────┬──────────┬──────────┬──────────┬──────────┬──────────┬───────────┘
        │          │          │          │          │          │
        ▼          ▼          ▼          ▼          ▼          ▼
     Pillow      Brain      EKLS       G3-10     Business   Registry
   (govern)   (dispatch)  (memory)   (decision)  Engines   (definitions)
        │          │          │          │          │          │
        └──────────┴──────────┴──────────┴──────────┴──────────┘
                              │
                              ▼
                    Grand King Cockpit (observe · approve · intervene)
```

---

## 4. Automation Lifecycle

### 4.1 Definition lifecycle (registry artifacts)

```
DRAFT → VALIDATED → PUBLISHED → DEPRECATED → RETIRED
```

| Stage | Actor | Rule |
|-------|-------|------|
| **DRAFT** | Engineering mission | Not executable in production |
| **VALIDATED** | Guardian + registry validator | Schema, permissions, rollback map present |
| **PUBLISHED** | Grand King / Pillow approval | Immutable version; eligible for triggers |
| **DEPRECATED** | Pillow governance | No new runs; existing runs complete |
| **RETIRED** | Pillow governance | Blocked; historical reference only |

### 4.2 Run lifecycle (runtime)

```
PROPOSED → VALIDATED → APPROVAL_PENDING → APPROVED → SCHEDULED → QUEUED
    → EXECUTING → { COMPLETED | FAILED | PAUSED | CANCELLED | ROLLING_BACK → ROLLED_BACK }
```

| State | Meaning | Transitions |
|-------|---------|-------------|
| **PROPOSED** | Trigger fired; run record created | → VALIDATED or CANCELLED |
| **VALIDATED** | Decision gate, permissions, registry resolution passed | → APPROVAL_PENDING or SCHEDULED |
| **APPROVAL_PENDING** | Awaiting Pillow / Grand King approval | → APPROVED or CANCELLED |
| **APPROVED** | Human or policy gate cleared | → SCHEDULED or QUEUED |
| **SCHEDULED** | Waiting for schedule slot | → QUEUED |
| **QUEUED** | Ready for orchestrator | → EXECUTING |
| **EXECUTING** | Steps in progress | → COMPLETED, FAILED, PAUSED |
| **PAUSED** | Grand King or policy hold | → EXECUTING or CANCELLED |
| **FAILED** | Unrecoverable step failure | → ROLLING_BACK (if map exists) |
| **ROLLING_BACK** | Compensating steps running | → ROLLED_BACK or FAILED |
| **ROLLED_BACK** | Compensation complete | terminal |
| **COMPLETED** | All steps success | terminal |
| **CANCELLED** | Aborted before irreversible action | terminal |

**Rule:** Irreversible steps (publish, charge, ship) require **APPROVED** state and Guardian `confirmed` payload.

---

## 5. Automation Governance

| Governance domain | Authority | Mechanism |
|-------------------|-----------|-----------|
| **Run authorization** | Pillow + Grand King | Approval model §9 |
| **Workflow publication** | Grand King via Pillow | Registry publish gate |
| **Objective alignment** | Pillow One Objective Rule | Runs tagged with `objectiveId`; out-of-scope → Improvement Vault queue only |
| **Commercial risk** | CRI / CRIR doctrine | Launch-class workflows require certification flag in registry |
| **Workspace isolation** | EKLS policy | `workspaceId` mandatory on every run |
| **Kill switch** | Grand King Cockpit | Global pause + per-workflow disable |
| **Plugin certification** | EA-005 EPF | Runtime plugins must be certified before LIVE automation steps |
| **Audit retention** | EKLS + Pillow | Outcomes never deleted; supersede only |

---

## 6. Automation States (data model)

### 6.1 AutomationRun

| Field | Type | Source |
|-------|------|--------|
| `runId` | UUID | BA generated |
| `workspaceId` | string | Required |
| `workflowId` | string | Registry `REG-AUTOMATION-WORKFLOW` |
| `workflowVersion` | semver | Registry pin |
| `triggerId` | string | Registry `REG-AUTOMATION-TRIGGER` |
| `triggerType` | enum | decision · schedule · event · manual · registry |
| `state` | enum | §4.2 lifecycle |
| `decisionSnapshotRef` | string? | G3-09/G3-10 correlation |
| `approvalRef` | string? | Pillow approval queue ID |
| `objectiveId` | string? | Pillow objective |
| `correlationId` | string | End-to-end trace |
| `parentRunId` | string? | Sub-workflow / rollback link |
| `startedAt` / `completedAt` | ISO8601 | Monitor |
| `pillowGovernance` | true | Required for EKLS writes |

### 6.2 AutomationStep

| Field | Type | Description |
|-------|------|-------------|
| `stepId` | string | Registry step definition ID |
| `runId` | string | Parent run |
| `sequence` | number | DAG order |
| `executorType` | enum | brain_dispatch · business_engine · g3_refresh · pillow_notify · ekls_record |
| `executorRef` | string | module:action or engine ID |
| `state` | enum | pending · running · succeeded · failed · skipped · rolled_back |
| `attempt` | number | Retry count |
| `brainDispatchId` | string? | Brain audit correlation |
| `rollbackStepId` | string? | Registry compensation mapping |
| `inputHash` / `outputHash` | string | Integrity verification |

---

## 7. Automation Triggers

| Trigger type | Source | Evaluation | Example |
|--------------|--------|------------|---------|
| **decision** | G3-10 `business-automation` consumer delivery | `finalRecommendation ∈ {PROCEED, PROCEED_WITH_CAUTION}` | Post–executive intelligence sweep |
| **schedule** | G3-10 / EKLS schedule manifest + `REG-AUTOMATION-SCHEDULE` | Cron / slot matcher | Hourly inventory sync |
| **event** | Brain event bus · webhooks · Business Engine signals | Registry event filter | Order paid → fulfilment workflow |
| **manual** | Cockpit · Pillow command | Grand King explicit | “Run launch readiness workflow” |
| **registry** | Registry change propagation | Row publish / plugin enable | New marketplace plugin certified |

**Trigger evaluation order (fail-fast):**

1. Global kill switch (Cockpit)
2. Workspace isolation (EKLS)
3. Pillow objective filter
4. G3 decision gate (if workflow requires intelligence)
5. Registry workflow eligibility (country, marketplace, engine availability)
6. Permission matrix (operational-access)
7. Guardian pre-check (dry-run where supported)

**No hardcoded triggers in core** — all triggers are `REG-AUTOMATION-TRIGGER` rows referencing workflow IDs and filter expressions resolved against registry context.

---

## 8. Automation Scheduling

### 8.1 Schedule sources

| Source | Role |
|--------|------|
| **G3-10 schedule manifest** | Intelligence-aligned slots (continuous, hourly, daily, on-demand) |
| **EKLS unified service schedule** | Memory / learning accumulation slots |
| **REG-AUTOMATION-SCHEDULE** | Business workflow cadence definitions |
| **Cockpit manual queue** | On-demand Grand King runs |

### 8.2 Scheduler architecture

```
Schedule Registry (REG-AUTOMATION-SCHEDULE)
        ↓
Automation Scheduler (BA component)
        ↓
Trigger Engine → Run PROPOSED
        ↓
Priority Queue (workspace-fair · objective-weighted)
```

| Policy | Rule |
|--------|------|
| **No overlap** | Same workflow + workspace cannot EXECUTING twice unless registry allows `concurrency: parallel` |
| **Backoff** | Failed schedule slot → exponential backoff; max attempts from registry |
| **Decision freshness** | Scheduled workflows requiring G3 must re-validate decision age < registry TTL |
| **Maintenance windows** | Registry-defined blackout periods |

---

## 9. Automation Approval Model

### 9.1 Approval tiers

| Tier | Steps | Approver | Mechanism |
|------|-------|----------|-----------|
| **A0 — Policy auto** | Read-only, G3 refresh, EKLS record | Pillow policy | No human gate |
| **A1 — Pillow gate** | Reversible business prep | Pillow approval queue | `pillow-approval` |
| **A2 — Grand King gate** | Irreversible commerce (publish, charge, ship) | Cockpit approval card | GC-02 Global Approval Bar |
| **A3 — Dual gate** | High-risk (CRIR launch class) | Pillow + Grand King | Sequential approvals |

### 9.2 Approval flow

```
Step requires approval tier > A0
        ↓
Create ApprovalRequest (Pillow)
        ↓
Surface in Cockpit (GC-02) + GC-03 notification
        ↓
Grand King: Approve · Reject · Defer
        ↓
Approved → Run state APPROVED → continue DAG
Rejected → Run CANCELLED + EKLS outcome record
Deferred → Run PAUSED + Improvement Vault optional
```

**Integration:** Pillow Approval Gate (`backend/src/orchestration/pillow-approval/`) — BA never bypasses.

---

## 10. Automation Execution Model

### 10.1 Execution principle

**Every side effect goes through Brain dispatch.** BA constructs dispatch envelopes; Brain routes to Business Engine tools; Guardian assesses each dispatch.

### 10.2 Step executors

| `executorType` | Delegates to | Example |
|----------------|--------------|---------|
| `brain_dispatch` | Brain `POST /brain/dispatch` | `{ module, action, payload, workspaceId }` |
| `business_engine` | Brain module tool for canonical engine | `marketplace-engine:publish_listing` |
| `g3_refresh` | Brain G3 module load | Refresh decision snapshot before gated step |
| `pillow_notify` | Pillow host notification | Executive alert on failure |
| `ekls_record` | EKLS governance gateway | Outcome + evidence append |

### 10.3 DAG orchestration

Workflows are ** directed acyclic graphs** defined in registry JSON (not code):

```json
{
  "workflowId": "wf-launch-readiness",
  "version": "1.0.0",
  "steps": [
    { "stepId": "refresh-intel", "executorType": "g3_refresh", "executorRef": "executive-intelligence-orchestrator:aggregate" },
    { "stepId": "validate-decision", "dependsOn": ["refresh-intel"], "executorType": "brain_dispatch", "executorRef": "decision-intelligence-engine:validate_gate" },
    { "stepId": "publish-listing", "dependsOn": ["validate-decision"], "approvalTier": "A2", "executorType": "business_engine", "executorRef": "marketplace-engine:publish" }
  ],
  "rollbackMap": {
    "publish-listing": "unpublish-listing"
  }
}
```

**Parallel steps:** Registry `dependsOn` graph; orchestrator respects topological order.

---

## 11. Component Architecture

### 11.1 Business Automation Core (BAC)

| Component | Responsibility | Owns business logic? |
|-----------|----------------|----------------------|
| **Trigger Engine** | Evaluate triggers against registry + G3 + events | No |
| **Scheduler** | Fire schedule slots; enqueue runs | No |
| **Workflow Orchestrator** | DAG state machine; step sequencing | No |
| **Approval Router** | Route to Pillow/Cockpit approval tiers | No |
| **Execution Broker** | Build Brain dispatch envelopes | No |
| **Registry Resolver** | Load workflow/trigger/policy from RegistryLoader | No |
| **State Store** | Ephemeral run state (SQLite/Redis); canonical outcomes → EKLS | No |
| **Monitor** | Health, SLAs, stuck-run detection | No |
| **Recovery Coordinator** | Retry, rollback, escalation | No |
| **Audit Emitter** | EKLS + Executive Audit artifacts | No |

### 11.2 Planned repository layout (G5-01+ — not implemented in G5-00)

```
backend/src/orchestration/business-automation/   ← target root (Pillow-owned)
├── contracts/          Run, step, trigger, workflow schemas
├── registry/           REG-AUTOMATION-* resolution adapters
├── triggers/           Trigger engine
├── scheduler/          Schedule matcher
├── orchestrator/       DAG executor
├── approval/           Approval router (Pillow bridge)
├── broker/             Brain dispatch broker
├── monitor/            Observability
├── recovery/           Retry + rollback
└── index.ts
```

---

## 12. Runtime Flow

### 12.1 Happy path (decision-triggered)

```
G3-10 publishes business-automation consumer delivery (PROCEED)
        ↓
Trigger Engine matches REG-AUTOMATION-TRIGGER (type: decision)
        ↓
Create AutomationRun (PROPOSED)
        ↓
Validate: workspace · objective · permissions · workflow version
        ↓
State → VALIDATED
        ↓
Approval Router (tier A0–A3 per first gated step)
        ↓
State → APPROVED
        ↓
Workflow Orchestrator loads DAG from registry
        ↓
For each step:
    Execution Broker → Brain dispatch
    Guardian assesses
    Business Engine executes
    Monitor records step state
    Audit Emitter → EKLS outcome fragment
        ↓
State → COMPLETED
        ↓
Cockpit panel refresh · GC-03 success notification · Executive report hook
```

### 12.2 Failure path

```
Step FAILED (retry budget exhausted)
        ↓
Recovery Coordinator evaluates rollbackMap
        ↓
If rollback exists → ROLLING_BACK → compensating steps via Brain
        ↓
Else → FAILED · Pillow notify · GC-03 alert · escalation policy
        ↓
EKLS records failure evidence + confidence adjustment hook
```

---

## 13. Interfaces

### 13.1 External API surface (future G5-01)

| Endpoint | Method | Consumer | Purpose |
|----------|--------|----------|---------|
| `/api/automation/runs` | GET | Cockpit | List runs (workspace scoped) |
| `/api/automation/runs/:id` | GET | Cockpit | Run detail + step timeline |
| `/api/automation/runs` | POST | Cockpit / Pillow | Manual trigger |
| `/api/automation/runs/:id/pause` | POST | Cockpit | Pause run |
| `/api/automation/runs/:id/resume` | POST | Cockpit | Resume run |
| `/api/automation/runs/:id/cancel` | POST | Cockpit | Cancel run |
| `/api/automation/runs/:id/rollback` | POST | Cockpit | Initiate rollback |
| `/api/automation/workflows` | GET | Cockpit | Registry-resolved workflow catalog |

**Rule:** All routes require auth + workspace + Pillow governance context.

### 13.2 Internal service interfaces

```typescript
/** G5-00 contract sketch — not implemented */

interface BusinessAutomationOrchestrator {
  evaluateTriggers(context: AutomationContext): Promise<TriggerEvaluation[]>;
  proposeRun(spec: ProposedRunSpec): Promise<AutomationRun>;
  advanceRun(runId: string): Promise<AutomationRun>;
  pauseRun(runId: string, actorId: string): Promise<void>;
  cancelRun(runId: string, actorId: string): Promise<void>;
  initiateRollback(runId: string, actorId: string): Promise<AutomationRun>;
}

interface AutomationExecutionBroker {
  executeStep(run: AutomationRun, step: AutomationStep): Promise<StepResult>;
  /** Always delegates to Brain — never calls engines directly */
}

interface AutomationRegistryResolver {
  resolveWorkflow(workflowId: string, version?: string): Promise<WorkflowDefinition>;
  resolveTrigger(triggerId: string): Promise<TriggerDefinition>;
  resolveSchedule(scheduleId: string): Promise<ScheduleDefinition>;
}
```

---

## 14. Integration Contracts

### 14.1 G3-10 Executive Intelligence Orchestrator

| Contract field | Direction | Usage |
|----------------|-----------|-------|
| `consumerDeliveries[business-automation]` | G3 → BA | Decision gate + schedule manifest reference |
| `decisionSnapshot.finalRecommendation` | G3 → BA | PROCEED / PROCEED_WITH_CAUTION / hold |
| `decisionSnapshot.decisionConfidence` | G3 → BA | Threshold checks in registry policies |
| `scheduleSlots[]` | G3 → BA | Scheduler alignment |
| `bridgeModule: "business-automation"` | G3 → BA | Integration boundary ID |

**BA never recalculates intelligence.** Stale decisions trigger `g3_refresh` step, not inline engine calls.

### 14.2 Pillow

| Interaction | Direction | Contract |
|-------------|-----------|----------|
| Approval queue | BA → Pillow | Create approval for A1+ tiers |
| Objective filter | Pillow → BA | Block runs misaligned with active objective |
| Kill switch | Pillow → BA | Global automation pause flag |
| Governance context | Pillow → BA | `pillowGovernance: true` on all operations |
| Notifications | BA → Pillow | Executive alerts on failure/escalation |

### 14.3 Brain

| Interaction | Direction | Contract |
|-------------|-----------|----------|
| Dispatch | BA → Brain | `POST /brain/dispatch` with module, action, payload |
| Guardian | Brain internal | Pre-check every dispatch |
| Event bus | Brain → BA | Event triggers (order paid, webhook) |
| Audit log | Brain → BA | `brainDispatchId` correlation |

**BA never registers tools or bypasses Orchestrator.**

### 14.4 EKLS

| Interaction | Direction | Contract |
|-------------|-----------|----------|
| Outcome history | BA → EKLS | Run completion records via governance gateway |
| Evidence | BA → EKLS | Step outputs, errors, rollback evidence |
| Decision linkage | BA → EKLS | `decisionSnapshotRef` on runs |
| Read | BA ← EKLS | Prior run outcomes for idempotency checks |
| Workspace isolation | EKLS policy | Enforced on every store/retrieve |

**BA never owns long-term memory** — ephemeral state in BA State Store; canonical history in EKLS.

### 14.5 Executive AI Engines (G3-01–G3-09)

| Interaction | Direction | Contract |
|-------------|-----------|----------|
| Intelligence refresh | BA → Brain → G3 modules | Via `g3_refresh` executor only |
| Direct engine call | **Forbidden** | Must go through Brain module routes |

### 14.6 Business Engines

| Interaction | Direction | Contract |
|-------------|-----------|----------|
| Domain execution | BA → Brain → Engine tool | Registry `executorRef` maps to module:action |
| Engine selection | Registry | `REG-AUTOMATION-WORKFLOW` step binds engine by ID, not hardcode |
| Plugin engines | EPF | Certified runtime plugins expose Brain tools |

### 14.7 Grand King Cockpit

| Interaction | Direction | Contract |
|-------------|-----------|----------|
| Run visibility | BA → Cockpit | `/cockpit/operations/automation` (future SCR) |
| Approvals | Cockpit → Pillow → BA | GC-02 approval bar |
| Notifications | BA → GC-03 | Run state changes |
| Manual triggers | Cockpit → BA | Grand King initiated runs |
| Kill switch UI | Cockpit → BA | Pause all / pause workflow |

**Cockpit never stores workflow definitions or executes steps directly.**

### 14.8 Registry System

| Registry ID | Purpose | Tier |
|-------------|---------|------|
| `REG-AUTOMATION-WORKFLOW` | DAG definitions | Policy / deployment |
| `REG-AUTOMATION-TRIGGER` | Trigger bindings | Policy |
| `REG-AUTOMATION-SCHEDULE` | Cron / slot definitions | Deployment |
| `REG-AUTOMATION-POLICY` | Approval tiers, retry, escalation | Constitutional / policy |
| `REG-AUTOMATION-ROLLBACK` | Compensation step maps | Policy |
| `DERIVED-AUTOMATION-CATALOG` | Resolved workflow catalog view | Derived |

**Extension:** New workflows = new registry rows + optional EPF plugin — **no BA core edit**.

---

## 15. Extension Points

| Extension | Mechanism | Registers through |
|-----------|-----------|-------------------|
| New workflow | `REG-AUTOMATION-WORKFLOW` row | RegistryLoader + Pillow publish approval |
| New trigger | `REG-AUTOMATION-TRIGGER` row | Registry |
| New schedule | `REG-AUTOMATION-SCHEDULE` row | Registry |
| New step executor type | EPF capability + BA plugin hook | EA-005 manifest (`automation_executor`) |
| New Business Engine step | Brain tool + registry `executorRef` | Business Engine mission |
| New marketplace/supplier/country | REG-MARKETPLACE / REG-SUPPLIER / REG-COUNTRY | EA-005 Layer A plugin |
| Live connector behaviour | EPF Layer B runtime plugin | Certified plugin host |
| Custom approval policy | `REG-AUTOMATION-POLICY` row | Pillow governance |
| Escalation rule | `REG-AUTOMATION-POLICY` escalation section | Registry |

**Forbidden extension pattern:** Subclassing BA orchestrator core, monkey-patching Brain dispatch, direct imports from `intelligence/` or `execution/` seeds.

---

## 16. Automation Monitoring

| Signal | Source | Surface |
|--------|--------|---------|
| Run state counts | BA Monitor | Cockpit automation dashboard |
| Step latency | BA Monitor | Observability metrics |
| Stuck runs (EXECUTING > SLA) | BA Monitor | GC-03 alert + Pillow notify |
| Decision gate pass rate | BA + G3 | Executive report |
| Approval queue depth | Pillow | Cockpit Mission Centre |
| Guardian blocks | Brain audit | Cockpit Infrastructure health |
| Engine availability | G3-10 feed | Automation hold reasons |

**SLA registry:** `REG-AUTOMATION-POLICY.sla` per workflow — not hardcoded in monitor.

---

## 17. Automation Recovery

| Scenario | Action |
|----------|--------|
| Transient Brain error | Retry step (registry `maxAttempts`, exponential backoff) |
| Guardian block | Pause run; surface reason in Cockpit; Grand King confirm retry |
| Business Engine timeout | Retry → fail → rollback if mapped |
| Partial DAG completion | Rollback completed steps in reverse topological order |
| Unrecoverable failure | FAILED + EKLS evidence + escalation |
| Data corruption suspicion | Guardian integrity check; halt workspace automations |

**Idempotency keys:** Every dispatch carries `correlationId` + `stepId` + `attempt` — Business Engines must honour idempotent retries where registry marks `idempotent: true`.

---

## 18. Automation Rollback

| Concept | Definition |
|---------|------------|
| **Rollback map** | Registry `rollbackMap`: forward step → compensating step |
| **Compensation** | Brain dispatch to inverse operation (unpublish, refund, cancel shipment) |
| **Scope** | Per-step; full-run rollback = reverse completed steps |
| **Approval** | Rollback of irreversible actions may require A2 Grand King gate |
| **Evidence** | EKLS records rollback chain |

**Rule:** Workflows without rollback maps cannot mark steps `irreversible: true` at publish validation.

---

## 19. Automation Retry

| Parameter | Source |
|-----------|--------|
| `maxAttempts` | REG-AUTOMATION-POLICY |
| `backoffMs` | REG-AUTOMATION-POLICY |
| `retryableErrors` | Registry error class list |
| `nonRetryableErrors` | Guardian blocks, approval rejected, decision HOLD |

**Jitter:** Scheduler adds random jitter to prevent thundering herd on hourly G3 slots.

---

## 20. Automation Auditing

| Audit event | Destination |
|-------------|-------------|
| Run proposed | EKLS Decision History + BA State Store |
| Approval granted/denied | EKLS + Pillow audit |
| Step executed | EKLS Outcome History + Brain audit log |
| Rollback initiated | EKLS Evidence Store |
| Workflow published | Executive Audit artifact + Registry revision |
| Kill switch activated | EKLS + COMBINED audit trigger |

**Standard:** `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md` — G5 missions produce mission audits in `artifacts/g5-*`.

---

## 21. Automation Observability

| Layer | Tooling |
|-------|---------|
| **Metrics** | Run duration, step success rate, trigger volume (backend observability) |
| **Traces** | `correlationId` across BA → Brain → Engine |
| **Logs** | Structured JSON; no secrets; workspace tagged |
| **Dashboards** | Cockpit Operations department |
| **Health** | `/health` includes BA scheduler heartbeat (future) |

---

## 22. Automation Reporting

| Report | Consumer | Source |
|--------|----------|--------|
| Daily automation summary | Executive Reports channel | EKLS aggregation |
| Workflow success/failure | Cockpit | BA Monitor |
| Decision-to-action latency | G3 + BA | Orchestrator + run timestamps |
| Commercial impact | Financial Intelligence feed | Post-run analytics step (registry optional) |

---

## 23. Automation Notifications

| Event | Channel |
|-------|---------|
| Approval required | GC-03 + Cockpit Mission Centre |
| Run completed | GC-03 (configurable severity) |
| Run failed | GC-03 + Pillow notify |
| Escalation | GC-03 + Pillow executive alert |
| Rollback complete | GC-03 |

**Registry:** `REG-AUTOMATION-POLICY.notifications` per workflow.

---

## 24. Automation Logging

| Rule | Requirement |
|------|-------------|
| Structured | JSON fields: runId, stepId, workspaceId, correlationId, state |
| No PII leakage | Redact customer payloads per UID doctrine |
| Correlation | Same `correlationId` from trigger through EKLS |
| Retention | Operational logs rotate; canonical events in EKLS |

---

## 25. Automation Security

| Control | Mechanism |
|---------|-----------|
| Authentication | Brain auth session (same as Cockpit) |
| Authorization | Operational-access permission matrix + registry step permissions |
| Workspace isolation | Mandatory workspaceId; EKLS cross-workspace block |
| Encryption | TLS in transit; secrets via credential vault only |
| Integrity | Step input/output hashes |
| Guardian | Every Brain dispatch |
| Least privilege | BA service account dispatches only registry-allowed module:actions |

---

## 26. Automation Permissions

| Permission scope | Example |
|------------------|---------|
| `automation:run:read` | View runs in workspace |
| `automation:run:trigger` | Manual trigger (Grand King) |
| `automation:run:pause` | Pause/resume |
| `automation:run:cancel` | Cancel run |
| `automation:run:rollback` | Initiate rollback |
| `automation:workflow:publish` | Registry publish (Pillow + King) |
| `automation:kill_switch` | Global pause (Grand King) |

**Binding:** Permissions declared in registry workflow rows and EPF plugin manifests — not inferred.

---

## 27. Automation Failure Handling

| Failure class | Handling |
|---------------|----------|
| **Validation** | Run never leaves PROPOSED; log reason |
| **Decision hold** | No run; surface G3 recommendation in Cockpit |
| **Approval denied** | CANCELLED |
| **Guardian block** | PAUSED; human review |
| **Engine error** | Retry → fail → rollback or FAILED |
| **Scheduler miss** | Catch-up policy from registry (skip vs run once) |
| **Registry missing** | Fail closed; alert ops |

---

## 28. Automation Escalation

| Level | Condition | Action |
|-------|-----------|--------|
| L1 | Step retry exhausted | GC-03 notification |
| L2 | Run FAILED, no rollback | Pillow notify |
| L3 | Repeated workflow failure (registry threshold) | Cockpit Mission Centre blocker |
| L4 | Commercial impact threshold | Grand King approval for retry |
| L5 | Guardian CRITICAL | Kill switch recommendation |

**Escalation policies:** `REG-AUTOMATION-POLICY.escalation` — fully registry-driven.

---

## 29. Future Compatibility

| Dimension | Design choice |
|-----------|---------------|
| **New businesses** | New workflow registry rows; same BAC |
| **New marketplaces** | REG-MARKETPLACE + EPF plugin; workflow references provider ID |
| **New countries** | REG-COUNTRY filter on triggers |
| **New suppliers** | REG-SUPPLIER + plugin |
| **New products** | REG-PRODUCT workspace rows; no SKU hardcoding in BA |
| **Distributed execution** | Brain queue already supports workers; BA remains orchestrator |
| **Multi-company** | Workspace + company scope on runs; EKLS isolation |
| **External schedulers** | Webhook trigger type accepts external cron (authenticated) |
| **AI step types** | Future registry executor `ai_assist` via Brain LLM router — not in G5-00 core |

---

## 30. Risks

| ID | Risk | Mitigation |
|----|------|------------|
| R1 | BA duplicates Business Engine logic | Architecture forbids; code review + Guardian module boundary |
| R2 | Hardcoded workflows creep in | REG-AUTOMATION-* only; EA-004 migration audits |
| R3 | Approval fatigue | Tier A0 for safe steps; batch approvals in Cockpit |
| R4 | Double execution on retry | Idempotency keys + registry flags |
| R5 | Stale G3 decision | Decision TTL + g3_refresh step |
| R6 | Rollback incomplete | Publish validation requires rollback map for irreversible steps |
| R7 | Cross-workspace leakage | EKLS isolation policy on every operation |
| R8 | Plugin uncertified live execution | EPF certification gate (EA-005) |
| R9 | Kill switch not tested | G5-01+ mission: drill in validation harness |
| R10 | 103 legacy runtime modules confuse BA targets | Canonical Business Engine map in registry derived view |

---

## 31. Non-Goals (G5-00)

| Non-goal | Owner instead |
|----------|---------------|
| Implement BAC runtime code | G5-01+ missions |
| Replace Pillow approvals | Pillow |
| Replace Brain dispatch | Brain |
| Replace EKLS memory | EKLS |
| Replace G3 intelligence | G3 suite |
| Replace Business Engine connectors | Business Engines + EPF |
| Replace Cockpit UI | G4 / G5 Cockpit wiring missions |
| Hardcode any business workflow | Registry System |
| Auto-modify repository | Pillow Mission System + Cursor bridge |
| Constitutional amendments | Grand King separate missions |

---

## 32. G5 Programme Roadmap (architecture-derived)

| Mission | Delivers | Depends on |
|---------|----------|------------|
| **G5-00** | This architecture | G3, G4, EKLS, Registry |
| **G5-01** | Registry schemas (`REG-AUTOMATION-*`) + validation | EA-003, G5-00 |
| **G5-02** | Trigger Engine + decision gate consumer | G3-10, G5-01 |
| **G5-03** | Scheduler + queue | G5-02, EKLS schedule manifest |
| **G5-04** | Workflow Orchestrator + Execution Broker | G5-03, Brain |
| **G5-05** | Approval Router + Pillow integration | G5-04, pillow-approval |
| **G5-06** | Recovery + rollback | G5-04, registry rollback maps |
| **G5-07** | Cockpit automation centre (SCR) | G5-04, G4 shell |
| **G5-08** | EKLS outcome integration | G5-04, EKLS gateway |
| **G5-09** | EPF automation executor plugins | EA-005, G5-04 |
| **G5-10** | Production readiness + executive audit | G5-01–G5-09 |

---

## 33. Repository Consistency

| Reference | Alignment |
|-----------|-----------|
| `EMPIREAI_PILLOW_CONSTITUTION.md` §17 | BA is Pillow-owned subsystem |
| `CANONICAL_EKLS_SPECIFICATION.md` | BA contributes to Outcome/Evidence/Decision history via gateway |
| `artifacts/ea-002-canonical-registry-architecture.md` | REG-AUTOMATION-* extends registry hierarchy |
| `artifacts/ea-005-plugin-framework.md` | EPF registers automation executors |
| G3-10 `business-automation` consumer | Primary decision trigger contract |
| G4 Cockpit | Operations department hosts automation SCR (future) |
| `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` | Business Engines as execution targets |

---

## 34. Completion Declaration

**G5-00 is complete.** The Business Automation architecture for EmpireAI Version 1 is fully specified. No runtime code was written. Implementation missions (G5-01+) shall cite this document as the sole architectural authority.

**Stop per mission directive.**

---

*G5-00 Business Automation Architecture · 2026-07-02 · Pillow Architecture · Grand King Authority*
