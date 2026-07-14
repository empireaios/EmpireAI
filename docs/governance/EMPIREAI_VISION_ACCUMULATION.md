# EMPIREAI VISION ACCUMULATION

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Document ID:** P1-03  
> **Constitutional phase:** P1 — Identity Foundation  
> **Dependencies:** P1-01 · [`EMPIREAI_VISION.md`](../EMPIREAI_VISION.md) · P1-02 · [`EMPIREAI_REASONING_MODEL.md`](./EMPIREAI_REASONING_MODEL.md)  
> **Authority:** Grand King  
> **Established:** 2026-07-04  
> **Steward:** Pillow COI (Vision stewardship)  
> **Role:** Ensure Vision is **never static** — every completed mission may permanently enrich constitutional WHY

**Companion (operational register):** [`EMPIREAI_VISION_ACCUMULATION_REGISTER.md`](./EMPIREAI_VISION_ACCUMULATION_REGISTER.md)  
**Short policy pointer:** [`EMPIREAI_VISION_ACCUMULATION_POLICY.md`](./EMPIREAI_VISION_ACCUMULATION_POLICY.md)

---

## 1. Purpose

EmpireAI must **continuously learn from itself**.

P1-01 established **why** the empire exists. P1-02 established **how every decision is reasoned**. P1-03 establishes **how WHY evolves** without losing identity, duplicating truth, or forgetting discoveries.

**The principle:**

- EmpireAI **never repeats mistakes** — lessons enter the register  
- EmpireAI **never loses discoveries** — evidence remains traceable  
- EmpireAI **never forgets WHY** — Vision compounds from validated outcomes  
- **Knowledge compounds · Vision compounds · The Empire compounds**

Vision is a **living constitutional document**. It is not marketing copy. Amendments are deliberate, classified, and approved — not silent drift.

---

## 2. Canonical Relationships

| Document | Relationship |
|----------|--------------|
| [`EMPIREAI_VISION.md`](../EMPIREAI_VISION.md) | **Amendment target** — Permanent Vision class only |
| [`EMPIREAI_GLOSSARY.md`](./EMPIREAI_GLOSSARY.md) | **Language** — official term definitions (P1-08) |
| [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md) | **Names** — canonical terms (P1-07) |
| [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) | **Structure** — tier placement (P1-06) |
| [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) | **Structure** — tier placement (P1-06) |
| [`EMPIREAI_SOUL.md`](../EMPIREAI_SOUL.md) | Identity memory — BP class destination (P1-04) |
| [`EMPIREAI_REASONING_MODEL.md`](./EMPIREAI_REASONING_MODEL.md) | **PROOF** gates accumulation; post-mission chain |
| [`EMPIREAI_CORE_CONSTITUTION_CTD.md`](../EMPIREAI_CORE_CONSTITUTION_CTD.md) | Bounds Vision — CTD overrides conflicting accumulation |
| [`EMPIREAI_MISSION_GENERATION_POLICY.md`](./EMPIREAI_MISSION_GENERATION_POLICY.md) | Requires lessons learned at mission close |
| [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](./EMPIREAI_SUPERVISOR_GOVERNANCE.md) | Pillow stewardship duties |
| [`JOURNEY.md`](../JOURNEY.md) · [`JOURNEY_AUDIT.md`](../JOURNEY_AUDIT.md) | Structural change log — cross-reference only |

---

## 3. Accumulation Lifecycle (Permanent Flow)

```
Mission Completed          (PROOF accepted — Reasoning Model)
        ↓
Lessons Learned            (minimum 3 bullets · executive summary · proof ref)
        ↓
Architectural Review       (Pillow + Architect — constitutional fit)
        ↓
Vision Review              (classify · dedupe · CTD/Soul alignment check)
        ↓
Vision Accumulation Decision   (Permanent Vision · Principle · Evidence · Reject · Defer)
        ↓
Approved Vision Update     (Grand King approval for Permanent Vision)
        ↓
Future Mission Improvement (Vision Sync reads enriched WHY)
```

**Timing:** Accumulation runs **after** PROOF — never during implementation.

**Frequency:** Every completed mission **must** be evaluated. “No accumulation” is a valid outcome only when explicitly recorded as **Rejected Insight** or **Historical Evidence only**.

---

## 4. Sources of Accumulation (Minimum Set)

Every source below **must** be evaluated for Vision improvement:

| Source | Typical classification |
|--------|------------------------|
| Completed Cursor missions | Engineering · Operational · Permanent Vision (rare) |
| REAL missions | Architecture · Engineering · Operational |
| Executive Audits (`COMBINED_*` · artifacts) | Historical Evidence · Architecture · Business |
| Architecture reviews · ADRs | Architecture Principle · Deferred |
| Production incidents | Operational · Engineering · Permanent Vision (rare) |
| Production successes | Business · Operational · Permanent Vision (rare) |
| Business discoveries | Business Principle · Permanent Vision (rare) |
| Performance improvements | Engineering · Operational |
| Engineering methodology | Engineering Principle |
| Grand King decisions | Permanent Vision · Business · Operational |
| Chief Architect decisions | Architecture · Engineering |
| Pillow discoveries | Any class — Pillow drafts recommendation |

