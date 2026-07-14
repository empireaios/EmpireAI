# Pillow Roadmap — Runtime vs Executive Intelligence

> **Canonical owner:** Pillow Architecture · Journey  
> **Authority:** Grand King Architecture Decision · EmpireAI Version 1  
> **Status:** PLANNING & DOCUMENTATION ONLY — no runtime behaviour modified by this artifact  
> **Date:** 2026-06-29  
> **Commercial transition (ADR-045):** REAL-002B completes foundational integration (architecture); Layer 3 is post-V1 strategic focus — see `docs/governance/COMMERCIAL_INTEGRATION_TO_INTELLIGENCE_TRANSITION.md`  
> **Executive Cognitive Pipelines (ADR-046):** Layer 2 PEI missions organised into pipelines A–E for Master Plan planning — see `docs/governance/EXECUTIVE_COGNITIVE_PIPELINES.md`  
> **Pillow Delivery Mode (ADR-049):** Layer 1 architecture complete — remaining V1 Pillow work is Product Integration Phases 1–3 only — see `docs/governance/PILLOW_VERSION_1_DELIVERY_MODE.md`  
> **Supersedes (planning framing only):** monolithic "Pillow V1 complete → post-V1 deferred" narrative

---

## Executive summary

Pillow progress is now tracked across **two distinct milestone classes** within the EmpireAI roadmap:

| Class | Question it answers | V1 status |
|---|---|---|
| **Pillow Runtime** | Can Pillow operate as live infrastructure — sessions, routing, approvals, objectives, UI, orchestration, governance? | **✅ Complete** (PILLOW-016…019) |
| **Pillow Executive Intelligence** | Can Pillow transform conversations **and validated evidence** into profit-aligned organizational intelligence? | **🔵 Future** — Core Principle + Executive Reflection (PEI-026) + Evidence-Based Learning defined; Bootstrap extension complete |

Technical runtime completion and executive intelligence completion are **independent milestones**. Runtime may be live while intelligence depth is still accumulating.

---

## EmpireAI future roadmap (five layers)

The post-UX engineering sequence is:

```
1. Pillow Runtime              ← ✅ V1 complete
2. Pillow Executive Intelligence
3. Commercial Intelligence
4. Supplier Intelligence
5. Empire Operations
```

| Layer | Scope | Primary owners | Status |
|---|---|---|---|
| **1 — Pillow Runtime** | Sessions, Brain host, API routing, auth, SSE, approval gate, Cursor bridge, chat UI, objective orchestrator, runtime governance | Pillow Architecture · Runtime Engineering | ✅ Complete |
| **2 — Pillow Executive Intelligence** | Transform conversations **and validated outcomes** into profit-aligned organizational intelligence | Pillow Architecture · AI Cognitive Doctrine | 🔵 Future |
| **3 — Commercial Intelligence** | Marketplace evaluation, listing intelligence, revenue engines, GKR commercial chain (REAL-003+) | Commerce OS · GVD-008 | 🔵 **Post-V1 strategic focus** (REAL built; REAL-002B integration foundation ✅; live activation gated) |
| **4 — Supplier Intelligence** | Supplier evaluation, CJ and successor adapters, supply-chain loops (REAL-015+) | Supplier Intelligence · CBD-006 | 🔵 Future |
| **5 — Empire Operations** | Live credentials, PROOF-001, MS-A, commerce runtime execution after Grand King approval | Empire Operations · GVD-009 | 🔵 Future |

Layers 3–5 are **Empire-wide programs** documented in `EMPIREAI_ROADMAP.md`, `COMMERCE_OS_BLUEPRINT.md`, and REAL module audits. This document owns Layers 1–2 only.

---

## Layer 1 — Pillow Runtime (complete)

**Definition:** The infrastructure required to **operate** Pillow — not the depth of executive reasoning.

### Included capabilities (implemented)

