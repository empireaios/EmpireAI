# G8-05 — Authorization Centre Cockpit · Executive Audit

**Mission:** G8-05 — Authorization Centre Cockpit  
**Authority:** Grand King · Pillow · Brain · Registry (EA-003) · EKLS · G8-00 IAP · G8-01–G8-04  
**Date:** 2026-07-03  
**Status:** **COMPLETE**  
**Scope:** Grand King Cockpit Authorization Centre at `/cockpit/operations/authorizations` — executive control surface for external accounts, OAuth, credentials, health, and reconnect actions. Brain-only data path. No secrets exposed.  
**Stop directive:** G8-06 **not started**

---

## Executive Summary

G8-05 implements the **Authorization Centre Cockpit** — the executive UI for Identity & Authorization Platform capabilities built in G8-00 through G8-04. The panel aggregates registry-derived provider cards, health matrix, attention items, account holder groups, and EKLS reference summaries exclusively through Pillow-governed Brain tools. No parallel UI system. No direct frontend reads of IAP internals.

**G8-06 not started** per mission directive.

---

## 1. Cockpit Route & Navigation

| Item | Value |
|------|-------|
| Route | `/cockpit/operations/authorizations` |
| Screen ID | `SCR-304` |
| Section | Operations → Authorization Centre |
| Module ID | `cockpit-authorization-centre` |
| Brain module anchor | `identity-authorization` |

Navigation registered in `empireai-web/lib/cockpit/navigation.ts` without disturbing existing G4 structure.

---

## 2. Dashboard Sections

- Overall Authorization Readiness
- Connected / Disconnected Providers
- Expired Authorizations
- Missing Credentials / Missing Permissions
- Reconnect Required
- Provider Health Matrix
- Account Holder Connections (Grand King, future founder/customer, operator, external)
- Recent Authorization Activity (EKLS references only)
- Executive Attention Items
- Plugin widget slot

---

## 3. Provider Card Contract

Each card displays: Provider Name · Category · Connection Status · Authorization Status · Credential Status · Health Status · Readiness Status · Expiry · Required Action · Account Holder · Environment · Last Verified · Connect/Reconnect action

All fields registry/Brain-derived — no hardcoded provider list.

---

## 4. Detail View

Connection summary · Required/Granted/Missing scopes · Required/Granted/Missing permissions · Credential references (metadata only) · Health checks · Readiness result · EKLS event references · Brain actions · Pillow governance state

---

## 5. Executive Actions (Pillow-governed via Brain)

`start_authorization` · `submit_credential` · `reconnect` · `cancel_authorization` · `run_health_check` · `refresh_status` · `view_requirements` · `view_credential_references` · `view_ekls_events`

---

## 6. Brain Tools (4)

| Tool | Purpose |
|------|---------|
| `authorization_centre.load_view` | Load SCR-304 dashboard |
| `authorization_centre.load_detail` | Provider detail view |
| `authorization_centre.attention_items` | Executive attention items |
| `authorization_centre.execute_action` | Pillow-governed executive actions |

Orchestrator routes wired in `module-routes.ts` for `cockpit-authorization-centre`.

---

## 7. Subsystem Components

| Component | Location |
|-----------|----------|
| Cockpit types | `authorization-centre/contracts/authorization-centre-types.ts` |
| View loader | `authorization-centre/cockpit/authorization-centre-view-loader.ts` |
| Pillow governance | `authorization-centre/cockpit/authorization-centre-pillow-governance.ts` |
| Plugin registry | `authorization-centre/cockpit/authorization-centre-plugin-registry.ts` |
| Brain tools | `authorization-centre/tools/authorization-centre-tools.ts` |
| Module contract | `authorization-centre/contract/authorization-centre-module.ts` |
| Cockpit panel | `empireai-web/components/cockpit/widgets/AuthorizationPanels.tsx` |
| App route | `empireai-web/app/(cockpit)/cockpit/operations/authorizations/page.tsx` |

---

## 8. G8 Integration

Aggregates from G8-00 (readiness) · G8-01 (connection registry, account holders) · G8-02 (authorization flows) · G8-03 (credential references) · G8-04 (health matrix, attention items)

---

## 9. Security Compliance

- No secret keys, tokens, webhook secrets, or private keys in Cockpit payloads
- Credential references show metadata only (type, status, vault backend — no raw paths with secrets)
- All Brain tool responses pass redaction checks
- No direct frontend IAP service calls

---

## 10. UI Requirements

- Loading, empty, and error states via G4 Cockpit primitives
- Responsive provider card grid and health matrix table
- Accessible labels (`aria-label`, `role="region"`, `role="status"`)
- Status badges via existing `StatusBadge` component
- No fake metrics — counts derived from live Brain aggregation

---

## 11. Validation Results

| Check | Result |
|-------|--------|
| Backend typecheck | **PASS** |
| empireai-web typecheck | **PASS** |
| frontend typecheck | **PASS** |
| G8-05 mission tests | **11/11 PASS** |
| G8-00–G8-04 regression | **93/93 PASS** |
| Combined G8 suite | **104/104 PASS** |

---

## 12. Programme Status

`authorization-centre-cockpit-established`  
Framework version: `g8-05-v1`  
Module ID: `cockpit-authorization-centre`  
Mission ID: `G8-05`

---

## Certification

✅ Implementation complete  
✅ Backend typecheck passes  
✅ Frontend typecheck passes  
✅ Tests pass  
✅ Executive audit generated  

**Mission G8-05 complete. G8-06 not started.**
