# EmpireAI Repository Totality Hierarchy Report

**Generated:** 2026-07-02  
**Authority:** `EMPIREAI_PILLOW_CONSTITUTION.md` §17 · `EMPIREAI_REPOSITORY_MASTER_INDEX.md`  
**Scope:** Full repository structure with parent-child relationships, ownership, canonical status, and Pillow governance reporting  
**Code changes:** None (read-only inventory)

---

## 1. Executive Summary

EmpireAI is organized under a **single technical ownership model**: **Pillow owns every technical subsystem**. The repository implements this through canonical specifications at the root, runtime code under `backend/`, `pillow/`, `frontend/`, and `empireai-web/`, and a large governance/audit corpus.

| Metric | Count (approx.) |
|--------|-----------------|
| Top-level directories | 18 (excl. `node_modules`, `.vercel`, `.empire`) |
| `backend/src` top-level modules | 37 |
| `backend/src/runtime` modules | 103 (mostly **legacy/advisory**) |
| `backend/src/intelligence` G3 engine folders | 10 primary + shared/support |
| `backend/src/registry` files | 12 (EA-003 **canonical**) |
| `backend/src/orchestration/pillow/ekls` files | 9 (**canonical**) |
| `pillow/src` subsystems | 21 |
| `artifacts/` executive audit files | 43 |
| Root `COMBINED_EXECUTIVE_AUDIT_*.md` | 38 |
| `backend/src/validation/tests/*.test.ts` | 198 |

**Normative hierarchy** (all paths report under Pillow governance unless Grand King explicitly exempts a future service):

```
Grand King
    │
EmpireAI (repository root)
    │
Pillow — sole technical owner
    │
    ├── Brain
    ├── EKLS
    ├── Registry System
    ├── Mission System
    ├── Executive Audit System
    ├── Guardian
    ├── Executive AI Engines (G3-01…G3-10)
    ├── Business Engines (7 canonical engines)
    ├── Grand King Cockpit
    └── Future Platform Services
```

---

## 2. Supreme Parent-Child Tree

```
Grand King
└── EmpireAI/                          [repository root · canonical + derived + legacy mixed]
    └── Pillow/                        [technical owner — constitutional + runtime]
        ├── Canonical specifications   [EMPIREAI_PILLOW_*, PILLOW_*, CANONICAL_EKLS_*]
        ├── pillow/                    [@empireai/pillow package · PILLOW-002…019]
        ├── backend/orchestration/     [Pillow host, approval, EKLS, mission-adjacent]
        ├── backend/brain/             [execution kernel · not peer of Pillow]
        ├── backend/registry/          [Registry System · EA-003]
        ├── backend/intelligence/      [Executive AI Engines · G3]
        ├── backend/execution/         [Business Engine implementations · scattered]
        ├── backend/revenue|payments|   [Business Engine · commerce execution]
        │   orders|fulfillment/
        ├── backend/guardian/          [Guardian]
        ├── backend/runtime/           [legacy advisory · EKLS integration backends]
        ├── frontend/ + empireai-web/  [Grand King Cockpit surfaces]
        ├── artifacts/                 [Executive Audit System outputs]
        ├── docs/                      [governance · architecture · EI library]
        ├── JOURNEY*.md                [operational continuity spine]
        └── .cursor/missions/          [Mission System · Cursor dispatch artifacts]
```

---

## 3. Canonical Architecture Files

| Path | Parent | Children / References | Owner | Status | Pillow governance |
|------|--------|----------------------|-------|--------|-------------------|
| `EMPIREAI_PILLOW_CONSTITUTION.md` | EmpireAI | §17 hierarchy; companion: Contract, EKLS, Layer 2 EI constitution | Pillow Architecture | **Canonical** | Yes — supreme technical ownership law |
| `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` | Pillow §17 | §2 hierarchy, §2.1 domain mapping, §3 subsystem defs | Pillow Architecture | **Canonical** (REAL-078) | Yes |
| `CANONICAL_EKLS_SPECIFICATION.md` | Pillow §17 | 28 EKLS subsystems; legacy integration map | Pillow (EKLS) | **Canonical** (permanent) | Yes |
| `PILLOW_ARCHITECTURE_CONTRACT.md` | Pillow Constitution | Parts 1–11; 27 Pillow subsystems incl. EKLS | Pillow Architecture | **Canonical** (PILLOW-001) | Yes |
| `EMPIREAI_PILLOW_ARCHITECTURE.md` | Pillow Constitution | Bootstrap, modes, ADR-047 separation | Pillow Architecture | **Canonical** doctrine | Yes |
| `docs/architecture/DEVELOPMENT_DOCTRINE.md` | Canonical architecture | Engineering rules REAL-079+ | Repository Governance | **Canonical** | Yes |
| `docs/ARCHITECTURE.md` | README | Brain stack diagram | Runtime Engineering | **Derived** (engineering) | Yes |
| `EMPIREAI_ARCHITECTURE.md` | Soul / Journey | Historical architecture narrative | Soul continuity | **Legacy / derived** | Yes |
| `artifacts/g4-01-grand-king-cockpit-architecture.md` | G4 mission | Cockpit IA, engine map, SCR refs | Pillow / Product | **Canonical** (G4-01) | Yes |
| `artifacts/ea-002-canonical-registry-architecture.md` | EA-002 | Registry hierarchy, REG-* IDs | Pillow / Registry | **Canonical** (registry) | Yes |
| `artifacts/constitutional-pillow-hierarchy-executive-audit.md` | Amendment mission | Files reviewed/amended for §17 | Pillow Architecture | **Derived** audit | Yes |
| `artifacts/canonical-ekls-executive-audit.md` | EKLS mission | EKLS delivery verification | Pillow / EKLS | **Derived** audit | Yes |
| `EMPIREAI_REPOSITORY_MASTER_INDEX.md` | Journey spine | Navigation catalog all artifacts | Repository Governance | **Canonical** index | Yes |

