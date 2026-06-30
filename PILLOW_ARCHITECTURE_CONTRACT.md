# PILLOW ARCHITECTURE CONTRACT — PILLOW-001 (Synchronized)

> Mission: PILLOW-001 — Pillow Architecture Contract  
> **Synchronized:** 2026-06-29 — Pillow Architecture Synchronization (ADR-030)  
> **Status:** **CANONICAL AUTHORITY** — PILLOW-002 ✅ · PILLOW-003 ✅ implemented; future missions follow Part 7 (finalized)  
> Date: 2026-06-29 (original) · synchronized 2026-06-29  
> **Authority:** This document is the single source of truth for every future Pillow implementation mission. Subsystem scope, dependencies, boundaries, and acceptance criteria are defined here. **Part 10** preserves PILLOW-001 original decomposition; **Parts 1–9** reflect the finalized architecture.

---

## Numbering Authority (read first)

| Label | Meaning |
|---|---|
| **PILLOW-001** | Original contract mission — architecture definition (historical decomposition preserved in Part 10) |
| **PILLOW-002+** | Implementation missions — must cite this contract **Part 7 (finalized order)** |
| **Architecture Sync** | 2026-06-29 synchronization — evolved architecture without discarding completed work (ADR-030) |
| **BL-B doctrines** | Parent law — this contract **extends**, does not replace, `EMPIREAI_PILLOW_ARCHITECTURE.md` and related BL-B artifacts |

Prior informal Pillow descriptions are superseded by this contract for implementation purposes. **PILLOW-001 Part 10 mapping is historical continuity only — not reversed by synchronization.**

---

## PART 1 — Purpose

**Pillow** is the **Executive Intelligence of EmpireAI** — the strategic advisor that continuously understands, analyses, protects and guides the Empire while minimizing Grand King's cognitive load.

Pillow is **not** a chatbot, autonomous coding agent, repository modifier, or Cursor controller. The conversational interface is how Grand King interacts with executive intelligence; execution always requires explicit Grand King approval (see `EMPIREAI_PILLOW_CONSTITUTION.md`).

Grand King interacts with the Empire through **one continuous conversation** that internally routes across operating modes (General Intelligence · Empire Operations · Engineering Operations).

Pillow **prepares** operational knowledge via Bootstrap and Repository Intelligence; Pillow **never** replaces OpenAI reasoning capability after session initialization completes. Pillow **never** automatically dispatches Cursor or modifies the repository.

**Parent doctrines (mandatory compliance):**

| Doctrine | Document |
|---|---|
| **Pillow Constitution (V1 permanent)** | `EMPIREAI_PILLOW_CONSTITUTION.md` |
| Pillow Bootstrap & modes | `EMPIREAI_PILLOW_ARCHITECTURE.md` |
| Memory & cost | `EMPIREAI_PILLOW_MEMORY_DOCTRINE.md` |
| Pillow Executive Intelligence (Layer 2) | `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` |
| Journey First | `EMPIREAI_JOURNEY_FIRST_DOCTRINE.md` |
| Repository First | `EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md` |
| Empire Recovery | `EMPIREAI_EMPIRE_RECOVERY_DOCTRINE.md` |
| Executive Audit standard | `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md` |
| Cursor Output standard | `EMPIREAI_CURSOR_OUTPUT_STANDARD.md` |
| Continuous Artifact Generation | `EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md` |

---

## PART 2 — System Architecture (finalized)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Pillow Chat UI (Grand King)                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │     Approval Gate      │  ← Grand King authorizes
                    │  (repository writes)   │     repository mutations
                    └───────────┬───────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
┌────────▼────────┐   ┌─────────▼─────────┐   ┌───────▼────────┐
│ Mission Generator│   │  Cursor Bridge    │   │ OpenAI API     │
│ (draft missions) │   │ (Cursor handoff)  │   │ Integration    │
└────────┬────────┘   └───────────────────┘   │ Layer          │
         │                                      └───────▲────────┘
         │                                              │
         │              ┌─────────────────────────────────┘
         │              │
┌────────▼──────────────▼──────────────────────────────────────────┐
│                        Context Builder                              │
│    (minimum knowledge per request — consumes Intelligence output)   │
└────────┬───────────────────────────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────────────────────────────┐
│              Repository Intelligence Engine (PILLOW-003) ✅           │
│   classify · relationship graph · dependency graph · health · query │
└────────┬────────────────────────────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────────────────────────────┐
│                      Bootstrap Engine (PILLOW-002) ✅               │
│   Repository Reader · artifact discovery · EmpireBootstrapContext   │
└────────┬────────────────────────────────────────────────────────────┘
         │
    ┌────┴────┬────────────┬─────────────┬──────────────┬─────────────┐
    │         │            │             │              │             │
┌───▼───┐ ┌───▼────┐ ┌─────▼─────┐ ┌─────▼──────┐ ┌─────▼──────┐ ┌───▼────────────┐
│Journey│ │Decision│ │  Status   │ │ Executive  │ │ UX Enhance │ │ Repository     │
│Manager│ │Manager │ │  Manager  │ │ Audit      │ │ Register   │ │ Reader         │
│ 🔵    │ │ 🔵     │ │  🔵       │ │ Reader 🔵  │ │ Reader 🔵  │ │ (in Bootstrap ✅)│
└───┬───┘ └───┬────┘ └─────┬─────┘ └─────┬──────┘ └─────┬──────┘ └───┬────────────┘
    │         │            │             │              │             │
    └─────────┴────────────┴─────────────┴──────────────┴─────────────┘
                                    │
                          Canonical repository artifacts
                          (Journey, Soul, Decisions, Status, …)
