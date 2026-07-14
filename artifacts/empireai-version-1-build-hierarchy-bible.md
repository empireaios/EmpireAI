# EmpireAI Version 1 — Build & Hierarchy Bible

**Document type:** Canonical Version 1 build map for external strategic review  
**Version:** EmpireAI Version 1.0 (`1.0.0`)  
**Status:** LOCKED · Production baseline established  
**Generated:** 2026-07-03  
**Authority:** Grand King · Pillow · Brain · Registry · EKLS · Guardian  
**Scope:** Repository extraction and documentation only — **no code modified**

---

## Document Purpose

This bible is the single strategic reference for what EmpireAI Version 1 **is**, how it is **organized**, what it **includes**, what it **does not yet include**, and what should come **next**. It consolidates the certified G0–G8 programme ladder, Empire Activation, Version 1 Lock, subsystem ownership, routes, modules, tools, registries, and production conditions.

**Related artifacts:**
- `artifacts/empire-v1-executive-audit.md`
- `artifacts/empire-v1-certification-report.md`
- `artifacts/empire-v1-version-lock-report.md`
- `artifacts/empire-v1-activation-executive-audit.md`
- `artifacts/empireai-master-build-bible.md` (prior archaeology — superseded for V1 baseline by this document)

---

## Table of Contents

