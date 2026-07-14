# G8-08 — Multi-Workspace & Customer Isolation · Executive Audit

**Mission:** G8-08 — Multi-Workspace & Customer Isolation  
**Authority:** Grand King · Pillow · Brain · Registry (EA-003) · EKLS · G8-00 IAP · G8-01–G8-07  
**Date:** 2026-07-03  
**Status:** **COMPLETE**  
**Scope:** Strict workspace, account-holder, and customer isolation across all G8 Identity & Authorization Platform components. No cross-boundary leakage of credentials, permissions, provider state, readiness, or authorization data.  
**Stop directive:** G8-09 **not started**

---

## Executive Summary

G8-08 implements the **Multi-Workspace & Customer Isolation** layer — enforcing registry-driven visibility boundaries across workspace, company, brand, account holder, Grand King, future customer, operator, and external account owner contexts. All G8 Brain tools are wrapped with isolation enforcement. Authorization Centre applies Cockpit visibility filters. Pillow governance is mandatory for every access decision.

**G8-09 not started** per mission directive.

---

## 1. Isolation Subjects

Workspace · company · brand · account holder · Grand King account · future customer account · operator account · external account owner · environment · provider · connection · credential reference · authorization record · health record · readiness result

---

## 2. Identity Isolation Contract

Every identity object supports: `workspaceId` · `companyId` · `brandId` · `accountHolderId` · `environment` · `providerId` · `connectionId` · `visibilityScope` · `accessPolicy` · `ownerReference` · `delegationState` · `governanceState` · `createdAt` · `updatedAt` · `correlationId`

---

## 3. Visibility Scopes (9)

`private_to_account_holder` · `workspace_visible` · `company_visible` · `brand_visible` · `operator_visible` · `grand_king_visible` · `pillow_governed` · `system_internal` · `future_scope`

Mapped from REG-CONNECTION-ACCOUNT-HOLDER `relationshipKind` — not hardcoded per account type ID.

---

## 4. Access Decisions (6)

`allow` · `deny` · `requires_approval` · `requires_delegation` · `requires_pillow_review` · `unknown`

---

## 5. Subsystem Components

| Component | Location |
|-----------|----------|
| Isolation contracts | `multi-workspace-isolation/contracts/isolation-types.ts` |
| Cockpit visibility | `multi-workspace-isolation/contracts/isolation-cockpit-contracts.ts` |
| Policy resolver | `multi-workspace-isolation/registry/isolation-policy-resolver.ts` |
| Filter service | `multi-workspace-isolation/services/isolation-filter-service.ts` |
| Enforcement service | `multi-workspace-isolation/services/isolation-enforcement-service.ts` |
| Brain gateway | `multi-workspace-isolation/tools/isolation-brain-gateway.ts` |
| Pillow governance | `multi-workspace-isolation/governance/isolation-pillow-governance.ts` |
| EKLS integration | `multi-workspace-isolation/ekls/` |
| Plugin host | `multi-workspace-isolation/plugins/isolation-plugin-host.ts` |

---

## 6. Registry Integration

Isolation behaviour from: REG-CONNECTION-ACCOUNT-HOLDER · REG-CONNECTION-POLICY · REG-CONNECTION-PROVIDER · REG-READINESS-POLICY · REG-IDENTITY-PROVIDER · REG-AUTHORIZATION-PROVIDER

---

## 7. Brain Integration

All G8 IAP Brain tools wrapped via `wrapG8BrainToolsWithIsolation` in `brain/index.ts`.

Additional tools: `identity_isolation_check` · `identity_visibility_matrix` · `account_holder_connection_scope` · `workspace_authorization_scope` · `credential_reference_visibility`

---

## 8. Cockpit Integration

Authorization Centre applies `applyCockpitIsolationFilter` with optional isolation actor. Exposes `isolationSummary` backend contract. Grand King full visibility; external/operator/customer scopes filtered per registry.

---

## 9. EKLS Kinds (6)

`isolation_check_passed` · `isolation_check_failed` · `visibility_scope_changed` · `delegation_created` · `delegation_revoked` · `unauthorized_access_blocked`

---

## 10. Security

Prevents: cross-workspace leakage · cross-customer leakage · credential leakage · authorization status leakage · readiness leakage · restricted provider metadata leakage · plugin privilege escalation

---

## 11. Validation

| Check | Result |
|-------|--------|
| Backend typecheck | PASS |
| empireai-web typecheck | PASS |
| frontend typecheck | PASS |
| G8-08 tests | 21/21 PASS |
| Combined G8 suite (G8-00–G8-08) | 166/166 PASS |

---

## 12. Mission Completion

✅ Implementation complete  
✅ Backend typecheck passes  
✅ Frontend typecheck passes  
✅ Tests pass  
✅ Executive audit generated  

**G8-09 not started.**
