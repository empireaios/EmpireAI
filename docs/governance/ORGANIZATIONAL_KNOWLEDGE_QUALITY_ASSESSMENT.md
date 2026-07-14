# Organizational Knowledge Quality Assessment (OKQA)

> **Authority:** Grand King Architecture Observation · EmpireAI Version 1  
> **Canonical owner:** Pillow Architecture · AI Cognitive Doctrine  
> **Repository artifact:** `docs/governance/ORGANIZATIONAL_KNOWLEDGE_QUALITY_ASSESSMENT.md`  
> **Status:** DESIGN — future Layer 2 Executive Intelligence enhancement (post-V1)  
> **Planned implementation:** **PEI-027** (subordinate to Executive Reflection · PEI-026)  
> **Companion artifacts:** `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` §2.2 · `EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md` *(unchanged)* · `docs/governance/EXECUTIVE_COGNITIVE_PIPELINES.md` Pipeline C · `docs/governance/ARTIFACT_GENERATION_CLASSIFICATION.md`

---

## 1. Purpose

**Organizational Knowledge Quality Assessment (OKQA)** is an **internal, advisory** quality stage that evaluates **candidate organizational knowledge** before it is presented to Grand King.

OKQA exists to:

| Goal | Mechanism |
|---|---|
| **Prioritize high-value proposals** | Rank and surface candidates by multi-dimensional quality scores |
| **Reduce cognitive load** | Batch, defer, or collapse repetitive or low-value candidates |
| **Preserve approval authority** | Never approve, reject, or write permanent knowledge — Grand King only |
| **Improve Executive Reflection signal** | Feed deduplication and novelty detection back into PEI-026 |

OKQA **does not** modify the Continuous Artifact Generation Workflow (CAGW). CAGW steps 1–5 remain authoritative. OKQA is a **Layer 2 pre-presentation enrichment** executed by Executive Reflection **after** candidate generation and **before** CAGW step 4 (Present).

---

## 2. Governance guarantees (non-negotiable)

| # | Guarantee | Enforcement |
|---|---|---|
| **G1** | **Advisory only** | OKQA scores, ranks, and recommends presentation order — never disposition |
| **G2** | **Grand King sole authority** | Only Grand King approves permanent organizational knowledge (GVD-019 · Approval Gate · §3 chain) |
| **G3** | **No constitutional authority** | OKQA cannot promote doctrine, amend contracts, dispatch missions, or mutate repository |
| **G4** | **Prioritization, not veto** | Low-scoring candidates may be deferred or grouped — Grand King may still request any candidate |
| **G5** | **CAGW immutability** | This design references CAGW; it does **not** add, remove, or reorder CAGW steps |
| **G6** | **Silent operation** | OKQA runs post-turn; never interrupts conversational flow |
| **G7** | **Evidence over narrative** | Scores cite repository evidence — not chat transcript alone |

Violations of G1–G7 invalidate OKQA output for governance purposes.

---

## 3. Position in the Executive Intelligence lifecycle

OKQA inserts **one internal stage** between Candidate Organizational Knowledge and Grand King presentation. The mandatory §3 approval chain is **unchanged**.

```
Executive Reasoning (turn complete)
        ↓
Executive Reflection (PEI-026)
  · detect lasting decisions
  · classify artifact type (CAGW §4 matrix)
  · generate Candidate Organizational Knowledge
        ↓
┌───────────────────────────────────────┐
│  OKQA — Organizational Knowledge      │  ← PEI-027 (advisory · internal)
│  Quality Assessment                   │
│  · score dimensions                   │
│  · rank · dedupe · defer low-value    │
└───────────────────────────────────────┘
        ↓
CAGW Step 4 — Present artifact to Grand King
  (includes OKQA Brief as optional attachment)
        ↓
CAGW Step 5 — Await Grand King approval
        ↓
Executive Knowledge Base (on approval only)
```

| Lifecycle stage | OKQA role |
|---|---|
| **Evidence** | Unchanged — OKQA consumes candidate + evidence bundle |
| **Internal Analysis** | OKQA is a **sub-stage** of Internal Analysis / Executive Reflection |
| **Candidate knowledge** | Input — one or more structured proposals |
| **Grand King Approval** | Unchanged — OKQA has zero authority here |
| **Executive Knowledge Base** | Unchanged — only post-approval |

---

## 4. Assessment dimensions

Every candidate **shall** receive an OKQA score on each dimension. Scores use a **0–5** rubric (0 = not applicable / no signal · 5 = exceptional).

### 4.1 Dimension definitions