```

**Legend:** ✅ implemented · 🔵 deferred (partial capability in Bootstrap + Intelligence until dedicated manager missions)

---

## PART 3 — Subsystem Inventory (finalized)

| # | Subsystem | Role | Reads | Writes (via Approval Gate) | Status |
|---|---|---|---|---|---|
| 1 | **Bootstrap Engine** | Session initialization; never skip before first response | Repository Reader + artifact catalog | None directly | ✅ PILLOW-002 |
| 2 | **Repository Reader** | Generic read-only file access (merged into Bootstrap runtime) | Git workspace files | None | ✅ PILLOW-002 |
| 3 | **Repository Intelligence Engine** | Engineering knowledge layer — classification, graphs, health, queries | Bootstrap output + repository texts | None | ✅ PILLOW-003 |
| 4 | **Context Builder** | Minimum context assembly per OpenAI request | Intelligence + scoped repository slices | None | ✅ PILLOW-004 |
| 5 | **Repository Memory Engine** | Long-term operational memory from repository | Bootstrap + Intelligence | None | ✅ PILLOW-005 |
| 6 | **Mission Planner** | Strategic planning — next mission, priority, dependencies, Cursor-ready generation | Memory + Intelligence + Bootstrap | None | ✅ PILLOW-006 |
| 7 | **Cursor Supervisor** | Engineering orchestration — launch, monitor, stall recovery for Cursor missions | Planner + Memory + Recovery Doctrine | None | ✅ PILLOW-007 |
| 8 | **Recovery Manager** | Autonomous engineering recovery per Cursor Recovery Doctrine | Supervisor invocation · git inspection | None | ✅ PILLOW-008 |
| 9 | **Executive Audit Reviewer** | Mandatory quality gate — evaluate missions before acceptance | Mission + audit + validation + repository inspection | None | ✅ PILLOW-009 |
| 10 | **Repository Synchronizer** | Repository maintenance — sync canonical artifacts after approved work | Memory + git inspection + drift signals | Gated writes only | ✅ PILLOW-010 |
| 11 | **Continuous Due Diligence Engine** | Permanent self-initiated analysis and improvement discovery | All Pillow modules · Memory · Intelligence | None | ✅ PILLOW-011 |
| 12 | **Autonomous Improvement Engine** | Convert observations into structured improvement proposals and mission readiness | Due Diligence · Memory · Intelligence · Mission Planner | None | ✅ PILLOW-012 |
| 13 | **EmpireAI Orchestrator** | Central coordination of subsystems, workers, and workflows | All Pillow modules | None | ✅ PILLOW-013 |
| 14 | **Live Repository Watcher** | Continuous repository sensing — change detection, events, drift | Repository · Memory · Intelligence | None | ✅ PILLOW-014 |
| 15 | **Grand King Command Interface** | Natural-language executive console — intent → context → coordination | All Pillow modules · Memory · Intelligence | None | ✅ PILLOW-015 |
| 16 | **Journey Manager** | Operational position; Journey First enforcement | `JOURNEY.md`, `JOURNEY_AUDIT.md` | Journey owners (gated) | 🔵 deferred |
| 17 | **Decision Manager** | Architectural/commercial decision continuity | `EMPIREAI_DECISIONS.md` | Decision Register (gated) | 🔵 deferred |
| 18 | **Status Manager** | Current project truth | `EMPIREAI_STATUS.md` | Project Status (gated) | 🔵 deferred |
| 19 | **UX Enhancement Register Reader** | Post-V1 UX backlog visibility | Register or Journey fallback | None | 🔵 deferred |
| 20 | **Executive Audit Reader** | Load latest audits; validate structure | Audit artifacts on disk | None | 🔵 deferred |
| 21 | **Mission Generator** | Draft Cursor missions for Grand King approval *(runtime: Mission Planner)* | Memory + Planner output | Mission artifacts (gated) | 🔵 PILLOW-017 |
| 22 | **Cursor Bridge** | Hand approved missions to Cursor; receive audits *(supervised by Cursor Supervisor)* | Supervisor + mission format · Executive Audits | None (handoff only) | 🔵 PILLOW-017 |
| 23 | **Approval Gate** | Grand King authorization before any repository mutation | Pending proposals | Approved owners only | 🔵 PILLOW-017 |
| 24 | **Pillow Chat UI** | Single continuous conversation surface | Pillow backend/session | Session state (ephemeral) | 🔵 PILLOW-018 |
| 25 | **OpenAI API Integration Layer** | LLM requests with Context Builder payloads | Context Builder + Memory | None | 🔵 PILLOW-016 |
| 26 | **Empire Recovery Assessment** | Recovery session runtime (BL-B doctrine) | Recovery checklist domains | Recovery report (gated) | 🔵 PILLOW-019 |

**PILLOW-001 note:** Original contract listed 13 subsystems without Repository Intelligence and with managers assumed in PILLOW-002. **Part 10** maps original names to finalized names. Completed PILLOW-002/003 implementations are **not discarded**.

---

## PART 4 — Subsystem Specifications

### 4.1 Bootstrap Engine

**Owner route:** Pillow Architecture · `EMPIREAI_PILLOW_ARCHITECTURE.md` §2–3

**Triggers:** First login · browser refresh · new session · recovery session · workstation replacement

**Sequence (finalized — PILLOW-002/003 implemented):**

```
Bootstrap Engine (PILLOW-002)
      ↓
Repository Reader + artifact catalog (read-only)
      ↓
EmpireBootstrapContext + Failure Mode gate
      ↓
Repository Intelligence Engine (PILLOW-003)
      ↓
RepositoryIntelligenceContext (classify · graph · health · query)
      ↓
Context Builder (PILLOW-004) ✅
      ↓
Repository Memory Engine (PILLOW-005) ✅
      ↓
Mission Planner (PILLOW-006) ✅
      ↓
Cursor Supervisor (PILLOW-007) ✅
      ↓
Recovery Manager (PILLOW-008) ✅
      ↓
Executive Audit Reviewer (PILLOW-009) ✅
      ↓
Repository Synchronizer (PILLOW-010) ✅
      ↓
Continuous Due Diligence Engine (PILLOW-011) ✅
      ↓
Autonomous Improvement Engine (PILLOW-012) ✅
      ↓
EmpireAI Orchestrator (PILLOW-013) ✅
      ↓
Live Repository Watcher (PILLOW-014) ✅
      ↓
Grand King Command Interface (PILLOW-015) ✅
      ↓
Executive Self-Assessment (reconstruction gate) ✅
      ↓
Executive Briefing generated (internal — pre-conversation)
      ↓
Operational Readiness Check (14 mandatory criteria — BL-B Item 013)
      ↓
