# Pillow Capability Reconciliation

**Mission:** Pillow Completion Programme — Task 1  
**Baseline:** `artifacts/empireai-version-1-build-hierarchy-bible.md`  
**Date:** 2026-07-03  
**Type:** Repository verification only — no code modified

---

## Classification Key

| Status | Definition |
|--------|------------|
| **COMPLETE** | Implemented, wired end-to-end in the active V1 stack (`empireai-web` + Brain dispatch), tested or audited |
| **BUILT BUT HIDDEN** | Implemented in backend or legacy frontend; not exposed in canonical Cockpit UX |
| **BUILT BUT DISCONNECTED** | Code exists; missing link between layers (HTTP ↔ Brain ↔ Cockpit ↔ package) |
| **PLACEHOLDER / SANDBOX** | Explicit stub, demo data, or sandbox data mode; not production-complete |
| **MISSING** | Not present in repository |

**Active V1 stack:** `empireai-web` → `/api/brain/dispatch` → Brain orchestrator → tools/views.  
**Legacy stack:** `frontend/` → `/api/pillow/*` → `@empireai/pillow` via `pillow-host`.

---

## Executive Finding

Pillow exists as **two parallel stacks** in Version 1:

| Stack | Transport | Full `@empireai/pillow` NL/LLM | Canonical UI |
|-------|-----------|----------------------------------|--------------|
| **G4-09 Operating Shell** | Brain `cockpit-global-assistant` → G4-07 | No | `empireai-web` (all Cockpit routes) |
| **Pillow Host Runtime** | HTTP `/api/pillow/*` + in-process package | Yes | Legacy `frontend/` only |

Governance Pillow (EKLS gateway, G5/G6/G8/version validators) is **COMPLETE** and cross-cutting. Product Pillow (NL chat, planner, supervisor, executive council via package) is **COMPLETE on backend** but **DISCONNECTED from `empireai-web`**.

**Verified:** `empireai-web` contains **zero** references to `/api/pillow` (repository grep, 2026-07-03).

---

## Pillow Capability Inventory

### A. Governance & Institutional Memory

| ID | Capability | Status | Evidence |
|----|------------|--------|----------|
| P-GOV-01 | EKLS governance gateway (`enforceEklsAccess`) | **COMPLETE** | `orchestration/pillow/ekls/services/ekls-governance-gateway.ts`; requires `pillowGovernance: true` |
| P-GOV-02 | EKLS unified service & schedule manifest | **COMPLETE** | `ekls-unified-service.ts`; 5 primary consumer channels |
| P-GOV-03 | EKLS subsystem registry (27 stores) | **COMPLETE** | `ekls/contracts/subsystem-registry.ts` |
| P-GOV-04 | EKLS ownership & workspace isolation policies | **COMPLETE** | `ekls/policies/` |
| P-GOV-05 | G5-05 Pillow approval router (automation) | **COMPLETE** | `business-automation/approval/pillow-approval-router.ts`; Brain tools + tests |
| P-GOV-06 | G5 approval Pillow governance gate | **COMPLETE** | `approval-pillow-governance.ts`; `g5-05` tests |
| P-GOV-07 | G5 Automation Centre Pillow governance | **COMPLETE** | `automation-centre-pillow-governance.ts`; SCR-303 |
| P-GOV-08 | G6 certification Pillow governance (all domains) | **COMPLETE** | `production-certification/**/pillow-governance*.ts`; G6 test suite |
| P-GOV-09 | G8 IAP Pillow governance (10+ submodules) | **COMPLETE** | `identity-authorization-platform/**/pillow-governance.ts`; G8 tests |
| P-GOV-10 | G8 Authorization Centre Pillow state in UI | **COMPLETE** | `AuthorizationPanels.tsx` shows `pillowGovernanceState` |
| P-GOV-11 | Version governance Pillow gateway | **COMPLETE** | `empire-version-governance/governance/version-governance-pillow-governance.ts` |
| P-GOV-12 | Version Lock Doctrine (Pillow recommend-only) | **COMPLETE** | `empire-version-governance/doctrine/version-lock-doctrine.ts` |
| P-GOV-13 | Pillow version status context builder | **COMPLETE** | `buildVersionGovernancePillowContext()` |
| P-GOV-14 | G5-08 EKLS outcome store | **BUILT BUT DISCONNECTED** | In-memory `automation-outcome-store.ts`; pillow-governed but not canonical EKLS observation path |
| P-GOV-15 | G2 commerce EKLS record functions | **BUILT BUT DISCONNECTED** | `record*Ekls*` in G2 tests only; not called from `infrastructure-commerce/services/` |

---

### B. Cockpit Operating Shell (G4-09 — canonical “Pillow” UX)