| Capability | Mission / artifact | Notes |
|---|---|---|
| Session lifecycle | PILLOW-016 · `backend/src/orchestration/pillow-host/` | Workspace-scoped sessions, bootstrap API |
| Brain LLM routing | PILLOW-016 · `pillow/src/openai/` | Context Builder → Brain `LLMRouter`; no browser keys |
| API surface | PILLOW-016 | `/api/pillow/*` BFF routes |
| Approval gate | PILLOW-017 · `backend/src/orchestration/pillow-approval/` | Unified proposals, history, policy |
| Cursor bridge | PILLOW-017 | Dry-run handoff, heartbeat ingress, mission queue |
| Chat UI | PILLOW-018 · `frontend/src/pages/dashboard/PillowChatPage.tsx` | SSE streaming, panels, session management |
| Objective management | PILLOW-019 · `pillow/src/objective/` | Single active objective, Builder Mode, Improvement Vault (storage) |
| Runtime orchestration | PILLOW-013 · PILLOW-019 | Objective-gated scheduling, autonomous runtime orchestrator |
| Runtime governance | PILLOW-017 · PILLOW-019 | Approval filtering, mission queue by objective |

### Package modules with runtime hosting role (foundations shipped in V1 architecture)

These modules exist in `@empireai/pillow` and are **hosted by runtime**; their **executive intelligence depth** is Layer 2:

| Module | Mission | Runtime role today | Intelligence depth → Layer 2 |
|---|---|---|---|
| Bootstrap Engine | PILLOW-002 | Session init, discovery pipeline | Self-reconstruction, executive-ready completeness |
| Repository Watcher | PILLOW-014 | Change events, cache invalidation | Drift → strategic signal synthesis |
| EmpireAI Orchestrator | PILLOW-013 | Workflow coordination, scheduling | Autonomous executive workflow reasoning |
| Grand King Command Interface | PILLOW-015 | Intent routing shell | Conversation intelligence, executive perspectives |
| Repository Synchronizer | PILLOW-010 | Preview-first gated writes | Journey-aware strategic sync recommendations |

### Runtime completion criteria (met)

- [x] Founder/admin can open `/dashboard/pillow` and maintain sessions
- [x] Inference flows Frontend → BFF → PillowHost → Brain `LLMRouter`
- [x] Approvals and Cursor missions pass through unified gate
- [x] Objective discipline gates autonomous orchestration
- [x] No repository write bypasses approval policy

**Historical planning artifact:** `PILLOW_RUNTIME_INTEGRATION_PLAN.md` — describes Phase 0–4 integration; Phases 1–3 implemented (PILLOW-016…018). Retained as integration archaeology.

---

## Layer 2 — Pillow Executive Intelligence (future)

> **Defining constitution:** `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md`

### Core Principle (supreme)

**Pillow Executive Intelligence exists to transform executive conversations and validated operational outcomes into structured organizational intelligence.**

Its primary responsibility is **not** merely answering questions. Its primary responsibility is **continuously improving the Empire's intelligence** through disciplined analysis of conversations **and validated operational evidence**.

**Supreme Directive alignment:** The purpose of organizational intelligence is to continuously improve the Empire's ability to generate **sustainable long-term profit** (CTD-002 / SUCCESS-001 / MS-A).

Executive Intelligence is measured **not** by features implemented, but by Pillow's ability to continuously improve executive reasoning toward profit while preserving Grand King's preferred conversational style.

### Continuous Artifact Generation (default workflow)

> **Canonical:** `EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md`

**Conversation is not the final output.** Every lasting architectural, constitutional, commercial, operational, or strategic decision shall produce a **Cursor-ready repository artifact** — classified, impact-assessed, presented to Grand King, and held until approval.

| Artifact type | Examples |
|---|---|
| Constitution Update · ADR · Journey Update · Repository Policy | Governance and architecture |
| Commercial Strategy · Product Strategy | Strategic posture |
| Executive Learning · Improvement Vault Entry | Layer 2 candidates |
| Mission Specification | Cursor Output Standard (PILLOW-006) |

Executive Reflection (PEI-026) and Evidence-Based Learning (PEI-021) implement detection and generation discipline within this workflow.

### Evidence-Based Learning Architecture

Layer 2 shall evolve through a **unified Evidence Sources abstraction** — never by direct modification from any signal:

**Evidence Sources** are the single entry point for all Executive Intelligence learning. Every learning input is Evidence from a registered source until promoted through Grand King approval.