Pillow Ready
```

**Implemented today:** Through Grand King Command Interface (PILLOW-015) — **Pillow Version 1 architecture complete**. Post-V1 missions (OpenAI, Approval Gate, Chat UI) require Grand King approval.

**Acceptance (PILLOW-015 ✅):** Natural language commands; automatic context; execution plans; module coordination; Grand King priority; repository-backed continuity; read-only verified.

**Acceptance (PILLOW-014 ✅):** Continuous observation; change detection; structured events; subscriber notification; drift detection; read-only verified.

**Acceptance (PILLOW-013 ✅):** Subsystem and worker registries operational; workflow coordination; scheduling; failure coordination; Grand King priority; read-only verified.

**Acceptance (PILLOW-012 ✅):** Improvement proposals generated from Due Diligence observations; evidence attached; dependencies verified; mission readiness determined; Grand King approval gate enforced; read-only verified.

**Acceptance (PILLOW-011 ✅):** Continuous analysis operational; recommendations prioritized; Grand King interrupt; read-only verified.

**Acceptance (PILLOW-008 ✅):** Recovery resumes missions per doctrine; outcomes recorded; repository/Journey/BL untouched by recovery runtime.

**Acceptance (PILLOW-002 ✅):** Pillow cannot proceed to operational reasoning until Bootstrap succeeds. Failure surfaces structured blocker report.

**Acceptance (PILLOW-003 ✅):** `startPillow()` chains Bootstrap → Intelligence before any downstream module.

---

### 4.2 Context Builder

**Owner route:** AI Cognitive Doctrine · `EMPIREAI_PILLOW_MEMORY_DOCTRINE.md`  
**Mission:** PILLOW-004 ✅

**Doctrine:** Determine **minimum** repository knowledge before **every** OpenAI API request. Never transmit unnecessary artifacts. Never replay full conversation history as context.

**Input (finalized):** `RepositoryIntelligenceContext` from PILLOW-003 — classification, relationships, dependencies, health — plus targeted repository slices per task.

**Runtime:** `pillow/src/context/` · `ContextBuilder` · `buildPillowContext()`

**Task profiles:** `continue_ux` · `generate_cursor_mission` · `review_executive_audit` · `empire_progress` · `journey_question` · `architecture` · `recovery` · `general`

**Acceptance (PILLOW-004 ✅):** Context manifest with artifact IDs, paths, token estimate. Runtime cache with repository fingerprint invalidation. Read-only.

| Operating mode | Typical minimum context |
|---|---|
| General Intelligence | None (or session user identity only) |
| Empire Operations — Journey question | Journey Manager snapshot + Status Manager snapshot |
| Empire Operations — architecture | Journey + Soul + Decision Manager snapshot |
| Engineering Operations — mission draft | Journey + Status + relevant contract + latest Executive Audit |
| Engineering Operations — audit review | Executive Audit Reader payload + Journey delta |
| Recovery session | Empire Recovery checklist domains (`EMPIREAI_EMPIRE_RECOVERY_DOCTRINE.md`) |

---

### 4.14 Repository Intelligence Engine

**Owner route:** Pillow Architecture · ADR-029 · `pillow/src/intelligence/`  
**Mission:** PILLOW-003 ✅

**Purpose:** Transform Bootstrap discovery into structured operational knowledge. Bootstrap knows **what exists**; Intelligence understands **what everything means**.

**Responsibilities (implemented):**

* Classify repository artifacts (constitution, doctrine, journey, contract, REAL owner, UX, GC, pillow, …)
* Build relationship graph (owns, depends_on, governs, implements, …)
* Build dependency graph (mission, owner, contract, commercial, governance)
* Evaluate repository health (detection only — no auto-repair)
* Answer natural repository queries from graph knowledge

**Reads:** `EmpireBootstrapContext` + `JOURNEY.md` + `UX_IMPLEMENTATION_CONTRACT.md` + `EMPIREAI_DECISIONS.md` + executive component index

**Prohibited:** Repository writes · Journey updates · BL updates · Cursor mission generation · implementation approval

**Acceptance (PILLOW-003 ✅):** `runRepositoryIntelligence()` produces `RepositoryIntelligenceContext`. Chained in `startPillow()` immediately after Bootstrap.

---

### 4.15 Repository Memory Engine

**Owner route:** Pillow Architecture · `EMPIREAI_PILLOW_MEMORY_DOCTRINE.md` · ADR-033  
**Mission:** PILLOW-005 ✅

**Purpose:** Maintain accurate, continuously refreshed operational memory from repository truth — without conversation history.

**Memory domains:** Journey position · completed/pending missions · architecture · repository health · owners · doctrines · contracts · executive audits · decisions · UX enhancements · GC/EC · REAL owners · BL documents · sync state.

**Lifecycle:** Initialize after Bootstrap → refresh after Intelligence → support Context Builder → auto-refresh on repository fingerprint change.

**Runtime:** `pillow/src/memory/` · `RepositoryMemoryEngine` · `requirePillowMemory()`

**Prohibited:** Repository writes · Journey/BL/audit mutation

**Acceptance (PILLOW-005 ✅):** All domains populated with provenance; `ensureFresh()` on context build; integrity verification; read-only.

---

### 4.16 Mission Planner

**Owner route:** Pillow Architecture · Part 4.8 · ADR-034  
**Mission:** PILLOW-006 ✅

**Purpose:** Determine the correct next engineering, repository, governance, architecture, or operational mission from repository state — never conversation history.

**Mission categories:** UX · REAL · GC · EC · Repository · Journey · Journey Audit · BL-A/B/C · Architecture · Governance · Pillow · Recovery · Executive Reviews · Repository Synchronization · Commercial Intelligence.

**Responsibilities:** Mission sequencing · priority assignment · dependency validation · Cursor-ready mission generation.

**Input:** `RepositoryMemoryState` + `RepositoryIntelligenceContext` + `EmpireBootstrapContext`

**Runtime:** `pillow/src/planner/` · `MissionPlannerEngine` · `requirePillowMissionPlanner()` · `generateNextPillowMission()`

**Prohibited:** Repository writes · mission execution · implementation approval

**Acceptance (PILLOW-006 ✅):** Next mission from repository; dependencies validated; standardized mission document; read-only.

---

### 4.17 Cursor Supervisor

**Owner route:** Pillow Architecture · `EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md` · ADR-035  
**Mission:** PILLOW-007 ✅

**Purpose:** Engineering orchestration layer — launch, monitor, supervise, and recover Cursor engineering missions. Cursor becomes a managed worker; Pillow becomes the supervisor.

**Mission lifecycle states:** queued · preparing · repository_inspection · implementation · validation · executive_audit · completed · recovery · failed · cancelled

**Responsibilities:** Mission registry · heartbeat monitoring · progress monitoring · stall detection · dead agent detection · Recovery Manager coordination · Executive Audit supervision.

**Input:** Mission Planner output · Repository Memory · Recovery Doctrine

**Runtime:** `pillow/src/supervisor/` · `CursorSupervisorEngine` · `requirePillowSupervisor()`

**Prohibited:** Repository writes · Journey/BL mutation · implementation approval

**Acceptance (PILLOW-007 ✅):** Missions launched and tracked; doctrine-conformant stall recovery; audit verification; read-only.

---

### 4.18 Recovery Manager

**Owner route:** Pillow Architecture · `EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md` · ADR-036  
**Mission:** PILLOW-008 ✅

**Purpose:** Autonomous engineering recovery — preserve completed work, resume interrupted missions, execute doctrine validation cycle. Invoked **only** by Cursor Supervisor.

**Recovery procedure:** Inspect repository → diagnose mission → determine strategy → resume first incomplete item → one validation cycle → Executive Audit.

**Recovery outcomes:** recovered_successfully · recovered_with_warnings · recovery_failed · manual_intervention_required · mission_already_complete

**Runtime:** `pillow/src/recovery/` · `RecoveryManagerEngine` · `requirePillowRecovery()`

**Prohibited:** Journey/BL/governance modification · duplicate implementation · repeated validation loops

**Acceptance (PILLOW-008 ✅):** Recovery resumes without restart; outcomes recorded; repository preservation verified.

---

### 4.19 Executive Audit Reviewer

**Owner route:** Pillow Architecture · `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md` · ADR-037  
**Mission:** PILLOW-009 ✅

**Purpose:** Mandatory quality gate before any mission is considered complete. Completion does not equal acceptance.

**Review categories:** Contract Compliance · Acceptance Compliance · Architecture Compliance · Repository Ownership · Component Reuse · Dependency Compliance · Validation Quality · Repository Continuity · Governance Compliance · Engineering Completeness

**Decision outcomes:** approved · approved_with_recommendations · conditionally_approved · rejected · manual_review_required

**Integration:** Reports to Cursor Supervisor. On approval, Mission Planner eligible for next mission. On rejection, Recovery Manager or Mission Planner determines corrective action.

**Runtime:** `pillow/src/audit-reviewer/` · `ExecutiveAuditReviewerEngine` · `requirePillowAuditReviewer()`

**Prohibited:** Repository writes · Journey/BL mutation · rewriting Executive Audits · approving repository changes

**Acceptance (PILLOW-009 ✅):** Audits evaluated; acceptance criteria verified individually; approval decision with reasoning; read-only verified.

---

### 4.20 Repository Synchronizer

**Owner route:** Pillow Architecture · `EMPIREAI_JOURNEY_FIRST_DOCTRINE.md` · `EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md` · ADR-038  
**Mission:** PILLOW-010 ✅

**Purpose:** Repository maintenance engine — keep canonical artifacts synchronized after approved engineering work. Preview Mode always first; Grand King approval required before writes.

**Synchronization scope:** Journey · Journey Audit · Empire Status · Decisions · Soul · BL-A/B/C · Enhancement Registers · Doctrines · Pillow Contracts · ADRs.

**Workflow:** Detect changes → Preview (no writes) → Approval Gate → Execute (approved only) → Verify → History.

**Runtime:** `pillow/src/synchronizer/` · `RepositorySynchronizerEngine` · `requirePillowSynchronizer()`

**Prohibited:** Engineering implementation · application code changes · mission generation · self-approval · bypassing Preview Mode

**Acceptance (PILLOW-010 ✅):** Change detection, preview, approval gate, verification, and history operational; read-only until approved.

---

### 4.21 Continuous Due Diligence Engine

**Owner route:** Pillow Architecture · `EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md` · ADR-039  
**Mission:** PILLOW-011 ✅

**Purpose:** Permanent self-initiated analysis subsystem — continuously investigate, validate, and improve EmpireAI without waiting for explicit user instructions. Pillow shall never become passive.

**Analysis domains:** Repository architecture · mission progression · repository health · journey consistency · commercial readiness · recovery readiness · technical debt · future scalability · *(auto-expanding)*

**Review categories:** Architecture · Risk · Repository · Dependency · Mission · Governance · Commercial · Security · Performance · Automation · Scalability · Repository Drift

**Recommendation priorities:** critical · high · normal · low · future — all require Grand King approval before execution.

**Runtime:** `pillow/src/due-diligence/` · `ContinuousDueDiligenceEngine` · `requirePillowDueDiligence()`

**Prohibited:** Repository writes · Journey/BL mutation · engineering execution · Cursor launch · self-approval

**Acceptance (PILLOW-011 ✅):** Continuous analysis; categorized recommendations; Grand King interrupt; read-only verified.

---

### 4.22 Autonomous Improvement Engine

**Owner route:** Pillow Architecture · `EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md` · ADR-040  
**Mission:** PILLOW-012 ✅

**Purpose:** Strategic improvement subsystem — convert approved Due Diligence observations into structured engineering proposals and implementation plans. Observation alone creates no value; improvement begins when observations become executable missions.

**Improvement domains:** Repository architecture · engineering architecture · commercial architecture · mission planning · Journey · repository synchronization · recovery · automation · executive governance · UX · REAL owners · global/executive components · Pillow · *(auto-expanding)*

**Improvement lifecycle:** Observation → evidence collection → impact analysis → priority assessment → dependency verification → implementation proposal → Grand King approval → mission generation → execution → executive audit review → repository synchronization

**Proposal fields:** Title · objective · reason · repository evidence · affected owners/contracts/modules · expected benefits/risks · engineering effort · commercial impact · recommended priority · mission sequence · mission readiness

**Mission readiness:** ready_for_implementation · blocked_by_dependencies · requires_repository_synchronization · requires_architecture_review · requires_grand_king_decision · requires_further_investigation

**Runtime:** `pillow/src/improvement/` · `AutonomousImprovementEngine` · `requirePillowImprovement()`

**Prohibited:** Engineering execution · repository writes · Journey/BL mutation · self-approval · direct Cursor launch

**Acceptance (PILLOW-012 ✅):** Proposals generated with evidence; dependencies verified; readiness determined; approval workflow enforced; read-only verified.

---

### 4.23 EmpireAI Orchestrator

**Owner route:** Pillow Architecture · `PILLOW_ARCHITECTURE_CONTRACT.md` · ADR-041  
**Mission:** PILLOW-013 ✅

**Purpose:** Central coordination layer — coordinate every Pillow subsystem, engineering worker, repository process, and governance workflow. The Orchestrator coordinates; it never replaces specialized modules or performs engineering work.

**Subsystem registry:** Dynamic discovery of Bootstrap through Autonomous Improvement plus deferred Live Repository Watcher and Grand King Command Interface.

**Worker registry:** Cursor (primary engineering worker) plus replaceable future agents (testing, documentation, review, commercial, research).

**Workflows:** Engineering · repository synchronization · executive review · mission planning · recovery · architecture improvement · commercial improvement · continuous due diligence.

**Engineering pipeline:** Mission Planner → Cursor Supervisor → Engineering Worker → Recovery (optional) → Executive Audit Reviewer → Repository Synchronizer → Memory Refresh → Due Diligence → Mission Planner.

**Runtime:** `pillow/src/orchestrator/` · `EmpireAIOrchestrator` · `requirePillowOrchestrator()`

**Prohibited:** Direct repository writes · governance rewrites · engineering approval · sync approval · bypassing Executive Audit · bypassing Grand King authority

**Acceptance (PILLOW-013 ✅):** Registries operational; pipeline coordinated; scheduling and failure coordination; Grand King priority enforced; read-only verified.

---

### 4.24 Live Repository Watcher

**Owner route:** Pillow Architecture · `PILLOW_ARCHITECTURE_CONTRACT.md` · ADR-042  
**Mission:** PILLOW-014 ✅

**Purpose:** Continuous sensing subsystem — observe repository activity, detect changes, classify events, notify subscribers, and identify drift. Pillow shall never assume repository state remains unchanged. The Watcher observes only.

**Observation scope:** Journey · Journey Audit · BL-A/B/C · Executive Audits · Architecture Decisions · Doctrines · UX/Pillow contracts · REAL owners · enhancement registers · repository structure · *(auto-expanding)*

**Change detection:** New/modified/deleted/renamed files · restructuring · Journey/BL updates · executive audit additions · synchronization · architecture/doctrine/contract changes · mission completion

**Event types:** RepositoryUpdated · JourneyUpdated · ExecutiveAuditAdded · MissionCompleted · DoctrineUpdated · ArchitectureChanged · SynchronizationCompleted · RepositoryHealthChanged · DriftDetected

**Subscribers:** Memory · Mission Planner · Cursor Supervisor · Executive Audit Reviewer · Repository Synchronizer · Due Diligence · Autonomous Improvement · Orchestrator · *(future modules)*

**Runtime:** `pillow/src/watcher/` · `LiveRepositoryWatcherEngine` · `requirePillowWatcher()`

**Prohibited:** Repository writes · Journey/BL mutation · approving or repairing repository issues · generating engineering work

**Acceptance (PILLOW-014 ✅):** Changes detected; events generated; subscribers notified; drift detected; optimized scanning; read-only verified.

---

### 4.25 Grand King Command Interface

**Owner route:** Pillow Architecture · `PILLOW_ARCHITECTURE_CONTRACT.md` · ADR-043  
**Mission:** PILLOW-015 ✅

**Purpose:** Primary operational interface between Grand King and Pillow — natural-language executive console translating intent into governed operations. The Grand King issues objectives; Pillow determines execution.

**Intent resolution:** Intent → repository context → relevant modules → dependencies → execution plan → Grand King confirmation (when required) → coordinated execution.

**Supported commands:** Continue · What's next? · Build/generate mission · Review repository/progress/architecture/health/commercial · Recover Cursor · Prepare Version 1 · Begin Pillow · Pause/resume autonomous work · *(auto-expanding)*

**Context awareness:** Journey · health · current mission · outstanding missions · architecture · audits · recovery · engineering · commercial · synchronization — loaded automatically from Memory and Intelligence.

**Runtime:** `pillow/src/command/` · `GrandKingCommandInterface` · `requirePillowCommand()`

**Prohibited:** Bypassing governance · bypassing Executive Audit · direct repository writes · engineering implementation

**Acceptance (PILLOW-015 ✅):** Intent parsing; context loading; execution plans; module coordination; Grand King priority; repository continuity; read-only verified.

---

### 4.3 Repository Reader

**Owner route:** Repository Governance · Repository First Doctrine

**Purpose:** Generic, read-only access to canonical repository files on disk or via approved git API.

**Capabilities:**

* Resolve paths to canonical owners (never invent owners — ADR-020)
* Verify file existence and last-modified metadata
* Return structured excerpts for managers and Context Builder
* Report missing owners to Grand King when a subsystem requires an artifact that does not exist

**Prohibited:** Direct writes. All mutations route through Approval Gate.

---

### 4.4 Journey Manager

**Owner route:** Journey · `EMPIREAI_JOURNEY_FIRST_DOCTRINE.md`

**Reads:** `JOURNEY.md`, `JOURNEY_AUDIT.md`

**Responsibilities:**

* Determine current operational position (e.g. UX Complete → Pillow → Go-Live)
* Answer "where is the Empire in the journey?" before executive recommendations
* Propose Journey synchronization when approved engineering/governance changes occur
* Preserve chronological audit log requirements

**Writes (gated):** Journey + Journey Audit only after Grand King approval via Approval Gate.

---

### 4.5 Decision Manager

**Owner route:** Decision Register · `EMPIREAI_DECISIONS.md`

**Reads:** `EMPIREAI_DECISIONS.md` (ADRs, PDRs)

**Responsibilities:**

* Surface relevant ADRs for the current question
* Propose new ADR entries for approved decisions
* Never contradict Decision Register without explicit Grand King override

**Writes (gated):** Append-only ADR proposals → Approval Gate → Decision Register.

---

### 4.6 Status Manager

**Owner route:** Project Status · `EMPIREAI_STATUS.md`

**Reads:** `EMPIREAI_STATUS.md`, optionally live health endpoints when configured

**Responsibilities:**

* Report current maturity, milestones (MS-A/MS-B), blockers, next gates
* Distinguish repository reality from historical preserved sections
* Propose Status updates after approved mission closeouts

**Writes (gated):** Project Status updates via Approval Gate.

---

### 4.7 UX Enhancement Register Reader

**Owner route:** UX Governance (canonical register — **not yet created**)

**Primary source (when exists):** `docs/governance/UX_ENHANCEMENT_REGISTER.md`

**Fallback source (until register exists):** `JOURNEY.md` UX Backlog rows (`BL-01`…`BL-11`) + `UX_IMPLEMENTATION_CONTRACT.md` Part 6 exclusions

**Responsibilities:**

* Read post-V1 UX enhancement backlog for Grand King planning
* Never conflate UX Backlog (`BL-##` in contract) with Backlog Release (`BL-A`, `BL-B`, `BL-C`)
* Report missing canonical register if Grand King requests register-specific operations

