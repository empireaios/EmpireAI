# G8-06 — Operational Readiness Engine · Executive Audit

**Mission:** G8-06 — Operational Readiness Engine  
**Authority:** Grand King · Pillow · Brain · Registry (EA-003) · EKLS · G8-00 IAP · G8-01–G8-05  
**Date:** 2026-07-03  
**Status:** **COMPLETE**  
**Scope:** Registry-driven operational readiness calculation for EmpireAI platform, workspace, brand, account holder, workflow, automation, and commerce operations. No live provider calls. No secrets exposed.  
**Stop directive:** G8-07 **not started**

---

## Executive Summary

G8-06 implements the **Operational Readiness Engine** — the readiness calculation layer for the Identity & Authorization Platform. The engine resolves requirements exclusively from registries (REG-READINESS-POLICY, REG-CONNECTION-PROVIDER, REG-CONNECTION-REQUIREMENT, REG-CONNECTION-CAPABILITY, REG-CONNECTION-DEPENDENCY, REG-IDENTITY-MONITOR, REG-AUTOMATION-WORKFLOW, REG-COMMERCE-POLICY) and evaluates connection, authorization, credential, and health state in memory. Business Automation and Commerce components receive readiness answers without executing automation or live provider calls.

**G8-07 not started** per mission directive.

---

## 1. Readiness Levels

| Level | Meaning |
|-------|---------|
| `ready` | Required providers connected, no blockers |
| `partially_ready` | Some providers connected or degraded |
| `not_ready` | Missing credentials, permissions, or connections |
| `blocked` | Expired or critical policy blockers |
| `requires_review` | Ambiguous state requiring executive review |
| `unknown` | Insufficient evidence |

---

## 2. Readiness Result Contract

Every evaluation returns: `readinessScore` · `readinessLevel` · `requiredProviders` · `connectedProviders` · `missingProviders` · `expiredProviders` · `degradedProviders` · `missingCredentials` · `missingPermissions` · `missingScopes` · `blockingIssues` · `warnings` · `recommendedActions` · `evidence` · `lastEvaluatedAt` · `correlationId` · `governanceState`

---

## 3. Readiness Contexts (16)

Empire platform · workspace · company · brand · account holder · business model · workflow · automation · marketplace operation · storefront operation · advertising operation · payment operation · supplier operation · logistics operation · analytics operation · future operation type

Operation contexts resolve required providers via registry `providerCategory` — no hardcoded provider IDs.

---

## 4. Subsystem Components

| Component | Location |
|-----------|----------|
| Readiness contracts | `operational-readiness-engine/contracts/readiness-types.ts` |
| Cockpit contracts | `operational-readiness-engine/contracts/readiness-cockpit-contracts.ts` |
| Policy resolver | `operational-readiness-engine/registry/readiness-policy-resolver.ts` |
| Provider evaluator | `operational-readiness-engine/evaluators/provider-readiness-evaluator.ts` |
| Workspace evaluator | `operational-readiness-engine/evaluators/workspace-readiness-evaluator.ts` |
| Workflow/automation evaluator | `operational-readiness-engine/evaluators/workflow-readiness-evaluator.ts` |
| Missing requirement detector | `operational-readiness-engine/services/missing-requirement-detector.ts` |
| Scoring service | `operational-readiness-engine/services/readiness-scoring-service.ts` |
| Recommendation service | `operational-readiness-engine/services/readiness-recommendation-service.ts` |
| Main service | `operational-readiness-engine/services/operational-readiness-service.ts` |
| Pillow governance | `operational-readiness-engine/governance/readiness-pillow-governance.ts` |
| EKLS integration | `operational-readiness-engine/ekls/` |
| Plugin host | `operational-readiness-engine/plugins/readiness-plugin-host.ts` |
| Brain tools | `operational-readiness-engine/tools/operational-readiness-tools.ts` |

---

## 5. Brain Tools (8)

| Tool | Purpose |
|------|---------|
| `readiness_overview` | Workspace readiness overview |
| `readiness_for_workspace` | Workspace evaluation |
| `readiness_for_account_holder` | Account holder boundary evaluation |
| `readiness_for_provider` | Provider readiness (Can Amazon/Stripe run?) |
| `readiness_for_workflow` | Workflow readiness (Can this workflow run?) |
| `readiness_for_automation` | Automation readiness (Can this automation execute?) |
| `readiness_blockers` | Blockers and missing connections |
| `readiness_recommendations` | Recommendations and next required action |

Module ID: `operational-readiness-engine` · EKLS channel: `operational-readiness-engine`

---

## 6. Pillow Governance

Validates: evaluation authority · workspace isolation · account holder boundary · provider visibility · connection visibility · business operation eligibility. No readiness result is trusted without Pillow governance.

---

## 7. EKLS Kinds (6)

`readiness_evaluated` · `readiness_blocked` · `readiness_recovered` · `readiness_degraded` · `readiness_requirement_missing` · `readiness_recommendation_generated`

Metadata only — never stores secrets.

---

## 8. Cockpit Integration (G8-05 enhancement)

Authorization Centre view loader extended with `readinessSummary` backend contract: overall readiness score/level · blocked actions · next required action · provider readiness count. No UI redesign.

---

## 9. Plugin Support

Plugins may register: readiness rules · provider readiness evaluators · workflow readiness evaluators · recommendation generators · blocker detectors — without modifying readiness core.

---

## 10. Security

- Never exposes secrets, vault paths, or unauthorized provider data
- `redactReadinessSecrets` + `assertNoSecretsInReadinessPayload` on all Brain tool outputs
- Registry-driven requirements only — no hardcoded provider/workflow/country/scope/permission requirements

---

## 11. Validation

| Check | Result |
|-------|--------|
| Backend typecheck | PASS |
| empireai-web typecheck | PASS |
| frontend typecheck | PASS |
| G8-06 tests | 19/19 PASS |
| Combined G8 suite (G8-00–G8-06) | PASS |

Test coverage: workspace readiness · provider readiness · workflow readiness · automation readiness · missing provider detection · missing permission detection · expired connection blocker · readiness scoring · Brain tools · Pillow governance · EKLS recording · secret redaction · plugin compatibility · Cockpit readiness summary

---

## 12. Mission Completion

✅ Implementation complete  
✅ Backend typecheck passes  
✅ Frontend typecheck passes  
✅ Tests pass  
✅ Executive audit generated  

**G8-07 not started.**