| Dimension | Question answered | High score (4–5) | Low score (0–1) |
|---|---|---|---|
| **Strategic Importance** | Does this advance EmpireAI's strategic position or Supreme Directive? | Alters roadmap phase, objective, or competitive posture | Cosmetic, local, or already achieved |
| **Profit Impact** | Does this increase probability of sustainable long-term net profit? | Direct SUCCESS-001 / commercial spine relevance with quantifiable path | No articulable profit linkage |
| **Architectural Impact** | Does this affect subsystem boundaries, dependencies, or Layer integrity? | ADR-worthy; cross-cutting architecture | Isolated copy or UI polish |
| **Governance Impact** | Does this affect approval, audit, Journey, or constitutional discipline? | New governance rule or sync obligation | No repository governance consequence |
| **Reusability** | Will approved knowledge benefit multiple future decisions? | Doctrine, pattern, or policy reusable across missions | One-off contextual note |
| **Evidence Strength** | Is the proposal grounded in repository truth? | Multiple canonical citations; audit/runtime corroboration | Chat narrative only; speculative |
| **Novelty** | Is this materially new vs existing canon and recent candidates? | New insight not in Journey, doctrines, or pending vault | Duplicate of recent proposal or existing row |
| **Long-term Value** | Will this matter beyond the current session or sprint? | Permanent intelligence; Bootstrap enrichment | Ephemeral context correctly classified |

### 4.2 Composite priority (advisory)

Composite score is a **weighted index for sorting only** — not a pass/fail gate.

| Dimension | Default weight | Rationale |
|---|---|---|
| Strategic Importance | 15% | Supreme Directive alignment |
| Profit Impact | 20% | §1.1 profit-over-activity |
| Architectural Impact | 12% | Protects Layer 1 integrity |
| Governance Impact | 10% | Repository First discipline |
| Reusability | 10% | Empire-scale leverage |
| Evidence Strength | 15% | CTD-014–017 honesty doctrine |
| Novelty | 8% | Anti-repetition |
| Long-term Value | 10% | Structural over cosmetic |

**Priority bands (presentation order only):**

| Band | Composite range | Default presentation behaviour |
|---|---|---|
| **P0 — Critical** | ≥ 4.0 | Present in current reflection batch — top of queue |
| **P1 — High** | 3.0 – 3.9 | Present in current batch after P0 |
| **P2 — Normal** | 2.0 – 2.9 | Present if batch size allows; else defer to next reflection cycle |
| **P3 — Low** | 1.0 – 1.9 | Defer by default; include in weekly digest unless Grand King requests all |
| **P4 — Suppress suggestion** | < 1.0 | Do not auto-present; log in reflection journal; Grand King may retrieve |

**Grand King override:** Any deferred candidate remains retrievable via Approval Gate / reflection review UI. OKQA **never** deletes candidates.

---

## 5. Repetition and low-value reduction

OKQA reduces repetitive proposals through **novelty-aware deduplication** — advisory consolidation only.

| Signal | OKQA action | Grand King impact |
|---|---|---|
| **Duplicate** of pending candidate (same owner + scope hash) | Merge into existing candidate; increment occurrence count | Single presentation |
| **Duplicate** of approved canon (Journey row, doctrine, register entry) | Flag `already_canonical`; defer unless Grand King requested amendment | Optional "no action needed" note |
| **Near-duplicate** (semantic similarity > threshold) | Group as variant; present one primary + appendix | Reduced queue noise |
| **Low composite + low novelty** | Defer to P3/P4 band | None — still retrievable |
| **Ephemeral misclassified as lasting** | Recommend `no_artifact` to Reflection — **not** auto-dismiss | Reflection may still propose if uncertain (CAGW §5) |

OKQA **shall not** suppress a candidate Grand King explicitly requested ("make this permanent", "create mission", etc.) — explicit directives bypass deferral bands (score still recorded for telemetry).

---

## 6. OKQA Brief (output artifact)

OKQA produces an **OKQA Brief** attached to each candidate presented to Grand King. The Brief is **metadata** — not a substitute for the CAGW artifact body.

### 6.1 Required fields

| Field | Content |
|---|---|
| `candidateId` | Stable identifier linking to Candidate Organizational Knowledge |
| `artifactClassification` | From CAGW / classification matrix — unchanged |
| `dimensionScores` | Eight scores 0–5 with one-line justification each |
| `compositeScore` | Weighted index (§4.2) |
| `priorityBand` | P0…P4 |
| `evidenceCitations` | Repository paths supporting scores |
| `noveltyAssessment` | New · variant · duplicate · already_canonical |
| `presentationRecommendation` | present_now · defer · group_with · digest_only |
| `advisorySummary` | ≤ 3 sentences — why this matters (or why deferred) |
| `profitRelevanceStatement` | Explicit SUCCESS-001 / Supreme Directive linkage or "none stated" |
| `okqaDisclaimer` | "Advisory only — Grand King approval required for permanence" |

### 6.2 Presentation rules (CAGW Step 4 enrichment)

| Rule | Requirement |
|---|---|
| **Default** | Grand King sees natural dialogue first; OKQA Brief surfaces with artifact proposal |
| **Batch limit** | Default max **3** P0/P1 candidates per reflection cycle — remainder deferred |
| **Ordering** | P0 → P1 → P2 within batch |
| **Transparency** | Every presented candidate includes OKQA Brief; deferred candidates listed in reflection summary on request |
| **No score-only rejection** | OKQA never hides a candidate solely because of score — deferral ≠ deletion |

