# UX IMPLEMENTATION CONTRACT — UX-000B

> Mission: UX-000B — UX Implementation Contract (Version 1 Freeze)
> Inputs: `EMPIREAI_UX_MASTER_BLUEPRINT.md`, `UX_BLUEPRINT_VALIDATION.md`
> Status: **CONTRACT ONLY — NO FRONTEND IMPLEMENTED**
> Date: 2026-06-28
> **Authority:** This document is the single source of truth for every future UX implementation mission. Screen scope, IDs, dependencies, acceptance criteria, and order are frozen here.
> **Contract completion:** ✅ **Version 1 UX contract closed 2026-06-29** — see `COMBINED_EXECUTIVE_AUDIT_UX-001-023.md` · GC-01…GC-07 · UX-001…UX-023 validated.

---

## Numbering Authority (read first)

Earlier documents used `UX-###` provisionally:
- The **Blueprint** used `UX-001…UX-017` as *implementation missions* (a roadmap).
- The **Validation** used `UX-018…UX-027` as *backlog enhancements*.

**This contract supersedes both.** From now on:
- `UX-###` = a **screen ID** (Part 2 screen inventory). These are the authoritative numbers.
- `GC-##` = a **global/shared component** (built once, reused).
- `BL-##` = a **backlog item** explicitly excluded from Version 1.

Prior provisional `UX-###` numbers are retired and must not be cited in implementation missions.

---

## PART 1 — Version 1 UX Scope

### 1.1 Canonical naming (resolves Validation W-2 / W-3, owner: empire-ux-identity-doctrine + REAL-091)

These names are frozen. No synonyms in code, routes, sidebar, or page titles.

| Canonical name | Retired synonyms (do not use) |
|---|---|
| **Mission Home** | "Mission Control", "Executive Headquarters" (as the landing) |
| **Empire Command Center** | "Executive HQ" (as a separate deep surface) |
| **Commerce Operations** | "Orders", "Operations" |
| **Profit & Operating Cost** | "Finance", "Profit", "Operating Cost" (standalone) |
| **Brand Workspace** | "Businesses", "Workspaces" (legacy) |

### 1.2 INCLUDED in Version 1 (exactly these — 23 screens + 7 global components)

Version 1 ships: the **global chrome**, the **commercial operating spine** (Product → Supplier → Pricing → Marketplace → Advertising → Orders → Finance → Expansion → Profit), the **governed decision chain** (Debate → Soul → Approvals → History), and the **reuse of already-built page assets**. The four-question executive contract (incl. SUCCESS-001 blocker) is V1 foundation (Validation W-1 closed in V1, not deferred).

### 1.3 EXCLUDED from Version 1 (frozen as backlog — see Part 6)

The following are explicitly **out of V1**. They remain as existing Mission Home panels / dispatch-only where they already exist; full-screen promotion is backlog:

- Risk Command (REAL-045), Governance/Decision Audit (REAL-068)
- Knowledge Evolution (REAL-042), Pattern Library (REAL-088), Soul Learning Review (REAL-087), Playbook (REAL-044)
- KPI full surface (REAL-062 stays a Home drill-in)
- Customers / CRM hub (REAL-026/028)
- Full-screen promotion of: World Operations Map (REAL-052), Global Business Health (REAL-061), Market Share (REAL-053), Product Portfolio (REAL-054), Strategic Center (REAL-067), Mission Command (REAL-057), Execution Timeline (REAL-058) — **these stay as Mission Home panels in V1**
- Dedicated Pricing desk (REAL-075 — folded into Product Discovery + Profit in V1)
- Operator multi-brand switcher (business-opportunity-workspace)
- Landing-page marketing polish

There is **nothing ambiguous**: if a surface is not in §1.2 / Part 2, it is excluded.

---

## PART 2 — Screen Inventory

### 2.1 Global Components (GC — build once, shared)

> **Executive interface layers (ADR-047):** **GC-05** = Executive Interaction Layer · **GC-03** = Executive Attention Layer. **PILLOW-019** = Executive Companion (persistent side panel, single conversation). Pillow intelligence remains in `@empireai/pillow` + Brain host (not a GC component). See `docs/governance/EXECUTIVE_UX_LAYER_ARCHITECTURE.md`.

| ID | Component | Owner | Executive layer |
|---|---|---|---|
| GC-01 | Global Shell (TopNav + Sidebar, canonical naming) | REAL-091 + empire-ux-identity-doctrine | — |
| GC-02 | Approval Bar (persistent, role-gated) | GKR + EC + REAL-086 | — |
| GC-03 | Notifications Center | executive-surveillance (ESS) + eye-series | **Attention** |
| GC-04 | Command Palette + Global Search | REAL-066 (commercial-explorer) | — |
| GC-05 | AI Assistant Panel ("Why" / evidence-on-demand) | REAL-031/032/033 + executive-council | **Interaction** |
| GC-06 | Executive Page Contract (4-question scaffold + SUCCESS-001 blocker chip) | REAL-035 + REAL-051 + REAL-090 | — |
| GC-07 | Verdict primitives (HealthGrid, StatusBadge, KPI card) | REAL-091 | — |