---

## 4. Pillow Files

### 4.1 Constitutional & roadmap (repository root)

| Path | Parent | Children | Owner | Status | Pillow governance |
|------|--------|----------|-------|--------|-------------------|
| `EMPIREAI_PILLOW_CONSTITUTION.md` | EmpireAI | §1–§17 | Pillow | **Canonical** | Self |
| `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` | Pillow Constitution | Layer 2 learning chain → EKLS Learning Store | Pillow / EI | **Canonical** Layer 2 | Yes |
| `EMPIREAI_PILLOW_MEMORY_DOCTRINE.md` | Pillow Constitution | Conversation vs knowledge; defers long-term to EKLS | Pillow | **Canonical** BL-B | Yes |
| `PILLOW_ARCHITECTURE_CONTRACT.md` | Pillow Constitution | PILLOW-001…027 inventory | Pillow | **Canonical** | Yes |
| `PILLOW_ROADMAP.md` | Pillow Constitution | 5 layers; Runtime ✅ | Pillow | **Canonical** roadmap | Yes |
| `PILLOW_RUNTIME_INTEGRATION_PLAN.md` | Pillow Roadmap | PILLOW-016…019 archaeology | Pillow | **Legacy** reference | Yes |

### 4.2 Executive intelligence companion docs

| Path | Parent | Status | Pillow governance |
|------|--------|--------|-------------------|
| `docs/executive-intelligence/PILLOW_EXECUTIVE_CONSTITUTION.md` | EIR-002 | **Canonical** EI alignment | Yes |
| `docs/executive-intelligence/PILLOW_EXECUTIVE_MEMORY.md` | EKLS domain | **Derived** (EKLS sub-domain) | Yes |
| `docs/executive-intelligence/PILLOW_EXECUTIVE_ALIGNMENT.md` | EIR-002 | **Derived** | Yes |
| `docs/executive-intelligence/PILLOW_EXECUTIVE_*.md` (KPI, Lessons, Accountability, Research) | EIR-002 | **Derived** doctrines | Yes |
| `docs/executive-intelligence/EI0–EI10_*.md` | Executive Intelligence Library | **Canonical** EI (King-approved) | Yes — Pillow applies, does not own EI amendments |
| `docs/governance/PILLOW_PRODUCT_INTEGRATION_MASTER_PLAN.md` | Pillow Runtime | **Canonical** product integration | Yes |
| `docs/governance/PILLOW_VERSION_1_DELIVERY_MODE.md` | ADR-049 | **Canonical** delivery mode | Yes |

### 4.3 Runtime package (`pillow/`)

| Path | Parent | Children (modules) | Owner | Status | Pillow governance |
|------|--------|-------------------|-------|--------|-------------------|
| `pillow/` | Pillow | `src/` | Pillow Architecture | **Canonical** package | Yes |
| `pillow/src/bootstrap/` | pillow | Repository reader, EmpireBootstrapContext | Pillow | **Canonical** PILLOW-002 | Yes |
| `pillow/src/intelligence/` | pillow | Repository Intelligence (PILLOW-003) | Pillow | **Canonical** | Yes |
| `pillow/src/context/` | pillow | Context Builder PILLOW-004 | Pillow | **Canonical** | Yes |
| `pillow/src/memory/` | pillow | Document Memory → **EKLS backend** | Pillow / EKLS | **Canonical** (legacy store) | Yes |
| `pillow/src/planner/` | pillow | Mission Planner PILLOW-006 | Pillow | **Canonical** | Yes |
| `pillow/src/supervisor/` | pillow | Cursor Supervisor PILLOW-007 | Pillow | **Canonical** | Yes |
| `pillow/src/recovery/` | pillow | Recovery Manager PILLOW-008 | Pillow | **Canonical** | Yes |
| `pillow/src/audit-reviewer/` | pillow | Executive Audit Reviewer PILLOW-009 | Pillow | **Canonical** | Yes |
| `pillow/src/synchronizer/` | pillow | Repository Synchronizer PILLOW-010 | Pillow | **Canonical** | Yes |
| `pillow/src/due-diligence/` | pillow | Continuous Due Diligence PILLOW-011 | Pillow | **Canonical** | Yes |
| `pillow/src/improvement/` | pillow | Autonomous Improvement PILLOW-012 | Pillow | **Canonical** | Yes |
| `pillow/src/orchestrator/` | pillow | EmpireAI Orchestrator PILLOW-013 | Pillow | **Canonical** | Yes |
| `pillow/src/watcher/` | pillow | Live Repository Watcher PILLOW-014 | Pillow | **Canonical** | Yes |
| `pillow/src/command/` | pillow | Grand King Command Interface PILLOW-015 | Pillow | **Canonical** | Yes |
| `pillow/src/openai/` | pillow | Brain LLM adapter (delegates inference) | Pillow / Brain | **Canonical** | Yes |
| `pillow/src/objective/` | pillow | Objective Engine PILLOW-019 | Pillow | **Canonical** | Yes |
| `pillow/src/executive-perspectives/` | pillow | Seven perspectives §15 | Pillow | **Canonical** | Yes |
| `pillow/src/executive-council/` | pillow | Companion-scoped council | Pillow | **Canonical** | Yes |
| `pillow/src/learning/` | pillow | Executive learning pipeline | Pillow / EKLS | **Derived** → EKLS Learning Store | Yes |