Mission Specifications and Constitution Updates use the **same** OKQA Brief attachment pattern.

---

## 7. Integration map (no CAGW modification)

| System | Integration | Modification |
|---|---|---|
| **Continuous Artifact Generation Workflow** | OKQA runs **before** Step 4 Present | **None** to CAGW document or steps |
| **Executive Reflection (PEI-026)** | Invokes OKQA after candidate generation | PEI-026 calls PEI-027 adapter |
| **Evidence-Based Learning (PEI-021)** | OKQA scores multi-source candidates uniformly | Shared dimension rubric |
| **Artifact Classification** | Classification unchanged; OKQA reads `artifactClassification` | **None** to classification matrix |
| **Approval Gate (PILLOW-017)** | Receives full candidate + OKQA Brief | Presentation enrichment only |
| **Improvement Vault (BL-C)** | Low P3/P4 candidates may route to vault instead of immediate present | Optional routing hint — GK decides |
| **Executive Audits** | OKQA scores auditable in reflection telemetry | Future PEI-024 feed |

---

## 8. PEI-027 — planned implementation specification

| Attribute | Value |
|---|---|
| **ID** | PEI-027 |
| **Name** | Organizational Knowledge Quality Assessment |
| **Pipeline** | **C — Executive Learning** (subordinate to PEI-026) |
| **Layer** | Pillow Executive Intelligence (Layer 2) |
| **V1 status** | 🔵 Future — post-V1 Master Plan tranche |
| **Runtime touchpoints** | `pillow/src/executive-reflection/` (planned) · candidate store · Approval Gate presentation payload |
| **Dependencies** | PEI-026 (Executive Reflection) · PEI-021 (evidence bundle) · Bootstrap extension reasoning output |

### 8.1 Implementation phases (planning)

| Phase | Deliverable |
|---|---|
| **0 — Design** | This document ✅ |
| **1 — Scoring engine** | Deterministic rubric + evidence citation validator |
| **2 — Deduplication** | Scope hash + canonical index lookup (Journey · registers · doctrines) |
| **3 — Reflection integration** | PEI-026 invokes OKQA; batch limit + deferral queue |
| **4 — Presentation UI** | OKQA Brief in Approval Gate / recommendation card |
| **5 — Telemetry** | Reflection journal; PEI-024 audit adapter feed |

### 8.2 Prohibited implementation patterns

PEI-027 **shall never**:

* Auto-approve or auto-reject candidates  
* Write repository artifacts without Grand King approval  
* Modify CAGW step definitions or bypass Step 5  
* Override explicit Grand King permanence directives  
* Reduce constitutional authority of GVD-019, Approval Gate, or BL-C  
* Train on chat history as canonical truth without repository corroboration  

---

## 9. Relationship to Pipeline D (Governance)

OKQA operates in **Pipeline C** (candidate formation). **Pipeline D** (Grand King Approval · promotion) is unchanged.

| Pipeline | OKQA role |
|---|---|
| **C — Executive Learning** | Primary home — scores candidates before presentation |
| **D — Executive Governance** | None — GK disposes; OKQA has no gate authority |
| **E — Executive Evolution** | Indirect — approved knowledge only; OKQA telemetry may inform maturity scoring (PEI-016) |

PEI-008 (Executive Audit Reviewer) remains the **mission acceptance** quality gate for engineering work. OKQA is the **organizational knowledge prioritization** gate for Layer 2 candidates — distinct scopes, both advisory to Grand King.

---

## 10. Success criteria (design acceptance)

This design is **accepted** when:

1. OKQA is documented as advisory-only with eight minimum dimensions ✅  
2. Grand King approval chain (§3) is preserved without modification ✅  
3. CAGW is referenced but not modified ✅  
4. PEI-027 registered as future Layer 2 capability ✅  
5. Executive Reflection integration point is specified (pre-present, post-candidate) ✅  
6. Repetition reduction rules preserve Grand King retrievability ✅  

Runtime implementation is **explicitly out of scope** for this mission.

---

## 11. Repository synchronization checklist (implementation mission — future)

When PEI-027 is implemented (future Grand King mission):

1. Register in `PILLOW_ROADMAP.md` Layer 2 capability table  
2. Append PEI-027 to `docs/governance/EXECUTIVE_COGNITIVE_PIPELINES.md` §5  
3. Cross-reference from `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` §2.2 (pointer only)  
4. Log in `JOURNEY_AUDIT.md`  
5. **Do not** amend `EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md` unless Grand King explicitly directs CAGW revision  

---

*Organizational Knowledge Quality Assessment — Grand King Architecture Observation · design only · no runtime modified · CAGW unchanged · 2026-06-29.*