| Evidence Source | Role |
|---|---|
| Executive conversations | Primary dialogue input |
| Repository evolution | Journey, ADR, doctrine drift |
| Commercial outcomes | Profit-relevant signals (Layer 3 bridge) |
| Runtime metrics | Health, blockers, readiness — observational |
| Executive Audits | Intent traceability, gap detection |
| Approved strategic reviews | Council/Soul synthesis — advisory until GK approves |
| *Validated External Intelligence* | *Reserved future source — same §3 chain; requires GK architecture decision* |

**PEI-021** implements this architecture: unified ingestion, internal analysis, candidate knowledge synthesis aligned to Supreme Directive, and GK-gated promotion only.

**Rule:** No Evidence Source may directly modify Executive Knowledge. All evidence → candidate knowledge → **Grand King Approval** → Executive Knowledge Base (EKLS Learning Store) (EKLS Learning Store — see `CANONICAL_EKLS_SPECIFICATION.md`).

### Executive Reflection

**Executive Reflection** is the **first downstream Layer 2 capability** following Bootstrap completion. It is the bridge between **Executive Reasoning** and **Executive Learning**.

After significant executive conversations complete their reasoning cycle, Executive Reflection silently:

1. Observes the completed reasoning cycle (composition + response + conversation context)
2. Detects potential executive learnings
3. Distinguishes ephemeral Executive Context from lasting organizational intelligence
4. Generates **Candidate Organizational Knowledge**
5. Submits all candidates through the existing Grand King Approval workflow
6. Never modifies Executive Knowledge directly

**PEI-026** implements Executive Reflection on the Bootstrap extension (`ExecutiveDirectionContext` · reasoning composition pipeline).

### Executive Intelligence lifecycle (per session)

```
Bootstrap
      ↓
Executive Identity
      ↓
Executive Direction
      ↓
Conversation
      ↓
Executive Reasoning
      ↓
Executive Reflection
      ↓
Candidate Organizational Knowledge
      ↓
Grand King Approval
      ↓
Executive Knowledge Base (EKLS Learning Store)
      ↓
Future Bootstrap
```

Bootstrap foundations (Identity · Direction · Context · Reasoning composition) are **complete** in Pillow Runtime. Executive Reflection is the **first planned intelligence mission** built on that architecture.

### Conversation Philosophy

Every Grand King conversation is a **business conversation** unless explicitly stated otherwise. Pillow silently analyses each exchange for executive learning, constitutional updates, architecture decisions, commercial strategies, repository policies, operational doctrines, workflow improvements, and strategic insights. Grand King experiences natural dialogue.

### Knowledge Evolution

```
Evidence (conversation · repository · commercial · runtime · audit · review)
      → Internal Analysis → Candidate Organizational Knowledge
      → Grand King Approval → Executive Knowledge Base (EKLS Learning Store) → Future Bootstrap
```

Neither conversation nor operational outcome alone modifies Pillow or the repository. Only approved organizational knowledge becomes permanent (GVD-019 · Approval Gate · Memory Doctrine).

### Conversational Experience

Internal intelligence never forces formal communication. Pillow speaks naturally while applying constitutional reasoning, executive perspectives, executive reflection, executive learning, repository reconstruction, and objective discipline.

**Definition:** The executive **reasoning layer** responsible for how Pillow thinks and learns — not merely how it connects.

### Core responsibility domains

| Domain | Description |
|---|---|
| **Self-reconstruction** | Convention-based repository reconstruction; executive-ready completeness; bootstrap evolution beyond scan-and-classify |
| **Executive perspectives** | Multi-lens internal reasoning (Financial … Strategy); Pillow synthesis; integration with REAL Council/Soul advisory outputs where applicable |
| **Conversation intelligence** | Mode-aware reasoning depth; strategic dialogue beyond transport; manifest-aware executive responses |
| **Executive reflection** | Post-reasoning evaluation of significant conversations → candidate knowledge; PEI-026 |
| **Outcome-based learning** | Evidence-Based Learning Architecture — unified Evidence Sources; PEI-021 |
| **Executive learning** | Improvement Vault promotion; audit and mission outcome learning; repository-backed memory refinement |
| **Strategic synthesis** | Cross-artifact strategic recommendations; Due Diligence → actionable executive briefs |
| **Continuous improvement** | Autonomous improvement loop activation; enhancement register prioritization; BL-C intelligence routing |