### 2.2 Screens (UX — authoritative numbers)

| ID | Screen | Role | Built asset to reuse |
|---|---|---|---|
| UX-001 | Login | all | existing auth |
| UX-002 | Mission Home | founder | existing MissionHomePage |
| UX-003 | SUCCESS-001 Command Center | founder | — |
| UX-004 | Empire Command Center | founder | existing command center |
| UX-005 | Product Discovery | founder | IntelligencePage (reuse) |
| UX-006 | Supplier Intelligence | founder | SuppliersPage (reuse) |
| UX-007 | Marketplace Intelligence | founder | — |
| UX-008 | Advertising | founder | AdsPage (reuse) |
| UX-009 | Commerce Operations | founder | existing operations |
| UX-010 | Profit & Operating Cost | founder | ProfitPage (reuse) |
| UX-011 | Expansion | founder | — |
| UX-012 | Executive Debate | founder | — |
| UX-013 | Soul Decision Chamber | founder | — |
| UX-014 | Approvals Center | founder | — |
| UX-015 | King Decision History | founder | — |
| UX-016 | AI Team | founder | AiTeamPage (reuse) |
| UX-017 | Reports | founder | existing reports |
| UX-018 | Brand Workspace | operator | existing brand pages |
| UX-019 | Launch Mission | founder/operator | existing launch |
| UX-020 | Infrastructure | admin/founder | existing infra |
| UX-021 | Empire Settings | all | existing settings |
| UX-022 | Billing | founder/admin | BillingPage (reuse) |
| UX-023 | Commercial Explorer | founder | IntelligencePage/search shell |
| UX-024 | Integrations Hub | founder | IntegrationsHubPage · IH-001 · REAL-051A |

> **Amendment 2026-06-29 (Grand King Directive):** UX-024 added under Certification Mode — founder-only external connectivity SSOT per Marketplace Autonomy Doctrine.

---

## PART 3 — Dependencies

"Must exist first" = hard build-order blocker. API owner = the module's existing route + brain tool (frontend reaches it via `/brain/dispatch` or module-routes; no new API invented).

| ID | Must exist first | Depends on | Shared components | Backend / API owner |
|---|---|---|---|---|
| GC-01 | — | auth session | — | REAL-091 |
| GC-02 | GC-01 | approvals data | GC-07 | GKR, EC, REAL-086 |
| GC-03 | GC-01 | event stream | GC-07 | ESS, eye-series |
| GC-04 | GC-01 | entity index | — | REAL-066 |
| GC-05 | GC-01 | chief outputs | — | REAL-031/032/033, executive-council |
| GC-06 | GC-01 | SUCCESS-001 status | GC-07 | REAL-035, REAL-051, REAL-090 |
| GC-07 | — | — | — | REAL-091 |
| UX-001 | — | auth | GC-01 | auth |
| UX-002 | GC-01,06,07 | UX-001 | GC-02,03,04,05 | REAL-051 |
| UX-003 | GC-06 | UX-002 | GC-07 | REAL-035 |
| UX-004 | GC-01 | UX-002 | GC-07 | REAL-051 + executive surfaces |
| UX-005 | GC-04 | UX-002 | GC-05,07 | product-discovery, REAL-066 |
| UX-006 | — | UX-005 | GC-07 | SUP, REAL-015, REAL-071 |
| UX-007 | — | UX-006 | GC-07 | REAL-072/073/074/075/076 |
| UX-008 | GC-02 | UX-007 | GC-02,07 | REAL-038 |
| UX-009 | — | UX-008 | GC-07 | REAL-037/039/040/041 |
| UX-010 | — | UX-009 | GC-07 | REAL-019/020 |
| UX-011 | GC-02 | UX-010 | GC-02,07 | REAL-065/089/029 |
| UX-012 | GC-02 | UX-002 | GC-07 | REAL-055 |
| UX-013 | — | UX-012 | GC-07 | REAL-056 |
| UX-014 | GC-02 | UX-013 | GC-02,07 | GKR, EC, REAL-086 |
| UX-015 | — | UX-014 | GC-07 | REAL-086 |
| UX-016 | GC-05 | UX-002 | GC-05,07 | REAL-031/032/033, executive-council |
| UX-017 | — | UX-002 | GC-07 | MCL, ESIS, REAL-070 |
| UX-018 | GC-01 | UX-001 | GC-07 | business-opportunity-workspace |
| UX-019 | GC-02 | UX-018 / UX-002 | GC-02,07 | GKR launch pipeline |
| UX-020 | GC-01 | UX-001 | GC-07 | orchestration, ESIS |
| UX-021 | GC-01 | UX-001 | — | auth, settings |
| UX-022 | GC-01 | UX-021 | GC-07 | billing module |
| UX-023 | GC-04 | UX-002 | GC-04,07 | REAL-066 |

