# EMPIREAI COCKPIT ARCHITECTURE

> **Classification:** CANONICAL — Tier 5 Normative Architecture (Cockpit)  
> **Document ID:** P3-03  
> **Constitutional phase:** P3 — Architecture Foundation  
> **Dependencies:** P1 complete · P2 complete · P3-01 · P3-02 · Architecture Law · UID · Executive UX Layer  
> **Owner:** Pillow (constitutional) · Chief Architect (normative maintainer)  
> **Authority:** CANONICAL — single permanent Cockpit architecture; **subordinate to CTD · Pillow Constitution · Architecture Law**  
> **Parent:** [`EMPIREAI_ARCHITECTURE_LAW.md`](./EMPIREAI_ARCHITECTURE_LAW.md) · [`EMPIREAI_CANONICAL_ARCHITECTURE.md`](./EMPIREAI_CANONICAL_ARCHITECTURE.md) §3.2  
> **Ratified:** 2026-07-05 (P3-03)  
> **Role:** Permanent architecture of the Executive Operating System — reconstructed from repository, not a rewrite

**Target specification:** [`PROJECT_COCKPIT_SPECIFICATION.md`](./PROJECT_COCKPIT_SPECIFICATION.md) (REAL-078)  
**UX layers:** [`EXECUTIVE_UX_LAYER_ARCHITECTURE.md`](../governance/EXECUTIVE_UX_LAYER_ARCHITECTURE.md) (GC-03 · GC-05)  
**Operational snapshot:** [`docs/audits/full-empireai-audit/09_COCKPIT_AND_UX_AUDIT.md`](../audits/full-empireai-audit/09_COCKPIT_AND_UX_AUDIT.md) (EVIDENCE)  
**Brain · Pillow:** [`EMPIREAI_BRAIN_ARCHITECTURE.md`](./EMPIREAI_BRAIN_ARCHITECTURE.md) · [`EMPIREAI_PILLOW_ARCHITECTURE.md`](./EMPIREAI_PILLOW_ARCHITECTURE.md)

---

## 1. Purpose

**Cockpit** is the **Executive Operating System** of EmpireAI — not merely a frontend. Cockpit **presents the Empire to the Grand King**. Cockpit **visualizes** and **orchestrates executive interaction**. Cockpit **never owns execution, governance, or constitutional authority**.

| Cockpit IS | Cockpit IS NOT |
|------------|----------------|
| Executive Operating System shell | Runtime execution engine (Brain) |
| Visualization of Empire status | Pillow intelligence (reasoning lives in Pillow) |
| Grand King decision surface | Builder (Cursor channel) |
| BFF proxy to Brain/Pillow | Source of truth for knowledge or config |
| One executive experience (target) | Business logic owner |
| Approval and attention presentation | Production mutator without GK approval |

**The principle:** Pillow owns · Brain executes · Cockpit visualises · Grand King decides.

---

## 2. Constitutional Relationships

```
Grand King (Tier 0)
        ↓
Vision · Soul (executive context — Cockpit displays, never owns)
        ↓
CTD · Constitutions (Cockpit surfaces health; never amends)
        ↓
Pillow (steward · intelligence · supervision governance)
        ↓
Cockpit (this document — executive interface)
        ↓
Brain (dispatch · data assembly · health probes)
        ↓
Production · Repository · Evidence
```

| System | Relationship |
|--------|--------------|
| **Pillow** | Constitutional owner of Cockpit; intelligence via GC-05/GC-03 |
| **Brain** | All module data via `/brain/dispatch`; domain view assembly |
| **Builder** | Visualized in Development department · Mission Centre |
| **Supervisor** | Pillow-owned; Cockpit displays progress · ETA · risks |
| **Guardian** | Brain module; health surfaced in Infrastructure/Brain panels |
| **Production Truth** | Cockpit labels live vs demo; never contradicts STATUS |

---

## 3. Ownership & Stewardship

| Field | Definition |
|-------|------------|
| **Constitutional owner** | Pillow |
| **Normative maintainer** | Chief Architect |
| **Primary consumers** | Grand King · Admin · Operator (role-filtered) |
| **Primary app** | `empireai-web/` — Next.js Cockpit (`app/(cockpit)/`) |
| **Executive depth (legacy)** | `frontend/` — Vite SPA pages migrating to Cockpit V2 |
| **View assembly** | `backend/src/domain/services/cockpit-panel-views.ts` |
| **Navigation registry** | `empireai-web/lib/cockpit/navigation.ts` |