**Writes:** None — read-only subsystem.

**Note:** If no register file exists, Pillow shall report the missing owner and recommend Grand King approval before creation (ADR-020).

---

### 4.8 Mission Generator

**Owner route:** Pillow Architecture · Engineering Operations mode

**Purpose:** Draft structured Cursor outputs (missions) for Grand King review per **`EMPIREAI_CURSOR_OUTPUT_STANDARD.md`**.

**Output format (frozen — two sections):**

**SECTION 1 — Executive Summary** (Grand King only — not implementation instructions):

* My Understanding
* Why this recommendation exists
* Expected Outcome
* Repository Impact
* Risk Assessment
* Recommendation

**SECTION 2 — Cursor Draft** (Cursor implementation only):

* Mission ID and title
* Mission type
* Objective (contract citation)
* Dependencies verification checklist
* Implementation rules
* Validation requirements
* Acceptance criteria
* Executive Audit expectations
* STOP conditions

**Constitutional rule:** Every lasting decision preserves executive intent (Section 1) and engineering implementation (Section 2).

**Prohibited:** Auto-dispatch to Cursor without Approval Gate + Grand King authorization.

---

### 4.9 Cursor Bridge

**Owner route:** Pillow Architecture · Cursor (governed implementation worker)

**Purpose:** Hand off **approved** missions to Cursor; ingest Cursor Executive Audit results back into Pillow session context.