---

## PART 4 — Acceptance Criteria (objectively testable)

A screen is **COMPLETE** only when every listed checkbox is verifiable by a tester. "Live data" = sourced from the owner's existing route/brain tool, never mocked.

**GC-01 Global Shell** — ✅ Sidebar shows only V1 canonical labels; ✅ zero retired synonyms in DOM; ✅ role-gated items hidden for `operator`; ✅ active route highlighted.
**GC-02 Approval Bar** — ✅ visible on every founder screen; ✅ shows live count of pending money-moving items; ✅ Approve/Reject/Defer call the owner route; ✅ hidden for `operator`; ✅ returns user to origin after action.
**GC-03 Notifications** — ✅ bell shows unread count from live event source (no stub); ✅ clicking an item deep-links to the owning screen; ✅ mark-as-read persists.
**GC-04 Command Palette + Search** — ✅ opens via keyboard shortcut from any screen; ✅ query returns entities from REAL-066 index; ✅ selecting a result navigates in ≤1 action.
**GC-05 AI Assistant Panel** — ✅ "Why?" on any KPI returns evidence from the owner's brain tool; ✅ no hardcoded text.
**GC-06 Executive Page Contract** — ✅ every founder screen renders the 4 slots (What happened / Why / What to do / **SUCCESS-001 blocker**); ✅ SUCCESS-001 blocker chip reflects live REAL-035 status on all screens.
**GC-07 Verdict primitives** — ✅ HealthGrid/StatusBadge/KPI card render consistent verdict colors; ✅ used by ≥1 screen each.

**UX-001 Login** — ✅ valid creds → role-correct landing (founder→UX-002, operator→UX-018); ✅ invalid creds show error; ✅ session persists on refresh.
**UX-002 Mission Home** — ✅ renders GC-02/03/04/05/06; ✅ all panels load live data or show explicit empty/error state; ✅ ≤1 primary action visible above the fold; ✅ SUCCESS-001 blocker visible.
**UX-003 SUCCESS-001 Command Center** — ✅ shows the single mission, current blocker, and next action from REAL-035; ✅ reachable in ≤1 click from any screen via GC-06 chip.
**UX-004 Empire Command Center** — ✅ aggregates executive surfaces with live data; ✅ each tile deep-links to its owner screen.
**UX-005 Product Discovery** — ✅ lists product candidates from live source; ✅ primary action routes a candidate toward supplier; ✅ "Why?" evidence available.
**UX-006 Supplier Intelligence** — ✅ shows supplier options + risk from SUP/REAL-071; ✅ primary action = switch/keep supplier; ✅ resolves a flagged risk.
**UX-007 Marketplace Intelligence** — ✅ country/marketplace comparison from REAL-073/074; ✅ primary action selects a market; ✅ price/shipping advantage shown.
**UX-008 Advertising** — ✅ shows ROAS/spend efficiency (REAL-038); ✅ spend changes pass through GC-02 governance (gated); ✅ no ungated money move.
**UX-009 Commerce Operations** — ✅ orders/fulfillment state from REAL-037/039/040; ✅ refund/return path visible (REAL-041); ✅ order links to its P&L.
**UX-010 Profit & Operating Cost** — ✅ net profit + margin from REAL-019/020; ✅ spend approvals gated via GC-02; ✅ before/after profit visible.
**UX-011 Expansion** — ✅ expansion score + candidate market (REAL-065/089); ✅ approval gated; ✅ links back to profit verification.
**UX-012 Executive Debate** — ✅ renders chiefs' positions for a case (REAL-055); ✅ primary action sends to Soul/Approvals.
**UX-013 Soul Decision Chamber** — ✅ single synthesized recommendation + strength (REAL-056); ✅ defer-to-King action.
**UX-014 Approvals Center** — ✅ lists pending items; ✅ Approve/Reject/Defer call owner routes; ✅ decision recorded to history.
**UX-015 King Decision History** — ✅ shows logged decisions (REAL-086); ✅ re-open routes to source.
**UX-016 AI Team** — ✅ renders chiefs **dynamically from executive-council registry** (Validation W-5: adding a worker requires no code change); ✅ confidence shown; ✅ route-to-debate action.
**UX-017 Reports** — ✅ single entry to completion %/review verdict (MCL/ESIS/REAL-070); ✅ export/sign-off action works.
**UX-018 Brand Workspace** — ✅ operator sees only brand-scoped data; ✅ zero Grand King controls in DOM; ✅ propose (not approve) actions only.
**UX-019 Launch Mission** — ✅ launch flow gated via GC-02; ✅ produces a tracked pipeline entry.
**UX-020 Infrastructure** — ✅ shows system/ESIS health from live inspectors; ✅ admin-gated.
**UX-021 Empire Settings** — ✅ role/identity settings persist; ✅ reflects canonical role terminology.
**UX-022 Billing** — ✅ billing state from billing module; ✅ founder/admin-gated.
**UX-024 Integrations Hub** — ✅ founder-only external connectivity SSOT; ✅ Connect/Reconnect actions; ✅ REAL-051A aligned.