### 4.4 Backend Pillow host & orchestration

| Path | Parent | Children | Owner | Status | Pillow governance |
|------|--------|----------|-------|--------|-------------------|
| `backend/src/orchestration/pillow-host/` | Pillow → Brain | `/api/pillow/*`, session store, Brain LLM adapter | Pillow | **Canonical** PILLOW-016 | Yes |
| `backend/src/orchestration/pillow-approval/` | Pillow | Approval queue, Cursor heartbeat | Pillow | **Canonical** PILLOW-017 | Yes |
| `backend/src/orchestration/pillow-executive-council/` | Pillow | Brain-hosted council routes | Pillow | **Derived** runtime | Yes |
| `backend/src/orchestration/executive-learning/` | Pillow → EKLS | GK-approved learnings, pending candidates | Pillow / EKLS | **Legacy backend** (EKLS-governed) | Yes |
| `backend/src/orchestration/objective-management-engine/` | Pillow → Mission | Objective persistence, routes | Pillow | **Canonical** mission-adjacent | Yes |
| `backend/src/orchestration/commerce-readiness-engine/` | Pillow | CRIR certification (CRI) | Pillow / Governance | **Canonical** | Yes |
| `frontend/src/components/pillow/` | Cockpit → Pillow | Chat UI, companion embed | Pillow | **Canonical** UI | Yes (visualises) |

---

## 5. EKLS Files

| Path | Parent | Children | Owner | Status | Pillow governance |
|------|--------|----------|-------|--------|-------------------|
| `CANONICAL_EKLS_SPECIFICATION.md` | Pillow §17 | 28 subsystems, lifecycles, integration rules | Pillow (EKLS) | **Canonical** (sole EKLS spec) | Yes — gateway required |
| `backend/src/orchestration/pillow/ekls/index.ts` | EKLS | Public exports | Pillow | **Canonical** implementation | Yes |
| `ekls/contracts/knowledge-object-standard.ts` | ekls | `EklsKnowledgeObject`, `ekls-v1` schema | Pillow | **Canonical** | Yes |
| `ekls/contracts/lifecycles.ts` | ekls | 6 lifecycle domains | Pillow | **Canonical** | Yes |
| `ekls/contracts/subsystem-registry.ts` | ekls | 28 subsystem IDs + feature catalog | Pillow | **Canonical** | Yes |
| `ekls/policies/ownership-policy.ts` | ekls | Pillow-only ownership | Pillow | **Canonical** | Yes |
| `ekls/policies/workspace-isolation-policy.ts` | ekls | Cross-workspace rules | Pillow | **Canonical** | Yes |
| `ekls/storage/store-registry.ts` | ekls | Subsystem → legacy backend map | Pillow | **Canonical** | Yes |
| `ekls/services/ekls-governance-gateway.ts` | ekls | `pillowGovernance: true` gate | Pillow | **Canonical** | Yes |
| `ekls/services/ekls-unified-service.ts` | ekls | 5 consumer channels, schedule manifest | Pillow | **Canonical** | Yes |
| `backend/src/validation/tests/canonical-ekls.test.ts` | validation | 7 EKLS tests | Pillow | **Derived** verification | Yes |

### EKLS legacy integration backends (Pillow-governed, not competing specs)

| EKLS subsystem | Integration path | Status |
|----------------|------------------|--------|
| Learning Store | `backend/src/orchestration/executive-learning/` | **Legacy live** |
| Knowledge Store / Graph | `backend/src/runtime/empire-knowledge/` | **Legacy live** |
| Document Memory | `pillow/src/memory/` | **Legacy live** |
| Observation Store | executive-learning + empire-knowledge records | **Partial** |
| Audit Memory | `artifacts/` (referenced) | **Derived** |
| Feature / Model / Vector stores | EKLS registry only | **Architecture** |

