# Cockpit Implementation Roadmap

**Mission:** REAL-080  
**Authority:** Grand King Executive Directive  
**Status:** Executable engineering plan (no code in this mission)  
**Version:** 1.0  
**Prerequisites:** REAL-076, REAL-077, REAL-078, REAL-079  

---

## 1. Purpose

Convert REAL-079 Cockpit specification into phased REAL missions (REAL-081+). This document defines **what** gets built, **when**, and **where** — not the implementation itself.

**Implementation host (canonical):** `empireai-web` extended with `app/(cockpit)/` route group.  
**Migration source:** `frontend/` (Vite) pages and components ported or wrapped incrementally.

---

## 2. Implementation Phases

| Phase | ID | Goal | REAL missions (planned) | Exit criteria |
|-------|-----|------|-------------------------|---------------|
| **Foundation** | P0 | Cockpit shell + nav + auth gate | REAL-081–083 | `/cockpit` loads; sidebar matches canonical tree; session validated |
| **Command core** | P0 | Home + Command + Missions | REAL-084–086 | Grand King daily workflow possible (read + approve) |
| **Shared UI** | P0 | Widget library + data mode | REAL-087–088 | KPI/widget registry; Live/Demo/Sandbox badges |
| **Commerce dept** | P1 | Store, orders, marketing, ads | REAL-089–093 | 12 platform modules under `/cockpit/commerce/*` |
| **Intelligence dept** | P1 | Products, suppliers, discovery | REAL-094–097 | Intelligence tabs wired; frontend discovery merged |
| **Operations dept** | P1 | Orders, fulfillment, support | REAL-098–100 | Fulfillment panel live-mode ready |
| **Finance dept** | P1 | Profit, P&L, billing, costs | REAL-101–104 | frontend ProfitPage merged |
| **Infrastructure dept** | P1 | Integrations, deploy, health, admin | REAL-105–108 | IntegrationsHub merged; admin real metrics path |
| **Governance dept** | P2 | Settings, soul, council, V1 | REAL-109–113 | Success-001 + settings save wired |
| **AI Workforce dept** | P2 | Roster, activity, audit | REAL-114–116 | AiTeamPage merged; brain/agents exposed |
| **Development dept** | P2 | Pillow, approvals, ESIS | REAL-117–120 | Pillow drawer + approvals in Cockpit shell |
| **Overlays** | P2 | Notifications, approval bar, Pillow FAB | REAL-121–123 | Global chrome complete |
| **Consolidation** | P3 | Deprecate dual frontend | REAL-124–126 | `frontend/` dashboard routes redirect to `/cockpit/*` |
| **Production hardening** | P3 | Placeholder replacement | REAL-127–135 | Live data; connectors; no sandbox in prod |

---

## 3. Screen Mapping Matrix

Legend: **R** = reuse/port, **A** = adapt, **N** = net new, **M** = merge two sources