**Rule:** Evidence sources are **append-only**. Accumulation **references** evidence; it does not rewrite audit bodies.

---

## 5. Classification System

Every accumulated item **must** receive exactly **one primary** classification:

| Class | Code | Meaning | Typical destination |
|-------|------|---------|---------------------|
| **Permanent Vision** | `PV` | Amends `EMPIREAI_VISION.md` WHY | Vision revision (GK approval) |
| **Engineering Principle** | `EP` | Repeatable engineering truth | Reasoning Model appendix · ADR · Soul engineering note |
| **Business Principle** | `BP` | Commercial learning | Soul §4 · CBD alignment note · Vision §12 reference |
| **Architecture Principle** | `AP` | Structural truth | Canonical Architecture footnote · ADR |
| **Operational Principle** | `OP` | Production/runbook truth | Production Truth · STATUS · Journey |
| **Historical Evidence** | `HE` | Immutable record — no principle | Evidence layer only — register links to artifact |
| **Rejected Insight** | `RI` | Reviewed — not adopted | Register with reason — prevents re-litigation |
| **Deferred Insight** | `DI` | Valid — not now | Register with trigger · CON-020+ · Tier 6 |

**No duplicate truth:**

| Insight type | Write once to |
|--------------|---------------|
| Permanent WHY change | `EMPIREAI_VISION.md` only |
| Engineering law | Constitution / ADR — not Vision |
| Architecture normative | Canonical Architecture — not Vision |
| Proof of past state | Evidence — never Vision |

---

## 6. Review Workflow

### 6.1 Lessons Learned (Mission owner)

Within **48 hours** of PROOF acceptance (or at mission close report):

1. Executive summary (5–10 lines)  
2. Lessons learned (3–10 bullets)  
3. Proof reference (commit · audit ID · test · GK sign-off)  
4. Proposed classification per item (PV/EP/BP/AP/OP/HE/RI/DI)  
5. Draft **Vision impact statement** — one sentence per item  

### 6.2 Architectural Review (Pillow + Chief Architect)

Pillow verifies:

- Item does not violate CTD · Engineering Constitution · locked P1–P9  
- Item is not duplicate of existing principle (search register + Vision + ADRs)  
- **WHY→WHAT→HOW→PROOF** was valid for originating mission  
- Correct classification — especially **PV** (high bar)

Output: **Recommended disposition** per item.

### 6.3 Vision Review (Pillow stewardship)

Pillow compares:

```
Current Vision
      ↓
Repository (register · Journey · ADRs · evidence)
      ↓
Production (STATUS · incidents · successes)
      ↓
Completed Missions (lessons batch)
      ↓
New Knowledge (this review)
      ↓
Vision Update Recommendation
```

Output: Accumulation Decision per item — queue for approval or reject/defer with reason.

---

## 7. Approval Workflow

| Classification | Approver | Action |
|----------------|----------|--------|
| **Permanent Vision (PV)** | **Grand King** required | Amend `EMPIREAI_VISION.md` · version bump · Journey audit entry |
| **Engineering Principle (EP)** | Chief Architect | ADR or Reasoning Model note · Soul cross-ref if identity-relevant |
| **Business Principle (BP)** | Grand King if commercial · else Architect | Soul / CBD note — not silent Vision |
| **Architecture Principle (AP)** | Chief Architect | ADR + architecture doc pointer |
| **Operational Principle (OP)** | Architect + DevOps/GK if production | Production Truth · STATUS |
| **Historical Evidence (HE)** | Auto on evidence publish | Register link only |
| **Rejected Insight (RI)** | Pillow + Architect | Register with rejection reason |
| **Deferred Insight (DI)** | Grand King if strategic · else Architect | Register with trigger condition |

**Grand King action required:** **YES** for all **Permanent Vision** updates and strategic **Deferred** items.

**CTD lock:** No accumulation may weaken CTD-001→040 without **CONSTITUTIONAL REVIEW**.

---

## 8. Ownership & Governance

| Role | Responsibility |
|------|----------------|
| **Pillow COI** | **Vision stewardship owner** — continuous compare · review · recommend |
| **Grand King** | Approve Permanent Vision · strategic deferrals · irreversible commercial principles |
| **Chief Architect** | Draft Vision amendments · ADR · architecture/business principle routing |
| **Mission owner** | Submit lessons learned + proof |
| **Governance maintainer** | Register integrity · dedupe audits |

**Pillow Rule (accumulation):** Before any Pillow recommendation for new work, Pillow checks register for **open DI** items and **recent PV** changes that affect WHY.

---

## 9. Register & Traceability

