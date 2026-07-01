# Commercial Risk Intelligence (CRI) Doctrine

> **Canonical label:** Commercial Risk Intelligence Doctrine  
> **Canonical owner:** Commercial Architecture · Governance · Intelligence  
> **Authority:** Executive Intelligence governance direction (2026-06-21)  
> **Status:** ✅ Permanent repository doctrine — **governance only** (no runtime enforcement in this document)  
> **Companion:** `COMMERCIAL_RISK_INTELLIGENCE_REPORT_SPECIFICATION.md` · ADR-051 · CBD companion §

---

## 1. Platform identity (repository truth)

**EmpireAI is an AI-powered e-commerce operating system.**

The **first commercial model** documented and prioritized in this repository is **global dropshipping** — product discovery, supplier-backed fulfillment, marketplace publication, and governed live commerce — executed through the canonical Commerce lifecycle (`EMPIREAI_COMMERCE_CANON.md`).

Future commercial models may extend the platform; they must not bypass CRI gates defined herein.

---

## 2. Core capability — Commercial Risk Intelligence (CRI)

**Commercial Risk Intelligence (CRI)** is a **permanent platform capability** in EmpireAI governance.

CRI is the continuous, structured analysis of commercial risk across **suppliers** and **marketplaces** so that launch, scale, and retirement decisions protect the Empire from systematic financial loss.

CRI is **not** a one-time checklist. It is an ongoing intelligence discipline integrated with Intelligence, Commerce, Finance, and Governance owners.

### 2.1 Dual-domain intelligence requirement

Commercial success depends on deep intelligence across **both**:

| Domain | Continuous analysis shall cover (minimum) |
|--------|----------------------------------------|
| **Suppliers** | Capabilities, reliability, refund policies, dispute processes, shipping performance, regional restrictions, cost structure, SLA risk |
| **Marketplaces** | Platform policies, fee schedules, refund rules, dispute/chargeback processes, shipping requirements, category restrictions, listing compliance, regional rules |

Additional cross-cutting analysis (repository-documented):

- Pricing opportunities and arbitrage opportunities (with explicit risk framing)
- Commercial risks (policy change, margin compression, fraud exposure)
- Expected margin after **all** costs (COGS, fees, ads, refunds, chargebacks, shipping variance)

---

## 3. Non-negotiable governance principles

| ID | Principle |
|----|-----------|
| **CRI-001** | **Survival over profit** — Empire survivability has higher priority than potential profit. No launch may jeopardize systematic solvency for speculative upside. |
| **CRI-002** | **Commercial risk transparency** — Material refund, dispute, fee, and exposure assumptions must be documented and visible to Grand King before irreversible launch actions. |
| **CRI-003** | **No systematic-loss launches** — EmpireAI shall **never knowingly launch** products whose refund or dispute structure can **reasonably** produce systematic financial loss. |
| **CRI-004** | **Launch certification** — Product launch approval **requires** commercial risk certification via a completed **Commercial Risk Intelligence Report** (CRIR). |
| **CRI-005** | **Pre-launch CRIR mandatory** — Before any future product launch, EmpireAI shall produce a CRIR meeting the minimum sections in `COMMERCIAL_RISK_INTELLIGENCE_REPORT_SPECIFICATION.md`. |
| **CRI-006** | **Triple alignment** — CRIR certification complements (does not replace) CBD-018 Executive + Soul + Grand King approval chain. |
| **CRI-007** | **Intelligence feeds Commerce** — CRI outputs are inputs to READINESS and PUBLICATION gates in the Commerce Canon; Commerce does not launch without CRI clearance when CRIR is required. |
| **CRI-008** | **Finance validates exposure** — Worst-case financial exposure and survivability assessment require Finance owner review sign-off on the CRIR. |
| **CRI-009** | **Governance records certification** — Governance owner maintains audit trail of CRIR IDs, certification status, and launch linkage. |
| **CRI-010** | **Backward compatibility** — Existing completed REAL missions and immutable CBD articles are unchanged; CRI applies to **future** launches and documentation-forward workflows. |

