# EmpireAI Marketplace Autonomy Doctrine — REAL-051A

> **Canonical label:** REAL-051A · Marketplace Autonomy Doctrine  
> **Authority:** Grand King Executive Directive · Certification Mode ACTIVE  
> **Status:** ✅ **ADOPTED** — 2026-06-29  
> **Type:** Permanent commercial operating model (governance only)  
> **Owner:** Repository Governance · Commercial Architecture  
> **Companion to:** `EMPIREAI_COMMERCIAL_BUSINESS_DOCTRINE_CBD.md` (immutable CBD-001→020) · `EMPIREAI_COMMERCE_CANON.md` (C001)  
> **Decision record:** ADR-050 · `EMPIREAI_DECISIONS.md`  
> **Runtime impact:** None — this document does not modify code, APIs, or approval authorities

---

## 1. Purpose

Formalize the EmpireAI Version 1 **commercial operating model** so the repository permanently enforces the founder experience already approved by Grand King:

- The founder performs **one-time legal onboarding** on third-party platforms only.
- After credentials are approved and stored securely, **EmpireAI becomes the operational executor** for marketplace and supplier operations.
- Automation respects the **existing constitutional approval chain** — no new authorities, no bypasses.

**Namespace note:** REAL-051A is a **governance doctrine label**. It is distinct from runtime module REAL-051 (Unified Grand King Headquarters). See ADR-044 namespace guidance.

---

## 2. Principle A — Founder One-Time Onboarding

The founder performs **only one-time legal onboarding** required by third-party platforms, including:

- Identity verification  
- Tax information  
- Banking information  
- Business verification  
- Acceptance of marketplace and supplier terms  

**EmpireAI must never require repetitive manual operational work after onboarding.**

| After onboarding | Founder role | EmpireAI role |
|---|---|---|
| Credentials approved | Strategic approval · governance decisions | Operational execution |
| Platform connected | Review dashboards · approve irreversible actions | Publish · sync · route · fulfil · monitor |
| Ongoing commerce | Grand King approval when doctrine requires | Autonomous operation within approved scope |

Re-onboarding is required **only** when a third-party platform mandates it (credential expiry, policy change, account suspension) — not as a default EmpireAI workflow.

---

## 3. Principle B — Marketplace Autonomy

After credentials are **approved**, **stored securely** in the credential vault, and **production activation gates** pass, EmpireAI becomes the **operational executor**.

EmpireAI is responsible for:

| Responsibility | Scope |
|---|---|
| Product publishing | Listings to approved marketplaces |
| Listing updates | Title, bullets, media, compliance fields |
| Pricing synchronization | Empire-owned pricing intelligence (CBD-008) |
| Inventory synchronization | Stock levels across connected channels |
| Supplier synchronization | Catalog, cost, availability (supplier-independent per CBD-006) |
| Marketplace synchronization | Cross-channel consistency |
| Order routing | Customer orders to fulfilment path |
| Fulfilment dispatch | Supplier / warehouse handoff (e.g. CJ) |
| Shipment tracking | Tracking sync and customer-facing status |
| Operational monitoring | Health, blockers, connector status |
| Retry and recovery | Transient failure handling within Guardian bounds |
| Health monitoring | Connector and pipeline health surfaces |

**All automation remains subject to existing governance approvals** (Principle D). EmpireAI executes; it does not self-authorize irreversible commercial actions.

This principle **operationalizes** GVD-009 (*Commerce Runtime Executes After Approval*) and CBD-020 (*Real Commercial Success*) without altering constitutional authority.

---

## 4. Principle C — Marketplace Strategy

The following product-to-channel strategy is **permanent repository doctrine**:

| Product class | Channel strategy |
|---|---|
| **Common products** | Publish **directly** to supported marketplaces (Amazon, eBay, Etsy, Walmart, TikTok Shop, Meta Commerce, Shopee, Lazada, and future adapters) |
| **Premium / branded products** | Automatically **generate and operate dedicated Shopify stores** |

| Rule | Requirement |
|---|---|
| **Classification** | EmpireAI intelligence classifies product tier; founder approves launch class when required by CBD-018 |
| **No duplicate paths** | One canonical lifecycle (Commerce Canon §2); strategy selects channel, not alternate workflows |
| **Shopify as brand surface** | Premium/branded path uses Shopify as owned storefront; marketplaces remain scale channels for common catalog |