---

## 6. Brain Files

| Path | Parent | Children | Owner | Status | Pillow governance |
|------|--------|----------|-------|--------|-------------------|
| `backend/src/brain/` | Pillow §17 | orchestrator, agents, workflows, LLM, memory, DB | Pillow (Brain) | **Canonical** execution kernel | Yes — not peer of Pillow |
| `brain/orchestrator.ts` | brain | Dispatch routing | Pillow / Brain | **Canonical** | Yes |
| `brain/agent-manager.ts` | brain | Agent lifecycle | Pillow / Brain | **Canonical** | Yes |
| `brain/workflow-engine.ts` | brain | Workflow execution | Pillow / Brain | **Canonical** | Yes |
| `brain/task-queue.ts` + `workers/` | brain | BullMQ workers | Pillow / Brain | **Canonical** | Yes |
| `brain/tools/tool-registry.ts` | brain | Module tools | Pillow / Brain | **Canonical** | Yes |
| `brain/llm/llm-router.ts` | brain | Anthropic, OpenAI, Gemini providers | Pillow / Brain | **Canonical** | Yes |
| `brain/guardian/` (integration) | brain | Pre-dispatch checks via `backend/src/guardian/` | Pillow / Guardian | **Canonical** | Yes |
| `brain/memory/memory-store.ts` | brain | **Ephemeral session memory** (not EKLS owner) | Pillow / Brain | **Derived** session scope | Yes — long-term via EKLS |
| `brain/contract/module-ids.ts` | brain | G3 module IDs, capabilities | Pillow / Brain | **Canonical** registry | Yes |
| `backend/src/agents/` | Brain | Definitions, routes, tools, workflows | Pillow / Brain | **Canonical** AI Workforce | Yes |
| `backend/src/auth/` | Brain | Sessions, permissions | Pillow / Brain | **Canonical** | Yes |
| `EMPIREAI_CONSTITUTION.md` Art. I | EmpireAI | Brain sovereignty (execution path) | Engineering law | **Canonical** (superseded commercially by CTD) | Yes — footnote §17 |

---

## 7. Registry System Files

| Path | Parent | Children | Owner | Status | Pillow governance |
|------|--------|----------|-------|--------|-------------------|
| `artifacts/ea-002-canonical-registry-architecture.md` | EA-002 | REG-* hierarchy, tiers, ownership table | Pillow / Registry | **Canonical** architecture | Yes |
| `artifacts/ea-003-registry-loader-foundation-executive-audit.md` | EA-003 | Loader delivery audit | Pillow / Registry | **Derived** audit | Yes |
| `artifacts/ea-004-registry-migration-standard.md` | EA-004 | Migration rules | Pillow / Registry | **Canonical** standard | Yes |
| `artifacts/ea-005-plugin-framework.md` | EA-005 | Plugin registration | Pillow / Registry | **Canonical** (architecture) | Yes |
| `artifacts/ea-006-dynamic-capability-discovery.md` | EA-006 | Discovery capability | Pillow / Registry | **Derived** | Yes |
| `artifacts/ea-007-architecture-certification.md` | EA-007 | Certification | Pillow / Registry | **Derived** audit | Yes |
| `backend/src/registry/index.ts` | Registry System | Public API | Pillow | **Canonical** EA-003 | Yes |
| `registry/registry-loader.ts` | registry | `RegistryLoader`, `getRegistryLoader()` | Pillow | **Canonical** | Yes |
| `registry/types/registry-ids.ts` | registry | REG-DOCTRINE, REG-COUNTRY, REG-MARKETPLACE, … | Pillow | **Canonical** | Yes |
| `registry/types/registry-types.ts` | registry | Resolve/derived contracts | Pillow | **Canonical** | Yes |
| `registry/sources/constitutional-source.ts` | registry | REG-DOCTRINE loader | Pillow | **Canonical** wired | Yes |
| `registry/sources/platform-catalog-source.ts` | registry | Countries, marketplaces, suppliers | Pillow | **Canonical** wired | Yes |
| `registry/sources/deployment-source.ts` | registry | REG-CHANNEL, deployment profiles | Pillow | **Canonical** wired | Yes |
| `registry/sources/placeholder-source.ts` | registry | Unwired registry placeholders | Pillow | **Derived** | Yes |
| `registry/derived/discovery-view.ts` | registry | DERIVED-DISCOVERY-SNAPSHOT | Pillow | **Canonical** derived | Yes |
| `registry/cache/registry-cache.ts` | registry | TTL cache policies | Pillow | **Canonical** | Yes |
| `backend/src/runtime/global-commerce/models/global-registry.ts` | runtime | **Legacy seed data** (migrating to RegistryLoader) | Pillow | **Legacy** — consumed via registry | Yes |
| `docs/governance/V1_MARKETPLACE_CHANNEL_REGISTRY.md` | governance | V1 channel doctrine | Pillow / Registry | **Canonical** V1 | Yes |
| `backend/src/validation/tests/ea-003-registry-loader-foundation.test.ts` | validation | 12 EA-003 tests | Pillow | **Derived** | Yes |