1. [Version 1 Status at a Glance](#1-version-1-status-at-a-glance)
2. [Full Programme Hierarchy (G0–G8)](#2-full-programme-hierarchy-g0g8)
3. [Empire Activation Summary](#3-empire-activation-summary)
4. [Version 1.0 Lock Summary](#4-version-10-lock-summary)
5. [Major Subsystems Overview](#5-major-subsystems-overview)
6. [Ownership Hierarchy](#6-ownership-hierarchy)
7. [Pillow Hierarchy](#7-pillow-hierarchy)
8. [Brain Hierarchy](#8-brain-hierarchy)
9. [Registry Hierarchy](#9-registry-hierarchy)
10. [EKLS Hierarchy](#10-ekls-hierarchy)
11. [Guardian Hierarchy](#11-guardian-hierarchy)
12. [Cockpit Hierarchy](#12-cockpit-hierarchy)
13. [Commerce Hierarchy](#13-commerce-hierarchy)
14. [Automation Hierarchy](#14-automation-hierarchy)
15. [Identity & Authorization Hierarchy](#15-identity--authorization-hierarchy)
16. [Production Deployment Hierarchy](#16-production-deployment-hierarchy)
17. [File & Folder Map — Major Modules](#17-file--folder-map--major-modules)
18. [Current Frontend Routes](#18-current-frontend-routes)
19. [Current Backend Orchestration Modules](#19-current-backend-orchestration-modules)
20. [Current Brain Tools](#20-current-brain-tools)
21. [Current Registries](#21-current-registries)
22. [Current EKLS Channels](#22-current-ekls-channels)
23. [Known Placeholders & Demo Areas](#23-known-placeholders--demo-areas)
24. [Current Blockers](#24-current-blockers)
25. [Current Production Conditions](#25-current-production-conditions)
26. [What Version 1 Includes](#26-what-version-1-includes)
27. [What Version 1 Does NOT Yet Include](#27-what-version-1-does-not-yet-include)
28. [Recommended Next Development Priorities](#28-recommended-next-development-priorities)

---

## 1. Version 1 Status at a Glance

| Field | Value |
|-------|-------|
| **Current Version** | EmpireAI Version 1.0 |
| **Semver** | `1.0.0` |
| **Status** | LOCKED |
| **Production Status** | ACTIVE (repository-eligible; live DNS deploy pending) |
| **Working Version** | Version 1.x Development |
| **Release Date** | 2026-07-03 |
| **Readiness Rating** | PASS WITH CONDITIONS |
| **Production Domain Target** | `https://empire-ai.co` |
| **Frontend Host** | Vercel (`empireai-web/`) |
| **Backend Host** | Railway (existing architecture) |
| **Engineering IDE** | Cursor (external to EmpireAI runtime) |
| **Operational HQ** | EmpireAI via Pillow + Cockpit |

---

## 2. Full Programme Hierarchy (G0–G8)

### Canonical certification ladder

```
G0  Platform Foundation
G1  Registry Foundation
G2  Infrastructure & Commerce        [G2-00 → G2-10]
G3  Executive AI Engines             [G3-01 → G3-10]
G4  Grand King Cockpit                [G4-01 → G4-10]
G5  Business Automation               [G5-00 → G5-10]
G6  Production Certification          [G6-00 → G6-10]
G7  Grand King Live Operations        [G7-00 → G7-10]
G8  Identity & Authorization          [G8-00 → G8-10]
    ↓
V1-ACTIVATION  Empire Activation
    ↓
V1-LOCK        Version 1.0 Lock
```

**Authoritative source:** `backend/src/orchestration/empire-version-governance/contracts/version-governance-types.ts`

---

### G0 — Platform Foundation

| Field | Value |
|-------|-------|
| Mission | `G0` |
| Status | ✅ Certified |
| Scope | Constitution, doctrine, governance framework, core infrastructure |

**Key modules:**

| Module | Path |
|--------|------|
| Soul runtime & file | `backend/src/foundation/soul-runtime/`, `soul-file/` |
| Doctrine engine | `backend/src/foundation/doctrine-engine/` |
| Policy engine | `backend/src/foundation/policy-engine/` |
| Empire governance | `backend/src/foundation/empire-governance/` |
| Empire constitution (CTD) | `backend/src/foundation/empire-constitution/` |
| Governance doctrine (GVD) | `backend/src/foundation/empire-governance-doctrine/` |
| Architecture constraints (ACD) | `backend/src/foundation/empire-architecture-constraints/` |
| UX identity doctrine (UID) | `backend/src/foundation/empire-ux-identity-doctrine/` |
| Commercial business doctrine (CBD) | `backend/src/foundation/empire-commercial-business-doctrine/` |
| Identity registry, KPI engine, strategic memory, decision registry | `backend/src/foundation/` |

---

### G1 — Registry Foundation

| Field | Value |
|-------|-------|
| Mission | `G1` |
| Status | ✅ Certified |
| Scope | Canonical registry IDs, loader, resolver, registry-driven wiring |

**Key modules:**

| Module | Path |
|--------|------|
| Registry loader & index | `backend/src/registry/` |
| Registry sources | `backend/src/registry/sources/` |
| Registry types & validation | `backend/src/registry/types/`, `validation/` |
| Architecture spec | `artifacts/ea-002-canonical-registry-architecture.md` |

---

### G2 — Infrastructure & Commerce

| Field | Value |
|-------|-------|
| Missions | `G2-00` (architecture) + `G2-01` … `G2-10` |
| Status | ✅ COMPLETE · Production certified |
| Root | `backend/src/orchestration/infrastructure-commerce/` |

| Mission | Subsystem |
|---------|-----------|
| G2-00 | Programme architecture |
| G2-01 | Commerce registry foundation |
| G2-02 | Marketplace integration |
| G2-03 | Supplier integration |
| G2-04 | Storefront integration |
| G2-05 | Payment integration |
| G2-06 | Logistics integration |
| G2-07 | Analytics integration |
| G2-08 | Commerce orchestration |
| G2-09 | Commerce plugin integration |
| G2-10 | Production certification |

**Artifact:** `artifacts/g2-infrastructure-commerce-completion-summary.md`

---

### G3 — Executive AI Engines

| Field | Value |
|-------|-------|
| Missions | `G3-01` … `G3-10` |
| Status | ✅ CLOSED / Certified |
| Views | `backend/src/domain/services/*-intelligence-engine-views.ts` |

| Mission | Engine |
|---------|--------|
| G3-01 | Product Intelligence |
| G3-02 | Market Intelligence |
| G3-03 | Supplier Intelligence |
| G3-04 | Financial Intelligence |
| G3-05 | Quantitative Intelligence |
| G3-06 | Advertising Intelligence |
| G3-07 | Customer Intelligence |
| G3-08 | Risk Intelligence |
| G3-09 | Decision Intelligence |
| G3-10 | Executive Intelligence Orchestrator |

**Cockpit surface:** `/cockpit/intelligence/*` (SCR-100 series)

---

### G4 — Grand King Cockpit

| Field | Value |
|-------|-------|
| Missions | `G4-01` … `G4-10` (+ G4-05A/B auth) |
| Status | ✅ COMPLETE |
| Frontend root | `empireai-web/` |

| Mission | Deliverable |
|---------|-------------|
| G4-01 | Cockpit architecture |
| G4-02 | Live cockpit wiring |
| G4-03 | Executive Home (SCR-001) |
| G4-04 | Engine Centers |
| G4-05 | Executive Dashboard |
| G4-05A/B | Grand King authentication |
| G4-06 | Live executive widgets |
| G4-07 | AI Interaction Layer |
| G4-08 | Executive Relationship Graph |
| G4-09 | Global AI Assistant (Pillow shell) |
| G4-10 | Production readiness |

---

### G5 — Business Automation

| Field | Value |
|-------|-------|
| Missions | `G5-00` + `G5-01` … `G5-10` |
| Status | ✅ CERTIFIED |
| Root | `backend/src/orchestration/business-automation/` |
| Cockpit | SCR-303 Automation Centre |

| Mission | Subsystem |
|---------|-----------|
| G5-01 | Automation registry |
| G5-02 | Trigger engine |
| G5-03 | Workflow scheduler & queue |
| G5-04 | Orchestrator & execution broker |
| G5-05 | Pillow approval router |
| G5-06 | Recovery & rollback |
| G5-07 | Cockpit Automation Centre |
| G5-08 | EKLS outcome integration |
| G5-09 | Automation plugin integration |
| G5-10 | Production certification |

**Artifact:** `artifacts/g5-business-automation-completion-summary.md`

---

### G6 — Production Certification

| Field | Value |
|-------|-------|
| Missions | `G6-00` … `G6-10` |
| Status | ✅ PRODUCTION READY |
| Root | `backend/src/orchestration/production-certification/` |

| Mission | Domain |
|---------|--------|
| G6-00 | Certification framework |
| G6-01 | Platform integrity |
| G6-02 | Security & governance |
| G6-03 | Infrastructure & deployment |
| G6-04 | Operational readiness |
| G6-05 | Business operations |
| G6-06 | Performance, scalability & resilience |
| G6-07 | Executive operations |
| G6-08 | Failure, recovery & incident |
| G6-09 | Production simulation |
| G6-10 | Final production readiness |

**Artifact:** `artifacts/g6-production-certification-completion-summary.md`

---

### G7 — Grand King Live Operations

| Field | Value |
|-------|-------|
| Missions | `G7-00` … `G7-10` |
| Status | ✅ LIVE READY |
| Certification | `G7-10` |

| Mission | Module |
|---------|--------|
| G7-00 | Live Operations Framework |
| G7-01 | Production Workspace |
| G7-02 | Commerce Operations |
| G7-03 | Business Automation Operations |
| G7-04 | Executive Decision Centre |
| G7-05 | Revenue & Financial Operations |
| G7-06 | Continuous Intelligence & Optimization |
| G7-07 | Autonomous Operations |
| G7-08 | Self-Healing Operations |
| G7-09 | Operational Intelligence & Executive Insights |
| G7-10 | Live Operations Certification |

**Artifact:** `artifacts/g7-grand-king-live-operations-completion-summary.md`

---

### G8 — Identity & Authorization

| Field | Value |
|-------|-------|
| Missions | `G8-00` … `G8-10` |
| Status | ✅ CERTIFIED · PASS WITH CONDITIONS |
| Root | `backend/src/orchestration/identity-authorization-platform/` |
| Cockpit | SCR-304 Authorization Centre |

| Mission | Subsystem |
|---------|-----------|
| G8-00 | Platform foundation |
| G8-01 | Connection registry |
| G8-02 | OAuth & API authorization framework |
| G8-03 | Credential vault & secret management |
| G8-04 | Connection health & monitoring |
| G8-05 | Authorization Centre Cockpit |
| G8-06 | Operational readiness engine |
| G8-07 | Automatic reauthorization & token lifecycle |
| G8-08 | Multi-workspace & customer isolation |
| G8-09 | Identity plugin integration |
| G8-10 | Production readiness & executive audit |

**Artifact:** `artifacts/g8-identity-authorization-completion-summary.md`

---

## 3. Empire Activation Summary

**Mission:** `V1-ACTIVATION`  
**Module:** `backend/src/orchestration/empire-activation/`  
**Status:** ACTIVATED · PASS WITH CONDITIONS  
**Date:** 2026-07-03

Empire Activation wires the certified G0–G8 repository into production-ready activation configuration without new architecture:

| Area | Implementation |
|------|----------------|
| Private gateway | `/login` — Grand King authentication entry |
| Root redirect | `/` → login or `/cockpit` based on session |
| Search engine protection | `robots.txt`, `X-Robots-Tag`, meta robots noindex |
| Executive Home | `/cockpit` (SCR-001) post-auth default |
| Pillow operating shell | Resizable panel, voice (Web Speech API), localStorage history |
| Production domain target | `https://empire-ai.co` |
| Governance verification | Ownership matrix preserved, no duplicate subsystems |

**Key frontend files:**
- `empireai-web/middleware.ts`
- `empireai-web/public/robots.txt`
- `empireai-web/app/(auth)/login/page.tsx`
- `empireai-web/lib/cockpit/pillow/` (session store, voice hook)
- `empireai-web/components/cockpit/global-assistant/` (Pillow shell)

**Artifact:** `artifacts/empire-v1-activation-executive-audit.md`

---

## 4. Version 1.0 Lock Summary

**Mission:** `V1-LOCK`  
**Module:** `backend/src/orchestration/empire-version-governance/`  
**Status:** LOCKED · Version `1.0.0`  
**Date:** 2026-07-03

Version Lock establishes permanent governance:

| Capability | Detail |
|------------|--------|
| Certification | EmpireAI Version 1.0 certified against G0–G8 + Activation |
| Logical snapshots | 9 metadata records (repository, architecture, registry, Brain, Pillow, Cockpit, EKLS, production config, certification) |
| Version history | Entry #1 — append-only, never rewritten |
| Version Lock Doctrine | Only Grand King may authorize lock; Pillow may recommend, never auto-create |
| EKLS recording | 6 version governance record kinds |
| Pillow awareness | Released vs working version, pending recommendations |
| Baseline hash | Sourced from REAL-025 `version-1-lockdown` |

**Brain tools:** `empire_version_governance.certification`, `.status`, `.lock_report`, `.authorize_lock`, `.recommend_version`

**Artifacts:**
- `artifacts/empire-v1-executive-audit.md`
- `artifacts/empire-v1-release-notes.md`
- `artifacts/empire-v1-certification-report.md`
- `artifacts/empire-v1-version-history-report.md`
- `artifacts/empire-v1-version-lock-report.md`

---

## 5. Major Subsystems Overview

```
                    ┌─────────────────────────────────────┐
                    │           GRAND KING                │
                    │    (unique authority · owner)       │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │              PILLOW                 │
                    │   governance · operating shell      │
                    └───────┬─────────────┬───────────────┘
                            │             │
              ┌─────────────▼──┐    ┌─────▼─────┐
              │     BRAIN      │    │   EKLS    │
              │   execution    │    │  memory   │
              └───────┬────────┘    └───────────┘
                      │
        ┌─────────────┼─────────────┬──────────────┐
        │             │             │              │
   ┌────▼────┐  ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
   │REGISTRY │  │ GUARDIAN  │  │ COCKPIT │  │  G2–G8    │
   │ config  │  │  safety   │  │  UI only│  │programmes │
   └─────────┘  └───────────┘  └─────────┘  └───────────┘
```

| Subsystem | Role | Owner | Path |
|-----------|------|-------|------|
| Pillow | Governance, approvals, operating shell | Pillow | `orchestration/pillow/`, `pillow-host/`, `pillow-approval/` |
| Brain | Tool registry, dispatch, orchestration | Brain | `backend/src/brain/` |
| Registry | Configuration resolution | Registry | `backend/src/registry/` |
| EKLS | Institutional memory | Pillow (gateway) | `orchestration/pillow/ekls/` |
| Guardian | Operational safety | Guardian | `backend/src/guardian/` |
| Cockpit | Presentation only | Cockpit | `empireai-web/app/(cockpit)/` |
| G2 Commerce | Marketplace, supplier, payment, logistics | G2 programme | `orchestration/infrastructure-commerce/` |
| G5 Automation | Triggers, workflows, approvals | G5 programme | `orchestration/business-automation/` |
| G8 Identity | Connections, auth, credentials, isolation | G8 programme | `orchestration/identity-authorization-platform/` |
| REAL Runtime | 103 runtime modules (REAL programme) | Various | `backend/src/runtime/` |

---

## 6. Ownership Hierarchy

**Canonical ownership matrix (preserved at V1 lock):**

| Domain | Owner | Must NOT duplicate |
|--------|-------|-------------------|
| Governance | Pillow | No parallel governance AI |
| Execution | Brain | No bypass of Brain dispatch |
| Configuration | Registry | No hardcoded config in engines |
| Institutional memory | EKLS | No shadow memory stores |
| Safety | Guardian | No unguarded L0 actions |
| Presentation | Cockpit | No business logic in UI |
| Connection & authorization state | G8 Identity & Authorization | No duplicate auth stores |
| Orchestration | G5 Business Automation | No parallel workflow engines |
| Commerce infrastructure | G2 Infrastructure Commerce | No duplicate commerce adapters |
| Executive intelligence | G3 Executive AI Engines | No hardcoded intelligence |
| Production certification | G6 | No shadow certification |
| Live operations | G7 | No duplicate ops command |
| Version governance | V1-LOCK (Grand King authorized) | No auto-version creation |

**Constitutional anchors:**
- Grand King is unique from Founder
- Soul never bypasses Grand King
- Net profit required before scaling
- Cursor is engineering IDE; EmpireAI is operational HQ

---

## 7. Pillow Hierarchy

Pillow is the governance layer — not a duplicate Brain.

```
Pillow (governance owner)
├── pillow-host/              Operating host & session bridge
├── pillow-approval/          Approval routing
├── pillow-executive-council/ Council governance bridge
├── orchestration/pillow/
│   └── ekls/                 EKLS governance gateway (all memory access)
│       ├── services/         ekls-governance-gateway, ekls-unified-service
│       ├── policies/         ownership, workspace isolation
│       ├── contracts/        subsystem registry, lifecycles, knowledge standard
│       └── storage/          store registry
└── Frontend Pillow shell (G4-09)
    ├── GlobalAiAssistantProvider / GlobalAiAssistantPanel
    ├── pillow-session-store.ts (conversation persistence)
    └── use-pillow-voice.ts (Web Speech API)
```

**Pillow responsibilities at V1:**
- Govern all EKLS access (no bypass)
- Route automation approvals (G5-05)
- Govern identity & authorization operations (G8)
- Surface version status and recommendations (V1-LOCK)
- Operate as Grand King's AI shell — not autonomous version creator

**Version Lock Doctrine (Pillow constraint):**
- Pillow **may recommend** future versions (1.1, 2.0, etc.)
- Pillow **must never** auto-create, auto-lock, or auto-release a version
- Only Grand King may authorize version lock

---

## 8. Brain Hierarchy

```
Brain (backend/src/brain/)
├── index.ts                  createBrain() — tool registry assembly
├── types.ts                  RegisteredTool, dispatch types
├── audit/                    Audit logger
├── database.ts               Brain persistence schema
├── orchestrator/             Dispatch & routing
└── Tool imports (~700+ tools, deduplicated at registration)
    ├── agents/               Core, module-load, domain, AI-CEO tools
    ├── foundation/           Soul, doctrine, policy, constitution tools
    ├── orchestration/        G5, G6, G7, G8, commerce, automation tools
    ├── runtime/              REAL programme dashboard tools (~90 modules)
    ├── revenue/              Revenue loop, payments, first dollar
    ├── execution/            Deployment, fulfillment, ads, publishing
    └── guardian/             Wired at init — assessDispatch on every call
```

**Authority levels:** L0 (Grand King only) through L3 (operator)

**Key Brain integrations:**
- All G8 identity tools isolation-wrapped
- Guardian assesses every dispatch when `GUARDIAN_ENABLED`
- Module routes map Cockpit actions → Brain tools (`agents/routes/module-routes.ts`)
- Frontend dispatch via `/api/brain/dispatch`

**Registration source:** `backend/src/brain/index.ts` (lines ~349–539)

---

## 9. Registry Hierarchy

**Architecture:** EA-002 canonical registry (6 tiers)

```
Tier 0 — Constitutional
  REG-DOCTRINE, REG-BUSINESS-RULE

Tier 1 — Platform catalog
  REG-REGION, REG-COUNTRY, REG-MARKETPLACE, REG-SUPPLIER, REG-STOREFRONT

Tier 2 — Deployment
  REG-PROVIDER, REG-INTEGRATION, REG-CHANNEL, REG-DEPLOYMENT-PROFILE
  REG-PAYMENT, REG-LOGISTICS, REG-PRODUCT-SOURCE

Tier 3 — Policy & topology
  Scoring, pricing, AI engine, workflow
  Automation (10 IDs) · Certification (13 IDs) · Live ops (3 IDs)
  Production workspace (8 IDs) · Identity/auth (6 IDs) · Connection registry (6 IDs)
  Commerce policy

Tier 4 — Workspace
  REG-TENANT, REG-COMPANY, REG-BRAND, REG-CATEGORY, REG-PRODUCT

Tier 5 — Derived views
  DERIVED-DISCOVERY-SNAPSHOT, DERIVED-ACTIVATION-SNAPSHOT, DERIVED-READINESS-SNAPSHOT
```

**Counts:**
- **71** canonical registry IDs (`REGISTRY_IDS`)
- **3** derived view IDs
- **~49** foundation-wired (actively loaded)
- **~22** foundation placeholders (catalogued, not yet wired)

**Programme registry groupings:**

| Programme | Registry constant | Count |
|-----------|-------------------|------:|
| G5 Automation | `AUTOMATION_REGISTRY_IDS` | 10 |
| G2 Commerce | `COMMERCE_REGISTRY_IDS` | 10 |
| G6 Certification | `CERTIFICATION_REGISTRY_IDS` | 13 |
| G7 Live ops | `LIVE_OPERATIONS_REGISTRY_IDS` | 3 |
| G7 Production workspace | `PRODUCTION_WORKSPACE_REGISTRY_IDS` | 8 |
| G8 Identity | `IDENTITY_AUTHORIZATION_REGISTRY_IDS` | 6 |
| G8 Connection | `CONNECTION_REGISTRY_REGISTRY_IDS` | 6 |

**Source:** `backend/src/registry/types/registry-ids.ts`

---

## 10. EKLS Hierarchy

**Owner:** Pillow (all access via governance gateway)

```
EKLS (orchestration/pillow/ekls/)
├── Governance Gateway          enforceEklsAccess() — mandatory for all stores
├── Unified Service             Schedules, coordinates, aggregates
├── Subsystem Registry          27 memory subsystems
├── Store Registry              Storage backends
├── Lifecycle Registry          Domain lifecycles
└── Knowledge Object Standard   Canonical record schema
```

**27 EKLS subsystems** (`EKLS_SUBSYSTEM_IDS`):

| Subsystem | Data mode |
|-----------|-----------|
| knowledge_store, experience_store, learning_store, evidence_store | partial / live |
| decision_history, outcome_history, observation_store | partial |
| document_memory, learning_store | live |
| knowledge_graph, marketplace_memory, supplier_memory, customer_memory | partial |
| financial_memory, advertising_memory, product_memory, country_memory, brand_memory, category_memory | partial |
| mission_memory, audit_memory | partial |
| confidence_history, pattern_store, feature_store, model_store, semantic_memory, workflow_memory, connector_memory | architecture |
| vector_memory | reserved |

**Version governance EKLS kinds (V1-LOCK):**
`version_certification`, `version_lock`, `version_history`, `version_recommendation`, `version_executive_audit`, `version_release`

**G8 programme EKLS kinds:** Per-subsystem (connection registry, authorization, credential vault, health, readiness, token lifecycle, isolation, plugin integration)

---

## 11. Guardian Hierarchy

**Path:** `backend/src/guardian/`

```
GuardianEngine
├── ActionGuard           assess() on every Brain dispatch
├── DatabaseGuardian      Schema / mutation protection
├── HealthMonitor         Platform health assessment
├── RecoveryPlanner       Recovery plans for blocked actions
├── RiskRegistry          Open risk tracking
└── architecture-validator (foundation cross-check)
```

**Behavior at V1:**
- Wired into `createBrain()` — optional via `GUARDIAN_ENABLED` env
- Blocks unsafe dispatches → records risk → creates recovery plan → audit log
- G5 automation has Guardian recovery bridge
- Self-check framework: `guardian/self-check.ts`

**Guardian does NOT own:** business logic, governance decisions (Pillow), or presentation (Cockpit)

---

## 12. Cockpit Hierarchy

**Frontend root:** `empireai-web/app/(cockpit)/cockpit/`  
**Navigation source:** `empireai-web/lib/cockpit/navigation.ts`  
**Screen registry:** SCR-000 through SCR-803

### Department structure (REAL-079 IA)

| Department | Primary SCR | Routes |
|------------|-------------|--------|
| Executive | SCR-001, SCR-015 | `/cockpit`, `/cockpit/relationship` |
| Command | SCR-010 | `/cockpit/command` |
| Missions | SCR-020 | `/cockpit/missions` |
| Intelligence | SCR-100–110 | `/cockpit/intelligence/*` |
| Commerce | SCR-200–204, SCR-106 | `/cockpit/commerce/*` |
| Operations | SCR-300–304 | `/cockpit/operations/*` |
| Finance | SCR-400–403, SCR-105 | `/cockpit/finance/*` |
| Workforce | SCR-500–502 | `/cockpit/workforce/*` |
| Infrastructure | SCR-600–603 | `/cockpit/infrastructure/*` |
| Governance | SCR-700–704 | `/cockpit/governance/*` |
| Development | SCR-800–803 | `/cockpit/development/*` |
| Auth (external) | SCR-000 | `/login` |

### Key certified screens

| SCR | Name | Data mode |
|-----|------|-----------|
| SCR-001 | Executive Home | live |
| SCR-010 | Command Centre | live |
| SCR-015 | Relationship Graph | live |
| SCR-020 | Mission Centre | live |
| SCR-303 | Automation Centre (G5) | sandbox |
| SCR-304 | Authorization Centre (G8) | sandbox |
| SCR-704 | V1 Certification | live |

**Cockpit rule:** Presentation only — all data via Brain `*.load_view` tools.

---

## 13. Commerce Hierarchy

```
G2 Infrastructure & Commerce (orchestration/infrastructure-commerce/)
├── registry/                 Commerce registry resolver
├── marketplace/              Marketplace integration (G2-02)
├── supplier/                 Supplier integration (G2-03)
├── storefront/               Storefront integration (G2-04)
├── payment/                  Payment integration (G2-05)
├── logistics/                Logistics integration (G2-06)
├── analytics/                Analytics integration (G2-07)
├── commerce-orchestration/   Orchestration layer (G2-08)
└── commerce-plugin/          Plugin integration (G2-09)

G7 Commerce Operations (grand-king-commerce-operations/)
└── Live commerce ops bridge to G2 infrastructure

Runtime commerce modules (backend/src/runtime/)
├── commerce-runtime/
├── global-commerce/
├── global-commerce-intelligence/
├── global-commerce-infrastructure/
├── global-marketplace-operations/
├── marketplace-publishing/
├── commerce-execution-pipeline/
└── amazon-global-seller/

Execution & revenue bridges
├── execution/product-publishing-engine/
├── execution/live-cj-fulfillment/
├── revenue/live-payment-engine/
├── revenue/customer-order-pipeline/
└── revenue/grand-kings-revenue-engine/
```

**Cockpit commerce routes:** `/cockpit/commerce/store`, `/launch`, `/marketing`, `/ads`, `/ad-intelligence`, `/workspace`, `/workspace/[id]`

---

## 14. Automation Hierarchy

```
G5 Business Automation (orchestration/business-automation/)
├── triggers/                 G5-02 Trigger engine
├── scheduler/                G5-03 Workflow scheduler
├── queue/                    G5-03 Execution queue
├── orchestrator/             G5-04 Orchestrator
├── broker/                   G5-04 Execution broker
├── approval/                 G5-05 Pillow approval router
├── recovery/                 G5-06 Recovery & rollback
├── cockpit/                  G5-07 Automation Centre (SCR-303)
├── outcome/                  G5-08 EKLS outcome integration
├── plugins/                  G5-09 Automation plugin integration
├── guardian/                 Guardian recovery bridge
└── data/automation-registry-seed.ts

G7 Automation Operations (grand-king-business-automation-operations/)
└── Live automation ops bridge to G5

Brain tools: business_automation.* (25), cockpit_automation.* (4),
             ekls_outcome.* (4), automation_plugin.* (9)
```

**Automation registry IDs (10):** trigger, workflow, schedule, policy, approval, executor, recovery, notification, report, monitor

---

## 15. Identity & Authorization Hierarchy

```
G8 Identity & Authorization Platform
├── connection-registry/              G8-01
├── authorization-framework/          G8-02 OAuth & API auth
├── credential-vault-integration/     G8-03 Secrets (redacted in all outputs)
├── connection-health-monitoring/     G8-04
├── authorization-centre/             G8-05 Cockpit SCR-304
├── operational-readiness-engine/     G8-06
├── automatic-reauthorization/        G8-07 Token lifecycle
├── multi-workspace-isolation/        G8-08 Workspace/customer isolation
├── identity-plugin-integration/      G8-09 Plugin hooks (12 categories)
├── production-readiness/             G8-10
└── contract/                         Programme certification

Brain tools: 58+ isolation-wrapped identity tools
Cockpit: /cockpit/operations/authorizations (SCR-304)
Registry: 6 identity IDs + 6 connection registry IDs
```

**Security invariants at V1:**
- No secrets in Brain responses, Cockpit payloads, or EKLS records
- Credential references redacted
- Workspace isolation enforced
- Plugin isolation enforced
- No public anonymous access to protected routes

---

## 16. Production Deployment Hierarchy

```
Production target stack
├── Domain: https://empire-ai.co
├── Frontend: Vercel (empireai-web/)
│   ├── vercel.json
│   ├── middleware.ts (session gate, robots headers)
│   └── next.config.ts (global X-Robots-Tag)
├── Backend: Railway
│   ├── CORS_ORIGIN → production domain
│   └── GUARDIAN_ENABLED, SESSION_SECRET, etc.
└── SSL: Platform-managed (Vercel + Railway)

Activation controls (V1-ACTIVATION)
├── Private gateway: /login only for anonymous
├── No public landing page
├── robots.txt blocks all crawlers
├── Session cookie: empireai_session
└── Post-auth entry: /cockpit (SCR-001)

Version lock (V1-LOCK)
├── Version 1.0.0 LOCKED — immutable baseline
├── Working version: Version 1.x Development
└── Future deploys accumulate as unreleased until new version approved
```

**Deployment verification status:** Repository wiring complete. Live DNS for `empire-ai.co` must point to Vercel (GoDaddy parking is not EmpireAI).

---

## 17. File & Folder Map — Major Modules

```
EmpireAI/
├── empireai-web/                    Primary frontend (G4 Cockpit + Pillow shell)
│   ├── app/(auth)/                  Login gateway
│   ├── app/(cockpit)/cockpit/       All Cockpit routes
│   ├── app/api/                     Auth + Brain dispatch APIs
│   ├── components/cockpit/          Widgets, global-assistant (Pillow)
│   └── lib/cockpit/                 Navigation, KPIs, panel types, pillow/
│
├── backend/src/
│   ├── brain/                       Brain execution core
│   ├── guardian/                    Operational safety
│   ├── registry/                    Configuration resolution (G1)
│   ├── foundation/                  G0 doctrine, soul, constitution (15 modules)
│   ├── orchestration/               39 programme modules (see §19)
│   ├── runtime/                     103 REAL runtime modules
│   ├── domain/                      G3 engine views, cockpit loaders
│   ├── agents/                      Core tools, module routes
│   ├── revenue/                     Revenue loop, payments, first dollar
│   ├── execution/                   Deployment, fulfillment, ads, publishing
│   ├── operational-access/          Platform credential catalog
│   ├── intelligence/                Supplier intelligence engine
│   ├── validation/tests/            ~200 validation test files
│   └── auth/                        Permissions, session
│
├── artifacts/                       Executive audits, certification reports (113+ files)
├── docs/                            Architecture decisions, specifications
└── pillow/                          Pillow package (separate npm workspace)
```

**Foundation modules (G0):** `decision-registry`, `doctrine-engine`, `empire-architecture-constraints`, `empire-commercial-business-doctrine`, `empire-constitution`, `empire-governance`, `empire-governance-doctrine`, `empire-ux-identity-doctrine`, `identity-registry`, `kpi-engine`, `policy-engine`, `promise-register`, `soul-file`, `soul-runtime`, `strategic-memory-engine`

**Runtime scale:** 103 directories under `backend/src/runtime/` (REAL-001→100 programme + extensions)

---

## 18. Current Frontend Routes

### Public & auth

| URL | Purpose |
|-----|---------|
| `/` | Redirect → `/login` or `/cockpit` |
| `/login` | Grand King authentication gateway (SCR-000) |

### Cockpit — 68 pages (canonical URLs)

**Executive:** `/cockpit`, `/cockpit/relationship`, `/cockpit/command`, `/cockpit/missions`

**Intelligence:** `/cockpit/intelligence`, `/products`, `/markets`, `/executive`, `/discovery`, `/marketplace`, `/suppliers`, `/customers`, `/risk`, `/decisions`

**Commerce:** `/cockpit/commerce`, `/store`, `/launch`, `/workspace`, `/workspace/[id]`, `/ads`, `/marketing`, `/ad-intelligence`

**Operations:** `/cockpit/operations`, `/orders`, `/fulfillment`, `/support`, `/automation`, `/authorizations`

**Finance:** `/cockpit/finance`, `/costs`, `/billing`, `/pl`, `/profit`, `/intelligence`

**Workforce:** `/cockpit/workforce`, `/audit`, `/activity`

**Infrastructure:** `/cockpit/infrastructure`, `/admin`, `/health`, `/deployments`, `/integrations`

**Governance:** `/cockpit/governance`, `/soul`, `/council`, `/decisions`, `/settings`, `/v1`

**Development:** `/cockpit/development`, `/learning`, `/inspection`, `/approvals`, `/pillow`

### API routes

| URL | Purpose |
|-----|---------|
| `/api/auth/login` | Session creation |
| `/api/auth/logout` | Session termination |
| `/api/auth/me` | Session validation |
| `/api/brain/dispatch` | Brain tool dispatch |
| `/api/brain/events` | Brain event stream |

### Legacy platform (308 → cockpit)

All `/platform/*` routes redirect to equivalent `/cockpit/*` paths via `lib/platform/cockpit-redirects.ts`.

---

## 19. Current Backend Orchestration Modules

39 top-level modules under `backend/src/orchestration/`:

| Module | Programme / role |
|--------|------------------|
| `account-infrastructure-engine` | Account provisioning |
| `business-automation` | **G5** |
| `business-build-engine` | Business build pipeline |
| `business-opportunity-workspace` | Opportunity workspace |
| `business-preview-studio` | Preview studio |
| `business-simulation-engine` | Simulation |
| `commerce-readiness-engine` | Commerce readiness |
| `ecommerce-os-orchestrator` | Commerce OS orchestration |
| `empire-activation` | **V1-ACTIVATION** |
| `empire-self-inspection` | ESIS repository inspection |
| `empire-version-governance` | **V1-LOCK** |
| `execution-layer` | Execution layer bridge |
| `executive-learning` | Executive learning |
| `eye-series` | Eye Series intelligence |
| `grand-king-autonomous-operations` | **G7-07** |
| `grand-king-business-automation-operations` | **G7-03** |
| `grand-king-commerce-operations` | **G7-02** |
| `grand-king-continuous-intelligence-optimization` | **G7-06** |
| `grand-king-executive-decision-centre` | **G7-04** |
| `grand-king-live-operations` | **G7-00** |
| `grand-king-operational-intelligence-executive-insights` | **G7-09** |
| `grand-king-production-workspace` | **G7-01** |
| `grand-king-revenue-financial-operations` | **G7-05** |
| `grand-king-self-healing-operations` | **G7-08** |
| `identity-authorization-platform` | **G8** |
| `infrastructure-commerce` | **G2** |
| `market-domination-strategy-engine` | Strategy engine |
| `marketplace-connection-engine` | Marketplace connections |
| `marketplace-infrastructure-engine` | Marketplace infrastructure |
| `master-completion-ledger` | Business completion tracking (MCL) |
| `objective-management-engine` | Objective management |
| `pillow` | Pillow EKLS core |
| `pillow-approval` | Pillow approvals |
| `pillow-executive-council` | Executive council bridge |
| `pillow-host` | Pillow operating host |
| `product-discovery-opportunity-engine` | Product discovery |
| `production-certification` | **G6** |
| `reality-integration` | Live connector integration |
| `version-1-activation` | Legacy V1 activation bridge |

---

## 20. Current Brain Tools

**Registration:** `backend/src/brain/index.ts` — ~700+ tool definitions, deduplicated by name at registration.

### Tool inventory by domain

| Domain | Module prefix | Approx. tools | Examples |
|--------|---------------|---------------:|----------|
| Core agents | `portfolio.*`, `intelligence.*`, `dashboard.load_view` | 56+ | Module load views for all Cockpit screens |
| Foundation | `soul_*`, `doctrine.*`, `policy.*`, `constitution.*` | 90+ | Soul, doctrine, KPI, decision registry |
| G5 Automation | `business_automation.*`, `automation_plugin.*` | 42 | Triggers, workflows, approvals, plugins |
| G6 Certification | `production_certification.*`, `platform_integrity.*`, etc. | 82 | All certification domains |
| G7 Live ops | `grand_king_*`, `final_live_launch.*` | 118 | All live operations subsystems |
| G8 Identity | `identity_*`, `connection_*`, `authorization_*`, etc. | 63 | Full IAP tool suite (isolation-wrapped) |
| G2/Revenue | `revenue_loop.*`, `live_payment.*`, `production_deploy.*` | 50+ | Revenue, payments, deployment |
| Orchestration | `ecommerce_os.*`, `execution_layer.*`, `reality_integration.*` | 80+ | Business engines, reality integration |
| Runtime (REAL) | `{module}.dashboard` | ~103 | One dashboard tool per runtime module |
| Version governance | `empire_version_governance.*` | 5 | Certification, lock, status |
| ESIS / MCL | `esis.*`, `master_completion_ledger.*` | 7 | Self-inspection, completion ledger |

### Representative Cockpit load tools

`executive-home.load_view`, `authorization-centre.load_view`, `automation-centre.load_view`, `engine-center.load_view`, `cockpit_global_assistant.ask`

### Authority

- **L0:** Grand King only (version lock, go-live, sensitive financial)
- **L1:** Founder/admin operational
- **L2–L3:** Operator read/limited write

Full tool manifest: grep `name:` in `backend/src/**/tools/*.ts` or inspect Brain init log (`tools: toolRegistry.list().length`).

---

## 21. Current Registries

### Canonical IDs (71 + 3 derived)

**Tier 0:** `REG-DOCTRINE`, `REG-BUSINESS-RULE`

**Tier 1:** `REG-REGION`, `REG-COUNTRY`, `REG-MARKETPLACE`, `REG-SUPPLIER`, `REG-STOREFRONT`

**Tier 2:** `REG-PROVIDER`, `REG-INTEGRATION`, `REG-CHANNEL`, `REG-DEPLOYMENT-PROFILE`, `REG-PAYMENT`, `REG-LOGISTICS`, `REG-PRODUCT-SOURCE`

**Tier 3 — Automation (G5):** `REG-AUTOMATION-TRIGGER` through `REG-AUTOMATION-MONITOR` (10)

**Tier 3 — Commerce (G2):** `REG-COUNTRY-COMMERCE`, `REG-COMMERCE-POLICY` (+ tier 1/2 commerce IDs)

**Tier 3 — Certification (G6):** `REG-CERTIFICATION-DOMAIN` through `REG-CERTIFICATION-FINAL-READINESS` (13)

**Tier 3 — Live ops (G7):** `REG-LIVE-OPERATIONS-DOMAIN`, `REG-LIVE-OPERATIONS-PROFILE`, `REG-LIVE-OPERATIONS-FINAL-CERTIFICATION`

**Tier 3 — Production workspace (G7):** 8 IDs including `REG-WORKSPACE`, `REG-READINESS-POLICY`, `REG-CONNECTION-PROVIDER`, etc.

**Tier 3 — Identity (G8):** 6 IDs including `REG-IDENTITY-PROVIDER`, `REG-AUTHORIZATION-PROVIDER`, `REG-CREDENTIAL-TYPE`, etc.

**Tier 3 — Connection registry (G8):** 6 IDs including `REG-CONNECTION-SCOPE`, `REG-CONNECTION-PERMISSION`, etc.

**Tier 4:** `REG-TENANT`, `REG-COMPANY`, `REG-BRAND`, `REG-CATEGORY`, `REG-PRODUCT`

**Derived:** `DERIVED-DISCOVERY-SNAPSHOT`, `DERIVED-ACTIVATION-SNAPSHOT`, `DERIVED-READINESS-SNAPSHOT`

### Wiring status

| Set | Count | Meaning |
|-----|------:|---------|
| `FOUNDATION_WIRED_REGISTRY_IDS` | ~49 | Loaded by registry loader |
| `FOUNDATION_PLACEHOLDER_REGISTRY_IDS` | ~22 | Catalogued, not yet wired |

**Registry sources:** `backend/src/registry/sources/` (commerce, automation, certification, constitutional, deployment, platform-catalog, connection, identity-authorization, live-operations, production-workspace)

---

## 22. Current EKLS Channels

### Primary consumer channels (`EKLS_CONSUMER_CHANNELS`)

| Channel | Delivery mode | Role |
|---------|---------------|------|
| `cockpit` | visualise-only | Cockpit panels consume EKLS summaries |
| `pillow` | govern-full | Pillow governs all memory quality |
| `global-ai-assistant` | summary-retrieval | Pillow shell memory (not parallel AI) |
| `business-automation` | schedule-gate | G5 consumes schedule manifest post-approval |
| `executive-reports` | report-bundle | Executive report generation |

### Extended governance channels (gateway)

Additional channels in `ekls-governance-gateway.ts` for programme subsystems: `identity-authorization`, `connection-registry`, `authorization-framework`, `credential-vault-integration`, `connection-health-monitoring`, `operational-readiness-engine`, `automatic-reauthorization`, `multi-workspace-isolation`, `identity-plugin-integration`, `empire-version-governance`, plus all G7 live operations channels.

### Schedule manifest

| Slot | Cadence | Consumers |
|------|---------|-----------|
| continuous-observations | continuous | pillow, global-ai-assistant |
| hourly-learning | hourly | pillow, business-automation |
| daily-suite-memory | daily | executive-reports, cockpit |
| on-demand-retrieval | on-demand | global-ai-assistant, cockpit, pillow |

---

## 23. Known Placeholders & Demo Areas

| Area | Location | Mode | Notes |
|------|----------|------|-------|
| SCR-303 Automation Centre | `/cockpit/operations/automation` | sandbox | G5 wired; live automation ops pending |
| SCR-304 Authorization Centre | `/cockpit/operations/authorizations` | sandbox | G8 wired; live OAuth flows need production credentials |
| Unmapped Cockpit screens | `cockpitScreenDataModes` default | demo | Screens without explicit mode default to `demo` |
| EKLS subsystems | `architecture` / `reserved` | partial | vector_memory reserved; feature/model stores architecture-only |
| Registry placeholders | `FOUNDATION_PLACEHOLDER_REGISTRY_IDS` | catalog | ~22 IDs not yet loaded by registry loader |
| In-memory G8 stores | IAP subsystems | validation | Production persistence is deploy-time concern |
| G8 plugin registry injection | G8-09 | deferred | Domain router handles runtime hooks; full registry row injection deferred |
| Legacy `/platform/*` routes | `app/(platform)/` | redirect | Exist but 308 to cockpit equivalents |
| Marketing page | `app/(marketing)/page.tsx` | redirect | Redirects to login — no public landing |
| Master Completion Ledger | MCL programmes | tracking | Business completion % separate from G-series certification |
| REAL runtime dashboards | 103 modules | mixed | Many REAL modules are certification/wiring surfaces; not all live revenue |
| Autonomy heartbeat | MCL `autonomy-heartbeat` | 48% | Production cron/worker not deployed |
| Proof of Money | MCL `proof-of-money` | 38% | PROOF-001 live revenue not yet verified |

---

## 24. Current Blockers

### Production / live revenue blockers (MCL-tracked)

| Blocker | Programme | Impact |
|---------|-----------|--------|
| **PROOF-001** | proof-of-money, live-commerce-intelligence | No verified live net profit toward USD 100K target |
| **REAL-002B** | operational-access | Live Amazon SP-API + verified credentials not connected |
| **GK-GOLIVE-APPROVAL** | v1-production-go-live | Grand King go-live sign-off pending live proof |
| **DNS not on Vercel** | empire-activation | `empire-ai.co` shows GoDaddy parking, not EmpireAI |
| **Live credentials** | operational-access | Amazon Seller, Stripe, CJ Dropshipping production keys |
| **CRT-002** | commerce-execution | Commerce runtime publish path blocked post-activation |
| **ECON-LIVE-001** | empire-economics | Live Stripe + supplier COGS not attached to financial engine |

### Architectural / governance blockers

None at V1 lock — architecture is certified. All remaining blockers are **deployment, credentials, and live revenue** — not structural.

### G8 conditions (non-blocking)

- In-memory authorization/credential stores suitable for validation; production persistence at deploy time
- Registry plugin row injection deferred; G8-09 domain router handles runtime hooks

---

## 25. Current Production Conditions

From V1 Activation and V1 Lock certification (PASS WITH CONDITIONS):

1. **DNS:** `https://empire-ai.co` must point to Vercel deployment — GoDaddy parking is not EmpireAI
2. **Persistence:** In-memory subsystem stores (G8, automation, etc.) require production database configuration at deploy time
3. **Voice:** Pillow voice uses browser Web Speech API — provider selection remains Brain-governed
4. **Canvas:** Visual canvas outputs open from Pillow when responses exceed chat panel capacity
5. **Version planning:** Version 2+ planning occurs inside EmpireAI through Pillow — Cursor remains engineering IDE
6. **Version lock:** Post-lock changes accumulate as unreleased work under Version 1.x Development until Grand King approves new version
7. **SSL:** Platform-managed once DNS is correct (Vercel + Railway)
8. **CORS:** Backend `CORS_ORIGIN` must match production frontend domain on Railway
9. **Session:** `SESSION_SECRET` and production env vars required on Vercel/Railway

---

## 26. What Version 1 Includes

EmpireAI Version 1.0 **includes** the complete certified software baseline:

### Programmes (certified & locked)
- ✅ G0 Platform Foundation — constitution, doctrine, soul, governance
- ✅ G1 Registry Foundation — 71 registry IDs, loader, resolver
- ✅ G2 Infrastructure Commerce — marketplace, supplier, payment, logistics, orchestration
- ✅ G3 Executive AI Engines — 10 intelligence engines + orchestrator
- ✅ G4 Cockpit — Executive Home, 68 routes, Pillow shell, auth gateway
- ✅ G5 Business Automation — triggers, workflows, approvals, SCR-303
- ✅ G6 Production Certification — 11 certification domains
- ✅ G7 Grand King Live Operations — 11 live operations subsystems
- ✅ G8 Identity & Authorization — full IAP stack, SCR-304
- ✅ V1 Activation — private gateway, SEO protection, production wiring
- ✅ V1 Lock — immutable Version 1.0 baseline, Version Lock Doctrine

### Architecture (preserved)
- Pillow governance layer with EKLS gateway
- Brain tool registry (~700+ tools)
- Guardian safety on dispatch
- Registry-driven configuration
- Cockpit presentation-only rule
- Workspace isolation (G8-08)
- Secret redaction throughout

### Repository assets
- 103 REAL runtime modules
- 39 orchestration modules
- 15 foundation modules
- ~200 validation test files
- 113+ executive audit artifacts
- Version governance artifacts (5)

### Production-ready repository configuration
- Private authentication gateway
- Search engine blocking
- Session-gated Cockpit
- Brain dispatch API
- Production domain constant (`https://empire-ai.co`)

---

## 27. What Version 1 Does NOT Yet Include

Version 1.0 is **software-complete and locked** but **not live-commerce-complete**:

### Not yet live
- ❌ Live DNS serving EmpireAI at `empire-ai.co` (GoDaddy parking active)
- ❌ Verified live net profit (PROOF-001)
- ❌ Production-connected Amazon SP-API, Stripe, CJ credentials
- ❌ First live product sale with fulfillment tracking
- ❌ Grand King go-live approval on live operations
- ❌ Production database persistence for all in-memory stores
- ❌ Production cron/worker for autonomy heartbeat
- ❌ OAuth callback routes fully live for all providers

### Not in Version 1 scope (by design)
- ❌ Version 2.0 features or architecture redesign
- ❌ Parallel AI systems outside Pillow/Brain
- ❌ Public marketing website or SEO-indexed landing
- ❌ Anonymous access to Cockpit, Brain, or Pillow
- ❌ Auto-version creation (forbidden by Version Lock Doctrine)
- ❌ REAL-093 or subsequent REAL missions (not started)
- ❌ Pillow Executive Intelligence Layer 2 (deferred per master build bible)
- ❌ Full registry placeholder wiring (~22 IDs remain catalog-only)
- ❌ Vector memory backend (EKLS reserved)
- ❌ Full live data on all Cockpit screens (many remain sandbox/demo mode)

### Distinction

| Layer | Status |
|-------|--------|
| **Software architecture** | ✅ Complete, certified, locked |
| **Production deployment** | 🟡 Wired in repo; DNS/credentials pending |
| **Live commerce revenue** | 🔴 PROOF-001 not yet achieved |

---

## 28. Recommended Next Development Priorities

Priorities for **Version 1.x Development** (unreleased until Grand King approves Version 1.1+):

### Priority 1 — Production go-live (deployment)

1. **Point DNS** for `empire-ai.co` to Vercel; disable GoDaddy parking
2. **Deploy** latest `empireai-web` build to Vercel with production env vars
3. **Configure Railway** backend: `CORS_ORIGIN`, `SESSION_SECRET`, production database
4. **Verify HTTPS** and end-to-end login → Executive Home flow on live domain

### Priority 2 — Live credentials (operational access)

5. **REAL-002B** — Connect Amazon SP-API with verified production credentials
6. **Stripe** — Business verification + live payment keys
7. **CJ Dropshipping** — Production API key + catalog sync
8. Wire credentials through G8 Authorization Centre (SCR-304) — no secrets in Brain/EKLS

### Priority 3 — First live revenue (proof of money)

9. **PROOF-001** — First LIVE product with verified net profit tracking
10. **CRT-002** — Unblock commerce runtime publish path
11. **ECON-LIVE-001** — Attach live Stripe + supplier COGS to financial engine
12. **GK-GOLIVE-APPROVAL** — Grand King sign-off after live proof

### Priority 4 — Production hardening

13. Production persistence for G8 in-memory stores (authorization, credentials, health)
14. Production cron/worker for autonomy heartbeat (MCL `AUTO-001`)
15. OAuth callback routes for provider connect flows (MCL `UX-001`)
16. Promote SCR-303/304 from sandbox to live data modes as credentials connect

### Priority 5 — Version governance (when ready)

17. Grand King review of Pillow version recommendation for **Version 1.1** (minor patches, live deploy fixes)
18. Do **not** begin Version 2.0 or REAL-093 until live commerce proof and explicit version approval

---

## Appendix A — Master Completion Ledger (Business Programmes)

Separate from G0–G8 certification, the MCL tracks **business/revenue completion**:

| Program | Base % | Blocks USD 100K | Next cursor |
|---------|-------:|:-----------------:|-------------|
| foundation | 88 | No | FOUNDATION-001 env vars |
| operational-access | 100 | Yes | REAL-002B live credentials |
| commerce-execution | 72 | Yes | CRT-002 publish path |
| supplier-intelligence | 85 | Yes | SUP-LIVE-001 CJ sync |
| product-intelligence | 62 | No | PI-LIVE-001 Eye Series |
| marketplace-intelligence | 58 | Yes | AMZ-RS-002 Amazon readiness |
| global-expansion | 78 | No | GCI-002 non-US attach |
| live-commerce-intelligence | 82 | Yes | PROOF-001 |
| empire-economics | 85 | Yes | ECON-LIVE-001 |
| proof-of-money | 38 | Yes | PROOF-001 |
| v1-absolute-completion | 98 | Yes | REAL-099 go-live recommendation |
| autonomy-heartbeat | 48 | No | AUTO-001 scheduler |

**Source:** `backend/src/orchestration/master-completion-ledger/models/program-catalog.ts`

---

## Appendix B — Validation & Test Coverage

| Suite | Status | Reference |
|-------|--------|-----------|
| Backend typecheck | ✅ PASS | `npm run typecheck` in `backend/` |
| Frontend typecheck | ✅ PASS | `npm run typecheck` in `empireai-web/` |
| G2 Infrastructure Commerce | ✅ | `g2-*.test.ts` |
| G5 Business Automation | ✅ 106/106 | completion summary |
| G6 Production Certification | ✅ 164/164 | completion summary |
| G7 Live Operations | ✅ 189/189 | completion summary |
| G8 Identity & Authorization | ✅ 192/192 | completion summary |
| Empire V1 Activation | ✅ 6/6 | `empire-v1-activation.test.ts` |
| Empire Version 1 Lock | ✅ 12/12 | `empire-version-1-lock.test.ts` |

---

## Appendix C — Document Certification

| Field | Value |
|-------|-------|
| Document | EmpireAI Version 1 Build & Hierarchy Bible |
| Version baseline | 1.0.0 LOCKED |
| Mission type | Documentation & repository extraction only |
| Code modified | None |
| Generated | 2026-07-03 |
| For | External strategic review |

---

*EmpireAI Version 1.0 — Canonical Build & Hierarchy Bible · Grand King Authorized Baseline*