**Operational register:** [`EMPIREAI_VISION_ACCUMULATION_REGISTER.md`](./EMPIREAI_VISION_ACCUMULATION_REGISTER.md)

Each entry **must** include:

| Field | Required |
|-------|----------|
| `ACC-###` | Sequential ID |
| Date | ISO date |
| Source | Mission ID · audit ID · incident ID |
| Summary | One line |
| Classification | PV · EP · BP · AP · OP · HE · RI · DI |
| Disposition | Approved · Pending · Rejected · Deferred |
| Destination | File/path or evidence link |
| Approver | GK · Architect · Pillow |
| Vision section | If PV — target § in EMPIREAI_VISION.md |

**Historical traceability:** Original evidence **never deleted**. Register points to evidence; Vision cites register ID in revision history.

---

## 10. Vision Evolution Without Identity Loss

| Allowed | Forbidden |
|---------|-----------|
| Add clarifying WHY | Change MS-A/MS-B targets without GK |
| Add refused-to-become items from failure | Become automation platform in Vision |
| Deepen principles in §7–§8 evolvable areas | Override CTD commercially |
| Compound factory metaphor from proof | Erase Grand King sovereignty |
| Append revision history entries | Silent edit without register |

**Identity anchors (immutable without constitutional review):** manufacture companies · intelligence not automation · Grand King sovereignty · net profit mission · WHY-not-HOW rule.

---

## 11. Connection to Reasoning Model

| Reasoning link | Accumulation role |
|----------------|-------------------|
| **WHY** | PV amendments enrich future WHY |
| **WHAT** | Lessons refine roadmap — not Vision unless PV |
| **HOW** | EP/AP go to engineering/architecture docs |
| **PROOF** | Gates entry to accumulation — no proof, no PV |

Post-mission chain in [`EMPIREAI_REASONING_MODEL.md`](./EMPIREAI_REASONING_MODEL.md) §12.

---

## 12. Connection to VIE (Tier 6)

**CON-014:** Vision Integrity Engine may automate compare step (Vision vs repository vs production).

**CURRENT:** Manual Pillow stewardship per this framework.

**FUTURE:** VIE validates accumulation recommendations — explicit deferral in P8.

---

## 13. Examples

### Example 1 — Production incident → Operational Principle

| Stage | Content |
|-------|---------|
| Source | Long-run Pillow session failure after stability fix |
| Lessons | Event-loop starvation from sync SQLite persist |
| Classification | **OP** + **EP** |
| Disposition | Production Truth note · Engineering Principle on persistence — **not PV** |
| WHY unchanged | Vision already requires honest production (§29) |

### Example 2 — PROOF-001 progress → Business Principle

| Stage | Content |
|-------|---------|
| Source | First live margin on test SKU |
| Lessons | Channel X yields faster proof than channel Y |
| Classification | **BP** |
| Disposition | Soul commercial note · GO-002 priority — **not PV** until GK elevates |

### Example 3 — Strategic Grand King decision → Permanent Vision

| Stage | Content |
|-------|---------|
| Source | GK affirms “operate marketplaces, don’t rebuild them” |
| Lessons | Confirms Vision §12 direction from marketplace pivot |
| Classification | **PV** |
| Disposition | Amend Vision §12 with explicit refusal to duplicate platforms · **GK approval** · ACC-00X |

### Example 4 — Executive Audit → Historical Evidence

| Stage | Content |
|-------|---------|
| Source | `COMBINED_EXECUTIVE_AUDIT_*` batch sign-off |
| Lessons | None for Vision — audit is point-in-time proof |
| Classification | **HE** |
| Disposition | Register link only — **no Vision edit** |

### Example 5 — Premature automation push → Rejected Insight

| Stage | Content |
|-------|---------|
| Source | Mission retrospective |
| Lessons | “Automate all approvals for speed” |
| Classification | **RI** |
| Reason | Violates Vision §24 · CTD-005 · Grand King sovereignty |
| Disposition | Registered rejected — do not reopen without CONSTITUTIONAL REVIEW |

### Example 6 — ECC concept → Deferred Insight

| Stage | Content |
|-------|---------|
| Source | Architecture review |
| Lessons | ECC may centralize execution visibility |
| Classification | **DI** |
| Trigger | CON-013 resolution or V2 programme |
| Disposition | Register · no Vision change until designed |

---

## 14. Validation Checklist

| Check | Status |
|-------|--------|
| Vision can evolve without losing identity | §10 |
| Historical discoveries remain traceable | §9 · HE class |
| No duplicate truth | §5 · classification routing |
| No conflicting principles | Architectural + Vision review §6 |
| Every future mission can improve Vision | §3 lifecycle · mandatory evaluation |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | 2026-07-04 | Grand King · P1-03 | Initial Vision Accumulation framework |

**Amendment:** CONSTITUTIONAL REVIEW + Grand King for framework changes. **PV** amendments follow §7 approval workflow.
