# EmpireAI Master Build Bible

**Document type:** Hierarchical engineering map (repository archaeology)  
**Generated:** 2026-07-02  
**Authority:** Grand King · Repository continuity spine  
**Scope:** Complete build history reconstructed from repository artifacts — **no code modified**

---

## Table of Contents

See PDF/HTML edition for clickable navigation. Major sections:

1. [Build Statistics](#build-statistics)
2. [Major Milestones](#major-milestones)
3. [Canonical Architecture Relationships](#canonical-architecture-relationships)
4. [Supreme Hierarchy Tree](#supreme-hierarchy-tree)
5. [EmpireAI Root](#1-empireai-root)
6. [Foundation](#2-foundation)
7. [Governance & Continuity](#3-governance--continuity)
8. [Pillow](#4-pillow)
9. [EKLS](#5-ekls)
10. [Brain](#6-brain)
11. [Registry System](#7-registry-system)
12. [Guardian](#8-guardian)
13. [Executive AI Engines (G3)](#9-executive-ai-engines-g3)
14. [Grand King Cockpit (G4)](#10-grand-king-cockpit-g4)
15. [Business Engines & B6](#11-business-engines--b6)
16. [REAL Programme](#12-real-programme)
17. [Executive Intelligence Library](#13-executive-intelligence-library)
18. [UX & Global Components](#14-ux--global-components)
19. [Business Automation (G5)](#15-business-automation-g5)
20. [Mission System & Cursor](#16-mission-system--cursor)
21. [Executive Audit System](#17-executive-audit-system)
22. [Deployment & Infrastructure](#18-deployment--infrastructure)
23. [Future Programmes](#19-future-programmes)
24. [Completion Summary](#completion-summary)

---

## Build Statistics

| Metric | Count | Notes |
|--------|------:|-------|
| Markdown documentation files (repo-wide) | 463+ | Includes root, docs/, artifacts/ |
| `artifacts/` executive audit files | 45 | G3, G4, G5, B6, EA, EKLS, constitutional |
| Root `COMBINED_EXECUTIVE_AUDIT_*.md` | 38 | Batch doctrine + programme audits |
| Architecture Decision Records (ADR-001→052) | 52 | `EMPIREAI_DECISIONS.md` |
| REAL modules (REAL-001→100) | 100 | Journey index; 103 runtime folders |
| Pillow missions (PILLOW-001→019) | 19 | Layer 1 runtime complete |
| Executive AI Engine missions (G3-01→10) | 11 | Suite closed; architecture + wiring |
| Cockpit missions (G4-01→10) | 11 | G4 programme complete |
| Registry architecture (EA-002→007) | 6 | Certified PASS WITH CONDITIONS (EA-007) |
| B6 live-commerce probes (B6-01A→04B) | 12 | Mixed pass/fail/superseded |
| UX screens (UX-001→023) | 23 | Frozen V1 contract |
| Global Components (GC-01→07) | 7 | ADR-047 layers |
| Backend validation test files | 198 | `backend/src/validation/tests/` |
| CTD articles | 40 | Immutable core constitution |
| GVD articles | 30 | Governance doctrine |
| ACD articles | 30 | Architecture constraints |
| UID articles | 20 | UX identity |
| CBD articles | 20 | Commercial business doctrine |
| Executive Intelligence (EI0→EI10) | 11 | EIR-v1.0 certified library |
| `.cursor/missions/` pending | 2 | PILLOW-017 deferred, REPOSITORY-SYNC |

**Programme completion snapshot:**

| Programme | Architecture | Implementation | Live revenue |
|-----------|-------------|----------------|--------------|
| BL-A / BL-B | ✅ Closed | ✅ | N/A |
| BL-C | ✅ Active | 🟡 Accumulating | N/A |
| Pillow Runtime (L1) | ✅ | ✅ PILLOW-002→019 | N/A |
| Pillow Executive Intelligence (L2) | ✅ Docs | 🔵 Deferred | N/A |
| EKLS | ✅ Canonical spec | ✅ Gateway + partial backends | N/A |
| Registry (EA) | ✅ EA-002→007 | ✅ EA-003 loader | N/A |
| G3 Executive AI Engines | ✅ | ✅ Wired + tests | N/A |
| G4 Cockpit | ✅ G4-01 | ✅ G4-02→10 | N/A |
| G5 Business Automation | ✅ G5-00 only | 🔴 No runtime | N/A |
| REAL-001→100 | ✅ | ✅ Built/wired | 🔴 PROOF-001 pending |
| V1 Go-Live | ✅ Certification Mode | 🟡 Blockers B5–B8 | 🔴 GK-GOLIVE |

---

## Major Milestones

| Milestone | Label | Status | Evidence |
|-----------|-------|--------|----------|
| Empire genesis | EMPIREAI_GENESIS.md | ✅ | Vision phase |
| Brain sovereignty | EMPIREAI_CONSTITUTION.md Art. I | ✅ | ADR-001 |
| Commerce OS pivot | COS-001 / ADR-013 | ✅ | COMMERCE_OS_BLUEPRINT.md |
| UX Master frozen | UX-000B contract | ✅ | COMBINED UX-001-023 audit |
| BL-A repository sync | BL-A closed | ✅ | ADR-014→020 |
| BL-B Pillow doctrines | BL-B closed 2026-06-29 | ✅ | Pillow architecture batch |
| BL-C continuous improvement | BL-C ACTIVE | 🟡 | Enhancement registers |
| Pillow Runtime complete | PILLOW-016→019 | ✅ | Product integration master plan |
| REAL namespace canon | ADR-044 | ✅ | ⚠️ 4 conflicts deferred |
| Executive Intelligence certified | EIR-v1.0 | ✅ | EI release certificate |
| REAL-061 compile recovery | REAL-061 | ✅ | Combined audit certified |
| Managed deployment | MPD-001 | ✅ Adaptation | Deploy pending |
| G3 suite closed | G3-01→G3-10 | ✅ | g3-10 executive audit |
| EKLS institutionalised | Canonical EKLS | ✅ | canonical-ekls-executive-audit |
| Pillow §17 hierarchy | Constitutional amendment | ✅ | constitutional-pillow-hierarchy audit |
| EA registry certified | EA-007 | ✅ PASS WITH CONDITIONS | ea-007 certification |
| G4 Cockpit complete | G4-02→G4-10 | ✅ | g4-10 production readiness |
| G5 architecture | G5-00 | ✅ Architecture only | g5-business-automation-architecture |
| MS-A (USD 100K profit) | MS-A | 🔴 | Commercial milestone |
| PROOF-001 first live profit | PROOF-001 | 🔴 | Go-live gate |

---

## Canonical Architecture Relationships

```
Grand King
    └── EmpireAI (repository)
            └── Pillow (sole technical owner — EMPIREAI_PILLOW_CONSTITUTION.md §17)
                    ├── Brain (execution — not peer of Pillow)
                    ├── EKLS (institutional memory)
                    ├── Registry System (configuration catalog)
                    ├── Mission System (Cursor + objective)
                    ├── Executive Audit System (artifacts corpus)
                    ├── Guardian (pre-dispatch safety)
                    ├── Executive AI Engines G3-01→10 (analyse)
                    ├── Business Engines ×7 (commerce execute)
                    ├── Grand King Cockpit G4 (visualise · approve)
                    ├── Business Automation G5 (orchestrate decisions → ops) [architecture]
                    └── Future Platform Services (deployment · infra)
```

**Cross-reference spine:** `JOURNEY.md` → `JOURNEY_AUDIT.md` → `EMPIREAI_SOUL.md` → `EMPIREAI_STATUS.md` → `EMPIREAI_DECISIONS.md` → `EMPIREAI_REPOSITORY_MASTER_INDEX.md`

---

## Supreme Hierarchy Tree

```
EmpireAI
├── Foundation (CTD · GVD · ACD · UID · CBD · Commerce Canon)
├── Governance & Continuity (BL-A/B/C · Journey · Audits · ADRs)
├── Pillow
│   ├── Constitution & Doctrines
│   ├── Architecture Contract (PILLOW-001→027)
│   ├── Runtime Package (PILLOW-002→015)
│   ├── Product Integration (PILLOW-016→019)
│   ├── Executive Intelligence Layer 2 (doctrine · 🔵 runtime)
│   ├── EKLS
│   ├── Mission System / Cursor Bridge
│   └── Executive Perspectives & Council
├── Brain
│   ├── Orchestrator · Agents · Workflows
│   ├── LLM Router · Task Queue · Guardian integration
│   └── Auth · Permissions
├── Registry System (EA-002→007)
├── Guardian
├── Executive AI Engines (G3)
│   ├── G3-01 Product … G3-09 Decision
│   └── G3-10 Orchestrator
├── Grand King Cockpit (G4)
│   ├── G4-01 Architecture
│   └── G4-02→10 Implementation
├── Business Engines
│   ├── Marketplace · Supplier · Storefront
│   ├── Advertising · Payment · Logistics · Analytics
│   └── B6 Live Commerce Probes
├── REAL Programme (REAL-001→100)
├── Executive Intelligence Library (EI0→EI10)
├── UX & Global Components (UX-001→023 · GC-01→07)
├── Business Automation (G5-00 architecture)
├── Deployment (MPD-001)
└── Future Programmes (G5-01+ · Pillow L2 · MS-A · PROOF-001)
```

---

# 1. EmpireAI Root

| Field | Value |
|-------|-------|
| **Parent** | Grand King |
| **Children** | Foundation · Governance · Pillow (all technical subsystems) · Documentation corpus |
| **Purpose** | AI-powered e-commerce operating system — manufacture and operate autonomous companies |
| **Status** | ✅ Active repository |
| **Completion** | V1 architecture substantially complete; live revenue gates open |
| **Classification** | **Canonical** |
| **Paths** | Repository root `EmpireAI/` |
| **Missions** | Genesis · REAL programme · G3 · G4 · G5 · B6 · EA |
| **Audits** | SA-001 suite · EMPIREAI_V1_* combined audits |

### 1.1 Vision & Identity

| Node | Parent | Paths | Status | Classification | Missions / Audits |
|------|--------|-------|--------|----------------|-------------------|
| **Genesis** | EmpireAI | `EMPIREAI_GENESIS.md` | ✅ | Canonical | Vision |
| **Soul** | EmpireAI | `EMPIREAI_SOUL.md` | ✅ | Canonical | BL-A continuity |
| **README** | EmpireAI | `README.md` | ✅ | Derived | Platform overview |
| **Roadmap** | EmpireAI | `EMPIREAI_ROADMAP.md` | ✅ | Canonical | Points to COS-001 |
| **Founder Experience** | EmpireAI | `docs/FOUNDER_EXPERIENCE.md` | ✅ | Derived | Product vision |
| **Marketplace OS Vision** | EmpireAI | `MARKETPLACE_OS_VISION.md` | 🟡 | **Superseded** by COS-001 | Legacy |
| **Reality V1** | EmpireAI | `EMPIREAI_REALITY_V1.md` | 🟡 | **Superseded** | Legacy archived |

---

# 2. Foundation

| Field | Value |
|-------|-------|
| **Parent** | EmpireAI |
| **Children** | CTD · GVD · ACD · UID · CBD · Commerce Canon · Engineering Constitution |
| **Purpose** | Immutable doctrine and commercial law governing all subsystems |
| **Status** | ✅ Complete (doctrine catalogs) |
| **Completion** | All articles indexed in JOURNEY.md |
| **Classification** | **Canonical** |
| **Paths** | Root `EMPIREAI_*_DOCTRINE*.md`, `EMPIREAI_CORE_CONSTITUTION_CTD.md`, `backend/src/foundation/` |
| **Missions** | BL-A · BL-B doctrine registration |
| **Audits** | COMBINED CTD · GVD · ACD · UID · CBD audits |

### 2.1 Core Constitution (CTD-001→040)

| Field | Value |
|-------|-------|
| **Parent** | Foundation |
| **Children** | 40 immutable articles |
| **Purpose** | Supreme commercial constitution — CTD-040 constitution supreme |
| **Status** | ✅ |
| **Classification** | **Canonical** |
| **Paths** | `EMPIREAI_CORE_CONSTITUTION_CTD.md` |
| **Audits** | `COMBINED_EXECUTIVE_AUDIT_CTD-001-040.md` |

### 2.2 Governance Doctrine (GVD-001→030)

| Field | Value |
|-------|-------|
| **Parent** | Foundation |
| **Purpose** | Grand King authority, approval gates (GVD-019), governance versioning |
| **Status** | ✅ |
| **Classification** | **Canonical** |
| **Paths** | `EMPIREAI_GOVERNANCE_DOCTRINE_GVD.md` |
| **Audits** | `COMBINED_EXECUTIVE_AUDIT_GVD-001-030.md` |

### 2.3 Architecture Constraints (ACD-001→030)

| Field | Value |
|-------|-------|
| **Parent** | Foundation |
| **Purpose** | Engineering constraints, module boundaries |
| **Status** | ✅ |
| **Classification** | **Canonical** |
| **Paths** | `EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md` |
| **Audits** | `COMBINED_EXECUTIVE_AUDIT_ACD-001-030.md` |

### 2.4 UX Identity Doctrine (UID-001→020)

| Field | Value |
|-------|-------|
| **Parent** | Foundation |
| **Purpose** | Immutable UX identity law |
| **Status** | ✅ |
| **Classification** | **Canonical** |
| **Paths** | `EMPIREAI_UX_IDENTITY_DOCTRINE_UID.md` |
| **Audits** | `COMBINED_EXECUTIVE_AUDIT_UID-001-020.md` |

### 2.5 Commercial Business Doctrine (CBD-001→020)

| Field | Value |
|-------|-------|
| **Parent** | Foundation |
| **Purpose** | Commercial business rules, triple approval (CBD-018) |
| **Status** | ✅ |
| **Classification** | **Canonical** |
| **Paths** | `EMPIREAI_COMMERCIAL_BUSINESS_DOCTRINE_CBD.md` |
| **Audits** | `COMBINED_EXECUTIVE_AUDIT_CBD-001-020.md` |

### 2.6 Commerce Canon & COS

| Node | Parent | Paths | Status | Classification |
|------|--------|-------|--------|----------------|
| **Commerce Canon C001** | Foundation | `EMPIREAI_COMMERCE_CANON.md` | ✅ | Canonical (ADR-011) |
| **Commerce OS COS-001** | Foundation | `COMMERCE_OS_BLUEPRINT.md` | ✅ | Canonical (ADR-013) |
| **Engineering Constitution** | Foundation | `EMPIREAI_CONSTITUTION.md` | ✅ | Canonical (Brain law; CTD supersedes commercially) |

### 2.7 Foundation Runtime

| Field | Value |
|-------|-------|
| **Parent** | Foundation → Brain |
| **Children** | 15 governance subsystems in `backend/src/foundation/` |
| **Purpose** | Runtime doctrine enforcement, KPI, governance engine |
| **Status** | ✅ Implemented |
| **Classification** | **Derived** runtime |
| **Paths** | `backend/src/foundation/` |
| **Audits** | `foundation.test.ts` |

---

# 3. Governance & Continuity

| Field | Value |
|-------|-------|
| **Parent** | EmpireAI |
| **Children** | BL-A · BL-B · BL-C · Journey spine · ADRs · Certification · CRI |
| **Purpose** | Repository synchronization, backlog releases, audit standards, go-live gates |
| **Status** | BL-A/B ✅ closed · BL-C 🟡 active |
| **Classification** | **Canonical** |
| **Paths** | `JOURNEY.md`, `BL-*.md`, `docs/governance/` |
| **Audits** | 38 COMBINED executive audits |

### 3.1 Backlog Releases

| Node | Parent | Paths | Status | Completion | Audits |
|------|--------|-------|--------|------------|--------|
| **BL-A** | Governance | ADR-014→020, sync reports | ✅ Closed | Repository sync standard | BL-A_* reports |
| **BL-B** | Governance | ADR-021→030, Pillow doctrines | ✅ Closed 2026-06-29 | Executive audit standard | BL-B validation |
| **BL-C** | Governance | `BL-C.md`, `EMPIREAI_BL_C_*.md` | 🟡 ACTIVE | Continuous improvement | Enhancement registers |

### 3.2 Journey Continuity Spine

| Node | Parent | Purpose | Status | Paths |
|------|--------|---------|--------|-------|
| **Journey** | Governance | Master operational index | ✅ | `JOURNEY.md` |
| **Journey Audit** | Journey | Structural change log | ✅ | `JOURNEY_AUDIT.md` |
| **Master Index** | Journey | Searchable artifact catalog | ✅ | `EMPIREAI_REPOSITORY_MASTER_INDEX.md` |
| **Project Status** | Journey | Current implementation state | ✅ | `EMPIREAI_STATUS.md` |
| **Decision Register** | Journey | ADR log | ✅ | `EMPIREAI_DECISIONS.md` |

### 3.3 Version 1 Certification

| Node | Parent | Paths | Status |
|------|--------|-------|--------|
| **Certification Mode** | Governance | `docs/governance/VERSION_1_CERTIFICATION_MODE.md` | ✅ ACTIVE (ADR-048) |
| **Blocker Register B5–B8** | Governance | `docs/governance/VERSION_1_CERTIFICATION_BLOCKER_REGISTER.md` | 🟡 Open |
| **Go-Live Checklist** | Governance | `docs/governance/VERSION_1_GO_LIVE_PREPARATION_CHECKLIST.md` | 🟡 |
| **Commercial Risk Intelligence** | Governance | `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md` | ✅ (ADR-051) |

### 3.4 Architecture Decision Records

| Field | Value |
|-------|-------|
| **Parent** | Governance |
| **Children** | ADR-001 through ADR-052 |
| **Purpose** | Permanent decision log |
| **Paths** | `EMPIREAI_DECISIONS.md`, `docs/governance/ADR-044-*.md` |
| **Classification** | **Canonical** |

Key ADR clusters: Brain/Guardian (001–010) · Commerce (011–013) · BL-A (014–020) · BL-B/Pillow (021–043) · REAL/UX (044–047) · V1/Pillow delivery (048–049) · Marketplace/CRI (050–052)

---

# 4. Pillow

| Field | Value |
|-------|-------|
| **Parent** | EmpireAI |
| **Children** | Constitution · Contract · Runtime · Host · EKLS · EI Layer 2 · Missions |
| **Purpose** | Sole technical owner; Executive Intelligence; governance of all subsystems |
| **Status** | Layer 1 ✅ · Layer 2 🔵 · §17 hierarchy ✅ |
| **Completion** | PILLOW-002→019 runtime complete |
| **Classification** | **Canonical** |
| **Paths** | `EMPIREAI_PILLOW_*.md`, `PILLOW_*.md`, `pillow/`, `backend/src/orchestration/pillow-*` |
| **Missions** | PILLOW-001→019 |
| **Audits** | 10+ COMBINED Pillow audits · constitutional-pillow-hierarchy · canonical-ekls |

### 4.1 Constitution & Core Doctrines

| Node | Parent | Paths | Status | Classification | Audits |
|------|--------|-------|--------|----------------|--------|
| **Pillow Constitution V1** | Pillow | `EMPIREAI_PILLOW_CONSTITUTION.md` | ✅ | **Canonical** | PILLOW_CONSTITUTION_UPDATE |
| **§17 Platform Hierarchy** | Constitution | §17 | ✅ | **Canonical** | constitutional-pillow-hierarchy |
| **Executive Intelligence Constitution L2** | Pillow | `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` | ✅ docs | **Canonical** | — |
| **Memory Doctrine** | Pillow | `EMPIREAI_PILLOW_MEMORY_DOCTRINE.md` | ✅ | **Canonical** → EKLS | BL-B |
| **Pillow Architecture** | Pillow | `EMPIREAI_PILLOW_ARCHITECTURE.md` | ✅ | **Canonical** | — |
| **Delivery Mode** | Pillow | `docs/governance/PILLOW_VERSION_1_DELIVERY_MODE.md` | ✅ ACTIVE | **Canonical** (ADR-049) | Combined audit |
| **Roadmap (5 layers)** | Pillow | `PILLOW_ROADMAP.md` | ✅ | **Canonical** | — |

### 4.2 Architecture Contract (PILLOW-001)

| Field | Value |
|-------|-------|
| **Parent** | Pillow |
| **Children** | 27 subsystems (Bootstrap → EKLS) |
| **Purpose** | Single source of truth for Pillow implementation |
| **Status** | ✅ Frozen V1 (ADR-027, ADR-030 sync) |
| **Paths** | `PILLOW_ARCHITECTURE_CONTRACT.md` |
| **Classification** | **Canonical** |

### 4.3 Pillow Runtime Missions (PILLOW-002→015)

| Mission | Subsystem | Paths | Status | Classification |
|---------|-----------|-------|--------|----------------|
| PILLOW-002 | Bootstrap + Repository Reader | `pillow/src/bootstrap/` | ✅ | Canonical |
| PILLOW-003 | Repository Intelligence | `pillow/src/intelligence/` | ✅ | Canonical |
| PILLOW-004 | Context Builder | `pillow/src/context/` | ✅ | Canonical |
| PILLOW-005 | Repository Memory | `pillow/src/memory/` | ✅ | Legacy backend → EKLS |
| PILLOW-006 | Mission Planner | `pillow/src/planner/` | ✅ | Canonical |
| PILLOW-007 | Cursor Supervisor | `pillow/src/supervisor/` | ✅ | Canonical |
| PILLOW-008 | Recovery Manager | `pillow/src/recovery/` | ✅ | Canonical |
| PILLOW-009 | Executive Audit Reviewer | `pillow/src/audit-reviewer/` | ✅ | Canonical |
| PILLOW-010 | Repository Synchronizer | `pillow/src/synchronizer/` | ✅ | Canonical |
| PILLOW-011 | Continuous Due Diligence | `pillow/src/due-diligence/` | ✅ | Canonical |
| PILLOW-012 | Autonomous Improvement | `pillow/src/improvement/` | ✅ | Canonical |
| PILLOW-013 | EmpireAI Orchestrator | `pillow/src/orchestrator/` | ✅ | Canonical |
| PILLOW-014 | Live Repository Watcher | `pillow/src/watcher/` | ✅ | Canonical |
| PILLOW-015 | Grand King Command Interface | `pillow/src/command/` | ✅ | Canonical |

**Deferred managers (contract):** Journey · Decision · Status · UX Register · Audit Reader — 🔵 partial in Bootstrap

### 4.4 Pillow Product Integration (PILLOW-016→019)

| Mission | Component | Paths | Status | Audits |
|---------|-----------|-------|--------|--------|
| PILLOW-016 | Brain Integration / Pillow Host | `backend/src/orchestration/pillow-host/` | ✅ | Product integration plan |
| PILLOW-017 | Approval Gate + Cursor Bridge | `backend/src/orchestration/pillow-approval/`, `.cursor/missions/pending/PILLOW-017.md` | ✅ built · mission deferred | — |
| PILLOW-018 | Pillow Chat UI | `frontend/.../PillowChatPage.tsx` | ✅ | Executive Companion audit |
| PILLOW-019 | Objective Engine + Companion | `pillow/src/objective/`, `PillowCompanionContext.tsx` | ✅ | PILLOW-019 audit |

**Plans:** `PILLOW_RUNTIME_INTEGRATION_PLAN.md` (✅ historical) · `docs/governance/PILLOW_PRODUCT_INTEGRATION_MASTER_PLAN.md` (✅ canonical)

### 4.5 Pillow Executive Intelligence (Layer 2 — future)

| Node | Parent | Status | Classification | Missions |
|------|--------|--------|----------------|----------|
| Executive Reflection | Pillow L2 | 🔵 Planned | Derived | PEI-026 |
| Evidence-Based Learning | Pillow L2 | 🔵 Planned | Derived | PEI-021 |
| OKQA | Pillow L2 | 🔵 Planned | Derived | PEI-027 |
| EIL Steward | Pillow L2 | 🔵 Planned | Derived | PEI-028 |
| Executive Perspectives | Pillow | ✅ Doctrine/runtime | Canonical | §15 constitution |
| Executive Council | Pillow | ✅ | Derived | Superseded by Perspectives audit |

### 4.6 Pillow Commerce Intelligence (implemented)

| Node | Paths | Status | Audits |
|------|-------|--------|--------|
| Commerce Intelligence Core | `backend/src/intelligence/commerce-intelligence-core/` | ✅ | PILLOW-020 CIC audit |
| Commerce Intelligence OS | Pillow-owned CIC integration | ✅ | PILLOW_020 audit |

---

# 5. EKLS

| Field | Value |
|-------|-------|
| **Parent** | Pillow |
| **Children** | Canonical spec · 28 subsystems · Governance gateway · Unified service · Legacy backends |
| **Purpose** | Institutional memory — remembers, learns, preserves |
| **Status** | ✅ Permanent canonical specification |
| **Completion** | Gateway + registry ✅ · many stores architecture/partial |
| **Classification** | **Canonical** |
| **Paths** | `CANONICAL_EKLS_SPECIFICATION.md`, `backend/src/orchestration/pillow/ekls/` |
| **Missions** | EKLS institutionalisation (post-G3) |
| **Audits** | `artifacts/canonical-ekls-executive-audit.md` |

### 5.1 EKLS Implementation

| Component | Paths | Status | Classification |
|-----------|-------|--------|----------------|
| Canonical Specification | `CANONICAL_EKLS_SPECIFICATION.md` | ✅ | **Canonical** (amend in place only) |
| Subsystem registry (28) | `ekls/contracts/subsystem-registry.ts` | ✅ | Canonical |
| Governance gateway | `ekls/services/ekls-governance-gateway.ts` | ✅ | Canonical |
| Unified service | `ekls/services/ekls-unified-service.ts` | ✅ | Canonical |
| Store registry | `ekls/storage/store-registry.ts` | ✅ | Canonical |
| Tests | `canonical-ekls.test.ts` | ✅ 7/7 | Derived |

### 5.2 EKLS Legacy Integration Backends

| Subsystem | Backend path | Status |
|-----------|-------------|--------|
| Learning Store | `backend/src/orchestration/executive-learning/` | Legacy live |
| Knowledge Store / Graph | `backend/src/runtime/empire-knowledge/` | Legacy live |
| Document Memory | `pillow/src/memory/` | Legacy live |
| Audit Memory | `artifacts/` (referenced) | Derived |

---

# 6. Brain

| Field | Value |
|-------|-------|
| **Parent** | Pillow (not peer) |
| **Children** | Orchestrator · Agents · Workflows · LLM · Queue · Auth · Memory (ephemeral) |
| **Purpose** | Mandatory orchestration execution path |
| **Status** | ✅ Production core (Railway) |
| **Classification** | **Canonical** |
| **Paths** | `backend/src/brain/`, `backend/src/agents/`, `backend/src/auth/` |
| **Missions** | Phase 1–3 architecture · REAL dispatch wiring |
| **Audits** | EMPIREAI_CONSTITUTION · subsystems.test.ts |

| Component | Paths | Status |
|-----------|-------|--------|
| Orchestrator | `brain/orchestrator.ts` | ✅ |
| Agent Manager | `brain/agent-manager.ts` | ✅ |
| Workflow Engine | `brain/workflow-engine.ts` | ✅ |
| Task Queue / Workers | `brain/task-queue.ts`, `workers/` | ✅ |
| Tool Registry | `brain/tools/tool-registry.ts` | ✅ |
| LLM Router | `brain/llm/llm-router.ts` | ✅ |
| Guardian integration | Pre-dispatch | ✅ |
| Session Memory | `brain/memory/memory-store.ts` | ✅ ephemeral (EKLS owns long-term) |
| Module routes | `backend/src/agents/routes/module-routes.ts` | ✅ |
| Architecture docs | `docs/ARCHITECTURE.md`, `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` | ✅ |

---

# 7. Registry System

| Field | Value |
|-------|-------|
| **Parent** | Pillow |
| **Children** | EA-002 architecture · EA-003 loader · EA-004 migration · EA-005 EPF · EA-006 discovery · EA-007 certification |
| **Purpose** | Registry-driven configuration — no hardcoded business assumptions |
| **Status** | ✅ EA-003 wired · EA-007 PASS WITH CONDITIONS |
| **Classification** | **Canonical** |
| **Paths** | `backend/src/registry/`, `artifacts/ea-*.md` |
| **Missions** | EA-002→007 |
| **Audits** | ea-003 audit · architecture-hardcode-governance (EA-001) |

| Mission | Document | Status | Classification |
|---------|----------|--------|----------------|
| EA-001 | `artifacts/architecture-hardcode-governance-audit.md` | ✅ | Derived audit |
| EA-002 | `artifacts/ea-002-canonical-registry-architecture.md` | ✅ | **Canonical** spec |
| EA-003 | `artifacts/ea-003-registry-loader-foundation-executive-audit.md` | ✅ | Canonical implementation |
| EA-004 | `artifacts/ea-004-registry-migration-standard.md` | ✅ | **Canonical** methodology |
| EA-005 | `artifacts/ea-005-plugin-framework.md` | ✅ | **Canonical** EPF spec |
| EA-006 | `artifacts/ea-006-dynamic-capability-discovery.md` | ✅ | Derived spec |
| EA-007 | `artifacts/ea-007-architecture-certification.md` | ✅ PASS WITH CONDITIONS | Derived audit |

**Runtime:** `backend/src/registry/registry-loader.ts` · tests `ea-003-registry-loader-foundation.test.ts` (12 tests)

**Registry IDs:** REG-DOCTRINE · REG-COUNTRY · REG-MARKETPLACE · REG-SUPPLIER · REG-CHANNEL · REG-PRODUCT (placeholder) · DERIVED-DISCOVERY-SNAPSHOT · + policy placeholders

---

# 8. Guardian

| Field | Value |
|-------|-------|
| **Parent** | Pillow |
| **Children** | Engine · Action guard · DB guardian · Health monitor · Recovery planner |
| **Purpose** | Pre-dispatch safety; database integrity; authority gates |
| **Status** | ✅ Implemented |
| **Classification** | **Canonical** |
| **Paths** | `backend/src/guardian/` |
| **Missions** | ADR-004 · Constitution Art. II |
| **Audits** | `guardian.test.ts` |

---

# 9. Executive AI Engines (G3)

| Field | Value |
|-------|-------|
| **Parent** | Pillow |
| **Children** | G3-01→G3-10 · shared discovery · G3 architecture refactor |
| **Purpose** | Executive intelligence — analyse, never own memory |
| **Status** | ✅ **G3 SUITE CLOSED** |
| **Completion** | Architecture + Brain wiring + Cockpit panels + tests |
| **Classification** | **Canonical** |
| **Paths** | `backend/src/intelligence/`, `backend/src/domain/services/*-views.ts` |
| **Audits** | `artifacts/g3-*-executive-audit.md` (12 files) |

### 9.1 G3 Engine Matrix

| Mission | Engine | Backend path | Cockpit route | Test | Audit status |
|---------|--------|--------------|---------------|------|--------------|
| G3 arch | Dynamic Market Discovery | `intelligence/shared/intelligence-market-discovery.ts` | — | g3-architecture test | ✅ Complete |
| G3-01 | Product Intelligence | `product-intelligence-engine/` | `/cockpit/intelligence/products` | g3-01 test | ✅ Complete |
| G3-02 | Market Intelligence | `market-intelligence-engine/` | `/cockpit/intelligence/markets` | g3-02 test | ✅ Complete |
| G3-03 | Supplier Intelligence | `supplier-intelligence-engine/` | `/cockpit/intelligence/suppliers` | g3-03 test | ✅ Complete |
| G3-04 | Financial Intelligence | `financial-intelligence-engine/` | `/cockpit/finance/intelligence` | g3-04 test | ✅ Complete |
| G3-05 | Quantitative Intelligence | `quantitative-intelligence-engine/` | Engine center | g3-05 test | ✅ Complete |
| G3-06 | Advertising Intelligence | `advertising-intelligence-engine/` | `/cockpit/commerce/ad-intelligence` | g3-06 test | ✅ Complete |
| G3-07 | Customer Intelligence | `customer-intelligence-engine/` | `/cockpit/intelligence/customers` | g3-07 test | ✅ Complete |
| G3-08 | Risk Intelligence | `risk-intelligence-engine/` | `/cockpit/intelligence/risk` | g3-08 test | ✅ Complete |
| G3-09 | Decision Intelligence | `decision-intelligence-engine/` | `/cockpit/intelligence/decisions` | g3-09 test | ✅ Complete |
| G3-10 | Executive Intelligence Orchestrator | `executive-intelligence-orchestrator/` | `/cockpit/intelligence/executive` | g3-10 test | ✅ **SUITE CLOSED** |

**G3-10 consumer channels:** Cockpit · Pillow · Global AI Assistant · **Business Automation** · Executive Reports

---

# 10. Grand King Cockpit (G4)

| Field | Value |
|-------|-------|
| **Parent** | Pillow |
| **Children** | G4-01 architecture · G4-02→10 implementation · Cockpit docs · UI shells |
| **Purpose** | Executive Operating System — visualise, approve, never own truth |
| **Status** | ✅ G4 programme complete (G4-02→10) |
| **Classification** | **Canonical** (G4-01) + **Derived** (implementation) |
| **Paths** | `empireai-web/app/(cockpit)/`, `empireai-web/components/cockpit/`, `frontend/src/pages/dashboard/` |
| **Missions** | G4-01→G4-10 · GO-002 Phase 4 |
| **Audits** | 11 `artifacts/g4-*` files |

| Mission | Deliverable | Status | Audit |
|---------|-------------|--------|-------|
| G4-01 | Complete cockpit architecture spec | ✅ Architecture only | g4-01-grand-king-cockpit-architecture |
| G4-02 | Live Brain wiring | ✅ | g4-02-live-cockpit-wiring |
| G4-03 | Executive Home | ✅ | g4-03-executive-home |
| G4-04 | Engine Centers | ✅ | g4-04-engine-centers |
| G4-05 | Executive Dashboard | ✅ | g4-05-executive-dashboard |
| G4-05A | Grand King Authentication UX | ✅ | g4-05a |
| G4-05B | Authentication Verification | ✅ | g4-05b |
| G4-06 | Live Executive Widgets | ✅ | g4-06 |
| G4-07 | AI Interaction Layer | ✅ | g4-07 |
| G4-08 | Executive Relationship Graph | ✅ | g4-08 |
| G4-09 | Global AI Assistant | ✅ Framework | g4-09 |
| G4-10 | Production Readiness & UX Polish | ✅ | g4-10 |

**Cockpit documentation:** `docs/architecture/PROJECT_COCKPIT_SPECIFICATION.md` · `docs/architecture/cockpit/COCKPIT_*.md` (6 files)

**GO-002:** `GO-002_GRAND_KING_OPERATIONAL_MASTER_PLAN.md` — operational sequence driver

---

# 11. Business Engines & B6

| Field | Value |
|-------|-------|
| **Parent** | Pillow |
| **Children** | 7 canonical engines · execution/ modules · B6 live probes · CRI |
| **Purpose** | Commerce execution — orders, listings, payments, logistics |
| **Status** | 🟡 Partial live · namespace consolidation pending |
| **Classification** | **Legacy layout** → **Canonical** targets |
| **Paths** | `backend/src/execution/`, `payments/`, `revenue/`, `orders/`, `fulfillment/` |
| **Missions** | REAL commerce chain · B6 · CRI |
| **Audits** | B6-01A→04B · COMBINED REAL commerce audits |

### 11.1 Canonical Business Engines (target map)

| Engine | Primary paths | Status |
|--------|--------------|--------|
| Marketplace | `orchestration/marketplace-*`, `runtime/global-commerce/`, `runtime/amazon-global-seller/` | 🟡 Partial |
| Supplier | `suppliers/`, `execution/live-cj-fulfillment/` | 🟡 Partial |
| Storefront | `execution/store-*`, `storefront-*`, `production-store-deployment/` | 🟡 Partial |
| Advertising | `execution/meta-ads-connector/`, `marketing-campaign-*` | 🟡 Partial |
| Payment | `payments/`, `revenue/live-payment-engine/` | 🟡 Partial live |
| Logistics | `fulfillment/`, `orders/` | 🟡 Partial |
| Analytics | `execution/analytics-*`, `reporting/` | 🟡 Partial |

### 11.2 B6 Live Commerce Programme

| Mission | Focus | Status | Audit |
|---------|-------|--------|-------|
| B6-01A | Amazon SP-API scope | **Superseded** | b6-01a |
| B6-01B | Marketplace architecture | Amended | b6-01b |
| B6-01C | Marketplace governance v2 | ✅ | b6-01c (ADR-052) |
| B6-01D | Amazon multi-region foundation | ✅ Foundation | b6-01d |
| B6-02A | CJ API 2.0 auth compatibility | ✅ | b6-02a |
| B6-02B | Live CJ auth proof | ✅ PASS | b6-02b |
| B6-03 | Stripe production readiness | 🟡 Pending | b6-03 |
| B6-03B | Stripe live auth proof | ✅ PASS | b6-03b |
| B6-03C | Railway recovery | ✅ RESTORED | b6-03c |
| B6-04 | Production vault | ❌ FAIL | b6-04 |
| B6-04B | Live vault certification | ✅ PASS | b6-04b |

**CRI:** `backend/src/orchestration/commerce-readiness-engine/` · CRIR doctrine docs

---

# 12. REAL Programme

| Field | Value |
|-------|-------|
| **Parent** | Pillow → EmpireAI platform |
| **Children** | REAL-001→100 · reality-integration · runtime/ (103 modules) |
| **Purpose** | Modular runtime architecture — advisory + execution dashboards |
| **Status** | ✅ Built/wired (⚠️ 4 namespace conflicts) |
| **Classification** | **Canonical** labels · **Legacy** runtime tier C collapse target |
| **Paths** | `backend/src/runtime/`, `backend/src/orchestration/reality-integration/` |
| **Audits** | 11 COMBINED REAL batch audits · REAL-061 recovery |

### 12.1 REAL Batch Audits

| Audit file | REAL range | Status |
|------------|------------|--------|
| COMBINED REAL-002B | REAL-002B Live Commerce | ✅ |
| COMBINED REAL-003-007 | REAL-003→007 | ✅ |
| COMBINED REAL-008-012 | REAL-008→012 | ✅ |
| COMBINED REAL-013-018 | REAL-013→018 | ✅ |
| COMBINED REAL-019-025 | REAL-019→025 | ✅ |
| COMBINED REAL-026-035 | REAL-026→035 | ✅ |
| COMBINED REAL-036-050 | REAL-036→050 | ✅ |
| COMBINED REAL-051-070 | REAL-051→070 | ✅ |
| COMBINED REAL-071-100 | REAL-071→100 | ✅ |
| COMBINED REAL061 | Backend compile recovery | ✅ Certified |
| EXECUTIVE_AUDIT REAL072 | Frontend production build | ✅ |

**Gaps (no combined audit):** REAL-001 · REAL-002 · REAL-002A

### 12.2 REAL-001→100 Index (Journey status)

| Range | Domain | Journey status | Audit batch |
|-------|--------|----------------|-------------|
| REAL-001→002B | Reality Integration / Live Commerce | ✅ (002B) | 002B |
| REAL-003→007 | Global Commerce Execution | ✅ ⚠️ namespace | 003-007 |
| REAL-008→012 | Global Marketplace Operations | ✅ | 008-012 |
| REAL-013→018 | Global Command Center | ✅ | 013-018 |
| REAL-019→025 | Economics + V1 readiness | ✅ | 019-025 |
| REAL-026→035 | SUCCESS-001 Commercial OS | ✅ | 026-035 |
| REAL-036→050 | Production + go-live | ✅ | 036-050 |
| REAL-051→070 | Grand King HQ expansion | ✅ | 051-070 |
| REAL-071→100 | V1 absolute completion | ✅ | 071-100 |

**⚠️ Deferred conflicts (ADR-044):** REAL-003/004/005 foundation vs commerce · REAL-055 alias drift

**Superseded:** `EMPIREAI_REALITY_V1.md` · `ARCHIVED_R002_README.md` · `MARKETPLACE_OS_VISION.md` (partial)

---

# 13. Executive Intelligence Library

| Field | Value |
|-------|-------|
| **Parent** | Grand King → Pillow applies |
| **Children** | EI0→EI10 · EIR reports · Pillow executive companion docs |
| **Purpose** | Approved executive doctrine — Pillow executes, never self-amends |
| **Status** | ✅ EIR-v1.0 certified |
| **Classification** | **Canonical** (King-approved) |
| **Paths** | `docs/executive-intelligence/` |
| **Audits** | EIR-001→006 · GO-001 · GO-002 |

| Document | Role | Status |
|----------|------|--------|
| EI0 Charter | Executive Intelligence charter | ✅ |
| EI1 Empire Constitution | Empire constitution (EI) | ✅ |
| EI2→EI10 | Domain doctrines (commerce, risk, marketplace, etc.) | ✅ |
| EI_INDEX.md | Library index | ✅ |
| EXECUTIVE_INTELLIGENCE_MANIFEST.md | Manifest | ✅ |
| EXECUTIVE_INTELLIGENCE_RELEASE_CERTIFICATE.md | EIR-v1.0 | ✅ |
| PILLOW_EXECUTIVE_*.md (8 files) | Pillow alignment | ✅ |
| GO-001 | Operational readiness report | ✅ |
| GO-002 | Grand King operational master plan | ✅ |

---

# 14. UX & Global Components

| Field | Value |
|-------|-------|
| **Parent** | Pillow → Cockpit presentation |
| **Children** | UX Master · UX-001→023 · GC-01→07 · Executive Components |
| **Purpose** | Frozen V1 UX contract and global chrome |
| **Status** | ✅ UX complete |
| **Classification** | **Canonical** contract · **Derived** pages |
| **Paths** | `UX_IMPLEMENTATION_CONTRACT.md`, `frontend/`, `empireai-web/` |
| **Audits** | COMBINED UX-001-023 · GC-03 · GC-05 |

| Layer | IDs | ADR | Status |
|-------|-----|-----|--------|
| UX Blueprint | UX-000→000B | — | ✅ Superseded by contract |
| UX Screens | UX-001→023 | — | ✅ Frozen |
| Global Components | GC-01→07 | ADR-047 | ✅ |
| GC-03 Notifications | GC-03 | ADR-047 Attention | ✅ |
| GC-05 AI Assistant | GC-05 | ADR-047 Interaction | ✅ |
| Integrations Hub | UX-024 | ADR-050 | ✅ |

---

# 15. Business Automation (G5)

| Field | Value |
|-------|-------|
| **Parent** | Pillow |
| **Children** | G5-00 architecture · G5-01→10 roadmap (not implemented) |
| **Purpose** | Convert approved executive decisions into executable business operations |
| **Status** | ✅ G5-00 architecture only · 🔴 No runtime |
| **Classification** | **Canonical** (architecture) |
| **Paths** | `artifacts/g5-business-automation-architecture.md` |
| **Missions** | G5-00 complete · G5-01+ planned |
| **Integration** | G3-10 `business-automation` consumer channel |

**Planned children (G5-01→10):** Registry schemas · Trigger engine · Scheduler · Orchestrator · Approval router · Recovery · Cockpit SCR · EKLS outcomes · EPF plugins · Production audit

---

# 16. Mission System & Cursor

| Field | Value |
|-------|-------|
| **Parent** | Pillow |
| **Children** | Mission Planner · Cursor Supervisor · `.cursor/missions/` · CAGW |
| **Purpose** | Grand King-approved Cursor execution and repository artifacts |
| **Status** | ✅ Runtime · 2 pending mission files |
| **Classification** | **Canonical** |
| **Paths** | `pillow/src/planner/`, `pillow/src/supervisor/`, `.cursor/missions/` |
| **Doctrines** | `EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md` |

| Pending mission | Path | Status |
|-----------------|------|--------|
| PILLOW-017 | `.cursor/missions/pending/PILLOW-017.md` | Deferred post-V1 |
| REPOSITORY-SYNC | `.cursor/missions/pending/REPOSITORY-SYNC.md` | Pending |

---

# 17. Executive Audit System

| Field | Value |
|-------|-------|
| **Parent** | Pillow |
| **Children** | Audit standard · artifacts/ · COMBINED audits · Audit index · PILLOW-009 reviewer |
| **Purpose** | Mandatory quality gate and permanent audit corpus |
| **Status** | ✅ Active (38+ combined · 45 artifacts) |
| **Classification** | **Canonical** standard · **Derived** artifacts |
| **Paths** | `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md`, `artifacts/`, `docs/governance/EXECUTIVE_AUDIT_INDEX.md` |

**Audit categories:** CTD · GVD · ACD · UID · CBD · REAL (11 batches) · UX · GC · Pillow (10+) · V1 certification · G3 (12) · G4 (11) · G5 · B6 (12) · EA (7) · EKLS · Constitutional · SA-001 supreme audit

---

# 18. Deployment & Infrastructure

| Field | Value |
|-------|-------|
| **Parent** | Pillow → Future Platform Services |
| **Children** | MPD-001 · Railway · Vercel · Supabase · Upstash |
| **Purpose** | Version 1 managed cloud deployment |
| **Status** | ✅ Documentation · deploy pending |
| **Paths** | `deployment/`, `railway.toml`, `vercel.json` |
| **Audits** | MANAGED_PRODUCTION_DEPLOYMENT · MANAGED_DEPLOYMENT_SYNCHRONIZATION · V1_PRODUCTION_DEPLOYMENT |

| Layer | Platform | Doc |
|-------|----------|-----|
| Frontend | Vercel | `deployment/vercel.md` |
| Backend (Brain) | Railway | `deployment/railway.md` |
| Storage backup | Supabase | `deployment/supabase.md` |
| Redis | Upstash | `deployment/upstash.md` |

---

# 19. Future Programmes

| Programme | Parent | Status | Next missions |
|-----------|--------|--------|---------------|
| **G5 Business Automation** | Pillow | G5-00 ✅ | G5-01→10 implementation |
| **Pillow Layer 2 EI** | Pillow | 🔵 Docs only | PEI-021, 026, 027, 028 |
| **MS-A USD 100K** | Commercial | 🔴 | PROOF-001 · live commerce |
| **MS-B USD 1M** | Commercial | 🔴 | Post MS-A |
| **GK-GOLIVE-APPROVAL** | Release | 🔴 | B5–B8 blockers |
| **REAL namespace cleanup** | REAL | ⚠️ Deferred post-V1 | Renumber 003–005 |
| **Runtime Tier C collapse** | REAL | 🔵 | REAL-078 consolidation |
| **Prompt Registry** | Pillow | 🔴 Not implemented | Master index §13 |

---

# Completion Summary

### Programmes closed or architecturally complete

- **BL-A / BL-B** — repository synchronization and Pillow doctrine batches
- **Pillow Runtime PILLOW-002→019** — Layer 1 complete
- **Executive Intelligence Library EIR-v1.0** — certified
- **UX Master UX-001→023** — frozen V1 contract
- **G3 Executive AI Engine suite G3-01→G3-10** — closed
- **G4 Cockpit G4-02→G4-10** — complete
- **EKLS canonical specification** — permanent
- **Registry EA-002→007** — certified (conditions on EA-007)
- **REAL-001→100** — built/wired in Journey (live revenue separate)
- **G5-00 Business Automation architecture** — specification only

### Active or open workstreams

- **BL-C** continuous improvement — enhancement registers accumulating
- **V1 Certification Mode** — blockers B5–B8 open
- **PROOF-001 / MS-A / GK-GOLIVE** — live commercial gates
- **Pillow Layer 2** — Executive Reflection and learning runtime deferred
- **G5-01+** — Business Automation implementation not started
- **B6** — mixed live auth proofs; production vault path certified via B6-04B
- **REAL namespace conflicts** — four labels deferred post-V1

### Superseded documents (retained in repository)

- `EMPIREAI_REALITY_V1.md` · `MARKETPLACE_OS_VISION.md` · `ARCHIVED_R002_README.md`
- `EMPIREAI_UX_MASTER_BLUEPRINT.md` (by UX contract)
- B6-01A (by B6-01C)
- Pillow Executive Council audit (by Executive Perspectives refinement)

### Definitive cross-references

| Need | Document |
|------|----------|
| Operational status | `JOURNEY.md` |
| Artifact paths | `EMPIREAI_REPOSITORY_MASTER_INDEX.md` |
| Technical ownership | `EMPIREAI_PILLOW_CONSTITUTION.md` §17 |
| Target architecture | `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` |
| Hierarchy inventory | `artifacts/repository-totality-hierarchy-report.md` |
| Build history (this bible) | `artifacts/empireai-master-build-bible.md` |

---

*EmpireAI Master Build Bible · Repository archaeology · 2026-07-02 · Grand King Authority · No repository files modified*