---

## 8. Executive AI Engine Files (G3 Suite)

All engines: **Parent** = Pillow → Executive AI Engines · **Owner** = Pillow · **Pillow governance** = Yes · **Status** = **Canonical** (G3-01…G3-10 complete)

| Engine | Mission | Architecture path | Views / wiring | Cockpit route (empireai-web) | Test |
|--------|---------|-------------------|----------------|------------------------------|------|
| Product Intelligence | G3-01 | `intelligence/product-intelligence-engine/` | `domain/services/product-intelligence-engine-views.ts` | `/cockpit/intelligence/products` | `g3-01-*.test.ts` |
| Market Intelligence | G3-02 | `intelligence/market-intelligence-engine/` | `market-intelligence-engine-views.ts` | `/cockpit/intelligence/markets` | `g3-02-*.test.ts` |
| Supplier Intelligence | G3-03 | `intelligence/supplier-intelligence-engine/` | `supplier-intelligence-engine-views.ts` | `/cockpit/intelligence/suppliers` | `g3-03-*.test.ts` |
| Financial Intelligence | G3-04 | `intelligence/financial-intelligence-engine/` | `financial-intelligence-engine-views.ts` | `/cockpit/finance/intelligence` | `g3-04-*.test.ts` |
| Quantitative Intelligence | G3-05 | `intelligence/quantitative-intelligence-engine/` | `quantitative-intelligence-engine-views.ts` | (engine center) | `g3-05-*.test.ts` |
| Advertising Intelligence | G3-06 | `intelligence/advertising-intelligence-engine/` | `advertising-intelligence-engine-views.ts` | `/cockpit/commerce/ad-intelligence` | `g3-06-*.test.ts` |
| Customer Intelligence | G3-07 | `intelligence/customer-intelligence-engine/` | `customer-intelligence-engine-views.ts` | `/cockpit/intelligence/customers` | `g3-07-*.test.ts` |
| Risk Intelligence | G3-08 | `intelligence/risk-intelligence-engine/` | `risk-intelligence-engine-views.ts` | `/cockpit/intelligence/risk` | `g3-08-*.test.ts` |
| Decision Intelligence | G3-09 | `intelligence/decision-intelligence-engine/` | `decision-intelligence-engine-views.ts` | `/cockpit/intelligence/decisions` | `g3-09-*.test.ts` |
| Executive Intelligence Orchestrator | G3-10 | `intelligence/executive-intelligence-orchestrator/` | `executive-intelligence-orchestrator-views.ts` | `/cockpit/intelligence/executive` | `g3-10-*.test.ts` |

### Shared intelligence infrastructure

| Path | Parent | Status | Notes |
|------|--------|--------|-------|
| `intelligence/shared/intelligence-market-discovery.ts` | G3 shared | **Canonical** | EA-003 RegistryLoader consumer |
| `intelligence/shared/marketplace-channel-registry.ts` | G3 shared | **Derived** | Deployment channel profiles |
| `intelligence/product-scoring-engine/` | G3 support | **Legacy** support | PIE scoring pipeline |
| `intelligence/commerce-intelligence-core/` | G3 support | **Legacy** CIC | Pre-G3 commerce intel |
| `intelligence/buyer-intelligence/` | G3 support | **Derived** | Buyer personas |
| `intelligence/connectors/` | G3 support | **Canonical** boundary | External signal connectors |
| `backend/src/eye/` | Intelligence | **Legacy** Eye Series | Amazon/Trends connectors |
| `artifacts/g3-*-executive-audit.md` (11 files) | G3 missions | **Derived** audits | Mission completion evidence |

---

## 9. Business Engine Files

Canonical Business Engines (Pillow §17) map to **scattered implementation folders** — consolidation under a single `business-engines/` namespace is a **future REAL target**, not current layout.

| Canonical engine | Primary implementation paths | Parent | Status | Pillow governance |
|------------------|------------------------------|--------|--------|-------------------|
| **Marketplace Engine** | `orchestration/marketplace-infrastructure-engine/`, `orchestration/marketplace-connection-engine/`, `runtime/global-commerce/`, `runtime/amazon-global-seller/`, `runtime/marketplace-publishing/` | Pillow → Business Engines | **Partial canonical** + legacy runtime | Yes |
| **Supplier Engine** | `suppliers/`, `supplier-intelligence/`, `execution/live-cj-fulfillment/`, `intelligence/supplier-intelligence-engine/` (intel overlap) | Pillow → Business Engines | **Partial** | Yes |
| **Storefront Engine** | `execution/store-blueprint/`, `storefront-*`, `store-page-generation/`, `production-store-deployment/`, `agents/store` | Pillow → Business Engines | **Partial** | Yes |
| **Advertising Engine** | `execution/meta-ads-connector/`, `execution/marketing-campaign-*`, `execution/ad-creative-generation/` | Pillow → Business Engines | **Partial** | Yes |
| **Payment Engine** | `payments/`, `revenue/live-payment-engine/`, `revenue/minimum-live-revenue-loop/` | Pillow → Business Engines | **Partial live** | Yes |
| **Logistics Engine** | `fulfillment/`, `orders/`, `execution/live-cj-fulfillment/` | Pillow → Business Engines | **Partial** | Yes |
| **Analytics Engine** | `execution/analytics-*`, `reporting/`, `runtime/commerce-intelligence-studio/` | Pillow → Business Engines | **Partial** | Yes |