**Handoff contract:**

* Approved Cursor Output per `EMPIREAI_CURSOR_OUTPUT_STANDARD.md` — **Section 2 (Cursor Draft)** is primary implementation authority; Section 1 preserved for audit traceability
* Repository root path
* Active branch metadata (when available)
* Reference to applicable architecture/UX contracts

**Return contract:**

* Executive Audit (per `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md`)
* Build/typecheck results when applicable
* Recommended BL-C items (for Grand King accumulation only)

**Prohibited:** Cursor Bridge shall not modify repository files directly — Cursor executes; Pillow orchestrates.

---

### 4.10 Executive Audit Reader

**Owner route:** Repository Governance · `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md`

**Reads:** Latest mission audits, `BL-*_VALIDATION_REPORT.md`, UX Master Audit, PILLOW closeout reports

**Responsibilities:**

* Load most recent Executive Audit for session context
* Validate presence of mandatory sections (including Owner Justification)
* Surface outstanding risks and executive recommendations to Grand King

**Writes:** None — audits are produced by Cursor/mission closeouts, not Pillow Reader.

---

### 4.11 Approval Gate

**Owner route:** Repository Governance · GVD-019 (Irreversible Actions Require King Approval)

**Purpose:** **No repository mutation without Grand King explicit approval.**