**Rule:** No third production executive surface. No duplicate Cockpit architecture authority.

---

## 4. Cockpit Responsibilities

Cockpit **visualizes** (never executes):

| Domain | Primary surfaces |
|--------|------------------|
| Empire status | Executive Home · Command Centre |
| Builder | Development · Mission Centre · Approvals |
| Supervisor | Development → Supervisor tab · Mission Centre |
| Pillow | GC-05 · Development → Pillow · Recommendations |
| Brain | Infrastructure → Health · Engine health strips |
| Businesses | Commerce · Finance · Operations departments |
| Runtime | Infrastructure · Workforce |
| Production | Infrastructure → Deployments · Health |
| Architecture | Governance · Development → Inspection |
| Repository | Development · Governance → Soul/Audit |
| Knowledge | Intelligence · Governance |
| Journey | Mission Centre · Executive timeline |
| Financial performance | Finance department · Executive summary cards |
| Risks | Intelligence → Risk · Executive alerts |
| Constitutional health | Governance department |

---

## 5. Cockpit Does NOT

| Forbidden | Owner instead |
|-----------|---------------|
| Execute runtime dispatch logic in UI | **Brain** Orchestrator |
| Replace Brain API | BFF proxies only |
| Replace Pillow reasoning | **Pillow** package + host |
| Replace Builder | **Cursor** under Supervisor |
| Own business logic | Domain services + Brain tools |
| Own production logic | Production Truth · deploy pipeline |
| Own constitutional governance | CTD · Framework · doctrines |
| Own engineering implementation | Builder + Engineering Constitution |

---

## 6. Executive Principles

| # | Principle | Implementation |
|---|-----------|----------------|
| 1 | Everything important is visible | Executive Home + department KPIs |
| 2 | Nothing important is hidden | Attention strip · alerts · blockers |
| 3 | Executive-first | SCR-001 default landing after login |
| 4 | Decision-first | Approval routing · next action strip |
| 5 | Production-first | Live/demo badges · Production Truth labels |
| 6 | Real-time awareness | SSE events · sync bar · polling where needed |
| 7 | Minimal navigation | 9 departments + executive surfaces |
| 8 | One operating system | Single Cockpit shell (merge target V2) |
| 9 | One executive experience | Shared chrome · consistent panel patterns |
| 10 | Explainability over complexity | Evidence links · audit refs · "Why?" (GC-05) |

---

## 7. System Architecture