### Business execution layer (`backend/src/execution/` — 44+ modules)

**Parent:** Pillow → Business Engines (conceptually) · **Status:** **Legacy / derived** execution modules awaiting namespace consolidation · **Pillow governance:** Yes

Representative children: `autonomous-company-manufacturing-loop`, `product-publishing-engine`, `production-store-deployment`, `meta-ads-connector`, `live-cj-fulfillment`, `storefront-assembly`, `pricing-intelligence`, `analytics-conversion-engine`, …

### Commerce orchestration (Pillow-owned)

| Path | Role | Status |
|------|------|--------|
| `orchestration/ecommerce-os-orchestrator/` | End-to-end commerce workflow | **Canonical** orchestration |
| `orchestration/reality-integration/` | Live connector vault, OAuth | **Canonical** integration |
| `orchestration/business-build-engine/` | Company manufacturing | **Derived** |
| `orchestration/business-preview-studio/` | Preview surfaces | **Derived** |
| `grand-king/`, `grand-king-revenue-pipeline/` | Revenue automation | **Partial live** |

---

## 10. Grand King Cockpit Files

| Path | Parent | Children | Owner | Status | Pillow governance |
|------|--------|----------|-------|--------|-------------------|
| `artifacts/g4-01-grand-king-cockpit-architecture.md` | G4-01 | SCR map, 9 departments, engine centers | Pillow / Cockpit | **Canonical** spec | Yes — visualises only |
| `docs/architecture/PROJECT_COCKPIT_SPECIFICATION.md` | REAL-078 | Department → module mapping | Pillow / Product | **Canonical** | Yes |
| `docs/architecture/cockpit/*.md` (7 files) | Cockpit | IA, screen map, migration, user flow | Pillow / Product | **Derived** specs | Yes |
| `empireai-web/app/(cockpit)/cockpit/` | Cockpit | 40+ route pages (departments) | Pillow / Cockpit | **Canonical** primary shell | Yes |
| `empireai-web/components/cockpit/` | Cockpit | Shell, widgets, panels, GAA drawer | Pillow / Cockpit | **Canonical** UI (83 files) | Yes |
| `frontend/src/pages/dashboard/` | Cockpit (legacy depth) | Mission Home, Pillow Chat, Command Center | Pillow / Cockpit | **Derived** founder UX | Yes |
| `backend/src/domain/services/cockpit-panel-views.ts` | Cockpit → Brain | G3/G4 panel loaders | Pillow / Cockpit | **Canonical** wiring | Yes |
| `backend/src/domain/services/cockpit-interaction-layer.ts` | Cockpit | G4-07 AI interaction bridge | Pillow / Cockpit | **Canonical** | Yes |
| `backend/src/domain/services/cockpit-global-assistant.ts` | Cockpit | GC-05 Global AI Assistant | Pillow / Cockpit | **Canonical** | Yes |
| `backend/src/domain/services/engine-center-views.ts` | Cockpit | Engine center aggregation | Pillow / Cockpit | **Derived** | Yes |
| `backend/src/global-assistant/` | Cockpit channel | GAA backend module | Pillow / Cockpit | **Partial** | Yes |
| `artifacts/g4-02` … `g4-10` executive audits | G4 missions | Cockpit wiring audits | Pillow | **Derived** | Yes |

**Cockpit rule:** Never source of truth for knowledge or configuration — consumes Brain dispatch + EKLS visualisation under Pillow governance.

---

## 11. Mission System & Executive Audit System

### Mission System

| Path | Parent | Children | Owner | Status | Pillow governance |
|------|--------|----------|-------|--------|-------------------|
| `.cursor/missions/` | Pillow → Mission System | `pending/` (e.g. PILLOW-017.md) | Pillow / Cursor bridge | **Canonical** dispatch surface | Yes — GK approval required |
| `pillow/src/planner/` | Pillow | Mission Planner PILLOW-006 | Pillow | **Canonical** | Yes |
| `backend/src/orchestration/objective-management-engine/` | Pillow | Objective persistence, single-objective rule | Pillow | **Canonical** PILLOW-019 backend | Yes |
| `backend/src/orchestration/master-completion-ledger/` | Pillow | Completion tracking | Pillow | **Derived** | Yes |
| `backend/src/runtime/mission-command-engine/` | runtime | Advisory mission dashboard | Pillow | **Legacy** runtime | Yes |
| `EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md` | Pillow Constitution | CAGW steps | Pillow | **Canonical** | Yes |
| `JOURNEY.md` | Continuity spine | Operational mission index REAL/UX/PILLOW | Journey | **Canonical** living index | Yes |