| ID | Capability | Status | Evidence |
|----|------------|--------|----------|
| P-UI-01 | Global AI Assistant panel (branded Pillow) | **COMPLETE** | `GlobalAiAssistantPanel.tsx`, `GlobalAiAssistantProvider.tsx` |
| P-UI-02 | CockpitShell wraps all routes with assistant | **COMPLETE** | `CockpitShell.tsx`; widget `W-G-010` |
| P-UI-03 | Brain `cockpit_global_assistant.ask` / `.load_context` | **COMPLETE** | `module-routes.ts`; `cockpit-global-assistant.test.ts` |
| P-UI-04 | G4-07 interaction layer delegation | **COMPLETE** | `cockpit-global-assistant.ts` → `cockpit-interaction-layer.ts` |
| P-UI-05 | Pillow session store (localStorage) | **COMPLETE** | `pillow-session-store.ts`; wired in provider |
| P-UI-06 | Pillow voice (Web Speech API) | **COMPLETE** | `use-pillow-voice.ts`; panel toggle |
| P-UI-07 | Voice backend channel | **MISSING** | Browser-only; no Brain/pillow-host voice bridge |
| P-UI-08 | Full NL `@empireai/pillow` chat in Cockpit | **MISSING** | G4-09 uses structured assistant, not pillow-host |
| P-UI-09 | `futureChannels` (Supervisor collaboration) | **PLACEHOLDER** | `cockpit-global-assistant.ts` — listed, not wired |
| P-UI-10 | G4-09 executive audit | **COMPLETE** | `artifacts/g4-09-global-ai-assistant-executive-audit.md` |

---

### C. Pillow Supervisor & Development Surfaces

| ID | Capability | Status | Evidence |
|----|------------|--------|----------|
| P-SUP-01 | Pillow Supervisor engine center view | **COMPLETE** (snapshot) | `loadPillowSupervisorView()` in `cockpit-panel-views.ts` |
| P-SUP-02 | Development Pillow page | **COMPLETE** (snapshot) | `/cockpit/development/pillow` → `DevelopmentPillowPanel` |
| P-SUP-03 | Brain `cockpit_pillow.load_view` | **COMPLETE** | `module-load-tools.ts`, `module-routes.ts` |
| P-SUP-04 | NL reasoning in supervisor | **PLACEHOLDER** | Explicit: *"Natural-language reasoning remains in Pillow package — not wired"* (L1141–1142) |
| P-SUP-05 | Approval counts in supervisor | **COMPLETE** | Reads approval repository state |
| P-SUP-06 | SCR-801 King's Approvals (development) | **BUILT BUT HIDDEN** | `/cockpit/development/approvals`; separate from G5 router queue |

---

### D. Pillow Host Runtime (`@empireai/pillow` + HTTP)

| ID | Capability | Status | Evidence |
|----|------------|--------|----------|
| P-HOST-01 | `@empireai/pillow` npm package | **COMPLETE** | `pillow/` (~183 TS files); backend dependency `file:../pillow` |
| P-HOST-02 | Pillow host initialization | **COMPLETE** | `pillow-host.ts`; `initializePillowHost()` in `app.ts` (default enabled) |
| P-HOST-03 | HTTP `/api/pillow/chat`, `/chat/stream` | **COMPLETE** | `registerPillowRoutes()` in `app.ts` L879+ |
| P-HOST-04 | HTTP session, history, objective, events | **COMPLETE** | `pillow-routes.ts` |
| P-HOST-05 | Pillow host tests | **COMPLETE** | `pillow-host.test.ts` |
| P-HOST-06 | empireai-web client for `/api/pillow` | **MISSING** | Zero matches in `empireai-web/` |
| P-HOST-07 | Legacy frontend Pillow chat UI | **BUILT BUT HIDDEN** | `frontend/src/pages/dashboard/PillowChatPage.tsx` |
| P-HOST-08 | Production mode gate | **COMPLETE** / **HIDDEN** | `isPillowProductionModeEnabled()` — env `EMPIRE_V1_OPERATIONAL_READY` |
| P-HOST-09 | Brain dispatch tools for pillow-host chat | **MISSING** | No `pillow_host.*` tools in Brain |

---

### E. Pillow Approval Subsystem (ADR-049 / Cursor bridge)