### 7.1 Layer diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│ GRAND KING                                                               │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│ COCKPIT SHELL (empireai-web)                                             │
│  CockpitShell · Sidebar · TopBar · MobileNav · AuthGuard                 │
│  GC-05 GlobalAiAssistantPanel · GC-03 notifications · InteractionDrawer  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ BFF (never direct LLM/external API)
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
 POST /api/brain/dispatch   /api/pillow/*          /api/auth/*
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ BRAIN (Railway) — Pillow-owned process                                   │
│  executive-home:load · module:* · health · guardian                      │
│  domain/cockpit-panel-views.ts · executive-home-loader.ts                │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 BFF interface (mandatory)

| BFF route | Brain upstream | Purpose |
|-----------|----------------|---------|
| `POST /api/brain/dispatch` | `/brain/dispatch` | All module + executive views |
| `GET /api/brain/events` | SSE stream | Real-time activity |
| `/api/pillow/[...path]` | `/api/pillow/*` | Pillow chat · session |
| `POST /api/auth/login` | `/auth/login` | Grand King access |

**Proxy:** `empireai-web/lib/brain/server-proxy.ts` — timeouts: dispatch 55s · chat 58s.

### 7.3 Authentication

| Layer | Implementation |
|-------|----------------|
| Cookie | `empireai_session` |
| Middleware | `empireai-web/middleware.ts` — protects `/cockpit/*` |
| Default landing | `/` → `/cockpit` (authenticated) |
| Roles | `founder` · `admin` · `operator` — `auth/permissions.ts` |

---

## 8. Executive Home (SCR-001)

**Canonical route:** `/cockpit` · **Screen ID:** SCR-001  
**Implementation:** `ExecutiveHomePage.tsx` · `loadExecutiveHomeView()` · `executive-home:load` dispatch

### 8.1 Mandatory content (normative)

| Section | Current implementation | Data source |
|---------|------------------------|-------------|
| **Executive Summary** | `ExecutivePriorityWidgetGrid` · summary cards | `buildExecutiveSummaryCards()` |
| **Mission Status** | OMS block in command snapshot | `loadOperationalCommandView()` |
| **Supervisor Status** | Pillow supervisor slice in home | `loadPillowSupervisorView()` |
| **Builder Status** | Pending approvals · approval routes | Pillow approval repository |
| **Current ETA** | Timeline + next action strip | `buildExecutiveTimeline()` · OMS |
| **Production Health** | Engine health strip · certification blockers | ESIS · readiness assessors |
| **Business Health** | Portfolio metrics · SUCCESS-001 | `loadDashboardView()` |
| **Repository Health** | ESIS · inspection signals | Engine panels |
| **Architecture Health** | Dependency graph · engine summaries | `buildExecutiveDependencyGraph()` |
| **Pillow Recommendations** | Attention strip · alerts | `buildExecutiveAlerts()` |
| **Grand King Actions** | Approval routing panel | `buildExecutiveApprovalRoutes()` |
| **Recent Changes** | Executive timeline | Portfolio activity + timeline |
| **Strategic Alerts** | `ExecutiveAlertsPanel` | Multi-source alert aggregation |

### 8.2 Executive Home layout (current)

1. Page header (live data mode badge)  
2. Sync bar (`ExecutiveHomeSyncBar`)  
3. Grand King greeting + top blocker  
4. Attention strip  
5. Next action strip  
6. Approval routing  
7. Priority widget grid (10+ summary cards)  
8. Alerts · dependency graph · timeline  
9. Engine health strip  

### 8.3 Performance model

| Mode | Behaviour |
|------|-----------|
| **Cold load** | Async assembly ~1–15s · cooperative yields |
| **Warm cache** | 60s cache · ~0–8s |
| **Fallback** | `_fallback: true` minimal view on timeout |
| **Production lite** | Reduced aggregation path when operational flag set |

→ `backend/src/domain/services/executive-home-loader.ts`

---

## 9. Permanent Executive Panels

Normative panel definitions. **Current:** partial implementation — placeholders noted in audit pack.

### 9.1 Supervisor Panel

**Primary surfaces:** Development → Pillow → Supervisor tab (SCR-800) · Mission Centre · Executive Home supervisor slice

| Field | Display | Source |
|-------|---------|--------|
| Current Mission | Active objective / supervised mission | OMS · Supervisor state |
| Current Step | Mission progress label | Objective dashboard |
| Overall Progress | Percent complete | OMS `progress` |
| Estimated Remaining Time | ETA when available | Supervisor heartbeat (future) |
| Current Risks | Blockers · certification gaps | `certificationBlockers` |
| Recovery Actions | Recovery doctrine links | Recovery Manager status (future wire) |
| Current Owner | Mission CO | Journey · approval row |
| Current Dependencies | Dependency graph edges | `buildExecutiveDependencyGraph()` |
| Execution Health | Engine panel health row | `loadAllEnginePanels()` |

**View builder:** `loadPillowSupervisorView()` · `loadPillowSupervisorEnginePanel()`

### 9.2 Builder Panel

**Primary surfaces:** Development → Approvals · Mission Centre (SCR-020)

| Field | Display | Source |
|-------|---------|--------|
| Current Builder Mission | Pending approval title | Pillow approval repo |
| Mission Queue | Pending + recent approvals | `listApprovals()` |
| Execution Timeline | Executive timeline events | Mission Centre |
| Current Activity | Recent approval activity | Approval rows |
| Repository Changes | Sync preview (gated) | Repository Synchronizer (future) |
| Validation Status | Audit reviewer outcome | Executive Audit Reviewer |
| Production Status | Infrastructure readiness | `assessProductionInfrastructureReadiness()` |
| Acceptance Status | Certification blockers | Operational command view |

**View builder:** `loadMissionCentreView()`

### 9.3 Pillow Panel

**Primary surfaces:** GC-05 Global AI Assistant · Development → Pillow (SCR-800)

| Field | Display | Source |
|-------|---------|--------|
| Recommendations | Due diligence · perspectives | Pillow engines (future aggregate) |
| Repository Drift | Watcher signals | Live Repository Watcher |
| Architecture Drift | ESIS · inspection | Architecture Law comparison |
| Production Drift | STATUS vs docs | Production Truth |
| Knowledge Updates | EKLS · learning pipeline | Executive Learning |
| Vision Updates | Accumulation register | Vision Accumulation Policy |
| Engineering Findings | Technical Chief · audit reviewer | Development panels |
| Business Findings | Commerce intelligence | Commerce department |
| Constitution Findings | Governance · Soul screens | Governance department |

**Interaction:** `GlobalAiAssistantProvider` · BFF `/api/pillow/*` — intelligence in Pillow, not UI.

### 9.4 Brain Panel

**Primary surfaces:** Infrastructure → Health (SCR-600+) · Engine health strips

| Field | Display | Source |
|-------|---------|--------|
| Runtime Health | `/health/live` | Brain health endpoints |
| API Health | Dispatch success · latency | Observability |
| Queue Health | BullMQ stats | Task queue (degraded mode labeled) |
| Database Health | SQLite persist stats | `/health/live` sqlite block |
| Memory | Redis mode | Health payload |
| Workers | Worker pool status | Off at API boot — labeled |
| Performance | Event loop lag | `eventLoopLagMs` |
| Scaling | Future horizontal notes | Architecture evolution |

**Widgets:** `InfrastructureMonitoringPanel` · `InfrastructureAdminPanel`

### 9.5 Business Panel

**Primary surfaces:** Commerce · Finance · Operations departments

| Field | Display | Source |
|-------|---------|--------|
| Companies | Portfolio list | `dashboard:load` · domain repos |
| Revenue | Today / MTD | Orders · ledger |
| Orders | Operations → Orders | `orders:load` |
| Profit | Finance → Profit | Computed P&L |
| Customers | Intelligence → Customers | Domain/intelligence views |
| Products | Intelligence → Products | PIE panels |
| Marketing | Commerce → Marketing | Campaigns |
| Growth | Finance intelligence | Engine panels |
| Automation | Operations → Automation | Automation centre |

### 9.6 Constitutional / Governance Panel

**Primary surfaces:** Governance department (SCR-700+)

| Field | Display | Source |
|-------|---------|--------|
| Soul | Governance → Soul | Soul file reads |
| Decisions | ADR register | `EMPIREAI_DECISIONS.md` views |
| Audit | Workforce → Audit | Executive audit index |
| V1 certification | Governance → V1 | Certification blockers |
| Policies | Governance → Settings | Foundation tools (read-only display) |

---

## 10. Navigation

### 10.1 Department model (9 + executive)

| Department | Route prefix | Screen IDs |
|------------|--------------|------------|
| **Executive** | `/cockpit` | SCR-001 · SCR-015 |
| **Command** | `/cockpit/command` | SCR-010 |
| **Missions** | `/cockpit/missions` | SCR-020 |
| **Intelligence** | `/cockpit/intelligence/*` | SCR-100–199 |
| **Commerce** | `/cockpit/commerce/*` | SCR-200–299 |
| **Operations** | `/cockpit/operations/*` | SCR-300–399 |
| **Finance** | `/cockpit/finance/*` | SCR-400–499 |
| **Workforce** | `/cockpit/workforce/*` | SCR-500–599 |
| **Infrastructure** | `/cockpit/infrastructure/*` | SCR-600–699 |
| **Governance** | `/cockpit/governance/*` | SCR-700–799 |
| **Development** | `/cockpit/development/*` | SCR-800–899 |

**Registry:** `empireai-web/lib/cockpit/navigation.ts` — consumed by `CockpitSidebar` · `CockpitMobileNav`.

### 10.2 Shell components

| Component | Path | Role |
|-----------|------|------|
| `CockpitShell` | `components/cockpit/shell/` | Root layout wrapper |
| `CockpitSidebar` | shell | Primary navigation |
| `CockpitTopBar` | shell | Workspace · status · profile |
| `ExecutiveCommandStrip` | shell | Command context strip |
| `GlobalAiAssistantPanel` | global-assistant | GC-05 |
| `CockpitInteractionDrawer` | interaction | Context actions |

---

## 11. Executive UX Principles

| Rule | Requirement |
|------|-------------|
| **No duplicate dashboards** | One Executive Home; departments extend, not repeat |
| **No hidden executive information** | Blockers on Home; attention strip mandatory |
| **One source of executive truth** | Brain dispatch views — not client-side invention |
| **Consistent navigation** | `cockpitNavigation` registry only |
| **Explainability** | GC-05 "Why?" · audit artifact links |
| **Real-time where possible** | SSE + sync bar |
| **Graceful degradation** | Fallback views · retry on Pillow 503 · loading states |
| **Live vs demo labels** | `dataMode` badges per screen (`getCockpitScreenDataMode`) |

---

## 12. Production Model

| Aspect | Current |
|--------|---------|
| **Primary deploy** | Vercel `empireai-web/` |
| **URL** | https://empire-ai.co (documented) |
| **Legacy** | `frontend/` — dual surface (CON-006 programme) |
| **Auth** | Cookie session → Brain Redis |
| **Journey verified** | Login → Executive Home → Pillow chat (automated + King confirmation) |

**Known limitations:** Partial placeholders (Governance SCR-700+, Discovery research); dual frontend until V2 merge.

---

## 13. Lifecycle & Evolution

| Event | Rule |
|-------|------|
| New screen | Declare department + SCR-ID in navigation registry |
| New panel field | Extend `cockpit-panel-views.ts` + TypeScript panel types |
| New department | ADR + PROJECT_COCKPIT_SPECIFICATION update |
| V2 merge | Single Next.js app — `frontend/` routes into Cockpit groups |

**Amendment:** Architecture Law §10 — structural Cockpit changes require ADR.

---

## 14. Examples

### Example 1 — Grand King morning flow

Login → `/cockpit` → `executive-home:load` → attention strip shows blocker → approval panel → navigate Commerce → all via dispatch.

### Example 2 — Correct BFF pattern

`useExecutiveHome` → `POST /api/brain/dispatch` `{module:"executive-home",action:"load"}` → render `ExecutiveHomeView`.

### Example 3 — Violation

React component calls OpenAI directly → breaks Brain boundary · ACD · Development Doctrine.

---

## 15. Validation Checklist (P3-03)

| Check | Status |
|-------|--------|
| Aligns with Vision · Soul · CTD · Hierarchy | §2 |
| Aligns with Brain · Pillow Architecture | §2 · §7 |
| Aligns with Architecture Law · Documentation Law · Production Truth | §12 |
| No duplicated Cockpit authority | §3 · single canonical doc |
| Executive Home validated | §8 |
| Panels validated (normative + current map) | §9 |
| Interfaces validated | §7 |
| Cross-references completed | §16 |

---

## 16. Ratification

| Field | Value |
|-------|-------|
| **Mission** | P3-03 — Cockpit Architecture |
| **Ratification date** | 2026-07-05 |
| **Next architecture mission** | Phase P3 complete — P4-01 Engineering Standards |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | 2026-07-05 | Grand King · P3-03 | Canonical Cockpit Architecture — Executive OS |

---

## Related

- [`PROJECT_COCKPIT_SPECIFICATION.md`](./PROJECT_COCKPIT_SPECIFICATION.md) · [`EXECUTIVE_UX_LAYER_ARCHITECTURE.md`](../governance/EXECUTIVE_UX_LAYER_ARCHITECTURE.md)  
- [`EMPIREAI_PILLOW_ARCHITECTURE.md`](./EMPIREAI_PILLOW_ARCHITECTURE.md) · [`EMPIREAI_BRAIN_ARCHITECTURE.md`](./EMPIREAI_BRAIN_ARCHITECTURE.md) · [`EMPIREAI_BUILDER_ARCHITECTURE.md`](./EMPIREAI_BUILDER_ARCHITECTURE.md) · [`EMPIREAI_COMMERCE_ARCHITECTURE.md`](./EMPIREAI_COMMERCE_ARCHITECTURE.md) · [`EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md`](./EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md)  
- [`empireai-web/lib/cockpit/navigation.ts`](../../empireai-web/lib/cockpit/navigation.ts) · [`backend/src/domain/services/cockpit-panel-views.ts`](../../backend/src/domain/services/cockpit-panel-views.ts)
