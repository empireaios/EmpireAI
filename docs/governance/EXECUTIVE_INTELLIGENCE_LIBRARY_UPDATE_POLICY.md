# Executive Intelligence Library — Update Policy

> **Canonical label:** Executive Intelligence Library Update Policy  
> **Canonical owner:** Repository Governance · Pillow Architecture · AI Cognitive Doctrine  
> **Authority:** Grand King Repository Governance · EmpireAI Version 1  
> **Status:** ✅ Permanent governance policy  
> **Registered:** 2026-06-29  
> **Companion artifacts:** `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` §3 · `EMPIREAI_PILLOW_MEMORY_DOCTRINE.md` · `EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md` · `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md` · `EMPIREAI_CURSOR_OUTPUT_STANDARD.md` · `docs/governance/ORGANIZATIONAL_KNOWLEDGE_QUALITY_ASSESSMENT.md`

---

## 1. Purpose and scope

This policy defines **when**, **how**, and **under what constraints** the **EmpireAI Executive Intelligence Library (EIL)** is updated.

The EIL is the **living executive record** of the Empire's latest **approved** organizational understanding — with **permanent preservation** of the reasoning history that produced it.

| In scope | Out of scope |
|---|---|
| Update triggers, verification cadence, revision discipline | Runtime implementation (Layer 2 PEI missions) |
| Relationship to Executive Knowledge Base and repository canon | Modifying CAGW step definitions |
| Weekly verification checklist | Time-based content refresh |

**Governing principle:** The Executive Intelligence Library **shall evolve when the Empire evolves**. Updates are triggered by **meaningful organizational events** — never by the passage of time alone.

---

## 2. What the Executive Intelligence Library is

The EIL is a **logical library** — not a single file. It aggregates **approved executive intelligence** from canonical sources:

| EIL layer | Canonical source | Role in library |
|---|---|---|
| **L1 — Approved learning entries** | SQLite `executive_knowledge_base` · `pillow/src/learning/` | Grand King–approved behavioural and strategic principles (Categories A–C) |
| **L2 — Repository canon index** | Journey · Soul · Status · Decisions · doctrines · frozen contracts · audits | Latest approved structural and operational truth |
| **L3 — Artifact provenance index** | Approved Cursor Outputs · mission closeouts · CAGW artifacts | Traceability from decision → implementation |
| **L4 — Revision ledger** | Append-only revision records per library entry | Historical reasoning preservation (§6) |
| **L5 — Assessment metadata** | OKQA briefs (PEI-027) · confidence scores · evidence citations | Prioritization and verification state — advisory only |

**Distinction:**

| Concept | Definition |
|---|---|
| **Executive Intelligence Library** | Curated **index + approved entries + revision history** representing latest GK-approved understanding |
| **Executive Knowledge Base** | **Approved entries** promoted through §3 chain (Constitution) — L1 of EIL |
| **Repository artifacts** | Permanent canonical files — **indexed by** EIL, not duplicated |
| **Conversation history** | **Never** part of EIL — Memory Doctrine |

Only **Grand King–approved** knowledge enters L1. L2 is **indexed**, not copied — paths and summaries only.

---

## 3. Governing principle (event-driven evolution)

| Rule | Requirement |
|---|---|
| **E1 — Event-driven updates** | Every EIL update **shall** cite a mandatory trigger (§4) or a verification repair (§5) |
| **E2 — No temporal refresh** | Calendar age, staleness duration, or "scheduled review" **shall not** alone cause content revision |
| **E3 — Latest approved understanding** | Current-state fields reflect **most recent GK-approved** truth |
| **E4 — History preserved** | Prior reasoning remains in revision ledger — never overwritten (§6) |
| **E5 — GK authority** | No EIL update bypasses Grand King approval for permanent knowledge |
| **E6 — Evidence over narrative** | Updates cite repository evidence — not chat transcript alone |

**Prohibited:** "Quarterly refresh", "annual rewrite", "default TTL expiry" on approved L1 entries without a §4 trigger event.

Category D ephemeral learnings (4h TTL per Executive Learning Engine) are **excluded** from permanent EIL — they never enter L1.

---

## 4. Mandatory update triggers

When any trigger below occurs, the **appropriate EIL layer(s)** **shall** be updated **immediately** (same governance cycle as the triggering event — not deferred to weekly verification alone).

### 4.1 Trigger catalog

