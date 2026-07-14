# G8-04 — Connection Health & Monitoring · Executive Audit

**Mission:** G8-04 — Connection Health & Monitoring  
**Authority:** Grand King · Pillow · Brain · Registry (EA-003) · EKLS · G8-00 IAP · G8-01 Connection Registry · G8-02 Authorization Framework · G8-03 Credential Vault  
**Date:** 2026-07-03  
**Status:** **COMPLETE**  
**Scope:** Connection health model, monitoring contracts, registry-driven evaluators, Brain tools, EKLS health records, Pillow governance, future Cockpit contracts, notification contracts. No live provider API calls. No secrets in monitoring records.  
**Stop directive:** G8-05 **not started**

---

## Executive Summary

G8-04 implements the **Connection Health & Monitoring** layer — determining whether connected external accounts are healthy, degraded, expired, revoked, incomplete, or requiring attention. All monitoring behaviour resolves from registries and plugins. Health checks integrate with G8-02 authorization state and G8-03 credential references without storing or exposing raw secrets.

**G8-05 not started** per mission directive.

---

## 1. Health States (13)

`healthy` · `degraded` · `warning` · `expired` · `revoked` · `failed` · `unavailable` · `misconfigured` · `missing_credentials` · `missing_permissions` · `requires_reconnect` · `requires_review` · `unknown`

---

## 2. Monitoring Contract

Every connection health check contains:

`healthCheckId` · `connectionId` · `providerId` · `workspaceId` · `accountHolderId` · `environment` · `checkType` · `status` · `severity` · `message` · `evidence` · `lastCheckedAt` · `nextCheckAt` · `expiry` · `requiredAction` · `correlationId` · `governanceState`

---

## 3. Check Types (12 — dynamic)

`credential_present` · `credential_expiry` · `authorization_status` · `scope_completeness` · `permission_completeness` · `webhook_status` · `provider_availability` · `sandbox_status` · `production_status` · `readiness_status` · `manual_review` · `future_check_type`

---

## 4. Provider Health Support (registry-driven — 14 providers)

Amazon SP-API · Stripe · Meta · Google · Shopify · TikTok · OpenAI · Anthropic · GitHub · Vercel · Cloudflare · CJdropshipping · Email Provider · Domain Provider

No live provider APIs called. No real credentials generated or stored.

---

## 5. Registry Integration

Resolves monitoring behaviour from:

- REG-IDENTITY-MONITOR
- REG-CONNECTION-PROVIDER
- REG-CONNECTION-REQUIREMENT
- REG-CONNECTION-CAPABILITY
- REG-CONNECTION-POLICY
- REG-CREDENTIAL-TYPE
- REG-READINESS-POLICY

---

## 6. Subsystem Components

| Component | Location |
|-----------|----------|
| Health contracts | `connection-health-monitoring/contracts/connection-health-types.ts` |
| Notification contracts | `connection-health-monitoring/contracts/connection-health-notification-contracts.ts` |
| Cockpit future contracts | `connection-health-monitoring/contracts/connection-health-cockpit-contracts.ts` |
| Brain module contract | `connection-health-monitoring/contract/connection-health-module.ts` |
| Registry resolver | `connection-health-monitoring/registry/connection-health-resolver.ts` |
| Monitoring service | `connection-health-monitoring/services/connection-monitoring-service.ts` |
| Credential health evaluator | `connection-health-monitoring/evaluators/credential-health-evaluator.ts` |
| Authorization health evaluator | `connection-health-monitoring/evaluators/authorization-health-evaluator.ts` |
| Expiry evaluator | `connection-health-monitoring/evaluators/expiry-evaluator.ts` |
| Permission health evaluator | `connection-health-monitoring/evaluators/permission-health-evaluator.ts` |
| Provider health evaluator | `connection-health-monitoring/evaluators/provider-health-evaluator.ts` |
| Readiness health bridge | `connection-health-monitoring/evaluators/readiness-health-bridge.ts` |
| Pillow governance | `connection-health-monitoring/governance/connection-health-pillow-governance.ts` |
| EKLS integration | `connection-health-monitoring/ekls/connection-health-ekls-integration.ts` |
| Plugin host | `connection-health-monitoring/plugins/connection-health-plugin-host.ts` |
| Brain tools (6) | `connection-health-monitoring/tools/connection-health-tools.ts` |

---

## 7. Brain Tools (6)

| Tool | Purpose |
|------|---------|
| `connection_health_list` | List health checks (metadata only) |
| `connection_health_detail` | Provider health detail |
| `run_connection_health_check` | Run registry-driven checks |
| `connection_health_summary` | Workspace health summary |
| `connection_health_attention_items` | Connections requiring attention |
| `provider_health_matrix` | Provider health matrix + Cockpit contract |

All tools apply secret redaction before returning.

---

## 8. EKLS Learning Events (7)

`connection_health_checked` · `connection_health_degraded` · `connection_health_recovered` · `connection_expired` · `connection_revoked` · `connection_requires_reconnect` · `connection_monitoring_failed`

Never stores secrets in EKLS.

---

## 9. Pillow Governance

Validates: workspace ownership · account holder authority · provider eligibility · monitoring permission · credential visibility boundary · health check authority · no bypass

---

## 10. Notification Contracts (prepared — no UI)

`expired_credential` · `token_expiring_soon` · `missing_permission` · `provider_degraded` · `webhook_failing` · `connection_revoked`

Delivery deferred to G8-05.

---

## 11. Cockpit Integration

Future Authorization Centre contracts exposed:

- Health summary
- Provider matrix
- Attention items
- Expired connections
- Reconnect required
- Missing permissions

Presentation deferred to G8-05.

---

## 12. Plugin Support (6 kinds)

`health_check_provider` · `monitoring_strategy` · `expiry_evaluator` · `permission_evaluator` · `webhook_monitor` · `provider_availability_check`

---

## 13. Wiring

| Integration | Status |
|-------------|--------|
| Brain (`backend/src/brain/index.ts`) | `connectionHealthTools` registered |
| EKLS gateway channel | `connection-health-monitoring` added |
| IAP public surface | Exports + harness reset extended |

---

## 14. Validation Results

| Check | Result |
|-------|--------|
| Backend typecheck | **PASS** |
| Frontend typecheck | **PASS** |
| G8-04 mission tests | **20/20 PASS** |
| G8-03 regression | **17/17 PASS** |
| G8-02 regression | **19/19 PASS** |
| G8-01 regression | **18/18 PASS** |
| G8-00 regression | **19/19 PASS** |
| Combined G8 suite | **93/93 PASS** |

---

## 15. Programme Status

`connection-health-monitoring-established`  
Framework version: `g8-04-v1`  
Module ID: `connection-health-monitoring`  
Mission ID: `G8-04`

---

## Certification

✅ Implementation complete  
✅ Backend typecheck passes  
✅ Frontend typecheck passes  
✅ Tests pass  
✅ Executive audit generated  

**Mission G8-04 complete. G8-05 not started.**