**Gated actions:**

* Journey / Journey Audit updates
* Decision Register ADR append
* Project Status updates
* Mission dispatch to Cursor
* Backlog Release item accumulation (BL-C+)
* Any file write outside ephemeral chat session state

**Flow:**

```
Subsystem proposes change
        ↓
Approval Gate presents diff summary to Grand King
        ↓
Grand King: Approve / Reject / Defer
        ↓
On Approve → execute write to canonical owner
        ↓
Record synchronization in next Executive Audit
```

---

### 4.12 Pillow Chat UI

**Owner route:** Pillow Architecture (presentation layer)

**Purpose:** Single continuous conversation for Grand King — General Intelligence, Empire Operations, and Engineering Operations without mode switching by the user.

**Requirements (future implementation):**

* Bootstrap status indicator until Pillow Ready
* Visible Approval Gate prompts for repository mutations
* Mission draft review panel before Cursor handoff
* Recovery session banner when Empire Recovery Assessment runs
* Ephemeral session history (not permanent memory — Memory Doctrine)

**Prohibited in V1 Pillow UI scope:** Duplicating full dashboard UX screens (UX-001…023 remain in `frontend/`).

---

### 4.13 OpenAI API Integration Layer

**Owner route:** AI Cognitive Doctrine · Cost Governance — CFO

**Purpose:** Execute LLM requests with Context Builder payloads only.

**Requirements (future implementation):**

* Model selection policy (documented in implementation mission)
* Token budget per operating mode
* Context manifest attached to each request (internal telemetry)
* No persistent conversation embedding store — repository is memory
* Rate limit and error surfacing to Grand King

**Compliance:** `EMPIREAI_PILLOW_MEMORY_DOCTRINE.md` — remember knowledge, not conversations.

---

## PART 5 — Dependencies (finalized)

| Subsystem | Must exist first | Depends on |
|---|---|---|
| Bootstrap Engine | Repository root valid | Repository Reader |
| Repository Intelligence | Bootstrap complete ✅ | Bootstrap output |
| Context Builder | Intelligence complete | Intelligence + managers (when implemented) |
| Journey Manager | Repository Reader | `JOURNEY.md` |
| Decision Manager | Repository Reader | `EMPIREAI_DECISIONS.md` |
| Status Manager | Repository Reader | `EMPIREAI_STATUS.md` |
| UX Enhancement Register Reader | Repository Reader | Register or Journey fallback |
| OpenAI API Integration Layer | Context Builder initialized | Context Builder · credentials (future env) |
| Mission Generator | Context Builder | Approval Gate |
| Cursor Bridge | Approval Gate | Mission Generator output |
| Executive Audit Reader | Repository Reader | Audit artifacts on disk |
| Approval Gate | Bootstrap + Intelligence complete | Grand King session |
| Pillow Chat UI | Pillow Ready | OpenAI layer + Approval Gate |
| Empire Recovery Assessment | Bootstrap Ready | Recovery doctrine checklist |

**External dependencies (existing, reused — not invented):**

| Asset | Owner |
|---|---|
| Auth session / Grand King identity | `backend/src/auth` · UX-001 |
| Journey index | `JOURNEY.md` |
| UX contract (complete) | `UX_IMPLEMENTATION_CONTRACT.md` |
| Cursor Recovery | `EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md` |
| Empire Recovery | `EMPIREAI_EMPIRE_RECOVERY_DOCTRINE.md` |

