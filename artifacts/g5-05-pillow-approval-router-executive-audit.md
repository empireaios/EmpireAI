# G5-05 — Pillow Approval Router · Executive Audit

**Mission:** G5-05 — Pillow Approval Router  
**Authority:** G5-00 Business Automation Architecture · G5-01–G5-04 · Pillow §17 · EKLS  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** Canonical approval layer — **routing and state only, no workflow or Business Engine execution**  
**Prerequisites:** G5-01 ✅ · G5-02 ✅ · G5-03 ✅ · G5-04 ✅

---

## Executive Summary

G5-05 implements the **Pillow Approval Router** as the canonical approval layer for Business Automation. Every automation request requiring approval passes through Pillow governance, registry-driven policy resolution, approval state tracking, notification routing via plugins, and Brain pause/resume coordination — **without executing workflows or Business Engines**.

**G5-06 not started** per mission directive.

---

## 1. Completed Work

| Capability | Status |
|------------|--------|
| Pillow Approval Router (`PillowApprovalRouter`) | ✅ |
| Nine approval states (not_required → completed) | ✅ |
| Approval tiers A0–A3 from REG-AUTOMATION-APPROVAL | ✅ |
| Full approval context contract | ✅ |
| REG-AUTOMATION-APPROVAL / POLICY / NOTIFICATION integration | ✅ |
| Pillow governance (authority, policy, workspace isolation) | ✅ |
| EKLS approval audit recorder | ✅ |
| Brain pause on pending / resume on grant / terminate on reject | ✅ |
| Cockpit approval status + Grand King review cards | ✅ |
| Notification plugin registry (no hardcoded providers) | ✅ |
| Approval plugin registry (providers, validators, observers, escalation) | ✅ |
| Trigger engine integration (approval_required → router submission) | ✅ |
| Orchestrator integration (APPROVAL_REQUIRED → pause + submit) | ✅ |

---

## 2. Files Created

| File | Purpose |
|------|---------|
| `contracts/approval-types.ts` | Approval states, request context, cockpit types |
| `approval/pillow-approval-router.ts` | Canonical Pillow Approval Router |
| `approval/approval-policy-resolver.ts` | Registry-driven approval policy resolution |
| `approval/approval-request-store.ts` | In-memory approval request store |
| `approval/approval-plugin-registry.ts` | Plugin registration surface |
| `governance/approval-pillow-governance.ts` | Pillow governance for approval decisions |
| `audit/approval-audit-recorder.ts` | EKLS-governed approval audit events |
| `services/approval-router-service.ts` | Brain tool handler layer |
| `validation/tests/g5-05-pillow-approval-router.test.ts` | 10 validation tests |
| `artifacts/g5-05-pillow-approval-router-executive-audit.md` | This audit |

---

## 3. Files Modified

| File | Change |
|------|--------|
| `triggers/approval-router.ts` | Delegates to canonical Pillow Approval Router |
| `triggers/trigger-engine.ts` | Submits approval requests on approval_required |
| `contracts/trigger-types.ts` | Added `approvalId` on TriggerEvaluation |
| `orchestrator/workflow-orchestrator.ts` | Pauses execution and submits approval on APPROVAL_REQUIRED |
| `data/automation-registry-seed.ts` | Approval configuration (expiryMs, notificationRefs) |
| `tools/business-automation-tools.ts` | Six approval Brain tools |
| `contract/business-automation-module.ts` | Mission G5-05 + capabilities |
| `agents/routes/module-routes.ts` | Approval dispatch routes |
| `index.ts` | Exported approval router + reset harness |
| `validation/tests/g5-02-automation-trigger-engine.test.ts` | Updated routing reason assertion |

---

## 4. Approval States

| State | Role |
|-------|------|
| `not_required` | A0 auto-approved path |
| `pending` | Request created |
| `awaiting_review` | Routed for Pillow/Grand King review |
| `approved` | Outcome granted (transient) |
| `rejected` | Outcome denied — workflow terminated |
| `expired` | Registry expiry elapsed |
| `cancelled` | Pillow-governed cancellation |
| `superseded` | Reserved for future multi-stage flows |
| `completed` | Approval lifecycle closed after resume |

---

## 5. Approval Flow

```
Automation request (trigger or execution step)
    → Pillow governance validation
    → Resolve REG-AUTOMATION-APPROVAL + POLICY + NOTIFICATION
    → Submit approval request (pending → awaiting_review)
    → Plugin notification delivery
    → EKLS audit: approval_requested
    → [Grant] resume scheduler/orchestrator → completed
    → [Reject/Expire/Cancel] terminate → audit outcome
```

---

## 6. Registry Integration

| Registry | Usage |
|----------|-------|
| `REG-AUTOMATION-APPROVAL` | Tier, routing rules, Pillow bridge, expiry |
| `REG-AUTOMATION-POLICY` | Notification refs, approval expiry fallback |
| `REG-AUTOMATION-NOTIFICATION` | Template/channel for plugin providers |

Foundation row `appr-foundation-tier-a1` carries `configuration.expiryMs: 86400000` and `notificationRefs`.

---

## 7. Brain Tools Added

| Tool | Purpose |
|------|---------|
| `business_automation.evaluate_approval` | Evaluate approval requirement |
| `business_automation.submit_approval` | Submit approval request |
| `business_automation.grant_approval` | Grant and resume automation |
| `business_automation.reject_approval` | Reject and terminate automation |
| `business_automation.approval_status` | Status + cockpit cards |
| `business_automation.expire_approvals` | Expire due approvals |

---

## 8. EKLS Audit Events

| Event | When |
|-------|------|
| `approval_requested` | Approval submitted |
| `approval_granted` | Approved |
| `approval_rejected` | Rejected |
| `approval_expired` | Expired |
| `approval_cancelled` | Cancelled |

---

## 9. Validation Results

| Suite | Tests | Result |
|-------|-------|--------|
| G5-05 Pillow Approval Router | 10 | ✅ Pass |
| G5-02 Trigger Engine (regression) | 15 | ✅ Pass |
| Typecheck (`npm run typecheck`) | — | ✅ Pass |

### G5-05 Test Coverage

- Registry resolution tests  
- Approval state transition tests  
- Full context contract tests  
- Pillow/EKLS audit tests  
- Trigger integration tests  
- Brain resume to scheduler tests  
- Notification plugin routing tests  
- Cockpit card exposure tests  
- Expiry policy tests  

---

## 10. Stop Conditions

| Condition | Status |
|-----------|--------|
| Typecheck pass | ✅ |
| Tests pass | ✅ |
| Executive audit artifact | ✅ |
| G5-06 not started | ✅ |

---

## 11. Sign-Off

**G5-05 Pillow Approval Router is COMPLETE.**

The Approval Router determines whether automation may proceed. Pillow governs all decisions. Workflows resume or terminate through Brain coordination — never through direct execution in the router.