This distinction aligns with CBD-003 (simplicity), CBD-013 (quality over quantity), and CBD-017 (commercial-driven expansion).

---

## 5. Principle D — Approval Chain

Marketplace autonomy automation **begins only after all three gates** are satisfied:

| # | Gate | Authority | Evidence |
|---|---|---|---|
| 1 | **Grand King approval** | Grand King | GC-02 · UX-014 · approval queue · `kingApproved` flags |
| 2 | **Executive governance approval** | Executive Council / executive governance | Council approval · Soul synthesis where required · CBD-018 |
| 3 | **Valid production credentials** | Operational activation | Credential vault · `LIVE_COMMERCE_INTEGRATION_MODE=production` · platform-specific secrets |

### Explicit prohibitions

| Prohibition | Constitutional basis |
|---|---|
| **No constitutional authority changes** | CTD · GVD-026 (no self-granted authority) |
| **No approval bypasses** | GVD-019 · CBD-018 · DOCTRINE-006 |
| **No silent automation** | GVD-024 · audit trail required |
| **No execution without credentials** | GVD-010 · OAR · Version 1 activation assessor |

Automation **accelerates execution after approval** — it does **not** replace approval.

---

## 6. Principle E — Future Expansion

This doctrine applies **generically** to current and future marketplace and supplier adapters, including but not limited to:

- Amazon  
- Shopify  
- CJ Dropshipping  
- TikTok Shop  
- Meta Commerce  
- Walmart  
- Etsy  
- eBay  
- Shopee · Lazada · WooCommerce · and future adapters registered in the operational access catalog  

| Rule | Requirement |
|---|---|
| **Adapter-agnostic** | New platforms adopt the same onboarding · autonomy · strategy · approval model |
| **No platform-specific redesign** | Extend adapters; do not fork governance per marketplace |
| **Supplier independence** | CBD-006 — CJ is first supplier, not permanent; autonomy applies to all verified suppliers |

Future platforms inherit Principle A–D without a new doctrine mission unless Grand King explicitly amends REAL-051A.

---

## 7. Constitutional compliance matrix

| Existing doctrine | REAL-051A alignment |
|---|---|
| **CBD-018** Triple Approval Chain | Principle D — unchanged; automation post-approval |
| **CBD-008** Empire Owns Pricing | Principle B — pricing sync is Empire-operated |
| **CBD-009** Empire Owns Listing | Principle B — listing updates are Empire-operated |
| **GVD-019** King approval for irreversible actions | Preserved — no bypass |
| **GVD-009** Commerce runtime after approval | Principle B operationalizes |
| **GVD-010** Reality integration authenticates | Principle D gate 3 |
| **UID / UX Contract** | Founder experience = approve + monitor, not repetitive ops |
| **Certification Mode (ADR-048)** | Doctrine only — does not close blockers by itself |
| **CRI Doctrine (ADR-051)** | Principle B autonomous publish for **new products** requires prior CRIR certification; survivability over profit (CRI-001) |

---

## 8. Operational activation cross-reference

Production execution paths documented in:

- `docs/governance/VERSION_1_GO_LIVE_PREPARATION_CHECKLIST.md`  
- `backend/src/orchestration/version-1-activation/` (implementation — unchanged by this doctrine)  
- `COMBINED_EXECUTIVE_AUDIT_EMPIREAI_V1_OPERATIONAL_ACTIVATION.md`  
- **Founder UI:** `IntegrationsHubPage` · UX-024 · `GET /integrations-hub/dashboard`

REAL-051A defines **what EmpireAI must do operationally** once activation gates pass; operational activation missions configure **how** the repository enables it.

---

## 9. Mission declaration template

Version 1 missions touching marketplace execution **shall** reference REAL-051A when declaring commercial operating intent:

```
Doctrine: REAL-051A Marketplace Autonomy
Approval chain preserved: yes
Runtime modified: [yes/no — default no for governance missions]
```

---

*Marketplace Autonomy Doctrine REAL-051A — permanent governance · no runtime change · await operational activation and Grand King go-live per blocker register.*