---

## PART 6 — Boundaries (PILLOW-001 scope)

### 6.1 IN SCOPE for PILLOW-001 (this mission)

✅ Architecture contract (this document)  
✅ Subsystem definitions, dependencies, acceptance criteria for future missions  
✅ Repository owner routing table  
✅ Journey / Status / Decisions synchronization  

### 6.2 OUT OF SCOPE for PILLOW-001 (explicitly deferred)

❌ Runtime code (any language)  
❌ Frontend Pillow Chat UI implementation  
❌ Backend Pillow API routes  
❌ OpenAI API calls  
❌ Database schema  
❌ Cursor MCP/SDK wiring (PILLOW-003+ territory)  

---

## PART 7 — Implementation Order (finalized — authoritative for PILLOW-004+)

```
PILLOW-001  Architecture Contract (original decomposition) ✅
      ↓
PILLOW-002  Bootstrap Engine + Repository Reader (read-only) ✅
      ↓
PILLOW-003  Repository Intelligence Engine (read-only) ✅
      ↓
PILLOW-004  Context Builder ✅
      ↓
PILLOW-005  Repository Memory Engine ✅
      ↓
PILLOW-006  Mission Planner ✅
      ↓
PILLOW-007  Cursor Supervisor ✅
      ↓
PILLOW-008  Recovery Manager ✅
      ↓
PILLOW-009  Executive Audit Reviewer ✅
      ↓
PILLOW-010  Repository Synchronizer ✅
      ↓
PILLOW-011  Continuous Due Diligence Engine ✅
      ↓
PILLOW-012  Autonomous Improvement Engine ✅
      ↓
PILLOW-013  EmpireAI Orchestrator ✅
      ↓
PILLOW-014  Live Repository Watcher ✅
      ↓
PILLOW-015  Grand King Command Interface ✅  ← Pillow V1 complete
      ↓
PILLOW-016  OpenAI API Integration Layer (deferred post-V1)
      ↓
PILLOW-017  Approval Gate + Cursor Bridge (deferred)
      ↓
PILLOW-018  Pillow Chat UI (deferred)
      ↓
PILLOW-019  Empire Recovery Assessment runtime (deferred)
```

**Historical note:** Pillow Version 1 completes at PILLOW-015. Post-V1 missions require Grand King approval. See **ADR-030** through **ADR-043**.

Dedicated manager subsystems (Journey, Decision, Status, Executive Audit Reader, UX Enhancement Register Reader) may ship as thin modules inside PILLOW-004 or as incremental missions — they are **not** reimplemented inside Bootstrap/Intelligence.

---

## PART 8 — Acceptance Criteria (PILLOW-001 contract complete)

PILLOW-001 is **COMPLETE** when:

| # | Criterion | Verifiable by |
|---|---|---|
| 1 | `PILLOW_ARCHITECTURE_CONTRACT.md` exists and defines all 13 subsystems | File inspection |
| 2 | Each subsystem has read/write boundaries documented | Part 4 table |
| 3 | Bootstrap + Context Builder sequences match BL-B doctrines | Cross-doc diff |
| 4 | Approval Gate gates all repository mutations | Part 4.11 |
| 5 | UX Enhancement Register Reader documents fallback + missing-owner rule | Part 4.7 |
| 6 | No runtime code introduced in PILLOW-001 | `git diff` scope |
| 7 | Journey synchronized with PILLOW-001 row | `JOURNEY.md` |
| 8 | Executive Audit produced with Owner Justification | Closeout report |

**PILLOW-001 remains complete.** Synchronization (ADR-030) **extends** the contract — it does not reopen PILLOW-001 acceptance.

---

## PART 9 — Relationship to EmpireAI workers

| Worker | Relationship to Pillow |
|---|---|
| **Grand King** | Sole approver; Approval Gate authority |
| **Pillow** | Primary executive operating interface (this contract) |
| **Cursor** | Implementation worker — receives approved missions via Cursor Bridge |
| **Pillow Executive Perspectives** | Internal reasoning disciplines (`pillow/src/executive-perspectives/`) — single Pillow intelligence; Pillow Synthesis; see master constitution §15 |
| **REAL Executive Council / Soul** | Empire-wide commercial governance (GVD-003/004) — Pillow may reference outputs but does not replace governance chain |

---

## PART 10 — Architecture Evolution & Mapping (PILLOW-001 → Finalized)

> **Purpose:** Preserve engineering continuity. PILLOW-001 authored the initial 13-subsystem decomposition. PILLOW-002/003 implementation revealed that Repository Intelligence is required between Bootstrap and Context Builder, and that manager subsystems should not block Bootstrap delivery.

### 10.1 Architectural differences identified

| # | Difference | Treatment |
|---|---|---|
| 1 | No Repository Intelligence in PILLOW-001 | **Extend** — new subsystem #3 (PILLOW-003 ✅) |
| 2 | PILLOW-002 assumed all managers in one mission | **Split** — Bootstrap + Reader shipped; managers **deferred** with partial parsers/graph |
| 3 | PILLOW-003 originally Context Builder + OpenAI | **Split** — Intelligence = PILLOW-003; Context Builder = PILLOW-004; Memory = PILLOW-005; Planner = PILLOW-006; OpenAI = PILLOW-007 |
| 4 | PILLOW-004 originally Approval Gate bundle | **Rename/reorder** — Approval bundle → PILLOW-008 |
| 5 | PILLOW-005 originally Chat UI | **Rename** — Chat UI → PILLOW-009 |
| 6 | PILLOW-006 originally Empire Recovery | **Rename** — Recovery → PILLOW-010 |
| 7 | Empire Recovery not in original 13 inventory | **Extend** — explicit subsystem #17 |
| 8 | Repository Reader listed separately | **Merge** — implemented inside Bootstrap (`RepositoryReader`) |
| 9 | Repository Memory not explicit in PILLOW-001 | **Extend** — subsystem #5 (PILLOW-005 ✅) |
| 10 | Mission Planner not in PILLOW-001 | **Extend** — subsystem #6 (PILLOW-006 ✅) |

### 10.2 Subsystem mapping table (original → finalized)

