# G8-02 — OAuth & API Authorization Framework · Executive Audit

**Mission:** G8-02 — OAuth & API Authorization Framework  
**Authority:** Grand King · Pillow · Brain · Registry (EA-003) · EKLS · G8-00 IAP · G8-01 Connection Registry  
**Date:** 2026-07-03  
**Status:** **COMPLETE**  
**Scope:** Canonical authorization flows for OAuth-style and API-key providers — flow state, contracts, callbacks, validation, Brain tools. No live APIs, no long-term secret storage.  
**Stop directive:** G8-03 **not started**

---

## Executive Summary

G8-02 implements the **OAuth & API Authorization Framework** — the canonical way EmpireAI initiates, tracks, validates, and completes external account authorization flows. All provider differences flow through registries (extended `REG-CONNECTION-REQUIREMENT` with `authorizationType`) and plugins. Credentials are referenced via deferred vault pointers only.

**G8-03 not started** per mission directive.

---

## 1. Authorization Types (10 — dynamic)

`oauth2` · `oauth1` · `api_key` · `secret_key` · `refresh_token` · `lwa` · `iam_role` · `webhook_secret` · `manual_upload` · `future_authorization_type`

---

## 2. Authorization Flow States (14)

`not_started` · `initiated` · `awaiting_redirect` · `awaiting_callback` · `awaiting_credentials` · `validating` · `authorized` · `partially_authorized` · `failed` · `expired` · `revoked` · `cancelled` · `requires_review` · `unknown`

---

## 3. Provider Authorization Support (registry-driven)

| Provider | Authorization Type |
|----------|-------------------|
| Amazon | LWA |
| Stripe | API key |
| Meta | OAuth2 |
| Google | OAuth2 |
| Shopify | OAuth2 |
| TikTok | OAuth2 |
| OpenAI | API key |
| Anthropic | API key |
| GitHub | OAuth2 |
| Vercel | API key |
| Cloudflare | API key |
| CJdropshipping | API key |

No live provider APIs called. No real credentials generated or stored.

---

## 4. Registry Integration

Resolves from:

- REG-CONNECTION-PROVIDER
- REG-CONNECTION-SCOPE
- REG-CONNECTION-PERMISSION
- REG-CONNECTION-REQUIREMENT (extended with `authorizationType`)
- REG-CONNECTION-CAPABILITY
- REG-IDENTITY-PROVIDER (via authorization resolver)
- REG-AUTHORIZATION-PROVIDER

---

## 5. Subsystem Components

| Component | Location |
|-----------|----------|
| Authorization contracts | `authorization-framework/contracts/authorization-framework-types.ts` |
| Cockpit future contracts | `authorization-framework/contracts/authorization-framework-cockpit-contracts.ts` |
| Brain module contract | `authorization-framework/contract/authorization-framework-module.ts` |
| Registry resolver | `authorization-framework/registry/authorization-framework-resolver.ts` |
| Authorization flow service | `authorization-framework/services/authorization-flow-service.ts` |
| State machine | `authorization-framework/services/authorization-state-machine.ts` |
| Scope/permission validator | `authorization-framework/services/scope-permission-validator.ts` |
| Pillow governance | `authorization-framework/governance/authorization-framework-pillow-governance.ts` |
| EKLS integration | `authorization-framework/ekls/authorization-framework-ekls-integration.ts` |
| Plugin host | `authorization-framework/plugins/authorization-framework-plugin-host.ts` |
| Brain tools (7) | `authorization-framework/tools/authorization-framework-tools.ts` |

---

## 6. Brain Tools (7)

| Tool | Purpose |
|------|---------|
| `authorization_start` | Start OAuth or API-key flow from registry |
| `authorization_callback_preview` | OAuth callback preview (secrets redacted) |
| `authorization_submit_credentials` | Submit credentials (vault reference only) |
| `authorization_validate_result` | Validate scopes/permissions from registry |
| `authorization_status` | Flow status + Cockpit view contract |
| `authorization_cancel` | Cancel authorization flow |
| `authorization_requirements` | Provider requirements from registry |

---

## 7. EKLS Learning Events (8)

`authorization_started` · `authorization_callback_received` · `credentials_submitted` · `authorization_validated` · `authorization_failed` · `authorization_cancelled` · `authorization_expired` · `authorization_revoked`

Never stores secrets in EKLS.

---

## 8. Pillow Governance

Validates: workspace ownership · account holder authority · provider eligibility · scope boundaries · permission boundaries · authorization type eligibility · security policy · no bypass

---

## 9. Security Compliance

- No secrets logged, exposed, or persisted in plain text
- Credential submissions use `vault:deferred:{authorizationId}` references only
- Callback preview redacts tokens and secrets
- No live provider API calls
- Tests use placeholder values only

---

## 10. Cockpit Integration

Future Authorization Centre contracts exposed (`cockpit-authorization-flow`) — presentation deferred to G8-05.

---

## 11. Plugin Support (6 kinds)

`authorization_provider` · `oauth_strategy` · `credential_validator` · `scope_mapper` · `permission_mapper` · `callback_handler`

---

## 12. Validation Results

| Check | Result |
|-------|--------|
| Backend typecheck | **PASS** |
| Frontend typecheck | **PASS** |
| G8-02 mission tests | **19/19 PASS** |
| G8-01 regression | **18/18 PASS** |
| G8-00 regression | **19/19 PASS** |

---

## 13. Programme Status

`oauth-api-authorization-framework-established`  
Framework version: `g8-02-v1`  
Module ID: `authorization-framework`  
Mission ID: `G8-02`

---

## Certification

✅ Implementation complete  
✅ Typecheck passes  
✅ Tests pass  
✅ Executive audit generated  

**Mission G8-02 complete. G8-03 not started.**