| # | Trigger event | EIL action | Primary owner | Canonical evidence |
|---|---|---|---|---|
| **T1** | **Grand King approves a Cursor Output** | Index artifact provenance (L3); promote approved learning if applicable (L1); append revision if understanding changed (L4) | Repository Governance · Pillow Architecture | Approved Cursor Output · Approval Gate record |
| **T2** | **Cursor mission completed and accepted** | Index mission closeout; link Executive Audit; update L2 index if Journey/Status/contracts changed | Journey · Mission owner | Executive Audit · `JOURNEY_AUDIT.md` entry |
| **T3** | **Executive Audit produces new findings or recommendations** | Index audit path + Executive Recommendation; register Future Enhancements in BL-C registers (indexed in L2); **do not** treat enhancements as approved EIL knowledge until promoted | Repository Governance | `COMBINED_EXECUTIVE_AUDIT_*.md` |
| **T4** | **Constitutional, architectural, governance, or workflow decision approved** | Update L2 index (doctrine · ADR · policy path); append L4 revision with decision summary | Respective doctrine owner | Approved doctrine/ADR/policy artifact |
| **T5** | **Material commercial event** | Index commercial evidence entry; update assessments (confidence · profit relevance); link REAL/commercial modules | Commercial Intelligence · Runtime | KPI delta · supplier/marketplace change · validated operational outcome · audit citation |
| **T6** | **Repository consolidation or architectural refactoring** | Reindex L2/L3 paths; repair broken references (§5); append L4 if canonical understanding shifted | Repository Governance · Journey | Consolidation audit · Master Index · `JOURNEY_AUDIT.md` |

### 4.2 Material commercial event (T5) — definition

A commercial event is **material** when it meets **any** of:

| Signal | Examples |
|---|---|
| **Significant KPI change** | SUCCESS-001 progress threshold crossed · margin shift · conversion rate change beyond documented baseline |
| **Supplier change** | Primary supplier switch · new adapter · fulfillment path change |
| **Marketplace change** | New marketplace live · channel offline · listing policy change |
| **Revenue-impacting discovery** | Pricing intelligence · ROAS shift · validated profit path change |
| **Validated operational outcome** | PROOF-001 milestone · live credential activation · production go-live gate |

Observational signals alone (runtime metrics without GK validation) **index as evidence** — they do **not** auto-revise L1 approved principles.

### 4.3 Update flow (conceptual)

```
Organizational event (§4 trigger)
        ↓
Verify Grand King approval (if permanent knowledge)
        ↓
Update EIL layer(s) per trigger table
        ↓
Append revision ledger entry if understanding changed (§6)
        ↓
Cross-index repository canon (L2) — no duplicate bodies
        ↓
Optional: OKQA assessment metadata (PEI-027 — advisory)
```

This flow **complements** — does **not** replace — the Executive Intelligence Lifecycle (Constitution §2.1) or CAGW.

---

## 5. Periodic verification (weekly)

### 5.1 Purpose

Once **every calendar week**, perform **Executive Intelligence Library Verification**.

| Purpose | Allowed action |
|---|---|
| Detect **missing entries** | Create index stub + queue for GK review |
| Detect **outdated assessments** | Update assessment metadata only — not approved principle text without §4 trigger |
| Detect **broken references** | Repair path/index links |
| Detect **orphaned artifacts** | Link to EIL index or flag for consolidation |
| Detect **confidence inconsistencies** | Reconcile scores with evidence; append confidence evolution (§6) |

### 5.2 Verification shall not

| Prohibition | Rationale |
|---|---|
| Rewrite historical reasoning | §6 preservation |
| Revise approved L1 content because of age | §3 E2 |
| Auto-approve pending candidates | GK authority |
| Delete revision ledger entries | Traceability |
| Replace repository canon bodies | Repository First — index only |

### 5.3 Weekly verification checklist

| # | Check | Repair if found |
|---|---|---|
| V1 | Every `COMBINED_EXECUTIVE_AUDIT_*.md` since last verification indexed in L2/L3 | Add index entry |
| V2 | Every GK-approved Cursor Output since last verification indexed in L3 | Add provenance link |
| V3 | Every Journey structural change in `JOURNEY_AUDIT.md` reflected in L2 index | Update index row |
| V4 | L1 entries with `supersededBy` have successor indexed | Link successor |
| V5 | Broken paths in EIL index (file moved/renamed) | Repair reference |
| V6 | Orphaned pending learnings past review SLA | Surface to Executive Learning Review UI |
| V7 | Confidence scores without evidence citations | Flag for evidence attachment |
| V8 | Duplicate index entries (same scope hash) | Merge index rows — preserve both revision histories |

**Cadence:** Weekly verification **detects and repairs omissions** — it is **not** a content revision schedule.

**Owner:** Repository Governance (coordination) · Pillow Architecture (L1/L5) · Journey (L2 structural index).

**Future implementation:** PEI-028 Executive Intelligence Library Steward (Layer 2 — post-V1).

---