| SCR | Canonical route | frontend/ page | empireai-web/ page | Reusable components | Missing |
|-----|-----------------|----------------|--------------------|---------------------|---------|
| SCR-001 | `/cockpit` | MissionHomePage (partial) | — | MetricCard, HealthGrid, MissionBriefPanel | Executive Home layout, dept health row, mission preview |
| SCR-010 | `/cockpit/command` | EmpireCommandCenterPage | dashboard + AiCeoModule | FounderDashboardModule, AiCeoModule, ExecutiveKpiCard, ExecutiveTable | Unified command layout, export |
| SCR-020 | `/cockpit/missions` | ApprovalsPage (partial) | — | GlobalApprovalBar, ApprovalPanel | Unified mission aggregator API hook |
| SCR-100 | `/cockpit/intelligence/products` | IntelligencePage | IntelligenceModule | BrainModuleShell, StatCard, DataTable | Category picker for scan |
| SCR-101 | `/cockpit/intelligence/suppliers` | SuppliersPage | SuppliersModule | SuppliersModule | SIE evaluate UI |
| SCR-102 | `/cockpit/intelligence/discovery` | ProductDiscoveryPage | — | EmpirePageShell | Port discovery API hooks |
| SCR-103 | `/cockpit/intelligence/marketplace` | MarketplaceIntelligencePage | — | empire panels | Port REST hooks |
| SCR-200 | `/cockpit/commerce/store` | — | StoreBuilderModule | store-builder/* (orphaned) | Mount preview panels; run_pipeline |
| SCR-201 | `/cockpit/commerce/launch` | LaunchCenterPage | — | MissionPanel | Launch timeline widget |
| SCR-202 | `/cockpit/commerce/marketing` | — | MarketingAiModule | MarketingAiModule | Wire generate campaign |
| SCR-203 | `/cockpit/commerce/ads` | AdsPage | AdManagerModule | AdManagerModule | Wire budget actions |
| SCR-204 | `/cockpit/commerce/workspace` | BusinessWorkspacePage, BusinessDetailPage, BusinessPreviewPage | — | ExecutiveTable | Port business API |
| SCR-300 | `/cockpit/operations/orders` | OrdersPage | OrdersModule + FulfillmentReadinessPanel | OrdersModule, FulfillmentReadinessPanel | Live fulfillment path |
| SCR-301 | `/cockpit/operations/fulfillment` | — | FulfillmentReadinessPanel | FulfillmentReadinessPanel | Dedicated fulfillment list (CJ) |
| SCR-302 | `/cockpit/operations/support` | — | SupportModule | SupportModule | Wire resolve |
| SCR-400 | `/cockpit/finance/profit` | ProfitPage, OperatingCostPage (split) | FinanceModule | OperatingCostPanel, FinanceModule | Profit trend chart |
| SCR-401 | `/cockpit/finance/pl` | — | FinanceModule | FinanceModule | Download P&L action |
| SCR-402 | `/cockpit/finance/billing` | BillingPage | — | — | Port billing API |
| SCR-403 | `/cockpit/finance/costs` | OperatingCostPage | — | OperatingCostPanel | Tab extract |
| SCR-500 | `/cockpit/workforce` | AiTeamPage | — | ExecutiveKpiCard | Agent roster grid (12 cards) |
| SCR-501 | `/cockpit/workforce/activity` | — | PlatformTopBar SSE | SSE hook | Full-page activity view |
| SCR-502 | `/cockpit/workforce/audit` | — | — | ExecutiveTable | brain/audit client |
| SCR-600 | `/cockpit/infrastructure/integrations` | IntegrationsHubPage | — | — | Port integrations-hub API |
| SCR-601 | `/cockpit/infrastructure/deployments` | — | — | — | production-deploy list UI |
| SCR-602 | `/cockpit/infrastructure/health` | InfrastructurePage | — | HealthGrid | Guardian health merge |
| SCR-603 | `/cockpit/infrastructure/admin` | — | AdminModule | AdminModule | Real metrics backend |
| SCR-700 | `/cockpit/governance/settings` | SettingsPage | SettingsModule | SettingsModule | Save/password/2FA |
| SCR-701 | `/cockpit/governance/soul` | SoulDecisionChamberPage | — | empire panels | Port soul chamber |
| SCR-702 | `/cockpit/governance/decisions` | KingDecisionHistoryPage | — | ExecutiveTable | Port history API |
| SCR-703 | `/cockpit/governance/council` | ExecutiveDebatePage | — | ExecutiveVisualDebatePanel | Port council API |
| SCR-704 | `/cockpit/governance/v1` | Success001CommandCenterPage | — | Version1CompletionPanel, GlobalSuccess001BlockerBar | Port success-001 |
| SCR-800 | `/cockpit/development/pillow` | PillowChatPage | — | PillowCompanionPanel, PillowMissionCenter | Cockpit drawer integration |
| SCR-801 | `/cockpit/development/approvals` | ApprovalsPage | — | ApprovalPanel, GlobalApprovalBar | Merge into Mission Centre |
| SCR-802 | `/cockpit/development/inspection` | — | — | — | ESIS dashboard port |
| SCR-803 | `/cockpit/development/learning` | ExecutiveLearningReviewPage | — | — | Port learning API |

---

## 4. Reusable Component Inventory

### 4.1 From empireai-web (port to `cockpit/ui/`)

| Component | Path | Reuse for |
|-----------|------|-----------|
| PlatformShell | `shell/PlatformShell.tsx` | CockpitShell base |
| PlatformSidebar | `shell/PlatformSidebar.tsx` | Adapt → CockpitSidebar |
| PlatformTopBar | `shell/PlatformTopBar.tsx` | Adapt → CockpitTopBar |
| PlatformMobileNav | `shell/PlatformMobileNav.tsx` | Adapt → CockpitMobileNav |
| PlatformPrimitives | `ui/PlatformPrimitives.tsx` | StatCard, DataTable, Panel, ActionButton |
| BrainModuleShell | `brain/BrainModuleShell.tsx` | All dispatch modules |
| *Module.tsx (12) | `modules/*` | Department panels |

### 4.2 From frontend (port to `cockpit/ui/` or `cockpit/widgets/`)

| Component | Path | Reuse for |
|-----------|------|-----------|
| ExecutiveKpiCard | `system/ExecutiveKpiCard.tsx` | KPI strip |
| ExecutiveTable | `system/ExecutiveTable.tsx` | Portfolio, missions, audit |
| ExecutiveHeader | `system/ExecutiveHeader.tsx` | Department headers |
| GlobalApprovalBar | `system/GlobalApprovalBar.tsx` | Approval bar overlay |
| GlobalSuccess001BlockerBar | `system/GlobalSuccess001BlockerBar.tsx` | V1 strip |
| NotificationsCenter | `system/NotificationsCenter.tsx` | Notification drawer |
| PillowCompanionPanel | `pillow/PillowCompanionPanel.tsx` | Pillow drawer |
| OperatingCostPanel | `empire/OperatingCostPanel.tsx` | Finance costs |
| HealthGrid | `empire/HealthGrid.tsx` | Infrastructure health |
| EmpirePageShell | `empire/EmpirePageShell.tsx` | Legacy page wrapper during migration |

### 4.3 Net-new components (P0–P2)

| Component ID | Name | Phase |
|--------------|------|-------|
| CMP-001 | CockpitShell | P0 |
| CMP-002 | CockpitSidebar + nav registry | P0 |
| CMP-003 | CockpitDepartmentLayout | P0 |
| CMP-004 | DataModeBadge | P0 |
| CMP-005 | ExecutiveHomePage | P0 |
| CMP-006 | MissionCentrePage + MissionQueue | P0 |
| CMP-007 | CommandCentrePage (merged) | P0 |
| CMP-008 | WidgetRegistry + KpiStrip | P0 |
| CMP-009 | DepartmentHealthRow | P0 |
| CMP-010 | MissionAggregatorHook | P0 |
| CMP-011 | AgentRosterGrid | P2 |
| CMP-012 | IntegrationConnectionGrid | P1 |
| CMP-013 | DeploymentStatusList | P1 |
| CMP-014 | NotificationDrawer | P2 |
| CMP-015 | PillowFab | P2 |

---

## 5. Placeholders Requiring Replacement (Pre-Production)

| ID | Placeholder | Location | Blocker for | Replacement REAL |
|----|-------------|----------|-------------|------------------|
| PH-001 | Seed portfolio data | `domain/seed.ts` | Live GMV/margin | REAL-127 |
| PH-002 | Mock PIE providers | `intelligence/`, module-views | Intelligence Live badge | REAL-128 |
| PH-003 | `useDeterministicMocks: true` | FulfillmentReadinessPanel | Production orders | REAL-129 |
| PH-004 | Sandbox order submit | `order.submit_approved_order_sandbox_only` | Live fulfillment | REAL-130 |
| PH-005 | Synthetic admin metrics | `loadAdminView()` | Admin panel | REAL-131 |
| PH-006 | Unwired ActionButtons | 12 empireai-web modules | User trust | REAL-089–104 |
| PH-007 | Cookie-only middleware | empireai-web middleware | Security | REAL-082 |
| PH-008 | `BRAIN_API_URL` unset | Vercel env | Auth | REAL-081 (ops) |
| PH-009 | sql.js SQLite | brain/database | Persistence | REAL-132 |
| PH-010 | Connector stubs default | mock-providers.ts | Integrations grid | REAL-133 |
| PH-011 | Orphaned store-builder UI | store-builder/* | Store panel | REAL-090 |
| PH-012 | Static marketing Hero metrics | Hero.tsx | N/A (marketing) | Optional |
| PH-013 | Settings display-only | SettingsModule | Governance save | REAL-109 |
| PH-014 | Dual frontend surfaces | frontend + empireai-web | Cockpit unity | REAL-124–126 |

---

## 6. Department Implementation Sequence

| Order | Department | Phase | Depends on | Parallel with |
|-------|------------|-------|------------|---------------|
| 1 | Shell + Navigation | P0 | Auth | — |
| 2 | Executive Command (Home, Command, Missions) | P0 | Shell | — |
| 3 | Infrastructure (Integrations) | P1 | Shell | Intelligence |
| 4 | Intelligence | P1 | Shell, Widget lib | Commerce |
| 5 | Commerce | P1 | Shell, Widget lib | Operations |
| 6 | Operations | P1 | Commerce store | Finance |
| 7 | Finance | P1 | Operations (ledger) | — |
| 8 | Governance | P2 | Shell | Development |
| 9 | AI Workforce | P2 | Shell, SSE | Development |
| 10 | Development | P2 | Pillow host | Governance |

---

## 7. Complexity & Estimate Summary

| Phase | Missions | Complexity | Calendar (1 dev) | Calendar (2 dev parallel) |
|-------|----------|------------|--------------------|---------------------------|
| P0 Foundation | REAL-081–088 | Large | 3–4 weeks | 2 weeks |
| P1 Departments | REAL-089–108 | Large | 6–8 weeks | 3–4 weeks |
| P2 Depth + Overlays | REAL-109–123 | Medium | 4–5 weeks | 2–3 weeks |
| P3 Consolidation + Prod | REAL-124–135 | Large | 4–6 weeks | 2–3 weeks |
| **Total** | ~55 missions | — | **17–23 weeks** | **9–12 weeks** |

*Estimates assume one focused engineer familiar with codebase; backend placeholder missions may run parallel in separate track.*

---

## 8. Planned REAL Mission Index (REAL-081+)

| REAL | Title | Phase |
|------|-------|-------|
| REAL-081 | Cockpit route group + folder scaffold | P0 |
| REAL-082 | Server-side session validation + auth redirect | P0 |
| REAL-083 | Canonical navigation registry | P0 |
| REAL-084 | CockpitShell (sidebar, topbar, layout) | P0 |
| REAL-085 | Executive Home screen | P0 |
| REAL-086 | Command Centre merge | P0 |
| REAL-087 | Mission Centre + aggregator hook | P0 |
| REAL-088 | Widget/KPI registry + DataModeBadge | P0 |
| REAL-089 | Commerce department tabs + routing | P1 |
| REAL-090 | Store panel + orphan mount | P1 |
| REAL-091 | Marketing + Ads wire actions | P1 |
| REAL-092 | Launch + Workspace port | P1 |
| REAL-093 | Commerce workspace detail routes | P1 |
| REAL-094 | Intelligence department shell | P1 |
| REAL-095 | Products + Suppliers merge | P1 |
| REAL-096 | Discovery port | P1 |
| REAL-097 | Marketplace port | P1 |
| REAL-098 | Operations department shell | P1 |
| REAL-099 | Orders + fulfillment merge | P1 |
| REAL-100 | Support panel | P1 |
| REAL-101 | Finance department shell | P1 |
| REAL-102 | Profit page merge | P1 |
| REAL-103 | P&L + billing port | P1 |
| REAL-104 | Operating costs tab | P1 |
| REAL-105 | Infrastructure department shell | P1 |
| REAL-106 | Integrations grid port | P1 |
| REAL-107 | Health + deployments UI | P1 |
| REAL-108 | Admin panel real metrics path | P1 |
| REAL-109 | Governance department shell | P2 |
| REAL-110 | Settings save wiring | P2 |
| REAL-111 | Soul + decisions port | P2 |
| REAL-112 | Council port | P2 |
| REAL-113 | V1 certification port | P2 |
| REAL-114 | AI Workforce roster grid | P2 |
| REAL-115 | Activity + SSE page | P2 |
| REAL-116 | Audit log viewer | P2 |
| REAL-117 | Development department shell | P2 |
| REAL-118 | Pillow drawer in Cockpit | P2 |
| REAL-119 | Approvals merge cleanup | P2 |
| REAL-120 | ESIS + learning port | P2 |
| REAL-121 | Notification drawer | P2 |
| REAL-122 | Global approval bar | P2 |
| REAL-123 | Pillow FAB + shortcuts | P2 |
| REAL-124 | frontend → cockpit redirects | P3 |
| REAL-125 | Shared package extraction (optional) | P3 |
| REAL-126 | Deprecate Vite dashboard routes | P3 |
| REAL-127–135 | Production placeholder replacement | P3 |

---

## 9. Related Documents

| Document | Content |
|----------|---------|
| `COCKPIT_DEPENDENCY_GRAPH.md` | Build order, parallel tracks, blockers |
| `COCKPIT_BUILD_SEQUENCE.md` | Sprint-by-sprint sequence |
| `COCKPIT_MIGRATION_PLAN.md` | frontend / empireai-web merge strategy |
| `COCKPIT_INFORMATION_ARCHITECTURE.md` | Target IA (REAL-079) |
| `EMPIREAI_CANONICAL_ARCHITECTURE.md` | Subsystem ownership (REAL-078) |
| `DEVELOPMENT_DOCTRINE.md` | Engineering rules |

---

*REAL-080 — Cockpit Implementation Roadmap v1.0*
