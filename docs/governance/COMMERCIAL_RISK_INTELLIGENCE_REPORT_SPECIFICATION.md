# Commercial Risk Intelligence Report (CRIR) — Specification

> **Canonical label:** CRIR Specification  
> **Canonical owner:** Commercial Architecture · Finance · Intelligence  
> **Authority:** `COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md` (CRI-004, CRI-005)  
> **Status:** ✅ Permanent repository specification — **documentation artifact only**

---

## 1. Purpose

Define the **minimum content** of a Commercial Risk Intelligence Report (CRIR) required before **future product launch approval** and **commercial risk certification**.

This specification does **not** implement report generation, storage, or UI. It governs what EmpireAI documentation and future systems must produce.

---

## 2. Report metadata (required header)

| Field | Description |
|-------|-------------|
| `reportId` | Unique identifier (e.g. `CRIR-2026-001`) |
| `productOrOpportunityId` | Linked company, SKU, or opportunity record |
| `workspaceId` / `companyId` | Scope |
| `supplierId(s)` | Primary and fallback suppliers |
| `marketplaceId(s)` | Target marketplaces and regions |
| `preparedBy` | Intelligence owner or delegated agent |
| `preparedAt` | ISO timestamp |
| `certificationStatus` | See §5 |
| `version` | Semantic version of report content |

---

## 3. Mandatory sections

Each section shall be **completed or explicitly marked `UNKNOWN_WITH_BLOCKER`** with documented reason and mitigation plan.

### 3.1 Supplier refund policy

- Supplier stated refund/return window and conditions  
- Restocking fees, return shipping responsibility  
- Non-refundable categories  
- EmpireAI customer-facing refund policy alignment gap  

### 3.2 Marketplace refund policy

- Platform A-to-z / buyer protection rules  
- Seller refund obligations and timelines  
- Category-specific policy overrides  
- Account health / defect rate triggers  

### 3.3 Customer refund exposure

- Estimated refund rate (assumption + source)  
- Maximum refund liability per order and per SKU batch  
- Customer service cost allowance  

### 3.4 Chargeback exposure

- Chargeback rate assumption (category benchmark or historical)  
- Dispute win-rate assumption  
- Payment processor reserve/hold risk  
- Total chargeback liability ceiling (period)  

### 3.5 Shipping risk

- Supplier shipping time variance  
- Lost/damaged shipment rates (assumption)  
- Cross-border customs/delay risk  
- Shipping cost variance vs quote  

### 3.6 Supplier reliability

- Fulfillment SLA history or proxy score  
- Stock accuracy risk  
- Communication / escalation path  
- Fallback supplier availability  

### 3.7 Legal or policy risks

- IP/trademark/category restriction risks  
- Prohibited claims (health, safety, marketplace TOS)  
- Regional sales restrictions  
- Tax/VAT collection obligations (high level)  

### 3.8 Expected margin after all costs

- Revenue per unit (assumption)  
- COGS, marketplace fees, payment fees, estimated ads, shipping, refunds, chargebacks  
- **Net margin % and net profit per unit** after all modeled costs  

### 3.9 Worst-case financial exposure

- Combined worst-case: refunds + chargebacks + shipping failures + ad spend at risk  
- Maximum loss if **zero** sales after pre-launch spend (where applicable)  
- Time-bound exposure window (e.g. first 30/60/90 days)  

### 3.10 Survivability assessment

- Explicit statement: **PASS** / **FAIL** / **CONDITIONAL**  
- Empire cash/runway impact if worst-case occurs  
- Whether launch threatens systematic financial loss (CRI-003)  
- Required conditions for CONDITIONAL pass  

---

## 4. Certification requirement

**Product launch approval shall require commercial risk certification.**

Launch documentation must reference:

- CRIR `reportId`  
- `certificationStatus` ≥ `GOVERNANCE_CERTIFIED` (and Grand King approval per CBD-018 where applicable)  
- Explicit **survivability PASS** or Grand King **written acceptance** of CONDITIONAL pass  

Launches with survivability **FAIL** are **prohibited** under CRI-003.

---

## 5. Certification workflow (documentation)

| Status | Meaning | Owner sign-off |
|--------|---------|----------------|
| `DRAFT` | Initial intelligence draft | Intelligence |
| `INTELLIGENCE_REVIEWED` | Sections 1–2, 5–7 complete | Intelligence lead |
| `FINANCE_REVIEWED` | Sections 8–10 validated | Finance owner |
| `GOVERNANCE_CERTIFIED` | Audit trail recorded; policy compliance | Governance |
| `GRAND_KING_APPROVED` | Launch authorized | Grand King |

---

## 6. Storage and traceability (future)

Recommended repository locations (when implemented):

- `docs/commercial-risk-reports/CRIR-{id}.md` (human-readable)  
- Journey / MCL linkage row for launch missions  
- Soul-memory capture of lessons from certified launches  

**Not required in this governance alignment mission.**

---

*CRIR Specification v1.0 — governance alignment 2026-06-21*