### Future capabilities mapped to Pillow Executive Intelligence

**Organisational view (ADR-046):** PEI missions group into **Executive Cognitive Pipelines** — A Reconstruction · B Reasoning · C Learning · D Governance · E Evolution. Full map: `docs/governance/EXECUTIVE_COGNITIVE_PIPELINES.md`. PEI identifiers below are **unchanged**.

| Pipeline | PEI missions (primary) |
|---|---|
| **A — Reconstruction** | PEI-001 · 002 · 003 · 009 · 011 · 013 · 017 · 018 · 020 |
| **B — Reasoning** | PEI-005 · 006 · 014 · 015 · 016 · 019 |
| **C — Learning** | PEI-007 · 012 · 021 · 022 · 023 · 024 · 025 · **026** |
| **D — Governance** | PEI-004 · 008 · 010 · 007 (promotion) |
| **E — Evolution** | PEI-001 · 002 · 004 · 006 · 016 |

| ID | Capability | Source module / register | Priority signal |
|---|---|---|---|
| PEI-001 | Repository self-reconstruction & executive-ready gate | PILLOW-002 reconstruction pipeline · PILLOW-ENH-045 | High — bootstrap maturity |
| PEI-002 | Repository Intelligence depth — NLP query engine, knowledge graph UX | PILLOW-003 · PILLOW-ENH-013, ENH-046–048 | High — engineering knowledge layer |
| PEI-003 | Context Builder executive task profiles & adaptive minimum context | PILLOW-004 · context task profiles | Normal — Memory Doctrine enforcement |
| PEI-004 | Repository Memory executive learning loops | PILLOW-005 · memory refresh intelligence | High — permanent memory refinement |
| PEI-005 | Mission Planner strategic synthesis & dependency-aware prioritization | PILLOW-006 · PILLOW-ENH-016 lineage | High — "what next" executive truth |
| PEI-006 | Continuous Due Diligence — full autonomous executive analysis | PILLOW-011 | High — self-initiated analysis |
| PEI-007 | Autonomous Improvement Engine — conversation → candidate knowledge → vault | PILLOW-012 · Improvement Vault · **Core Principle §3** | High — knowledge evolution chain |
| PEI-008 | Executive Audit Reviewer — cognitive quality gate depth | PILLOW-009 | Normal — mission acceptance intelligence |
| PEI-009 | Dedicated Journey Manager — operational position intelligence | PILLOW-ENH-006 · contract Part 3 #16 | Normal — Journey First enforcement |
| PEI-010 | Dedicated Decision Manager — architectural continuity intelligence | PILLOW-ENH-007 | Normal — ADR continuity |
| PEI-011 | Dedicated Status Manager — project truth intelligence | PILLOW-ENH-008 | Normal — STATUS synchronization |
| PEI-012 | Executive Audit Reader — audit structure & trend intelligence | PILLOW-ENH-009 | Normal — governance spine |
| PEI-013 | UX Enhancement Register Reader — post-V1 surface intelligence | PILLOW-ENH-010 | Low — cross-program visibility |
| PEI-014 | Conversation intelligence — silent business-conversation analysis & natural dialogue | PILLOW-015 · PILLOW-016 · **Core Principle §2** | Critical — primary Layer 2 expression |
| PEI-026 | **Executive Reflection** — post-reasoning evaluation → candidate knowledge; bridge Reasoning → Learning | Bootstrap extension · `ExecutiveDirectionContext` · Constitution §2.2 | **Critical — first downstream Layer 2 capability** |
| PEI-015 | Executive perspectives — council/debate integration in Pillow responses | REAL-007 · GVD-003/004 | High — executive operating picture |
| PEI-016 | Strategic synthesis dashboard — cross-module executive brief | PILLOW-MASTER · ENH-306–315 | Future — master maturity scoring |
| PEI-017 | Empire Recovery Assessment — recovery session intelligence | Empire Recovery Doctrine · PILLOW-ENH-005 | Normal — continuity intelligence (distinct from PILLOW-019 objective runtime) |
| PEI-018 | REAL owner graph normalization & health intelligence | PILLOW-ENH-014 | Low — repository hygiene |
| PEI-019 | Prompt Registry & canonical executive prompt versioning | Not implemented · BL-C | Future — cognitive consistency |
| PEI-020 | Full Operational Readiness Check (14 criteria) — executive readiness certification | PILLOW-ENH-012 · BL-B Item 013 | Normal — bootstrap certification |
| PEI-021 | Evidence-Based Learning Architecture — unified Evidence Sources abstraction → profit-aligned candidates | Constitution §3.1 · §3.2 | Critical — Layer 2 long-term direction |
| PEI-022 | Commercial outcomes Evidence Source adapter — validated profit signals → strategic synthesis | PEI-021 · Layer 3 bridge · REAL metrics | High — Supreme Directive alignment |
| PEI-023 | Runtime metrics Evidence Source adapter — health/blocker observational learning | PEI-021 · PILLOW-014 · REAL readiness | Normal — observational only |
| PEI-024 | Executive Audits Evidence Source adapter — audit trends → improvement candidates | PEI-021 · PILLOW-009 · Audit Standard §6 | Normal — traceability loop |
| PEI-025 | Approved strategic reviews Evidence Source adapter — Council/Soul outputs → intelligence feed | PEI-021 · REAL-007 · GVD-003/004 | Normal — advisory until GK approves |