| ID | Capability | Status | Evidence |
|----|------------|--------|----------|
| P-APR-01 | Approval gate engine | **COMPLETE** | `pillow-approval/approval-gate-engine.ts` |
| P-APR-02 | Cursor bridge adapter | **COMPLETE** | `cursor-bridge-adapter.ts` |
| P-APR-03 | Cursor heartbeat service | **COMPLETE** | `cursor-heartbeat-service.ts` |
| P-APR-04 | HTTP `/api/pillow/approval`, `/cursor/*` | **COMPLETE** | Registered when host lifecycle === `"running"` |
| P-APR-05 | SQLite approval repository | **COMPLETE** | `sqlite-pillow-approval-repository.ts` |
| P-APR-06 | G5 PillowApprovalRouter integration | **BUILT BUT DISCONNECTED** | G5 router self-contained; does not call `ApprovalGateEngine` |
| P-APR-07 | Unified approval queue (G5 + Cursor) | **MISSING** | Two parallel approval systems |
| P-APR-08 | empireai-web approval UI | **BUILT BUT HIDDEN** | Legacy `frontend/` only; SCR-801 partial |

---

### F. Pillow Executive Council & Learning

| ID | Capability | Status | Evidence |
|----|------------|--------|----------|
| P-EC-01 | Pillow executive council HTTP API | **COMPLETE** | `pillow-executive-council/routes/` |
| P-EC-02 | Council triggered from pillow-host chat | **COMPLETE** | Host integration |
| P-EC-03 | Executive learning HTTP API | **COMPLETE** | `executive-learning/routes/` under `/api/pillow/executive-learning/` |
| P-EC-04 | Brain `executive_council.*` tools | **BUILT BUT DISCONNECTED** | Separate `executive-council/tools/` — not same path as pillow-executive-council HTTP |
| P-EC-05 | Cockpit council page | **PLACEHOLDER** | SCR-703 — "Capability not yet implemented" in `GovernancePanels.tsx` |
| P-EC-06 | empireai-web council client | **MISSING** | No HTTP client |

---

### G. `@empireai/pillow` Package Submodules

All submodules below are **COMPLETE in-package** (CLI + tests) and **DISCONNECTED from `empireai-web`** unless accessed via pillow-host HTTP from legacy frontend.

| Submodule | Path | CLI | Package tests |
|-----------|------|-----|---------------|
| Bootstrap Engine | `pillow/src/bootstrap/` | Yes | Yes |
| Context Builder | `pillow/src/context/` | Yes | Yes |
| Repository Intelligence | `pillow/src/intelligence/` | Yes | Yes |
| Memory | `pillow/src/memory/` | Yes | Yes |
| Mission Planner | `pillow/src/planner/` | Yes | Yes |
| Cursor Supervisor | `pillow/src/supervisor/` | Yes | Yes |
| Recovery Manager | `pillow/src/recovery/` | Yes | Yes |
| Audit Reviewer | `pillow/src/audit-reviewer/` | Yes | Yes |
| Repository Synchronizer | `pillow/src/synchronizer/` | Yes | Yes |
| Due Diligence | `pillow/src/due-diligence/` | Yes | Yes |
| Autonomous Improvement | `pillow/src/improvement/` | Yes | Yes |
| Empire Orchestrator | `pillow/src/orchestrator/` | Yes | Yes |
| Live Watcher | `pillow/src/watcher/` | Yes | Yes |
| Grand King Command | `pillow/src/command/` | Yes | Yes |
| Executive Learning | `pillow/src/learning/` | — | Yes |
| Executive Perspectives | `pillow/src/executive-perspectives/` | — | Yes |
| Objective Engine | `pillow/src/objective/` | — | Yes |
| OpenAI/Brain adapter | `pillow/src/openai/` | — | Yes |

---

### H. Legacy Parallel Systems (do not rebuild)

| ID | Capability | Status | Evidence |
|----|------------|--------|----------|
| P-LEG-01 | GC-05 legacy global-assistant HTTP | **BUILT BUT DISCONNECTED** | `backend/src/global-assistant/`; not used by empireai-web |
| P-LEG-02 | Legacy `frontend/` Pillow companion | **BUILT BUT HIDDEN** | Full chat UI exists; superseded by empireai-web for V1 |
| P-LEG-03 | `pillow-executive-council` vs `executive-council` Brain tools | **BUILT BUT DISCONNECTED** | Parallel council implementations |

---

## Pillow Summary Counts

| Status | Count (Pillow-specific capabilities) |
|--------|---------------------------------------:|
| COMPLETE | 38 |
| BUILT BUT HIDDEN | 8 |
| BUILT BUT DISCONNECTED | 14 |
| PLACEHOLDER / SANDBOX | 5 |
| MISSING | 7 |

---

## Critical Gap (single sentence)

**Governance Pillow is complete; product Pillow (`@empireai/pillow` NL runtime) is complete on the backend but not connected to the canonical Cockpit (`empireai-web`).**

---

*Verified against repository 2026-07-03 · Documentation only*
