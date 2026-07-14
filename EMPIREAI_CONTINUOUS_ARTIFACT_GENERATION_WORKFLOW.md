# EmpireAI — Continuous Artifact Generation Workflow

> **Canonical label:** Continuous Artifact Generation Workflow  
> **Canonical owner:** Repository Governance · Pillow Architecture  
> **Authority:** Grand King Workflow Decision · EmpireAI Version 1  
> **Status:** ✅ Permanent development workflow — default for Pillow and architectural discussions  
> **Registered:** 2026-06-29  
> **Companion artifacts:** `EMPIREAI_CURSOR_OUTPUT_STANDARD.md` · `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` · `docs/governance/ARTIFACT_GENERATION_CLASSIFICATION.md` · `PILLOW_ARCHITECTURE_CONTRACT.md`

---

## 1. Workflow rule

**Conversation is not the final output.**

Every lasting architectural, constitutional, commercial, operational, or strategic decision **shall** automatically produce a **Cursor-ready repository artifact**.

Pillow shall **continuously analyse conversations**. When a lasting decision is detected, Pillow shall:

| Step | Action |
|---|---|
| **1. Classify** | Determine decision type and artifact category (see §4) |
| **2. Repository impact** | Identify canonical owners, artifacts, and sync obligations |
| **3. Generate** | Draft the appropriate repository artifact in Cursor-ready form |
| **4. Present** | Surface the artifact to Grand King for verification |
| **5. Await approval** | Hold implementation until Grand King approves (GVD-019 · Approval Gate) |

Grand King experiences natural dialogue. Artifact generation occurs **when governance requires permanence** — not as the default conversational mode for every exchange.

---

## 2. Workflow principle

**No permanent decision shall exist only in conversation.**

**Every approved permanent decision shall exist as a canonical repository artifact.**

| Principle | Requirement |
|---|---|
| **Repository First** | Permanent memory lives in repository artifacts — not chat history |
| **Intent + implementation** | Artifacts preserve executive intent and actionable specification (see Cursor Output Standard for missions) |
| **Approval before mutation** | No repository write, mission dispatch, or canonical update without Grand King approval |
| **Traceability** | Executive Audits reference originating artifact intent |

This workflow is the **default behaviour** for Pillow and for EmpireAI architectural discussions going forward.

---

## 3. End-to-end flow

```
Executive conversation (natural dialogue)
        ↓
Pillow continuous analysis (silent)
        ↓
Lasting decision detected?
        ↓ yes
Classify decision → Determine repository impact
        ↓
Generate Cursor-ready repository artifact
        ↓
Present artifact to Grand King (Section 1 / summary first when applicable)
        ↓
Grand King Approval (GVD-019 · Approval Gate · BL-C)
        ↓
Implementation (Cursor · Synchronizer · approved sync)
        ↓
Canonical repository artifact + Journey / Audit sync
        ↓
Future Bootstrap · Executive Reasoning · Executive Reflection
```

### Relationship to Executive Intelligence lifecycle

| Lifecycle stage | This workflow |
|---|---|
| **Executive Reasoning** | Upstream — dialogue and analysis during the turn |
| **Executive Reflection (PEI-026)** | Detects lasting decisions post-reasoning; triggers artifact generation |
| **Candidate Organizational Knowledge** | Pre-approval artifact draft |
| **Grand King Approval** | Mandatory gate before permanence |
| **Executive Knowledge Base** | Terminal state — approved canonical artifact |

See `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` §2.1 · §2.2 · §3.

---

## 4. Artifact types

When a lasting decision is detected, Pillow shall generate the **appropriate** artifact type. Examples:

| Artifact type | When used | Typical canonical destination | Format standard |
|---|---|---|---|
| **Constitution Update** | CTD / GVD / ACD / UID / CBD / BL doctrine change | Respective doctrine document | Doctrine structure + Journey sync |
| **Architecture Decision Record** | Subsystem boundary, dependency, or ADR-worthy choice | `EMPIREAI_DECISIONS.md` · contract append | ADR template |
| **Executive Learning** | Durable insight about executive reasoning or preferences | Improvement Vault · Layer 2 register | Candidate + evidence |
| **Executive Knowledge Base Update** | Approved organizational intelligence promotion | Soul · Status · contracts · doctrines | Sync preview |
| **Journey Update** | Operational position, mission row, roadmap classification | `JOURNEY.md` · `JOURNEY_AUDIT.md` | BL-A structural change |
| **Repository Policy** | Governance, sync, audit, or navigation rule | Governance doctrine · BL register | Policy document |
| **Commercial Strategy** | Marketplace, pricing, revenue posture | Commercial doctrine · strategy docs | Strategy brief |
| **Product Strategy** | Product direction, surface scope, UX posture | Product / UX contracts | Strategy brief |
| **Improvement Vault Entry** | Deferred enhancement with evidence | `docs/governance/*_ENHANCEMENT_REGISTER.md` | BL-C register row |
| **Mission Specification** | Engineering, UX, governance, or Pillow implementation work | `.cursor/missions/` · mission file | **`EMPIREAI_CURSOR_OUTPUT_STANDARD.md`** |

**Mission Specification** uses the two-section Cursor Output format (Executive Summary + Cursor Draft). Other artifact types shall include at minimum: decision summary, repository impact, canonical owner, approval recommendation, and implementation or sync scope.

Full classification matrix: `docs/governance/ARTIFACT_GENERATION_CLASSIFICATION.md`.

---

## 5. Detection criteria (lasting vs ephemeral)

| Signal | Treatment |
|---|---|
| Grand King explicit directive ("make this permanent", "add to Journey", "create mission") | **Generate artifact** |
| Architectural / constitutional / commercial / strategic choice with repository consequence | **Generate artifact** |
| Operational correction affecting canonical truth | **Generate artifact** |
| Clarifying question, exploratory dialogue, temporary context | **No artifact** — ephemeral Executive Context only |
| Already captured in an pending approval artifact | **Do not duplicate** — reference existing draft |

When uncertain, Pillow shall **propose** an artifact rather than silently omit — Grand King may defer or reject.

---

## 6. Pillow default behaviour

| Surface | Behaviour |
|---|---|
| **Pillow Chat** | Natural dialogue; artifact surfaced when lasting decision detected |
| **Mission Planner (PILLOW-006)** | Emits Mission Specification artifacts per Cursor Output Standard |
| **Approval Gate (PILLOW-017)** | Holds artifact payload until Grand King approves |
| **Repository Synchronizer (PILLOW-010)** | Executes approved Executive Knowledge Base updates |
| **Executive Reflection (PEI-026 — planned)** | Post-reasoning detection → classify → generate candidate artifact |
| **Cursor Bridge** | Receives **Section 2 — Cursor Draft** only for Mission Specifications |

Pillow advisors (including Cursor agents working on EmpireAI architecture) shall treat this workflow as **default** unless Grand King explicitly requests conversation-only exploration.

---

## 7. Prohibitions

This workflow shall **never**:

* Treat chat history as canonical organizational memory  
* Implement permanent decisions without a repository artifact  
* Auto-write repository artifacts without Grand King approval  
* Skip classification or repository impact analysis for lasting decisions  
* Discard executive intent after implementation — artifacts remain traceable  
* Bypass Journey synchronization (BL-A) for structural changes  

---

## 8. Governance

| Concern | Owner |
|---|---|
| This workflow | Repository Governance |
| Pillow detection and generation | Pillow Architecture · Layer 2 (PEI-026 · PEI-021) |
| Mission artifact format | Cursor Output Standard · PILLOW-006 |
| Approval enforcement | Approval Gate · GVD-019 |
| Audit traceability | Executive Audit Standard |
| Classification reference | `docs/governance/ARTIFACT_GENERATION_CLASSIFICATION.md` |

Structural changes require Journey synchronization per BL-A / ROUTE 02.

---

_Workflow standard only — establishes default behaviour; runtime enforcement accumulates through Layer 2 missions (Executive Reflection · Evidence-Based Learning) without modifying completed Layer 1 acceptance criteria._
