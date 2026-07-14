# G8-07 — Automatic Reauthorization & Token Lifecycle · Executive Audit

**Mission:** G8-07 — Automatic Reauthorization & Token Lifecycle  
**Authority:** Grand King · Pillow · Brain · Registry (EA-003) · EKLS · G8-00 IAP · G8-01–G8-06  
**Date:** 2026-07-03  
**Status:** **COMPLETE**  
**Scope:** Registry-driven token lifecycle detection, refresh eligibility, reconnect requirements, and Pillow-governed reauthorization handoffs. No live provider calls. No secrets exposed.  
**Stop directive:** G8-08 **not started**

---

## Executive Summary

G8-07 implements the **Automatic Reauthorization & Token Lifecycle** layer for the Identity & Authorization Platform. The subsystem detects expiring, expired, revoked, and degraded authorizations using registry-resolved lifecycle profiles, generates reauthorization requests with full governance contracts, and exposes lifecycle summaries to the Authorization Centre backend. All behaviour is registry- or plugin-driven — no hardcoded provider refresh rules.

**G8-08 not started** per mission directive.

---

## 1. Token Lifecycle States (13)

`active` · `expiring_soon` · `expired` · `refresh_required` · `refreshing` · `refresh_failed` · `reconnect_required` · `reauthorization_pending` · `reauthorized` · `revoked` · `suspended` · `invalid` · `unknown`

---

## 2. Reauthorization Contract

Every reauthorization request includes: `reauthorizationId` · `connectionId` · `providerId` · `authorizationId` · `credentialRefId` · `workspaceId` · `accountHolderId` · `environment` · `reason` · `lifecycleState` · `requiredAction` · `expiry` · `warningWindow` · `refreshEligible` · `requiresUserAction` · `requiresPillowApproval` · `createdAt` · `updatedAt` · `correlationId` · `governanceState`

---

## 3. Subsystem Components

| Component | Location |
|-----------|----------|
| Lifecycle contracts | `automatic-reauthorization/contracts/token-lifecycle-types.ts` |
| Notification contracts | `automatic-reauthorization/contracts/token-lifecycle-notification-contracts.ts` |
| Cockpit contracts | `automatic-reauthorization/contracts/token-lifecycle-cockpit-contracts.ts` |
| Registry resolver | `automatic-reauthorization/registry/token-lifecycle-resolver.ts` |
| Expiry detector | `automatic-reauthorization/evaluators/expiry-detector.ts` |
| State machine | `automatic-reauthorization/services/reauthorization-state-machine.ts` |
| Request generator | `automatic-reauthorization/services/reauthorization-request-generator.ts` |
| Scheduler | `automatic-reauthorization/services/reauthorization-scheduler.ts` |
| Main service | `automatic-reauthorization/services/reauthorization-service.ts` |
| Pillow governance | `automatic-reauthorization/governance/token-lifecycle-pillow-governance.ts` |
| EKLS integration | `automatic-reauthorization/ekls/` |
| Plugin host | `automatic-reauthorization/plugins/token-lifecycle-plugin-host.ts` |
| Brain tools | `automatic-reauthorization/tools/token-lifecycle-tools.ts` |

---

## 4. Registry Integration

Lifecycle behaviour resolved from: REG-CONNECTION-PROVIDER · REG-CONNECTION-POLICY · REG-CONNECTION-REQUIREMENT · REG-CONNECTION-CAPABILITY · REG-CREDENTIAL-TYPE · REG-READINESS-POLICY · REG-IDENTITY-MONITOR

Warning windows derived from registry `reconnectRuleRefs` / `recoveryRuleRefs` or plugin expiry evaluators — not hardcoded per provider.

---

## 5. Brain Tools (8)

| Tool | Purpose |
|------|---------|
| `token_lifecycle_summary` | Workspace lifecycle summary |
| `token_lifecycle_detail` | Provider lifecycle detail |
| `reauthorization_required` | Providers needing reauthorization |
| `reauthorization_start` | Start Pillow-governed reauthorization handoff |
| `reauthorization_cancel` | Cancel reauthorization request |
| `reauthorization_status` | Reauthorization status |
| `token_expiry_warnings` | Expiring-soon warnings |
| `refresh_eligibility` | Registry-driven refresh eligibility |

Module ID: `automatic-reauthorization` · EKLS channel: `automatic-reauthorization`

---

## 6. Pillow Governance

Validates: reauthorization authority · workspace isolation · account holder authority · credential visibility · refresh eligibility · security policy · manual approval requirement.

---

## 7. EKLS Kinds (8)

`token_expiring_soon` · `token_expired` · `reauthorization_requested` · `reauthorization_completed` · `reauthorization_failed` · `token_revoked` · `refresh_attempted` · `refresh_blocked`

Metadata only — never stores tokens or secrets.

---

## 8. Cockpit Integration (G8-05 enhancement)

Authorization Centre view extended with `tokenLifecycleSummary`: expiring soon count · expired count · reconnect required count · reauthorization pending count · required account-holder action. No UI redesign.

---

## 9. Notification Contracts

Prepared for: token expiring soon · token expired · reauthorization required · refresh failed · permission revoked · provider reconnect needed. No hardcoded notification provider.

---

## 10. Plugin Support

Plugins may register: refresh providers · reauthorization providers · expiry evaluators · token validators · reconnect handlers · notification providers.

---

## 11. Security

- Never exposes, logs, or stores raw tokens
- Credential references only in lifecycle records
- `redactTokenLifecycleSecrets` + `assertNoSecretsInTokenLifecyclePayload` on all Brain outputs
- Reauthorization handoffs are metadata-only (`liveProviderCall: false`)

---

## 12. Validation

| Check | Result |
|-------|--------|
| Backend typecheck | PASS |
| empireai-web typecheck | PASS |
| frontend typecheck | PASS |
| G8-07 tests | 22/22 PASS |
| Combined G8 suite (G8-00–G8-07) | PASS |

Test coverage: expiry detection · expiring soon warnings · refresh eligibility · reauthorization request creation · state transitions · revoked handling · Brain tools · Pillow governance · EKLS recording · Cockpit contracts · plugin compatibility · secret redaction

---

## 13. Mission Completion

✅ Implementation complete  
✅ Backend typecheck passes  
✅ Frontend typecheck passes  
✅ Tests pass  
✅ Executive audit generated  

**G8-08 not started.**