---

## 4. Commercial Risk Intelligence Report (CRIR)

Every future product launch requiring commercial risk certification shall have an associated **Commercial Risk Intelligence Report**.

**Minimum sections** (detail in specification document):

1. Supplier refund policy analysis  
2. Marketplace refund policy analysis  
3. Customer refund exposure  
4. Chargeback exposure  
5. Shipping risk  
6. Supplier reliability assessment  
7. Legal or policy risks  
8. Expected margin after all costs  
9. Worst-case financial exposure  
10. Survivability assessment  

**Certification states:** `DRAFT` → `INTELLIGENCE_REVIEWED` → `FINANCE_REVIEWED` → `GOVERNANCE_CERTIFIED` → `GRAND_KING_APPROVED` (launch may proceed only when policy requires all applicable states).

---

## 5. Repository owner responsibilities (updated)

The following **canonical repository owners** shall reflect CRI in their documented duties:

| Owner | CRI responsibility |
|-------|-------------------|
| **Commercial Architecture** | Maintain CRI doctrine; map CRIR to Commerce Canon gates; ensure launch workflows reference CRIR. |
| **Commerce / Execution** | Block launch documentation that lacks CRIR certification; surface CRI blockers in readiness evaluations. |
| **Intelligence** | Continuous supplier + marketplace policy/fee/refund/dispute intelligence; feed CRIR sections 1–2, 5–7. |
| **Finance** | Model margin-after-all-costs, worst-case exposure, survivability; sign Finance review on CRIR. |
| **Governance / Foundation** | Record CRIR certification; integrate with `empire-governance` assess patterns; audit trail. |
| **Executive Audit (Repository Governance · PILLOW-009)** | Verify CRI documentation presence in launch-related Executive Audits; flag missing CRIR. |
| **Pillow Supervisor (PILLOW-007)** | Ensure Cursor missions touching launch/commerce include CRI doc requirements; no code merge narratives that bypass CRIR. |
| **Pillow Mission Planner (PILLOW-006) / Brain planning** | Propose REAL missions for CRI automation; sequence CRI before launch REALs in planning artifacts. |
| **Launch workflows (Commerce Canon READINESS → PUBLICATION)** | Require CRIR certification as blocking condition alongside existing readiness blockers. |
| **Connector Kernel / Reality Integration** | Document supplier and marketplace connector limitations affecting CRI data freshness. |
| **Journey / Repository Governance** | Index CRI artifacts in Master Index; sync Journey when CRI gates affect milestone rows. |

---

## 6. Relationship to existing doctrine

| Artifact | Relationship |
|----------|--------------|
| **CBD-001→020** | Immutable. CRI extends via companion doctrine (survival priority aligns with CBD-002 net profit priority; CRI-001 elevates survivability when in conflict). |
| **REAL-051A Marketplace Autonomy** | Autonomous execution remains approval-gated; CRIR required before autonomous publish paths activate for new products. |
| **Commerce Canon C001** | CRIR added as READINESS exit criterion (documentation phase). |
| **ADR-051** | Architectural acceptance of CRI as permanent capability. |
| **Guardian / empire-governance** | Future runtime enforcement may assess dispatch against CRIR status; **not in scope of this governance mission**. |

---

## 7. Future REAL missions (documentation reference only)

The following **future** REAL missions are anticipated (not renumbering history):

| Proposed focus | Owner |
|----------------|-------|
| CRI report artifact schema + repository templates | Commercial Architecture · Governance |
| Supplier policy intelligence ingestion | Intelligence |
| Marketplace policy intelligence ingestion | Intelligence |
| CRIR generation workflow in Cockpit Governance | Product / Cockpit |
| Finance exposure calculator integration | Finance |
| Launch gate enforcement in `commerce-readiness-engine` | Commerce / Runtime |

---

*Commercial Risk Intelligence Doctrine v1.0 — governance alignment 2026-06-21*
