# G8-01 — Connection Registry Foundation · Executive Audit

**Mission:** G8-01 — Connection Registry Foundation  
**Authority:** Grand King · Pillow · Brain · Registry (EA-003) · EKLS · Identity & Authorization Platform (G8-00)  
**Date:** 2026-07-03  
**Status:** **COMPLETE**  
**Scope:** Registry-backed source of truth for external account connection definitions — metadata only (no OAuth, secrets, live authorization, or provider API calls)  
**Stop directive:** G8-02 **not started**

---

## Executive Summary

G8-01 implements the **Connection Registry Foundation** as the canonical registry layer for all external connection definitions. Fourteen foundation providers (including Email Provider and Domain Provider) are defined entirely as registry rows. Eight canonical registries integrate with G8-00 without duplicating ownership or creating parallel sources of truth.

**G8-02 not started** per mission directive.

---

## 1. Canonical Registries (8)

| Registry | Purpose |
|----------|---------|
| REG-CONNECTION-PROVIDER | Full provider contract (shared with production-workspace tier) |
| REG-CONNECTION-TYPE | Extended connection type definitions (shared with G8-00 IAP tier) |
| REG-CONNECTION-SCOPE | Provider scope maps |
| REG-CONNECTION-PERMISSION | Permission definitions with scope refs |
| REG-CONNECTION-ACCOUNT-HOLDER | Account holder relationship types |
| REG-CONNECTION-REQUIREMENT | Connection requirements per provider |
| REG-CONNECTION-CAPABILITY | Provider capability metadata |
| REG-CONNECTION-DEPENDENCY | Registry/provider dependency rules |

No duplicate registries. No parallel source of truth.

---

## 2. Foundation Providers (14 — all registry rows)

Amazon · Stripe · Meta · Google · Shopify · TikTok · OpenAI · Anthropic · GitHub · Vercel · Cloudflare · CJdropshipping · **Email Provider** · **Domain Provider**

---

## 3. Provider Categories (13 — dynamic)

`marketplace` · `payment` · `advertising` · `analytics` · `storefront` · `supplier` · `logistics` · `ai-provider` · `developer-platform` · `hosting-platform` · `domain-provider` · `email-provider` · `future-provider`

---

## 4. Account Holder Types (5 — registry-compatible)

Grand King · Future founder/customer · Workspace admin · Operator · External account owner

---

## 5. Status & Readiness Models

**Connection statuses (11):** `not_configured` · `pending` · `connected` · `authorized` · `partially_authorized` · `expired` · `revoked` · `failed` · `suspended` · `requires_review` · `unknown`

**Readiness states (9):** `ready` · `not_ready` · `missing_credentials` · `missing_permissions` · `expired` · `provider_unavailable` · `requires_reconnect` · `requires_review` · `unknown`

---

## 6. Subsystem Components

| Component | Location |
|-----------|----------|
| Connection registry types | `registry/types/connection-registry-types.ts` |
| Registry validator | `registry/validation/connection-registry-validator.ts` |
| Registry source | `registry/sources/connection-registry-source.ts` |
| Provider seed (canonical) | `connection-registry/data/connection-provider-seed.ts` |
| Scope/permission/account-holder seeds | `connection-registry/data/*-seed.ts` |
| Registry resolver | `connection-registry/registry/connection-registry-resolver.ts` |
| Connection registry service | `connection-registry/services/connection-registry-service.ts` |
| Pillow governance | `connection-registry/governance/connection-registry-pillow-governance.ts` |
| EKLS integration | `connection-registry/ekls/connection-registry-ekls-integration.ts` |
| Plugin host | `connection-registry/plugins/connection-registry-plugin-host.ts` |
| Brain tools (6 + init) | `connection-registry/tools/connection-registry-tools.ts` |
| Cockpit backend contracts | `connection-registry/contracts/connection-registry-cockpit-contracts.ts` |

---

## 7. Brain Tools (6 required)

| Tool | Purpose |
|------|---------|
| `connection_registry_list` | List all connection providers from registry |
| `connection_provider_detail` | Single provider full contract |
| `connection_requirements` | Connection requirements per provider |
| `connection_capabilities` | Provider capabilities |
| `connection_dependencies` | Dependency rules |
| `workspace_connection_profile` | Workspace connection profile + Cockpit view |

---

## 8. EKLS Learning Events (5)

`connection_provider_registered` · `connection_requirement_defined` · `connection_capability_defined` · `connection_profile_resolved` · `connection_registry_validation_failed`

---

## 9. Pillow Governance

Validates: workspace ownership · account holder eligibility · provider eligibility · permission boundary · registry compliance · no direct bypass

---

## 10. Cockpit Integration

- **Route:** `cockpit.operations.authorization-centre` (deferred — G8-05 owns full UI)
- **Backend contract only** — no Authorization Centre UI built

---

## 11. Plugin Support (7 kinds)

`connection_provider` · `connection_type` · `credential_type` · `scope_map` · `permission_map` · `dependency_rule` · `readiness_rule`

---

## 12. Security Compliance

- No credentials stored
- No secrets exposed or logged
- No provider API calls
- No OAuth flows
- No API key creation

---

## 13. Validation Results

| Check | Result |
|-------|--------|
| Backend typecheck | **PASS** |
| Frontend typecheck | **PASS** |
| G8-01 mission tests | **18/18 PASS** |
| G8-00 regression | **19/19 PASS** |

---

## 14. Programme Status

`connection-registry-foundation-established`  
Framework version: `g8-01-v1`  
Module ID: `connection-registry`  
Mission ID: `G8-01`

---

## Certification

✅ Implementation complete  
✅ Typecheck passes  
✅ Tests pass  
✅ Executive audit generated  

**Mission G8-01 complete. G8-02 not started.**