## 6. Historical preservation (append-only revisions)

Historical reasoning **shall never be overwritten**.

Every revision to an EIL entry **shall append** a revision record containing:

| Field | Requirement |
|---|---|
| **Revision Date** | ISO-8601 timestamp of the revision event |
| **Reason for Revision** | Citing §4 trigger ID (T1–T6) or verification repair ID (V1–V8) |
| **New Understanding** | Summary of the updated approved understanding |
| **Confidence Evolution** | Prior confidence → new confidence with evidence basis |
| **Supersedes** | Optional link to prior revision ID (chain) |
| **Approved By** | Grand King (for L1 promotions); verification owner (for index repairs only) |

### 6.1 Revision rules

| Rule | Requirement |
|---|---|
| **R1** | Prior revision text remains **permanently readable** |
| **R2** | `superseded` status on L1 entries preserves prior record — links via `supersededBy` |
| **R3** | L2 index updates change **pointer + summary** — full history in `JOURNEY_AUDIT.md` and revision ledger |
| **R4** | Executive Audits are **immutable** — new findings produce **new audit files**, not edits to closed audits |
| **R5** | Verification repairs to broken links **do not** alter understanding text |

### 6.2 Revision record schema (minimum)

```yaml
revisionId: string          # stable identifier
entryId: string             # EIL entry or index row
revisionDate: ISO-8601
trigger: T1|T2|T3|T4|T5|T6|V1..V8
reasonForRevision: string
newUnderstanding: string
confidenceBefore: number | null
confidenceAfter: number | null
evidenceCitations: string[] # repository paths
approvedBy: string          # grand-king | verification-steward
priorRevisionId: string | null
```

---

## 7. Update philosophy

The Executive Intelligence Library is a **living executive record**.

| Principle | Expression |
|---|---|
| **Latest approved truth** | Current-state fields always reflect Grand King's most recent approval |
| **Permanent reasoning history** | Every change leaves a trace — decisions, evidence, and confidence evolution |
| **Empire-synchronized** | EIL evolves with the repository — not ahead of it, not independent of it |
| **Decision-driven** | Triggers are organizational events — approvals, audits, commercial validation, consolidation |
| **Not time-driven** | Age alone never justifies rewrite |
| **Pillow serves, GK disposes** | Pillow may propose index updates and verification repairs; Grand King approves permanent knowledge |

> *Its evolution shall be driven by decisions, evidence, and organizational learning — not by the passage of time.*

---

## 8. Relationship to adjacent governance

| Artifact | Relationship |
|---|---|
| **Executive Intelligence Constitution §3** | Mandatory approval chain — EIL L1 obeys §3 exactly |
| **Memory Doctrine** | Conversations disposable; EIL holds approved knowledge only |
| **CAGW** | Produces artifacts that become L2/L3 index targets on GK approval — CAGW **unchanged** |
| **Executive Audit Standard** | T3 trigger; audits indexed, not duplicated |
| **Cursor Output Standard** | T1 trigger; Section 1 intent preserved in revision ledger |
| **OKQA (PEI-027)** | Advisory assessment metadata in L5 — never auto-updates L1 |
| **Executive Learning Engine** | L1 storage and approval workflow — obeys this policy on promotion |
| **Bootstrap / Future Bootstrap** | Loads approved EIL canon for session reconstruction |

---

## 9. Prohibitions (summary)

The Executive Intelligence Library Update Policy **shall never** be interpreted to:

1. Authorize time-only content revisions  
2. Overwrite or delete historical reasoning  
3. Bypass Grand King approval for permanent organizational knowledge  
4. Treat chat history as canonical EIL content  
5. Modify closed Executive Audits in place  
6. Duplicate full repository artifact bodies inside EIL indices  
7. Auto-promote Future Enhancements from audits to approved L1 entries  
8. Substitute weekly verification for mandatory immediate updates (§4)  

---

## 10. Repository synchronization

| Artifact | Action on adoption |
|---|---|
| `docs/governance/EXECUTIVE_INTELLIGENCE_LIBRARY_UPDATE_POLICY.md` | Created (this policy) |
| `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` | §3.4 cross-reference |
| `JOURNEY.md` | Governance row |
| `JOURNEY_AUDIT.md` | Structural log |
| `EMPIREAI_REPOSITORY_MASTER_INDEX.md` | Governance § index |
| `docs/governance/PILLOW_ENHANCEMENT_REGISTER.md` | PEI-028 design note |

**Runtime implementation** is explicitly post-V1 Layer 2 (PEI-028 — Executive Intelligence Library Steward).

---

*Executive Intelligence Library Update Policy · Grand King Repository Governance · 2026-06-29 · documentation only — no runtime modified.*