| PILLOW-001 Original # | Original Subsystem Name | Finalized Name | Treatment | Implementation |
|---|---|---|---|---|
| 1 | Bootstrap Engine | Bootstrap Engine | **Retain** | ✅ `pillow/src/bootstrap/` |
| 3 | Repository Reader | Repository Reader (in Bootstrap) | **Merge** | ✅ `pillow/src/bootstrap/repository-reader.ts` |
| — | *(not in PILLOW-001)* | Repository Intelligence Engine | **Extend** | ✅ `pillow/src/intelligence/` |
| 2 | Context Builder | Context Builder | **Retain · reorder** | ✅ PILLOW-004 |
| — | *(doctrine)* | Repository Memory Engine | **Extend** | ✅ PILLOW-005 |
| — | *(not in PILLOW-001)* | Mission Planner | **Extend** | ✅ PILLOW-006 |
| 13 | OpenAI API Integration Layer | OpenAI API Integration Layer | **Split · reorder** | 🔵 PILLOW-007 |
| 4 | Journey Manager | Journey Manager | **Defer** | 🔵 partial in Bootstrap/Intelligence |
| 5 | Decision Manager | Decision Manager | **Defer** | 🔵 partial parsers |
| 6 | Status Manager | Status Manager | **Defer** | 🔵 partial parsers |
| 7 | UX Enhancement Register Reader | UX Enhancement Register Reader | **Defer** | 🔵 Bootstrap fallback |
| 10 | Executive Audit Reader | Executive Audit Reader | **Defer** | 🔵 Bootstrap discovery |
| 8 | Mission Generator | Mission Generator | **Retain · reorder** | 🔵 PILLOW-008 *(Planner runtime)* |
| 9 | Cursor Bridge | Cursor Bridge | **Retain · reorder** | 🔵 PILLOW-008 |
| 11 | Approval Gate | Approval Gate | **Retain · reorder** | 🔵 PILLOW-008 |
| 12 | Pillow Chat UI | Pillow Chat UI | **Retain · reorder** | 🔵 PILLOW-009 |
| — | *(BL-B doctrine)* | Empire Recovery Assessment | **Extend** | 🔵 PILLOW-010 |

### 10.3 Mission ID mapping (original Part 7 → finalized Part 7)

| Original PILLOW-001 Part 7 | Finalized Part 7 | Notes |
|---|---|---|
| PILLOW-002 Bootstrap + managers | PILLOW-002 Bootstrap + Reader ✅ | Managers deferred — not discarded |
| PILLOW-003 Context Builder + OpenAI | PILLOW-003 Intelligence ✅ | Scope split per ADR-029 |
| — | PILLOW-004 Context Builder | New slot ✅ |
| — | PILLOW-005 Repository Memory | New slot ✅ |
| — | PILLOW-006 Mission Planner | New slot ✅ |
| — | PILLOW-007 OpenAI Layer | Split from original PILLOW-003 |
| PILLOW-004 Approval bundle | PILLOW-008 Approval bundle | Renumbered |
| PILLOW-005 Chat UI | PILLOW-009 Chat UI | Renumbered |
| PILLOW-006 Empire Recovery | PILLOW-010 Empire Recovery | Renumbered |

### 10.4 Validation continuity

| Completed work | Remains valid after sync |
|---|---|
| `pillow/` Bootstrap runtime (PILLOW-002) | ✅ Yes — contract Part 4.1 updated to match implementation |
| `pillow/` Intelligence runtime (PILLOW-003) | ✅ Yes — contract Part 4.14 added |
| `pillow/` Context Builder runtime (PILLOW-004) | ✅ Yes — contract Part 4.2 |
| `pillow/` Memory runtime (PILLOW-005) | ✅ Yes — contract Part 4.15 |
| `pillow/` Mission Planner runtime (PILLOW-006) | ✅ Yes — contract Part 4.16 |
| ADR-027 (PILLOW-001 contract) | ✅ Preserved — superseded in scope by ADR-030 for mission order only |
| ADR-028 (Bootstrap) | ✅ Unchanged |
| ADR-029 (Intelligence) | ✅ Unchanged |
| JOURNEY_AUDIT PILLOW-001/002/003 entries | ✅ Historical log preserved — not rewritten |

---

*End of PILLOW Architecture Contract (synchronized 2026-06-29, ADR-030). For parent doctrines see BL-B artifacts. For UX surface scope see `UX_IMPLEMENTATION_CONTRACT.md`. For Journey position see `JOURNEY.md`. For evolution mapping see Part 10. For Runtime vs Executive Intelligence roadmap see Part 11.*

---

## PART 11 — Roadmap Layers (Runtime vs Executive Intelligence)

> **Authority:** Grand King Architecture Decision · EmpireAI Version 1 (2026-06-29)  
> **Canonical detail:** `PILLOW_ROADMAP.md` · **`EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md`**

Pillow delivery is tracked across **two milestone classes** within the five-layer Empire roadmap:

| Layer | Definition | Contract mapping | Status |
|---|---|---|---|
| **Pillow Runtime** | Infrastructure to operate Pillow: sessions, routing, approvals, objective management, UI integration, orchestration, runtime governance | PILLOW-016…019 · hosting for PILLOW-013–015 | ✅ Complete |
| **Pillow Executive Intelligence** | Transform conversations **and validated evidence** into profit-aligned organizational intelligence; Executive Reflection + Evidence-Based Learning via GK approval only | PILLOW-002…012 foundations · Bootstrap extension · PEI-001…026 (planned) · Layer 2 Constitution | 🔵 Future |

**Layer 2 Core Principle:** Pillow Executive Intelligence transforms executive conversations **and validated operational evidence** into structured organizational intelligence aligned with the Supreme Directive (sustainable long-term profit). **Executive Reflection (PEI-026)** is the first downstream capability after Bootstrap. Learning enters through unified **Evidence Sources** (Constitution §3.1). See `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` §2.1 · §2.2 · §3.1 · §3.2.

**Preservation rule:** PILLOW-001…019 mission IDs are unchanged. Part 7 implementation order remains historical truth. Part 11 adds **planning classification only** — it does not reopen completed acceptance criteria.

**Five-layer Empire sequence:** (1) Pillow Runtime → (2) Pillow Executive Intelligence → (3) Commercial Intelligence → (4) Supplier Intelligence → (5) Empire Operations.

Subsystems in Part 3 marked ✅ remain valid package implementations. Layer 2 missions **activate intelligence depth** without replacing runtime hosting established in Layer 1.

