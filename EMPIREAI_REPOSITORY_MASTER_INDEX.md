# EmpireAI Repository Master Index

> **Canonical owner:** Repository Governance · Journey  
> **Purpose:** Searchable master navigation for every permanent repository artifact  
> **Authority:** BL-A continuity model · Journey First · Repository First  
> **Status:** ACTIVE (opened 2026-06-29)  
> **Synchronized with:** `JOURNEY.md` · `JOURNEY_AUDIT.md`

Use **Ctrl+F / Cmd+F** to search by file name, label (REAL-###, UX-###, PILLOW-###, GC-##, ADR-###), or owner.

**Operational map:** `JOURNEY.md` remains the living status index (✅ 🟡 🔴). This document is the **navigation catalog** — file paths, owners, purpose, dependencies, and cross-links.

---

## Quick navigation

| Section | Jump |
|---|---|
| [Continuity spine](#1-continuity-spine-journey--soul--status) | Journey, Audit, Soul, Status, Roadmap |
| [Managed deployment (MPD-001)](#1a-managed-production-deployment-mpd-001) | Vercel · Railway · Supabase · Upstash |
| [ADRs](#2-architecture-decision-records-adrs) | Decision Register |
| [Governance](#3-governance) | Doctrines, BL governance, milestones |
| [BL-A / BL-B / BL-C](#4-backlog-releases-bl-a--bl-b--bl-c) | Backlog Releases |
| [Contracts](#5-implementation-contracts) | UX + Pillow frozen contracts |
| [Enhancement registers](#6-enhancement-registers-bl-c) | UX + Pillow post-V1 registers |
| [Executive Audits](#7-combined-executive-audits) | COMBINED audit corpus · `docs/governance/EXECUTIVE_AUDIT_INDEX.md` |
| [REAL](#8-real-architecture) | REAL-001…100 + orchestration |
| [UX](#9-ux-architecture) | Screens, foundation, backlog |
| [Global Components](#10-global-components-gc) | GC-01…07 |
| [Executive Components](#11-executive-components) | Design system primitives |
| [PILLOW](#12-pillow-architecture) | PILLOW-001…019 + runtime |
| [Prompt Registry](#13-prompt-registry) | Not implemented |
| [REAL appendix](#appendix-a-real-001100-index) | Full REAL label table |

---

## 1. Continuity spine (Journey · Soul · Status)

| File | Path | Owner | Purpose | Dependencies | Related artifacts |
|---|---|---|---|---|---|
| Journey | `JOURNEY.md` | Journey | Master operational index — what exists, status, phase | Doctrine catalogs, ledgers, audits, contracts | `JOURNEY_AUDIT.md`, `EMPIREAI_SOUL.md`, `EMPIREAI_STATUS.md`, this index |
| Journey Audit | `JOURNEY_AUDIT.md` | Journey (change log) | Structural change log, gaps, conflicts, BL sync history | `JOURNEY.md` | All BL validation/difference reports; §9 change log |
| Soul | `EMPIREAI_SOUL.md` | Soul continuity | Permanent identity, mission, doctrine memory | CTD, GVD, ADR-015/016/018/019 | `JOURNEY.md`, `EMPIREAI_STATUS.md`, `EMPIREAI_DECISIONS.md` |
| Project State | `EMPIREAI_STATUS.md` | Project State | Current implemented state, milestone progress, next gates | `JOURNEY.md`, runtime reality | `EMPIREAI_SOUL.md`, `JOURNEY.md`, Pillow bootstrap |
| Roadmap | `EMPIREAI_ROADMAP.md` | Vision | Active direction; points to Commerce OS (COS-001) | `COMMERCE_OS_BLUEPRINT.md` | `JOURNEY.md`, `EMPIREAI_SOUL.md` |
| **Master Index** | `EMPIREAI_REPOSITORY_MASTER_INDEX.md` | Repository Governance | Searchable navigation catalog (this file) | All canonical artifacts | `JOURNEY.md`, Pillow bootstrap catalog |
| **Pillow Roadmap** | `PILLOW_ROADMAP.md` | Pillow Architecture | Five-layer roadmap — Runtime vs Executive Intelligence | Pillow Runtime complete | Constitution, Contract Part 11 |
| **Pillow Constitution (V1)** | `EMPIREAI_PILLOW_CONSTITUTION.md` | Pillow Architecture | Permanent identity — Executive Intelligence, Supreme Directive, Cursor Sovereignty, One Objective | PILLOW-019 · ADR-016 | Layer 2 constitution, Contract Part 1 |
| **Pillow Executive Intelligence Constitution** | `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` | Pillow Architecture | Layer 2 Core Principle — conversation → organizational intelligence | PILLOW_ROADMAP Layer 2 · Pillow Constitution | Memory Doctrine, Approval Gate |
| **Pillow Integration Plan** | `PILLOW_RUNTIME_INTEGRATION_PLAN.md` | Pillow Architecture | Historical Layer 1 integration (complete) | Pillow Runtime | `PILLOW_ROADMAP.md` |
| **Pillow Product Integration Master Plan** | `docs/governance/PILLOW_PRODUCT_INTEGRATION_MASTER_PLAN.md` | Pillow Architecture | Canonical PILLOW-016…019 product integration · migration Phases 0–4 | Pillow Runtime complete | Constitution · ADR-047 |

---

## 1A. Managed production deployment (MPD-001)

| File | Path | Owner | Purpose | Dependencies | Related artifacts |
|---|---|---|---|---|---|
| Managed deployment overview | `deployment/MANAGED_DEPLOYMENT.md` | Repository Governance | V1 split-stack sequence — Vercel · Railway · Supabase · Upstash | `railway.toml`, `vercel.json` | `COMBINED_EXECUTIVE_AUDIT_MANAGED_PRODUCTION_DEPLOYMENT.md` |
| Vercel guide | `deployment/vercel.md` | Runtime Engineering | Founder UX static deploy · `VITE_API_BASE_URL` | Railway Brain URL | `frontend/.env.example` |
| Railway guide | `deployment/railway.md` | Runtime Engineering | Brain API + worker · volume · Pillow | Upstash Redis | `backend/.env.example` |
| Supabase guide | `deployment/supabase.md` | Runtime Engineering | V1 SQLite backup · future Postgres (ADR-002) | Railway volume | — |
| Upstash guide | `deployment/upstash.md` | Runtime Engineering | Production Redis · `rediss://` | Railway API + worker | — |
| Railway config | `railway.toml` | Runtime Engineering | Nixpacks build + health check | Monorepo root | `pillow/`, `backend/` |
| Deployment hub | `deployment/README.md` | Repository Governance | Local + managed + optional Docker | All deployment guides | `README.md` |
| Managed deployment audit | `COMBINED_EXECUTIVE_AUDIT_MANAGED_PRODUCTION_DEPLOYMENT.md` | Repository Governance | MPD-001 executive certification | Journey MPD-001 row | `EXECUTIVE_AUDIT_INDEX.md` |
| Pillow Executive Companion | `frontend/src/context/PillowCompanionContext.tsx` | Pillow Architecture | PILLOW-019 persistent companion | Brain pillow-host | `COMBINED_EXECUTIVE_AUDIT_PILLOW_EXECUTIVE_COMPANION.md` |

---

## 2. Architecture Decision Records (ADRs)

| File | Path | Owner | Purpose | Dependencies | Related artifacts |
|---|---|---|---|---|---|
| Decision Register | `EMPIREAI_DECISIONS.md` | Decision Register | Permanent ADR log — architectural & governance decisions | Constitution supreme | `JOURNEY.md`, `EMPIREAI_SOUL.md`, BL-A/B/C closeouts |

**Indexed ADRs:** ADR-001 → ADR-051 (Brain orchestration through Commercial Risk Intelligence). Key BL anchors: ADR-014 Journey · ADR-019 repository reality · ADR-020 backlog routing · ADR-044 REAL namespace · ADR-045 commercial architecture · ADR-046 PEI pipelines · ADR-047 executive UX layers · ADR-050 marketplace autonomy · **ADR-051 CRI** · ADR-027–043 Pillow missions.

---

## 3. Governance

| File | Path | Owner | Purpose | Dependencies | Related artifacts |
|---|---|---|---|---|---|
| Engineering Constitution | `EMPIREAI_CONSTITUTION.md` | Constitution (supreme) | Permanent engineering law — Brain sovereignty, Guardian, financial integrity | — | All doctrine; BL-C derives authority |
| Backlog Release Governance | `EMPIREAI_BACKLOG_RELEASE_GOVERNANCE.md` | Repository Governance | BL routing model, lifecycle, immutability, ROUTE 02 | ADR-020, ADR-022 | `BL-A`…`BL-C.md`, validation reports |
| Executive Audit Standard | `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md` | Repository Governance | Mandatory audit sections incl. Owner Justification + Future Enhancements + Cursor Output traceability | BL-B, BL-C | `docs/governance/EXECUTIVE_AUDIT_INDEX.md` · all `COMBINED_EXECUTIVE_AUDIT_*.md` |
| Cursor Output Standard | `EMPIREAI_CURSOR_OUTPUT_STANDARD.md` | Repository Governance | Executive Summary + Cursor Draft — preserves intent and implementation | Executive Audit Standard · PILLOW-006 | `docs/governance/CURSOR_OUTPUT_TEMPLATE.md` |
| Continuous Artifact Generation Workflow | `EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md` | Repository Governance | Default workflow — lasting decisions produce Cursor-ready repository artifacts | Cursor Output Standard · Executive Intelligence Constitution | `docs/governance/ARTIFACT_GENERATION_CLASSIFICATION.md` |
| Repository First Doctrine | `EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md` | Repository Governance | Repository = permanent memory; chat = temporary | ADR-019, ADR-026 | `EMPIREAI_SOUL.md`, `JOURNEY.md` |
| Journey First Doctrine | `EMPIREAI_JOURNEY_FIRST_DOCTRINE.md` | Repository Governance | Journey sync before other owners; Pillow reads position from Journey | ADR-014, ADR-026 | `JOURNEY.md`, Pillow bootstrap |
| Cursor Recovery Doctrine | `EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md` | CTO / Cursor | Recovery Mode for agent stalls and validation deadlocks | BL-B | `PILLOW-007`, `PILLOW-008` |
| Empire Recovery Doctrine | `EMPIREAI_EMPIRE_RECOVERY_DOCTRINE.md` | Pillow Architecture | No single device destroys the Empire; recovery assessment | ADR-025, BL-B | Layer 2 PEI-017 (deferred) |
| BL-C Continuous Improvement Constitution | `EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md` | Repository Governance · Continuous Improvement | BL-C doctrine — enhancement lifecycle, registers, GK approval gate | Constitution | `BL-C.md`, enhancement registers |
| Core Constitution (CTD) | `EMPIREAI_CORE_CONSTITUTION_CTD.md` | Immutable doctrine | CTD-001→040 articles | `backend/src/foundation/empire-constitution/` | `COMBINED_EXECUTIVE_AUDIT_CTD-001-040.md` |
| Governance Doctrine (GVD) | `EMPIREAI_GOVERNANCE_DOCTRINE_GVD.md` | Immutable doctrine | GVD-001→030 — roles, approval, audit | foundation catalog | `COMBINED_EXECUTIVE_AUDIT_GVD-001-030.md` |
| Architecture Constraints (ACD) | `EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md` | Immutable doctrine | ACD-001→030 — modular architecture rules | foundation catalog | `COMBINED_EXECUTIVE_AUDIT_ACD-001-030.md` |
| UX Identity Doctrine (UID) | `EMPIREAI_UX_IDENTITY_DOCTRINE_UID.md` | Immutable doctrine | UID-001→020 — Grand King/founder UX law | foundation catalog | `COMBINED_EXECUTIVE_AUDIT_UID-001-020.md` |
| Commercial Business Doctrine (CBD) | `EMPIREAI_COMMERCIAL_BUSINESS_DOCTRINE_CBD.md` | Immutable doctrine | CBD-001→020 — commercial soul | foundation catalog | `COMBINED_EXECUTIVE_AUDIT_CBD-001-020.md` |
| Marketplace Autonomy Doctrine (REAL-051A) | `docs/governance/MARKETPLACE_AUTONOMY_DOCTRINE_REAL-051A.md` | Commercial governance | Founder onboarding · marketplace autonomy · channel strategy · approval-gated automation | CBD · Commerce Canon · ADR-050 | Operational activation · go-live checklist |
| **Commercial Risk Intelligence (CRI) Doctrine** | `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md` | Commercial Architecture · Intelligence · Finance · Governance | Permanent CRI capability · CRIR before launch · survival over profit · dual supplier+marketplace intelligence | CBD companion · Commerce Canon · ADR-051 | CRIR Specification · Canonical Architecture §3.7A |
| **CRIR Specification** | `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_REPORT_SPECIFICATION.md` | Commercial Architecture · Finance | Minimum CRIR sections · certification workflow · artifact storage | CRI Doctrine CRI-004–005 | Future launch REAL missions |
| **CRI Governance Alignment Report** | `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_GOVERNANCE_ALIGNMENT_REPORT.md` | Repository Governance | Executive report — docs updated · owners · future REALs · King approval items | ADR-051 · CRI Doctrine | This alignment mission |
| Integrations Hub (UX-024) | `frontend/src/pages/dashboard/IntegrationsHubPage.tsx` | UX Governance · Commercial Architecture | IH-001 external connectivity SSOT — 8 categories · REAL-051A | OAR · reality-integration · ADR-050 | `/integrations-hub/dashboard` |
| Commerce Canon | `EMPIREAI_COMMERCE_CANON.md` | Commercial Architecture | C001 — single commerce lifecycle truth | ADR-011 | `COMMERCE_OS_BLUEPRINT.md`, REAL commerce path |
| Commerce OS Blueprint | `COMMERCE_OS_BLUEPRINT.md` | Commercial Architecture | COS-001 — fourteen-kernel Commerce OS | ADR-013 | `EMPIREAI_ROADMAP.md`, reality-integration |
| Executive UX Layer Architecture | `docs/governance/EXECUTIVE_UX_LAYER_ARCHITECTURE.md` | UX Governance · Pillow Architecture | GC-03 Attention + GC-05 Interaction layers; Pillow = Intelligence | ADR-047 · UX Contract | GC-03 · GC-05 · Pillow |
| Pillow Product Integration Master Plan | `docs/governance/PILLOW_PRODUCT_INTEGRATION_MASTER_PLAN.md` | Pillow Architecture · Runtime Engineering | Canonical PILLOW-016…019 live product integration | Pillow Runtime · Constitution | pillow-host · PillowChatPage |
| Executive Cognitive Pipelines | `docs/governance/EXECUTIVE_COGNITIVE_PIPELINES.md` | Pillow Architecture | PEI missions A–E planning taxonomy | ADR-046 | PILLOW_ROADMAP Layer 2 |
| Executive Intelligence Library Update Policy | `docs/governance/EXECUTIVE_INTELLIGENCE_LIBRARY_UPDATE_POLICY.md` | Repository Governance · Pillow Architecture | Permanent EIL update policy — event-driven triggers; weekly verification; append-only revision ledger | Executive Intelligence Constitution §3.4 · Memory Doctrine · CAGW | PEI-028 (deferred) |
| Organizational Knowledge Quality Assessment | `docs/governance/ORGANIZATIONAL_KNOWLEDGE_QUALITY_ASSESSMENT.md` | Pillow Architecture · AI Cognitive Doctrine | Advisory OKQA design — PEI-027 pre-presentation scoring; CAGW unchanged | Executive Intelligence Constitution §2.2 · Pipeline C | PEI-027 (deferred) |

**Milestone labels (Journey-indexed):** MS-A (USD 100K net profit) · MS-B (USD 1M) · PROOF-001 · GK-GOLIVE-APPROVAL · SUCCESS-001 (mission name, not milestone name per ADR-015).

---

## 4. Backlog Releases (BL-A · BL-B · BL-C)

| File | Path | Owner | Purpose | Dependencies | Related artifacts |
|---|---|---|---|---|---|
| BL-A (label) | Journey row `BL-A` | Repository Governance | Repository Synchronization standard — closed | ADR-014→020 | Reports below (no `BL-A.md`) |
| BL-A Validation Report | `BL-A_VALIDATION_REPORT.md` | Repository Governance | BL-A closeout validation | ROUTE 02 sequence | `BL-A_SYNCHRONIZATION_REPORT.md` |
| BL-A Repository Difference Report | `BL-A_REPOSITORY_DIFFERENCE_REPORT.md` | Repository Governance | Pre/post BL-A repository diff | `JOURNEY_AUDIT.md` §9 | `BL-A_VALIDATION_REPORT.md` |
| BL-A Synchronization Report | `BL-A_SYNCHRONIZATION_REPORT.md` | Repository Governance | BL-A sync confirmation | `JOURNEY.md`, Soul, Status | ADR-014→020 |
| BL-B | `BL-B.md` | Repository Governance | Closed Backlog Release B — audit standard, Pillow priority, doctrines | ADR-021→026 | `BL-B_VALIDATION_REPORT.md` |
| BL-B Validation Report | `BL-B_VALIDATION_REPORT.md` | Repository Governance | BL-B closeout validation | `BL-B.md` | `BL-B_REPOSITORY_DIFFERENCE_REPORT.md` |
| BL-B Repository Difference Report | `BL-B_REPOSITORY_DIFFERENCE_REPORT.md` | Repository Governance | Pre/post BL-B repository diff | `JOURNEY_AUDIT.md` §9 | `BL-B_VALIDATION_REPORT.md` |
| BL-C | `BL-C.md` | Repository Governance · Continuous Improvement | **ACTIVE** — accumulating BL-C items 001+ | BL-C constitution | Enhancement registers; ADR-031+ |
| BL-C Constitution | `EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md` | Continuous Improvement | BL-C authoritative doctrine | Constitution | `BL-C.md`, registers |

**Note:** UX contract Part 6 labels `BL-01…BL-11` are **UX backlog enhancements**, not Backlog Releases BL-A/B/C. Canonical home: `docs/governance/UX_ENHANCEMENT_REGISTER.md`.

---

## 5. Implementation contracts

| File | Path | Owner | Purpose | Dependencies | Related artifacts |
|---|---|---|---|---|---|
| UX Implementation Contract | `UX_IMPLEMENTATION_CONTRACT.md` | UX Governance | **Frozen V1** — UX-001…023, GC-01…07, acceptance criteria | UID doctrine, REAL owners | `UX_ENHANCEMENT_REGISTER.md`, executive components |
| Pillow Architecture Contract | `PILLOW_ARCHITECTURE_CONTRACT.md` | Pillow Architecture | **Frozen V1** — Pillow subsystem authority, mission order | ADR-027→043 | `PILLOW_ENHANCEMENT_REGISTER.md`, `pillow/` runtime |
| Global Component Contract (embedded) | `UX_IMPLEMENTATION_CONTRACT.md` Part 2 | UX Governance | GC-01…07 specification | REAL module owners per GC | Global + executive components |
| Executive Component Surface | `frontend/src/components/system/index.ts` | UX Governance · Executive Components | Exported design-system primitives (GC-06/07) | `@/components/ui/PageStates` | UX screens, GC rows |

---

## 6. Enhancement registers (BL-C)

| File | Path | Owner | Purpose | Dependencies | Related artifacts |
|---|---|---|---|---|---|
| UX Enhancement Register | `docs/governance/UX_ENHANCEMENT_REGISTER.md` | UX Governance | Post-V1 UX enhancements — UX-001…023 + Master + global | BL-C ITEM 002; frozen UX contract | `UX_IMPLEMENTATION_CONTRACT.md`, `JOURNEY.md`, `EXECUTIVE_AUDIT_INDEX.md` |
| Pillow Enhancement Register | `docs/governance/PILLOW_ENHANCEMENT_REGISTER.md` | Pillow Architecture | Post-V1 Pillow enhancements — PILLOW-002…015 + Master | BL-C ITEM 003; frozen Pillow contract | `PILLOW_ARCHITECTURE_CONTRACT.md`, `JOURNEY.md`, `EXECUTIVE_AUDIT_INDEX.md` |
| Executive Audit Index | `docs/governance/EXECUTIVE_AUDIT_INDEX.md` | Repository Governance · Journey | Canonical COMBINED audit catalog — 24 files, gaps, supersession, future protocol | `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md` | Master Index §7 · all `COMBINED_EXECUTIVE_AUDIT_*.md` |

---

## 7. Combined Executive Audits

**Canonical catalog:** `docs/governance/EXECUTIVE_AUDIT_INDEX.md` — full registry (24 files), domain taxonomy, cross-reference architecture, ownership verification, supersession, and future-audit protocol. This section is the **navigation summary**.

| File | Path | Owner | Purpose | Dependencies | Related artifacts |
|---|---|---|---|---|---|
| **Executive Audit Index** | `docs/governance/EXECUTIVE_AUDIT_INDEX.md` | Repository Governance · Journey | Canonical audit catalog — all COMBINED files, gaps, supersession | `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md` | All rows below; `JOURNEY.md` |
| CTD Executive Audit | `COMBINED_EXECUTIVE_AUDIT_CTD-001-040.md` | Repository Governance | CTD catalog validation | `EMPIREAI_CORE_CONSTITUTION_CTD.md` | `JOURNEY.md` CTD rows |
| GVD Executive Audit | `COMBINED_EXECUTIVE_AUDIT_GVD-001-030.md` | Repository Governance | GVD catalog validation | GVD doctrine + catalog | GVD Journey rows |
| ACD Executive Audit | `COMBINED_EXECUTIVE_AUDIT_ACD-001-030.md` | Repository Governance | ACD catalog validation | ACD doctrine + catalog | ACD Journey rows |
| UID Executive Audit | `COMBINED_EXECUTIVE_AUDIT_UID-001-020.md` | Repository Governance | UID catalog validation | UID doctrine + catalog | UX architecture |
| CBD Executive Audit | `COMBINED_EXECUTIVE_AUDIT_CBD-001-020.md` | Repository Governance | CBD catalog validation | CBD doctrine + catalog | Commercial REAL modules |
| REAL 002B Audit | `COMBINED_EXECUTIVE_AUDIT_REAL-002B.md` | Reality Integration | Live Commerce Integration | `reality-integration/` | ADR-045 · REAL-002B Journey row |
| REAL 003–007 Audit | `COMBINED_EXECUTIVE_AUDIT_REAL-003-007.md` | Runtime Engineering | Global Commerce Execution Engine | REAL-003→007 runtime | `UX_IMPLEMENTATION_CONTRACT.md` commerce path |
| REAL 008–012 Audit | `COMBINED_EXECUTIVE_AUDIT_REAL-008-012.md` | Runtime Engineering | Global Marketplace Operations batch | REAL-008→012 runtime | GMO modules |
| REAL 013–018 Audit | `COMBINED_EXECUTIVE_AUDIT_REAL-013-018.md` | Runtime Engineering | Global Command Center batch | REAL-013→018 runtime | Command center UX |
| REAL 019–025 Audit | `COMBINED_EXECUTIVE_AUDIT_REAL-019-025.md` | Runtime Engineering | Economics + V1 readiness batch | REAL-019→025 runtime | MS-A alignment |
| REAL 026–035 Audit | `COMBINED_EXECUTIVE_AUDIT_REAL-026-035.md` | Runtime Engineering | SUCCESS-001 Commercial OS batch | REAL-026→035 runtime | UX-003, REAL-035 |
| REAL 036–050 Audit | `COMBINED_EXECUTIVE_AUDIT_REAL-036-050.md` | Runtime Engineering | Production + go-live batch | REAL-036→050 runtime | GK-GOLIVE, REAL-050 Gold Master |
| REAL 051–070 Audit | `COMBINED_EXECUTIVE_AUDIT_REAL-051-070.md` | Runtime Engineering | Grand King HQ expansion batch | REAL-051→070 runtime | UX-012…017, UX-023 |
| REAL 071–100 Audit | `COMBINED_EXECUTIVE_AUDIT_REAL-071-100.md` | Runtime Engineering | V1 absolute completion batch | REAL-071→100 runtime | Version 1 completion |
| GC-03 Audit | `COMBINED_EXECUTIVE_AUDIT_GC-03.md` | executive-surveillance · eye-series | Global Notification Integration | `global-notifications/` | ADR-047 · GC-03 Journey row |
| GC-05 Audit | `COMBINED_EXECUTIVE_AUDIT_GC-05.md` | UX Governance · Pillow Architecture | Global AI Assistant | GC-05 panel | ADR-047 · GC-05 Journey row |
| Executive UX Layer Audit | `COMBINED_EXECUTIVE_AUDIT_EXECUTIVE_UX_LAYER_ARCHITECTURE.md` | UX Governance | GC-03/05 executive interface layers (ADR-047) | `EXECUTIVE_UX_LAYER_ARCHITECTURE.md` | GC audits |
| Pillow Constitution Audit | `COMBINED_EXECUTIVE_AUDIT_PILLOW_CONSTITUTION_UPDATE.md` | Pillow Architecture | Executive Intelligence constitutional role | `EMPIREAI_PILLOW_CONSTITUTION.md` | Laws finalization audit |
| Pillow Laws Audit | `COMBINED_EXECUTIVE_AUDIT_PILLOW_CONSTITUTIONAL_LAWS_FINALIZATION.md` | Pillow Architecture | Constitutional Laws 1–7 | Pillow constitution | Perspectives audit |
| Pillow Executive Council Audit | `COMBINED_EXECUTIVE_AUDIT_PILLOW_EXECUTIVE_COUNCIL.md` | Pillow Architecture | Internal reasoning (historical) | — | **Superseded** by Perspectives audit |
| Pillow Perspectives Audit | `COMBINED_EXECUTIVE_AUDIT_EXECUTIVE_PERSPECTIVES_REFINEMENT.md` | Pillow Architecture | Executive Perspectives + Pillow synthesis | `pillow/src/executive-perspectives/` | Canonical internal reasoning |
| Pillow Learning Audit | `COMBINED_EXECUTIVE_AUDIT_EXECUTIVE_LEARNING_ENGINE.md` | Pillow Architecture | Pre-go-live learning engine | `pillow/src/learning/` | PILLOW objective |
| Pillow Product Plan Audit | `COMBINED_EXECUTIVE_AUDIT_PILLOW_PRODUCT_INTEGRATION_MASTER_PLAN.md` | Pillow Architecture | PILLOW-016…019 product integration plan | `PILLOW_PRODUCT_INTEGRATION_MASTER_PLAN.md` | Product phases |
| UX Master Audit | `COMBINED_EXECUTIVE_AUDIT_UX-001-023.md` | UX Governance | UX-001…023 + GC-01…07 contract closure | `UX_IMPLEMENTATION_CONTRACT.md` | Journey GC + UX rows |
| V1 Certification Gap Audit | `COMBINED_EXECUTIVE_AUDIT_EMPIREAI_V1_EXECUTIVE_CERTIFICATION_GAP_ANALYSIS.md` | Repository Governance · Journey | V1 certification readiness analysis | All major audits | Blocker register (SSOT) |
| Version 1 Certification Mode | `docs/governance/VERSION_1_CERTIFICATION_MODE.md` | Repository Governance · Project State | ACTIVE operating mode — blocker-first missions; defers post-V1 expansion | ADR-048 · EMPIREAI_STATUS.md | Blocker register |
| V1 Certification Blocker Register | `docs/governance/VERSION_1_CERTIFICATION_BLOCKER_REGISTER.md` | Repository Governance · Journey | Single source of truth — open/closed V1 blockers (B1–B8) | Certification Mode policy | Activation audit |
| Pillow Version 1 Delivery Mode | `docs/governance/PILLOW_VERSION_1_DELIVERY_MODE.md` | Pillow Architecture · Runtime Engineering | Pillow architecture complete — Delivery Phases 1–3 only; Layer 2 deferred | ADR-049 · Product Integration Plan §10 | Delivery Mode audit |
| V1 Operational Totality Audit | `COMBINED_EXECUTIVE_AUDIT_EMPIREAI_V1_OPERATIONAL_TOTALITY.md` | Repository Governance · Journey | Go-live simulation audit — NOT READY · M1–M8 | Certification blocker register | Totality audit |

**Gaps (no combined audit file yet):** REAL-001 · REAL-002 · REAL-002A (foundation reality-integration). See `EXECUTIVE_AUDIT_INDEX.md` §2.

---

## 8. REAL architecture

### 8.1 REAL series anchors

| File / path | Path | Owner | Purpose | Dependencies | Related artifacts |
|---|---|---|---|---|---|
| REAL Journey index | `JOURNEY.md` (REAL rows) | Journey | Canonical REAL-001…100 labels + status | Runtime, MCL, audits | Appendix A below |
| Runtime root | `backend/src/runtime/` | Runtime Engineering | REAL module implementations (003→100 primary) | OAR, GKR, executive-council | Combined REAL audits |
| Reality Integration | `backend/src/orchestration/reality-integration/` | Connector Kernel | REAL-001→005 foundation (⚠️ 003–005 namespace conflict with commerce REAL) | ADR-013, COS-001 | REAL-002B live gate |
| Program catalog | `backend/src/orchestration/master-completion-ledger/models/program-catalog.ts` | MCL | Mission program metadata, blocking programs | Journey, REAL missions | `MASTER_COMPLETION_LEDGER.md` |
| Master Completion Ledger | `MASTER_COMPLETION_LEDGER.md` | MCL | Completion ledger mirror | program-catalog | REAL audits |
| Revenue Mission Ledger | `REVENUE_MISSION_LEDGER.md` | Commercial | Revenue-path mission tracking | REAL commerce chain | REAL-003→007 audit |

**Combined audit coverage:** REAL-003→100 (batched). **Orchestration-only:** REAL-001, REAL-002, REAL-002A, **REAL-002B** ✅.

### 8.2 REAL namespace conflicts (documented — governed by ADR-044)

Per **ADR-044**, commerce/runtime ownership below is **canonical** for Journey, audits, and Pillow. Foundation `reality-integration` labels for REAL-003/004/005 are **legacy deferred**. Blueprint REAL-055 → visual debate alias is **superseded**; REAL-007 owns debate, REAL-055 owns War Room.

| Label | Commerce/runtime title | reality-integration title | Status |
|---|---|---|---|
| REAL-003 | Marketplace Publishing | Human approval framework | ⚠️ deferred renumber |
| REAL-004 | Listing Intelligence | Credential governance | ⚠️ deferred renumber |
| REAL-005 | Product Media | Reality Readiness Dashboard | ⚠️ deferred renumber |
| REAL-055 | Executive War Room | — (blueprint alias drift to REAL-007 debate) | ⚠️ doc correction deferred |

Full per-label index: [Appendix A](#appendix-a-real-001100-index).

---

## 9. UX architecture

### 9.1 UX foundation documents

| File | Path | Owner | Purpose | Dependencies | Related artifacts |
|---|---|---|---|---|---|
| UX Master Blueprint | `EMPIREAI_UX_MASTER_BLUEPRINT.md` | UX Governance | UX-000 historical design reference | UID doctrine | `UX_IMPLEMENTATION_CONTRACT.md` (supersedes for V1) |
| UX Blueprint Validation | `UX_BLUEPRINT_VALIDATION.md` | UX Governance | UX-000A validation (76/100) | Blueprint | Contract freeze |
| UX Implementation Contract | `UX_IMPLEMENTATION_CONTRACT.md` | UX Governance | UX-000B **frozen V1 authority** | REAL owners per screen | Enhancement register |
| Grand King Operation Simulation | `GRAND_KING_OPERATION_SIMULATION.md` | UX Governance | UX-002A journey simulation + GKS backlog | REAL, GKR | Operation backlog GKS-01…17 |

### 9.2 UX screens (UX-001…023)

| Label | Path (primary) | Owner | Purpose | REAL / deps | Related |
|---|---|---|---|---|---|
| UX-001 Login | `frontend/` auth routes | UX Governance | Role-correct login; founder vs operator routing | auth session | UX-002, UX-018 |
| UX-002 Mission Home | Mission Home page | UX Governance | Founder headquarters — KPIs, blockers, next action | REAL-035, REAL-051, GC-06 | UX-003, UX-004 |
| UX-003 SUCCESS-001 Command Center | SUCCESS-001 page | UX Governance | USD 100K mission desk | REAL-035 | GC-06, MS-A |
| UX-004 Empire Command Center | Command center page | UX Governance | Executive aggregation surface | REAL-037, REAL-051 | BL-07 panels |
| UX-005 Product Discovery | Intelligence / discovery | UX Governance | Product opportunity desk | product-discovery engine | UX Backlog BL-06 |
| UX-006 Supplier Intelligence | Suppliers page | UX Governance | Supplier evaluation desk | SUP, REAL-015 | REAL-071 |
| UX-007 Marketplace Intelligence | Marketplace intel | UX Governance | Marketplace operations desk | GMO REAL-008→012 | REAL-072→076 |
| UX-008 Advertising | Ads page | UX Governance | Advertising intelligence desk | REAL-038 | GC-02 |
| UX-009 Commerce Operations | Operations pages | UX Governance | Orders, fulfillment, commerce ops | REAL-039, REAL-040 | REAL-003 pipeline |
| UX-010 Profit & Operating Cost | Profit page | UX Governance | Economics and operating cost | REAL-019, REAL-020 | MS-A |
| UX-011 Expansion | Expansion desk | UX Governance | Global expansion command | REAL-065, REAL-089 | BL-07 |
| UX-012 Executive Debate | Debate surface | UX Governance | Visual executive debate | **REAL-055** (war room) | UX-013, REAL-007 |
| UX-013 Soul Decision Chamber | Soul chamber | UX Governance | Soul synthesis before approval | REAL-056 | UX-014 |
| UX-014 Approvals Center | Approvals page | UX Governance | Grand King approval queue | GKR, REAL-086 | GC-02 |
| UX-015 King Decision History | Decision history | UX Governance | Auditable King decisions | REAL-086 | UX-014 |
| UX-016 AI Team | AI Team page | UX Governance | AI workforce visibility | ai-workforce registry | REAL-031→033 |
| UX-017 Reports | Reports pages | UX Governance | Executive reporting | REAL-062, REAL-058 | REAL-070 |
| UX-018 Brand Workspace | Brand workspace | UX Governance | Operator multi-brand desk | business-opportunity-workspace | BL-10 |
| UX-019 Launch Mission | Launch flow | UX Governance | Product launch mission | REAL-077 | REAL-078 |
| UX-020 Infrastructure | Infrastructure admin | UX Governance | Platform infrastructure | account-infrastructure | admin role |
| UX-021 Empire Settings | Settings | UX Governance | Empire configuration | empire-governance | all roles |
| UX-022 Billing | Billing page | UX Governance | Billing and subscription | financial-ledger | GC-01 nav |
| UX-023 Commercial Explorer | `/dashboard/explorer` | UX Governance | Global entity search desk | REAL-066 | GC-04 Command Palette |

**UX program label:** UX Master Executive Audit — `COMBINED_EXECUTIVE_AUDIT_UX-001-023.md` ✅; enhancements in `docs/governance/UX_ENHANCEMENT_REGISTER.md` § UX Master.

### 9.3 UX backlog enhancements (not BL-A/B/C)

| Labels | Owner | Purpose | Related |
|---|---|---|---|
| BL-01…BL-11 | UX Governance | Post-V1 full-screen promotions and desks | `UX_ENHANCEMENT_REGISTER.md`; owners REAL-045, REAL-068, etc. |

---

## 10. Global Components (GC)

> **Executive interface layers (ADR-047):** GC-03 = Executive Attention Layer · GC-05 = Executive Interaction Layer · Pillow = Executive Intelligence. Full doctrine: `docs/governance/EXECUTIVE_UX_LAYER_ARCHITECTURE.md`.

| Label | Implementation path | Owner | Purpose | Dependencies | Related REAL / UX |
|---|---|---|---|---|---|
| GC-01 Global Shell | Layout, `ExecutiveSidebar`, `ExecutiveHeader`, nav | UX Governance | TopNav + Sidebar, canonical naming | auth, REAL-091 | UX-002, all screens |
| GC-02 Approval Bar | `ApprovalPanel` (screen-local; universal bar pending) | UX Governance | Persistent approval affordance | GKR, EC, REAL-086 | UX-014, money screens |
| GC-03 Notifications | `backend/src/global-notifications/`, `frontend/src/components/system/NotificationsCenter.tsx` | ESS + eye-series | **Executive Attention Layer** — live notification center, sync, unread, deep-links, ack | ESS, eye-series | ✅ |
| GC-04 Command Palette | `frontend/src/components/system/CommandPalette.tsx` | UX Governance | Cmd/Ctrl+K global search | REAL-066 entity index | UX-023 |
| GC-05 AI Assistant | `backend/src/global-assistant/`, `frontend/src/components/system/GlobalAssistantPanel.tsx` | REAL-031/032/033 + EC | **Executive Interaction Layer** — evidence-on-demand Why? panel, missions, audits | REAL-031/032/033, EC | ✅ |
| GC-06 Executive Page Contract | `MissionBriefPanel` + 4-question scaffold | UX Governance | Mission brief + SUCCESS-001 blocker chip | REAL-035, REAL-051, REAL-090 | UX-002, UX-003 |
| GC-07 Verdict primitives | `ExecutiveKpiCard`, HealthGrid patterns, StatusBadge | UX Governance | KPI cards, health grids, status badges | REAL-091 | All executive screens |

Contract authority: `UX_IMPLEMENTATION_CONTRACT.md` Part 2.

---

## 11. Executive Components

Design system barrel: `frontend/src/components/system/index.ts` · Owner: **Executive Components / UX Governance**

| Component file | Path | Purpose | Dependencies | Related |
|---|---|---|---|---|
| index.ts | `frontend/src/components/system/index.ts` | Public export surface | PageStates re-export | GC-06, GC-07 |
| ExecutiveHeader | `…/ExecutiveHeader.tsx` | Page header chrome | — | GC-01 |
| ExecutiveSidebar | `…/ExecutiveSidebar.tsx` | Role-gated navigation shell | `defaultExecutiveNav.tsx` | GC-01 |
| defaultExecutiveNav | `…/defaultExecutiveNav.tsx` | Canonical nav items | Journey UX routes | GC-01 |
| ExecutiveKpiCard / Grid | `…/ExecutiveKpiCard.tsx` | KPI cards with trend/health | — | GC-07 |
| ExecutivePanel | `…/ExecutivePanel.tsx` | Bordered executive content panel | — | GC-06 |
| MissionBriefPanel | `…/MissionBriefPanel.tsx` | 4-question mission brief + actions | REAL-035 status | GC-06 |
| ApprovalPanel | `…/ApprovalPanel.tsx` | Approval queue panel | GKR pipeline | GC-02, UX-014 |
| AlertBanner | `…/AlertBanner.tsx` | Severity banners | — | GC-07 |
| ExecutiveTable | `…/ExecutiveTable.tsx` | Executive data tables | — | GC-07 |
| GlobalFilters | `…/GlobalFilters.tsx` | Filter bar primitive | — | Intelligence screens |
| CommandPalette | `…/CommandPalette.tsx` | Global search palette | REAL-066 API | GC-04, UX-023 |
| PageStates | `frontend/src/components/ui/PageStates.tsx` | Loading / empty / error states | — | Re-exported from system index |

---

## 12. PILLOW architecture

### 12.1 Pillow documents

| File | Path | Owner | Purpose | Dependencies | Related |
|---|---|---|---|---|---|
| Pillow Architecture Contract | `PILLOW_ARCHITECTURE_CONTRACT.md` | Pillow Architecture | **Frozen V1 authority** | ADR-027→043 | `pillow/` package |
| Pillow Architecture (doctrine) | `EMPIREAI_PILLOW_ARCHITECTURE.md` | Pillow Architecture | Bootstrap, operating modes doctrine | BL-B | Contract Part 7 |
| Pillow Memory Doctrine | `EMPIREAI_PILLOW_MEMORY_DOCTRINE.md` | Pillow Architecture | Remember knowledge not conversations | BL-B | PILLOW-005 |
| Pillow Constitution (V1) | `EMPIREAI_PILLOW_CONSTITUTION.md` | Pillow Architecture | Executive Intelligence identity · Supreme Directive · Cursor Sovereignty · One Objective · Proposal Model | PILLOW-019 · ADR-016 | Layer 2 constitution · Contract Part 1 |
| Pillow Executive Intelligence Constitution | `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` | Pillow Architecture | Layer 2 — Executive Reflection §2.2; EIL Update Policy §3.4; Evidence Sources; lifecycle §2.1; PEI-026 first downstream capability | PILLOW_ROADMAP · ADR-046 pipelines · Pillow Constitution | PEI-021…028 · EIL Update Policy |
| Pillow Enhancement Register | `docs/governance/PILLOW_ENHANCEMENT_REGISTER.md` | Pillow Architecture | Post-V1 Pillow enhancements | BL-C | Contract |

### 12.2 Pillow missions (PILLOW-001…019)

| Label | Runtime path | Owner | Purpose | Dependencies | Status |
|---|---|---|---|---|---|
| PILLOW-001 | Contract authorship | Pillow Architecture | Original 13-subsystem decomposition | ADR-027, ADR-030 | ✅ |
| PILLOW-002 Bootstrap | `pillow/src/bootstrap/` | Pillow Architecture | Mandatory read-only repository bootstrap | Bootstrap catalog | ✅ |
| PILLOW-003 Intelligence | `pillow/src/intelligence/` | Pillow Architecture | Artifact classification, graph, health | PILLOW-002 | ✅ |
| PILLOW-004 Context Builder | `pillow/src/context/` | Pillow Architecture | Dynamic context assembly, cache | PILLOW-003 | ✅ |
| PILLOW-005 Memory | `pillow/src/memory/` | Pillow Architecture | Long-term repository memory | PILLOW-004 | ✅ |
| PILLOW-006 Mission Planner | `pillow/src/planner/` | Pillow Architecture | Strategic planning, Cursor-ready missions | PILLOW-005, Journey | ✅ |
| PILLOW-007 Cursor Supervisor | `pillow/src/supervisor/` | Pillow Architecture | Cursor lifecycle, stall recovery | Cursor Recovery Doctrine | ✅ |
| PILLOW-008 Recovery Manager | `pillow/src/recovery/` | Pillow Architecture | Autonomous recovery governance | PILLOW-007 | ✅ |
| PILLOW-009 Audit Reviewer | `pillow/src/audit-reviewer/` | Pillow Architecture | Executive Audit quality gate | Executive Audit Standard | ✅ |
| PILLOW-010 Synchronizer | `pillow/src/synchronizer/` | Pillow Architecture | Preview-first Journey sync | Journey First | ✅ |
| PILLOW-011 Due Diligence | `pillow/src/due-diligence/` | Pillow Architecture | Continuous self-initiated analysis | BL-C | ✅ |
| PILLOW-012 Improvement Engine | `pillow/src/improvement/` | Pillow Architecture | Observations → proposals | PILLOW-011 | ✅ |
| PILLOW-013 Orchestrator | `pillow/src/orchestrator/` | Pillow Architecture | Subsystem coordination | All PILLOW modules | ✅ |
| PILLOW-014 Repository Watcher | `pillow/src/watcher/` | Pillow Architecture | Continuous repository sensing | PILLOW-003 | ✅ |
| PILLOW-015 Grand King Command | `pillow/src/command/` | Pillow Architecture | Natural-language executive console | PILLOW-013 | ✅ V1 architecture |
| PILLOW-016 Brain Integration | `backend/src/orchestration/pillow-host/` | Pillow Architecture | Layer 1 Runtime — host, sessions, LLM adapter | PILLOW-004 | ✅ |
| PILLOW-017 Approval + Cursor Bridge | `backend/src/orchestration/pillow-approval/` | Pillow Architecture | Layer 1 Runtime — approval gate, Cursor bridge | PILLOW-006, PILLOW-007 | ✅ |
| PILLOW-018 Pillow Chat UI | `frontend/src/pages/dashboard/PillowChatPage.tsx` | Pillow Architecture | Layer 1 Runtime — chat surface, SSE | PILLOW-016, PILLOW-017 | ✅ |
| PILLOW-019 Objective Orchestrator | `pillow/src/objective/` | Pillow Architecture | Layer 1 Runtime — objective engine, Builder Mode | PILLOW-013 | ✅ |
| Pillow Executive Intelligence | — | Pillow Architecture | Layer 2 — Executive Reflection (PEI-026) · Evidence-Based Learning · PEI-001…026 | Constitution · Pillow Runtime · Bootstrap extension | 🔵 future |
| Empire Recovery Assessment | — | Pillow Architecture | Layer 2 — PEI-017 (distinct from PILLOW-019 objective runtime) | Empire Recovery Doctrine | 🔵 deferred |

Package entry: `pillow/` (`@empireai/pillow`). Bootstrap catalog: `pillow/src/bootstrap/catalog.ts`.

---

## 13. Prompt Registry

| Status | **NOT IMPLEMENTED** |
|---|---|
| Search result | No `PROMPT_REGISTRY`, Prompt Registry artifact, or canonical prompt catalog found in repository |
| Owner (when implemented) | Repository Governance or Pillow Architecture (TBD by Grand King) |
| Related | Pillow context profiles (`pillow/src/context/`), BL-C enhancement lifecycle |

---

## Appendix A — REAL-001…100 index

| Label | Phase | Title | Primary path | Combined audit |
|---|---|---|---|---|
| REAL-001 | Reality Integration | Provider Capability Matrix | `backend/src/orchestration/reality-integration/` | — |
| REAL-002 | Reality Integration | Universal Connection Lifecycle | `backend/src/orchestration/reality-integration/` | — |
| REAL-002A | Reality Integration | Live Commerce Foundation | orchestration + runtime bridge | — |
| REAL-002B | Reality Integration | Live Commerce Integration — Amazon SP-API + CJ supplier adapters | ✅ · `COMBINED_EXECUTIVE_AUDIT_REAL-002B.md` |
| REAL-003 | Commerce Execution ⚠️ | Marketplace Publishing | `backend/src/runtime/marketplace-publishing/` | REAL-003-007 |
| REAL-004 | Commerce Execution ⚠️ | Listing Intelligence | `backend/src/runtime/listing-intelligence/` | REAL-003-007 |
| REAL-005 | Commerce Execution ⚠️ | Product Media | `backend/src/runtime/product-media/` | REAL-003-007 |
| REAL-006 | Commerce Execution | Commerce Execution Pipeline | `backend/src/runtime/commerce-execution-pipeline/` | REAL-003-007 |
| REAL-007 | Commerce Execution | Executive Visual Debate | `backend/src/runtime/executive-visual-debate/` | REAL-003-007 |
| REAL-008 | Global Marketplace Ops | Country × Marketplace Operations Model | `backend/src/runtime/global-marketplace-operations/` | REAL-008-012 |
| REAL-009 | Global Marketplace Ops | Global Distribution Dashboard | runtime GMO modules | REAL-008-012 |
| REAL-010 | Global Marketplace Ops | Country Marketplace Tabs | runtime GMO modules | REAL-008-012 |
| REAL-011 | Global Marketplace Ops | Global Product Distribution Engine | runtime GMO modules | REAL-008-012 |
| REAL-012 | Global Marketplace Ops | Executive Distribution Debate | runtime GMO modules | REAL-008-012 |
| REAL-013 | Global Command Center | Live Product Intelligence | `backend/src/runtime/global-command-center/` et al. | REAL-013-018 |
| REAL-014 | Global Command Center | Executive Product Optimization | runtime GCC modules | REAL-013-018 |
| REAL-015 | Global Command Center | Supplier Intelligence Loop | `backend/src/runtime/supplier-intelligence-loop/` | REAL-013-018 |
| REAL-016 | Global Command Center | Global Opportunity Engine | `backend/src/runtime/global-opportunity-engine/` | REAL-013-018 |
| REAL-017 | Global Command Center | Revenue Improvement Engine | `backend/src/runtime/revenue-improvement-engine/` | REAL-013-018 |
| REAL-018 | Global Command Center | Global Command Center | `backend/src/runtime/global-command-center/` | REAL-013-018 |
| REAL-019 | Empire Economics | Empire Economics Engine | `backend/src/runtime/empire-economics/` | REAL-019-025 |
| REAL-020 | Empire Economics | Grand King Financial Command Center | `backend/src/runtime/grand-king-financial-command-center/` | REAL-019-025 |
| REAL-021 | V1 Readiness | Founder Platform Preparation | `backend/src/runtime/founder-platform-preparation/` | REAL-019-025 |
| REAL-022 | V1 Readiness | AI Self Improvement Engine | `backend/src/runtime/ai-self-improvement-engine/` | REAL-019-025 |
| REAL-023 | V1 Readiness | Version 2 Backlog Engine | `backend/src/runtime/version-2-backlog-engine/` | REAL-019-025 |
| REAL-024 | V1 Readiness | Version 1 Readiness Audit | `backend/src/runtime/version-1-readiness-audit/` | REAL-019-025 |
| REAL-025 | V1 Readiness | Version 1 Lockdown | `backend/src/runtime/version-1-lockdown/` | REAL-019-025 |
| REAL-026 | SUCCESS-001 / Commercial OS | Customer Intelligence | `backend/src/runtime/customer-intelligence/` | REAL-026-035 |
| REAL-027 | SUCCESS-001 / Commercial OS | Competitor Intelligence | `backend/src/runtime/competitor-intelligence/` | REAL-026-035 |
| REAL-028 | SUCCESS-001 / Commercial OS | Customer Psychology Engine | `backend/src/runtime/customer-psychology-engine/` | REAL-026-035 |
| REAL-029 | SUCCESS-001 / Commercial OS | Global Category Expansion | `backend/src/runtime/global-category-expansion-engine/` | REAL-026-035 |
| REAL-030 | SUCCESS-001 / Commercial OS | Global Revenue Simulation | `backend/src/runtime/global-revenue-simulation/` | REAL-026-035 |
| REAL-031 | SUCCESS-001 / Commercial OS | AI Chief of Commerce | `backend/src/runtime/ai-chief-of-commerce/` | REAL-026-035 |
| REAL-032 | SUCCESS-001 / Commercial OS | AI Chief of Growth | `backend/src/runtime/ai-chief-of-growth/` | REAL-026-035 |
| REAL-033 | SUCCESS-001 / Commercial OS | AI Chief of Customer | runtime chiefs | REAL-026-035 |
| REAL-034 | SUCCESS-001 / Commercial OS | Global Strategy Engine | `backend/src/runtime/global-strategy-engine/` | REAL-026-035 |
| REAL-035 | SUCCESS-001 / Commercial OS | SUCCESS-001 Command Center | `backend/src/runtime/success-001-command-center/` | REAL-026-035 |
| REAL-036 | Empire HQ / Go-Live | Grand King Live Operations Mode | `backend/src/runtime/grand-king-live-operations-mode/` | REAL-036-050 |
| REAL-037 | Empire HQ / Go-Live | Global Operational Command Center | `backend/src/runtime/global-operational-command-center/` | REAL-036-050 |
| REAL-038 | Empire HQ / Go-Live | Global Advertising Intelligence | `backend/src/runtime/global-advertising-intelligence/` | REAL-036-050 |
| REAL-039 | Empire HQ / Go-Live | First Order Operations | `backend/src/runtime/first-order-operations/` | REAL-036-050 |
| REAL-040 | Empire HQ / Go-Live | Global Order Intelligence | `backend/src/runtime/global-order-intelligence/` | REAL-036-050 |
| REAL-041 | Empire HQ / Go-Live | Post Purchase Intelligence | `backend/src/runtime/post-purchase-intelligence/` | REAL-036-050 |
| REAL-042 | Empire HQ / Go-Live | Global Knowledge Evolution | `backend/src/runtime/global-knowledge-evolution/` | REAL-036-050 |
| REAL-043 | Empire HQ / Go-Live | AI Strategic Memory | `backend/src/runtime/ai-strategic-memory/` | REAL-036-050 |
| REAL-044 | Empire HQ / Go-Live | Empire Playbook Engine | `backend/src/runtime/empire-playbook-engine/` | REAL-036-050 |
| REAL-045 | Empire HQ / Go-Live | Global Risk Command | `backend/src/runtime/global-risk-command/` | REAL-036-050 |
| REAL-046 | Empire HQ / Go-Live | Founder Platform Readiness | `backend/src/runtime/founder-platform-readiness/` | REAL-036-050 |
| REAL-047 | Empire HQ / Go-Live | Production Hardening | `backend/src/runtime/production-hardening/` | REAL-036-050 |
| REAL-048 | Empire HQ / Go-Live | Version 1 Acceptance Test | `backend/src/runtime/version-1-acceptance-test/` | REAL-036-050 |
| REAL-049 | Empire HQ / Go-Live | Grand King Go-Live Checklist | `backend/src/runtime/grand-king-go-live-checklist/` | REAL-036-050 |
| REAL-050 | Empire HQ / Go-Live | Version 1 Gold Master | `backend/src/runtime/version-1-gold-master/` | REAL-036-050 |
| REAL-051 | Grand King HQ Expansion | Unified Grand King Headquarters | `backend/src/runtime/unified-grand-king-headquarters/` | REAL-051-070 |
| REAL-052 | Grand King HQ Expansion | World Operations Map | `backend/src/runtime/world-operations-map/` | REAL-051-070 |
| REAL-053 | Grand King HQ Expansion | Global Market Share Engine | `backend/src/runtime/global-market-share-engine/` | REAL-051-070 |
| REAL-054 | Grand King HQ Expansion | Product Portfolio Command | `backend/src/runtime/product-portfolio-command/` | REAL-051-070 |
| REAL-055 | Grand King HQ Expansion ⚠️ | Executive War Room | `backend/src/runtime/executive-war-room/` | REAL-051-070 |
| REAL-056 | Grand King HQ Expansion | Soul Decision Chamber | `backend/src/runtime/soul-decision-chamber/` | REAL-051-070 |
| REAL-057 | Grand King HQ Expansion | Mission Command Engine | `backend/src/runtime/mission-command-engine/` | REAL-051-070 |
| REAL-058 | Grand King HQ Expansion | Global Execution Timeline | `backend/src/runtime/global-execution-timeline/` | REAL-051-070 |
| REAL-059 | Grand King HQ Expansion | Autonomous Analysis Engine | `backend/src/runtime/autonomous-analysis-engine/` | REAL-051-070 |
| REAL-060 | Grand King HQ Expansion | Commercial Memory Engine | `backend/src/runtime/commercial-memory-engine/` | REAL-051-070 |
| REAL-061 | Grand King HQ Expansion | Global Business Health Engine | `backend/src/runtime/global-business-health-engine/` | REAL-051-070 |
| REAL-062 | Grand King HQ Expansion | Empire KPI Engine | `backend/src/runtime/empire-kpi-engine/` | REAL-051-070 |
| REAL-063 | Grand King HQ Expansion | Live Commercial Investigations | `backend/src/runtime/live-commercial-investigations/` | REAL-051-070 |
| REAL-064 | Grand King HQ Expansion | Commercial Simulation Engine | runtime commercial simulation | REAL-051-070 |
| REAL-065 | Grand King HQ Expansion | Global Expansion Command | runtime expansion command | REAL-051-070 |
| REAL-066 | Grand King HQ Expansion | Commercial Explorer | `backend/src/runtime/commercial-explorer/` | REAL-051-070 |
| REAL-067 | Grand King HQ Expansion | Empire Strategic Center | runtime strategic center | REAL-051-070 |
| REAL-068 | Grand King HQ Expansion | Version 1 Governance Review | runtime governance review | REAL-051-070 |
| REAL-069 | Grand King HQ Expansion | SUCCESS-001 Readiness Review | runtime readiness review | REAL-051-070 |
| REAL-070 | Grand King HQ Expansion | Version 1 Executive Sign-Off Report | runtime executive sign-off | REAL-051-070 |
| REAL-071 | V1 Absolute Completion | Global Supplier Market | runtime supplier market | REAL-071-100 |
| REAL-072 | V1 Absolute Completion | Global Marketplace Adapter Framework | runtime adapter framework | REAL-071-100 |
| REAL-073 | V1 Absolute Completion | Marketplace Difference Engine | runtime marketplace diff | REAL-071-100 |
| REAL-074 | V1 Absolute Completion | Country Difference Engine | runtime country diff | REAL-071-100 |
| REAL-075 | V1 Absolute Completion | Global Price Intelligence | runtime price intelligence | REAL-071-100 |
| REAL-076 | V1 Absolute Completion | Shipping Intelligence | runtime shipping intelligence | REAL-071-100 |
| REAL-077 | V1 Absolute Completion | Product Launch Commander | runtime launch commander | REAL-071-100 |
| REAL-078 | V1 Absolute Completion | Post-Launch Commander | runtime post-launch | REAL-071-100 |
| REAL-079 | V1 Absolute Completion | Product Scale Engine | runtime scale engine | REAL-071-100 |
| REAL-080 | V1 Absolute Completion | Product Retirement Engine | runtime retirement | REAL-071-100 |
| REAL-081 | V1 Absolute Completion | Empire Revenue Forecast | runtime revenue forecast | REAL-071-100 |
| REAL-082 | V1 Absolute Completion | Empire Cashflow Engine | runtime cashflow | REAL-071-100 |
| REAL-083 | V1 Absolute Completion | Empire Investment Engine | runtime investment | REAL-071-100 |
| REAL-084 | V1 Absolute Completion | Global Opportunity Board | runtime opportunity board | REAL-071-100 |
| REAL-085 | V1 Absolute Completion | Executive Strategy Room | `backend/src/runtime/executive-strategy-room/` | REAL-071-100 |
| REAL-086 | V1 Absolute Completion | King Decision History | `backend/src/runtime/king-decision-history/` | REAL-071-100 |
| REAL-087 | V1 Absolute Completion | Soul Learning Review | `backend/src/runtime/soul-learning-review/` | REAL-071-100 |
| REAL-088 | V1 Absolute Completion | Empire Pattern Library | `backend/src/runtime/empire-pattern-library/` | REAL-071-100 |
| REAL-089 | V1 Absolute Completion | Global Expansion Score | runtime expansion score | REAL-071-100 |
| REAL-090 | V1 Absolute Completion | Empire Priority Engine | `backend/src/runtime/empire-priority-engine/` | REAL-071-100 |
| REAL-091 | V1 Absolute Completion | Command Center Polish | `backend/src/runtime/command-center-polish/` | REAL-071-100 |
| REAL-092 | V1 Absolute Completion | UX Review Preparation | `backend/src/runtime/ux-review-preparation/` | REAL-071-100 |
| REAL-093 | V1 Absolute Completion | Performance Review | `backend/src/runtime/performance-review/` | REAL-071-100 |
| REAL-094 | V1 Absolute Completion | Security Review | `backend/src/runtime/security-review/` | REAL-071-100 |
| REAL-095 | V1 Absolute Completion | Architecture Review | `backend/src/runtime/architecture-review/` | REAL-071-100 |
| REAL-096 | V1 Absolute Completion | Commercial Review | `backend/src/runtime/commercial-review/` | REAL-071-100 |
| REAL-097 | V1 Absolute Completion | Version 1 Freeze Review | `backend/src/runtime/version-1-freeze-review/` | REAL-071-100 |
| REAL-098 | V1 Absolute Completion | Version 1 Release Candidate | `backend/src/runtime/version-1-release-candidate/` | REAL-071-100 |
| REAL-099 | V1 Absolute Completion | Version 1 Go-Live Approval | `backend/src/runtime/version-1-go-live-approval/` | REAL-071-100 |
| REAL-100 | V1 Absolute Completion | Version 1 Completion | `backend/src/runtime/version-1-completion/` | REAL-071-100 |

---

## Appendix B — Search index (labels → section)

`JOURNEY` · `JOURNEY_AUDIT` · `SOUL` · `STATUS` · `ROADMAP` · `PILLOW_ROADMAP` · `PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION` · `ADR` · `BL-A` · `BL-B` · `BL-C` · `GC-01`…`GC-07` · `UX-001`…`UX-023` · `PILLOW-001`…`PILLOW-019` · `REAL-001`…`REAL-100` · `COMBINED_EXECUTIVE_AUDIT` · `UX_ENHANCEMENT_REGISTER` · `PILLOW_ENHANCEMENT_REGISTER` · `UX_IMPLEMENTATION_CONTRACT` · `PILLOW_ARCHITECTURE_CONTRACT` · `ExecutiveHeader` · `MissionBriefPanel` · `CommandPalette` · `Prompt Registry` (not implemented)

---

_Last updated: EmpireAI Repository Master Index — initial publication (2026-06-29). Documentation only — no runtime modified._