**PILLOW-019 Executive Companion** — ✅ persistent Moon icon on every founder screen; ✅ right-side panel opens without navigation; ✅ single Pillow session survives route changes; ✅ automatic workspace context (screen, module, KPI, approvals, navigation history); ✅ extension pages register via `usePillowPageContext`; ✅ dedicated `/dashboard/pillow` redirects to companion (no standalone chat page); ✅ GC-05 remains separate interaction layer (ADR-047); ✅ constitutional gates preserved.

---

## PART 5 — Implementation Order (exact queue, all dependencies resolved)

```
Foundations (chrome first — everything depends on these)
GC-07  →  GC-01  →  GC-06  →  GC-02  →  GC-03  →  GC-04  →  GC-05
                          ↓
Entry
UX-001 Login
   ↓
Executive core
UX-002 Mission Home  →  UX-003 SUCCESS-001  →  UX-004 Empire Command Center
   ↓
Commercial spine (in business-flow order)
UX-005 Product Discovery
   ↓
UX-006 Supplier Intelligence
   ↓
UX-007 Marketplace Intelligence
   ↓
UX-008 Advertising
   ↓
UX-009 Commerce Operations
   ↓
UX-010 Profit & Operating Cost
   ↓
UX-011 Expansion
   ↓
Governance chain
UX-012 Executive Debate  →  UX-013 Soul Decision Chamber  →  UX-014 Approvals Center  →  UX-015 King Decision History
   ↓
Supporting
UX-016 AI Team  →  UX-017 Reports
   ↓
Operator + system
UX-018 Brand Workspace  →  UX-019 Launch Mission  →  UX-020 Infrastructure  →  UX-021 Empire Settings  →  UX-022 Billing
   ↓
UX-023 Commercial Explorer
```

Rule: a screen may not start until every "Must exist first" (Part 3) is COMPLETE (Part 4).

---

## PART 6 — Backlog Integration

Everything beyond V1 is registered in the **canonical UX Enhancement Register** (`docs/governance/UX_ENHANCEMENT_REGISTER.md` per BL-C). Part 6 table below remains frozen V1 reference; new enhancements register in the canonical register only.

| ID | Backlog item | Existing owner |
|---|---|---|
| BL-01 | Risk Command surface | REAL-045 |
| BL-02 | Governance / Decision Audit surface | REAL-068 |
| BL-03 | Knowledge Evolution + Pattern Library + Soul Learning surfaces | REAL-042, REAL-088, REAL-087 |
| BL-04 | Playbook surface | REAL-044 |
| BL-05 | KPI promoted to full surface | REAL-062 |
| BL-06 | Customers / CRM hub | REAL-026, REAL-028 |
| BL-07 | Full-screen promotion: World Map / Business Health / Market Share / Portfolio | REAL-052, REAL-061, REAL-053, REAL-054 |
| BL-08 | Full-screen promotion: Strategic Center / Mission Command / Execution Timeline | REAL-067, REAL-057, REAL-058 |
| BL-09 | Dedicated Pricing desk | REAL-075 + REAL-019 |
| BL-10 | Operator multi-brand switcher | business-opportunity-workspace |
| BL-11 | Landing-page marketing polish | REAL-091 |

No backlog item may be pulled into V1 without a Grand King approval recorded against this contract.

---

## PART 7 — Version 1 Freeze

**The Version 1 UX is frozen as of this contract.**

- The authoritative V1 surface set is exactly: **GC-01…GC-07** and **UX-001…UX-023**. Nothing else.
- **No additional UX feature, screen, panel, or global component may be added to Version 1 after this contract unless explicitly approved by the Grand King**, with the approval recorded as an amendment here.
- Any new idea is registered to the Backlog (Part 6) against its existing owner — never added to V1, never invented as new architecture.
- Every future UX implementation mission must cite a screen ID from Part 2 and satisfy its Part 4 acceptance criteria in the Part 5 order.

This document is the authority for all subsequent UX implementation missions.

---

*Contract only. No frontend implemented. V1 scope frozen.*
*STOP.*