### Executive Audit System

| Path | Parent | Children | Owner | Status | Pillow governance |
|------|--------|----------|-------|--------|-------------------|
| `EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md` | Pillow / Governance | Audit format law | Repository Governance | **Canonical** | Yes |
| `artifacts/` | Pillow → Executive Audit | 43 mission audits (G3, G4, B6, EA, EKLS, constitutional) | Pillow | **Derived** audit corpus | Yes — EKLS Audit Memory refs |
| `COMBINED_EXECUTIVE_AUDIT_*.md` (38 root files) | Executive Audit | Batch audits REAL, UX, GC, CTD, Pillow | Repository Governance | **Derived** combined audits | Yes |
| `docs/governance/EXECUTIVE_AUDIT_INDEX.md` | governance | Audit navigation | Repository Governance | **Canonical** index | Yes |
| `pillow/src/audit-reviewer/` | Pillow | PILLOW-009 quality gate | Pillow | **Canonical** | Yes |
| `pillow/src/master-audit/` | Pillow | Master audit composition | Pillow | **Canonical** | Yes |

---

## 12. Guardian

| Path | Parent | Children | Owner | Status | Pillow governance |
|------|--------|----------|-------|--------|-------------------|
| `backend/src/guardian/` | Pillow §17 | engine, action-guard, health-monitor, recovery-planner, risk-registry | Pillow (Guardian) | **Canonical** | Yes — contributes EKLS memory, does not govern it |
| `guardian/guardian-engine.ts` | guardian | Pre-dispatch assessment | Pillow / Guardian | **Canonical** | Yes |
| `guardian/database-guardian.ts` | guardian | Integrity checks | Pillow / Guardian | **Canonical** | Yes |
| `backend/src/validation/tests/guardian.test.ts` | validation | Guardian tests | Pillow | **Derived** | Yes |

---

## 13. Governance, ADR, Roadmap & Continuity Spine

### Continuity spine (canonical navigation)

| Path | Parent | Status | Pillow governance |
|------|--------|--------|-------------------|
| `JOURNEY.md` | EmpireAI | **Canonical** operational index | Yes |
| `JOURNEY_AUDIT.md` | Journey | **Canonical** change log | Yes |
| `EMPIREAI_SOUL.md` | EmpireAI | **Canonical** identity | Yes |
| `EMPIREAI_STATUS.md` | EmpireAI | **Canonical** project state | Yes |
| `EMPIREAI_DECISIONS.md` | EmpireAI | **Canonical** ADR register | Yes |
| `EMPIREAI_ROADMAP.md` | Vision | **Canonical** direction | Yes |
| `EMPIREAI_REPOSITORY_MASTER_INDEX.md` | Governance | **Canonical** master catalog | Yes |

### Governance doctrines (root + docs/governance)

| Path | Domain | Status | Pillow governance |
|------|--------|--------|-------------------|
| `EMPIREAI_CORE_CONSTITUTION_CTD.md` | Commercial CTD-001…040 | **Canonical** commercial law | Yes (Grand King) |
| `EMPIREAI_GOVERNANCE_DOCTRINE_GVD.md` | GVD | **Canonical** | Yes |
| `EMPIREAI_COMMERCE_CANON.md` | Commerce | **Canonical** | Yes |
| `EMPIREAI_COMMERCIAL_BUSINESS_DOCTRINE_CBD.md` | CBD | **Canonical** | Yes |
| `EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md` | BL-C | **Canonical** | Yes |
| `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md` | CRI ADR-051 | **Canonical** | Yes |
| `docs/governance/VERSION_1_CERTIFICATION_*.md` | V1 cert | **Canonical** | Yes |
| `docs/governance/EXECUTIVE_UX_LAYER_ARCHITECTURE.md` | ADR-047 GC layers | **Canonical** | Yes |
| `docs/governance/ADR-044-REAL-NAMESPACE-CANONICALIZATION.md` | REAL namespace | **Canonical** ADR | Yes |
| `GO-001_*.md`, `GO-002_*.md` | Grand King ops | **Derived** operational plans | Yes |
| `SA-001_*.md` | Supreme audit | **Derived** historical audit | Yes (pre-§17 stack language) |

### Roadmaps

| Path | Parent | Status |
|------|--------|--------|
| `EMPIREAI_ROADMAP.md` | Vision | **Canonical** |
| `PILLOW_ROADMAP.md` | Pillow | **Canonical** |
| `docs/executive-intelligence/EXECUTIVE_INTELLIGENCE_ROADMAP_v1.md` | EI Library | **Canonical** EI |

---