### Explicitly NOT Pillow Executive Intelligence

These belong to other roadmap layers:

| Capability | Roadmap layer |
|---|---|
| Marketplace publish, listing optimization, ad spend | Commercial Intelligence (Layer 3) |
| CJ/supplier evaluation, fulfillment adapters | Supplier Intelligence (Layer 4) |
| Live credentials, order flow, PROOF-001, MS-A | Empire Operations (Layer 5) |
| Session store, SSE transport, approval queue mechanics | Pillow Runtime (Layer 1 — complete) |

### Layer 2 entry criteria (proposed)

Layer 2 missions may begin when:

1. Pillow Runtime Layer 1 is ✅ (met 2026-06-29)
2. Grand King approves first PEI mission from `docs/governance/PILLOW_ENHANCEMENT_REGISTER.md`
3. Journey + Journey Audit synchronized per BL-A / ROUTE 02

---

## Mission ID reference (unchanged labels)

PILLOW-001…019 mission IDs are **preserved**. This roadmap **reclassifies** them by layer without renumbering:

| Mission | Roadmap layer | Status |
|---|---|---|
| PILLOW-001…015 | Architecture + intelligence **foundations** (package); Layer 2 activation mostly future | ✅ package complete |
| PILLOW-016…019 | **Layer 1 — Pillow Runtime** | ✅ live |
| PEI-001…026 | **Layer 2 — future intelligence missions** (planning IDs; not yet PILLOW-### until GK approval) | 🔵 proposed |
| Empire Recovery (contract PILLOW-019 historical slot) | Layer 2 — PEI-017 | 🔵 deferred (objective runtime took PILLOW-019 label) |

---

## Related artifacts

| Artifact | Relationship |
|---|---|
| `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` | **Layer 2 defining constitution — Core Principle** |
| `docs/governance/EXECUTIVE_COGNITIVE_PIPELINES.md` | **ADR-046 — PEI pipeline organisation (planning only)** |
| `PILLOW_ARCHITECTURE_CONTRACT.md` | Part 11 — roadmap layer authority |
| `PILLOW_RUNTIME_INTEGRATION_PLAN.md` | Historical Layer 1 integration plan (Phases 1–3 complete) |
| `docs/governance/PILLOW_ENHANCEMENT_REGISTER.md` | Layer 2 capability backlog |
| `JOURNEY.md` | Master index — Pillow Roadmap rows |
| `EMPIREAI_ROADMAP.md` | Empire-wide five-layer summary |
| `EMPIREAI_REPOSITORY_MASTER_INDEX.md` | Navigation to this document |

---

_Planning document only. Implementation of Layer 2 requires Grand King-approved missions per BL-C._