## 14. Future Platform Services & Legacy Tier

| Path | Parent | Status | Pillow governance |
|------|--------|--------|-------------------|
| `deployment/` | Pillow → Future Platform Services | **Canonical** V1 deploy guides | Yes |
| `backend/src/config/`, `observability/`, `cost/`, `retention/` | Infrastructure | **Canonical** cross-cutting | Yes |
| `backend/src/foundation/` (15 subsystems) | Pillow governance artifacts | **Canonical** governance runtime | Yes |
| `backend/src/runtime/` (103 modules) | Pillow (advisory tier) | **Legacy** Tier B/C dashboards | Yes — collapse target per REAL-078 |
| `backend/src/connectors/` | Integration boundary | **Canonical** connector catalog | Yes |
| `empireai-web/` (non-cockpit) | Platform modules | **Secondary** UI / BFF | Yes |
| `ai-agents/` | Documentation only | **Derived** docs; agents live in `backend/src/agents/` | Yes |
| `automation/`, `database/`, `marketing/`, `tests/` | Supporting | **Derived** / ops | Yes |

---

## 15. Status Legend

| Label | Meaning |
|-------|---------|
| **Canonical** | Single source of truth; amend in place; Pillow-governed |
| **Derived** | Generated from canonical sources (views, audits, indexes, tests) |
| **Legacy** | Pre-consolidation implementation; still live but mapped to canonical owner |
| **Architecture** | Spec/registry only; runtime not fully wired |
| **Placeholder** | RegistryLoader unwired tier (REG-SCORING-POLICY, etc.) |

---

## 16. Pillow Governance Reporting Matrix

| Subsystem | Reports under Pillow? | Gateway / enforcement |
|-----------|-------------------------|------------------------|
| Brain | Yes (owned, not peer) | Dispatch-only execution |
| EKLS | Yes | `ekls-governance-gateway.ts` — `pillowGovernance: true` |
| Registry | Yes | RegistryLoader; no direct catalog imports in G3 |
| Executive AI Engines | Yes | Brain module routes; registry-driven discovery |
| Business Engines | Yes | Brain tools; connector boundary |
| Cockpit | Yes | Visualise-only; `cockpit-panel-views.ts` |
| Guardian | Yes | Pre-dispatch; contributes EKLS observations |
| Mission System | Yes | Approval gate + CAGW |
| Executive Audit | Yes | `artifacts/` referenced by EKLS Audit Memory |
| Executive Intelligence Library | Yes (Pillow applies) | King amends EI; Pillow never self-amends |
| Foundation / CTD / GVD | Yes (Grand King authority) | Governance assess before autonomous actions |
| Legacy runtime (103 modules) | Yes | Tier C collapse; no new modules without Cockpit binding |

---

## 17. Key Parent-Child Relationships Summary

```
EMPIREAI_PILLOW_CONSTITUTION.md §17
├── CANONICAL_EKLS_SPECIFICATION.md
├── PILLOW_ARCHITECTURE_CONTRACT.md
├── docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md
├── pillow/ → backend/orchestration/pillow-host/ (Brain routes)
├── backend/orchestration/pillow/ekls/
│   ├── executive-learning/ (Learning Store backend)
│   ├── runtime/empire-knowledge/ (Knowledge Store backend)
│   └── pillow/src/memory/ (Document Memory backend)
├── backend/registry/ (Registry System)
├── backend/intelligence/* (G3 Executive AI Engines)
│   └── domain/services/*-views.ts → cockpit-panel-views.ts
├── backend/brain/ + backend/agents/ (Brain)
├── backend/guardian/ (Guardian)
├── backend/execution/ + revenue/ + payments/ (Business Engines — legacy layout)
├── empireai-web/components/cockpit/ + app/(cockpit)/ (Grand King Cockpit)
├── artifacts/ + COMBINED_EXECUTIVE_AUDIT_* (Executive Audit System)
├── JOURNEY.md + EMPIREAI_REPOSITORY_MASTER_INDEX.md (navigation spine)
└── .cursor/missions/ (Mission System)
```

---

## 18. Observations

1. **Single ownership authority** is documented in `EMPIREAI_PILLOW_CONSTITUTION.md` §17; implementation layout still uses historical folder names (`runtime/`, `execution/`, `intelligence/`).
2. **G3 Executive AI Engines** are the most structurally complete Pillow subsystem (architecture + views + cockpit + tests + audits).
3. **Business Engines** are canonically named but **not** yet consolidated into seven top-level folders.
4. **103 runtime modules** are the largest **legacy** surface — advisory Tier B/C per REAL-078.
5. **EKLS** has canonical spec + gateway but many of 28 subsystems remain **architecture/partial** data modes.
6. **Two Cockpit surfaces** coexist: `empireai-web` (primary G4 shell) and `frontend/` (founder depth UX) — both Pillow-owned presentation layers.

---

*Repository Totality Hierarchy Report · generated read-only · 2026-07-02 · Pillow Architecture · Grand King Authority*
