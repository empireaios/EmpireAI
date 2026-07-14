# Pillow Completion Master Plan

**Mission:** Pillow Completion Programme  
**Type:** Repository reconciliation & analysis only  
**Baseline:** `artifacts/empireai-version-1-build-hierarchy-bible.md`  
**Date:** 2026-07-03  
**Authority:** Grand King · Version 1.0 LOCKED baseline  

**Supporting artifacts:**
- `artifacts/pillow-capability-reconciliation.md` — Pillow-only detail
- `artifacts/repository-capability-matrix.md` — All subsystems matrix

**Constraints honoured:** No new architecture · No parallel systems · No G0–G8 redesign · No Version 2 · No REAL programmes · No implementation missions generated · Documentation only

---

## Executive Summary

EmpireAI Version 1 has **two Pillow implementations** that must be understood as complementary, not competing:

1. **Governance Pillow (COMPLETE)** — EKLS gateway, G5/G6/G8/version validators, approval doctrine, institutional memory gates. This is the certified V1 governance layer and must not be rebuilt.

2. **Product Pillow (BUILT BUT DISCONNECTED)** — The full `@empireai/pillow` runtime (NL chat, planner, supervisor, executive council) wired through `pillow-host` HTTP (`/api/pillow/*`) and the legacy `frontend/` app. The canonical V1 Cockpit (`empireai-web`) uses **G4-09 Global AI Assistant** instead — a structured Brain-delegated shell that is **COMPLETE** for its mission but **does not** invoke the Pillow package.

**Pillow is not missing.** Pillow is **split**. Completion means **connecting existing pieces**, not building new subsystems.

---

## 1. Capabilities Already Complete

These are verified in the repository as implemented and wired in the active V1 stack. **Do not rebuild.**

### 1.1 Governance Pillow (cross-cutting)

| Capability | Evidence |
|------------|----------|
| EKLS governance gateway — all memory access requires Pillow | `orchestration/pillow/ekls/services/ekls-governance-gateway.ts` |
| EKLS unified service + 5 primary consumer channels | `ekls-unified-service.ts` |
| G5-05 Pillow approval router + Brain tools | `business-automation/approval/pillow-approval-router.ts`; 6 Brain approval tools |
| G5/G6/G8/version Pillow governance validators | 30+ `*-pillow-governance.ts` files; full G5/G6/G8 test suites |
| Version Lock Doctrine (Pillow recommend-only) | `empire-version-governance/doctrine/version-lock-doctrine.ts` |
| G8 secret redaction + workspace isolation on Brain tools | `isolation-brain-gateway.ts` in `brain/index.ts` |

### 1.2 Cockpit Operating Shell (G4-09 — canonical UX)

| Capability | Evidence |
|------------|----------|
| Global AI Assistant panel on all Cockpit routes | `GlobalAiAssistantPanel.tsx`, `CockpitShell.tsx` |
| Brain dispatch `cockpit_global_assistant.ask` / `.load_context` | `module-routes.ts`; `cockpit-global-assistant.test.ts` |
| G4-07 interaction layer delegation | `cockpit-global-assistant.ts` |
| Pillow session persistence (localStorage) | `pillow-session-store.ts` |
| Pillow voice (Web Speech API) | `use-pillow-voice.ts` |
| Private auth gateway + Executive Home entry | V1 Activation — `middleware.ts` |

### 1.3 Pillow Host Runtime (backend — complete, separate transport)

| Capability | Evidence |
|------------|----------|
| `@empireai/pillow` package (18 submodules, CLI, tests) | `pillow/src/` |
| Pillow host init + HTTP routes | `app.ts` L217–897; `/api/pillow/chat`, session, history, objective |
| Pillow approval gate + Cursor bridge | `pillow-approval/`; HTTP when host running |
| Pillow executive council HTTP | `pillow-executive-council/routes/` |
| Executive learning HTTP | `/api/pillow/executive-learning/*` |

### 1.4 Certified programme stacks (Pillow-governed, not Pillow-product)

| Programme | Pillow role | Status |
|-----------|-------------|--------|
| G5 Automation + SCR-303 | Approval router, governance | COMPLETE (sandbox data mode) |
| G8 Identity + SCR-304 | Governance, auth centre | COMPLETE (sandbox data mode) |
| G6 Certification | Pillow validators | COMPLETE |
| G7 Live ops | EKLS + governance patterns | COMPLETE (Brain tools; routing gaps) |
| V1 Lock | Pillow version context | COMPLETE |

### 1.5 Brain & Guardian (Pillow-adjacent, complete)

| Capability | Evidence |
|------------|----------|
| ~700+ Brain tools, ~642 module routes | `brain/index.ts`, `module-routes.ts` |
| Cockpit load_view chain (EW → API → orchestrator → tool) | `useBrainModule.ts`, `/api/brain/dispatch` |
| Guardian dispatch gate (default enabled) | `GUARDIAN_ENABLED` default true; `guardian.test.ts` |

---

## 2. Capabilities Already Implemented but Hidden

These exist in the repository but are **not exposed** in the canonical `empireai-web` Cockpit.

| Capability | Location | Why hidden |
|------------|----------|------------|
| Full Pillow NL chat UI | `frontend/src/pages/dashboard/PillowChatPage.tsx` | Legacy app; V1 uses empireai-web |
| Pillow companion panel | `frontend/src/components/pillow/*` | Legacy app |
| `/api/pillow/*` HTTP surface | `pillow-host/routes/` | No empireai-web client (verified: zero `/api/pillow` refs) |
| Pillow approval Cursor bridge UI | Legacy frontend API clients | Not in Cockpit nav |
| Pillow executive council UI | `frontend/src/api/pillow-executive-council.ts` | SCR-703 is placeholder |
| Guardian HTTP API | `GET /guardian/health`, `/guardian/risks` | No Cockpit SCR |
| G7 Grand King ops Brain tools | `grand-king-*-operations/tools/` | Registered in Brain; no module routes |
| G8 submodule Brain tools (beyond auth centre) | `identity-authorization-platform/**/tools/` | Brain-only; no Cockpit dispatch |
| Business engines (eye-series, business-build, etc.) | `orchestration/*/tools/` | Brain + routes; no dedicated SCR |
| operational-access dashboard | `operational-access/` | Backend complete; no primary Cockpit SCR |
| GC-05 legacy global-assistant HTTP | `backend/src/global-assistant/` | Superseded by G4-09 |
| SCR-801 King's Approvals | `/cockpit/development/approvals` | Development nav only; not unified with G5 |
| Pillow production mode gate | `isPillowProductionModeEnabled()` | Env-gated (`EMPIRE_V1_OPERATIONAL_READY`) |

**Action implication:** Surface existing code — do not rewrite.

---

## 3. Capabilities Already Implemented but Disconnected

These are the **highest-value completion targets** — code exists; wiring is missing.

| Disconnect | Layer A | Layer B | Evidence |
|------------|---------|---------|----------|
| **Dual Pillow stacks** | G4-09 assistant (EW) | `@empireai/pillow` host (HTTP) | No EW client for `/api/pillow`; explicit supervisor note: NL not wired |
| **Dual approval systems** | G5 PillowApprovalRouter | pillow-approval ApprovalGateEngine | No cross-import; separate queues |
| **Dual executive council** | `executive_council.*` Brain tools | pillow-executive-council HTTP | Parallel implementations |
| **G2 commerce → Brain** | infrastructure-commerce services | Brain tool registry | Zero Brain imports; no `tools/` directory |
| **G2 commerce → EKLS** | G2 test record functions | G2 service paths | `record*Ekls*` in tests only |
| **G7 ops → Cockpit** | G7 Brain tools (10 modules) | module-routes.ts | grep: no `grand-king-commerce` routes |
| **G5 outcomes → EKLS** | automation-outcome-store | canonical EKLS observation stores | Parallel pillow-governed store |
| **SCR-600 → reality-integration** | Integrations panel | `reality_integration.dashboard` | Simplified connector list vs full EAR |
| **Registry metadata drift** | G8 loaders (12 IDs) | `FOUNDATION_WIRED_REGISTRY_IDS` | Loaded but tagged placeholder |
| **Sandbox/live mismatch** | SCR-300–304 Brain (live) | `cockpitScreenDataModes` (sandbox) | UI badges disagree with wiring |
| **Automation workers** | Brain worker pool | `buildApp()` defaults | `startWorkers: false` |

---

## 4. Capabilities That Are Placeholder / Demo / Sandbox

| Area | Capability | Evidence |
|------|------------|----------|
| Pillow | NL reasoning in supervisor | `cockpit-panel-views.ts` L1141–1142 explicit stub |
| Pillow | G4-09 `futureChannels` | Listed in `cockpit-global-assistant.ts`; not wired |
| Cockpit | Workforce SCR-500+ | `workforceDemoData.ts` |
| Cockpit | Infrastructure SCR-600+ (partial) | `infrastructureDemoData.ts` |
| Cockpit | Governance policies SCR-700 | Static demo; "Policy engine Brain dispatch is not wired" |
| Cockpit | Governance council/risks SCR-701/703 | "Capability not yet implemented" |
| Cockpit | SCR-300–304 data mode badges | `sandbox` in KPI registry despite live Brain |
| Registry | ~22 placeholder IDs | `buildPlaceholderNotice` in loader |
| Registry | 2 derived views | activation/readiness snapshots deferred |
| Registry | Plugin row injection | Manifest-only register |
| EKLS | vector_memory, feature_store, model_store, etc. | `architecture` or `reserved` data modes |
| Reality | Connector live API calls | Structural validation only in sandbox default |
| Commerce | LIVE_COMMERCE_INTEGRATION_MODE | Default `sandbox` |
| Automation | In-memory workflow/approval stores | Production persistence = deploy concern |
| G8 | In-memory auth/credential stores | G8-10 condition |

**These are not "missing" — they are explicitly scoped as sandbox/demo/deferred in V1.**

---

## 5. Capabilities Genuinely Missing

Only capabilities with **no repository implementation** qualify here.

| Missing capability | Notes |
|--------------------|-------|
| empireai-web client for `/api/pillow/*` | No HTTP client; primary product integration gap |
| Brain dispatch bridge to pillow-host chat | No `pillow_host.*` tools |
| Unified approval queue (G5 + Cursor pillow-approval) | Two systems; neither merged |
| infrastructure-commerce Brain tools | G2 certified but no tool module |
| G7 Grand King ops module routes | Tools in Brain; routes absent |
| Cockpit Guardian dashboard SCR | HTTP API exists; no UI |
| Reality integration EKLS recording | No EKLS in module |
| Eye-series EKLS recording | No EKLS in module |
| Backend voice channel for Pillow | Browser Web Speech only |
| Automated route↔tool integrity checker | Partial test coverage only |
| PROOF-001 live verified revenue | Business outcome; not software |

**Count discipline:** 11 genuinely missing items. Everything else is built, hidden, disconnected, or placeholder.

---

## 6. Capabilities That Should Never Be Rebuilt

Rebuilding these would violate Version 1 Lock and create parallel ownership.

| Never rebuild | Reason | Canonical owner |
|---------------|--------|-----------------|
| EKLS governance gateway | Certified G0/G5/G6/G7/G8/V1-LOCK | `orchestration/pillow/ekls/` |
| G5 Pillow approval router | Certified G5-05 | `business-automation/approval/` |
| G8 isolation brain gateway | Certified G8-08 | `multi-workspace-isolation/` |
| G4-09 Global AI Assistant | Certified G4-09; Cockpit shell | `cockpit-global-assistant` |
| G4-07 interaction layer | Certified AI interaction | `cockpit-interaction-layer.ts` |
| Registry loader (EA-003) | Certified G1 | `registry/registry-loader.ts` |
| Guardian dispatch gate | Certified safety layer | `guardian/guardian-engine.ts` |
| G8 Authorization Centre | Certified G8-05 SCR-304 | `authorization-centre/` |
| Version Lock Doctrine | Certified V1-LOCK | `empire-version-governance/` |
| `@empireai/pillow` package core | PILLOW-002→019 runtime complete | `pillow/src/` |
| Executive intelligence engines (G3) | Certified G3-01→10 | Domain view services |
| Cockpit SCR registry & navigation | Certified G4 REAL-079/080 | `empireai-web/lib/cockpit/navigation.ts` |

**Rule:** Extend and wire. Never duplicate.

---

## 7. Capabilities That Should Be Deleted If Duplicated

Candidates for **removal or archival** after merge verification — not immediate deletion without Grand King approval.

| Duplicate | Keep (canonical) | Retire candidate | Condition for deletion |
|-----------|------------------|------------------|------------------------|
| GC-05 legacy global-assistant HTTP | G4-09 `cockpit-global-assistant` | `backend/src/global-assistant/` | After confirming zero consumers |
| Legacy frontend Pillow UI | empireai-web G4-09 shell | `frontend/src/pages/dashboard/PillowChatPage.tsx` + pillow components | After EW connects to pillow-host OR Brain bridge |
| `executive-council` Brain tools (if redundant) | pillow-executive-council HTTP path OR unified Brain module | Whichever path is not chosen in merge | After council unification decision |
| Standalone demo panels superseded by engine panels | `CommerceEnginePanels`, `IntelligenceEnginePanels` | `CommerceMarketingPanel.tsx`, orphaned `*DemoData.ts` files | After confirming no imports |
| Legacy `/platform/*` page files | Cockpit routes + 308 redirects | `app/(platform)/platform/*` pages | Optional — redirects work; pages are dead code |
| `version-1-activation` orchestration duplicate | `empire-activation` | `orchestration/version-1-activation/` | Verify exports; merge if duplicate |

**Do not delete** `pillow-host`, `pillow-approval`, or `@empireai/pillow` — these are the product runtime, not duplicates of governance Pillow.

---

## 8. Capabilities That Should Be Merged

Merges are **integration actions** (future, not this mission) — listed here as architectural guidance.

| Merge | Into | Rationale |
|-------|------|-----------|
| G4-09 assistant chat transport | pillow-host `/api/pillow/chat` OR Brain proxy to host | Single NL entry point in empireai-web |
| G5 PillowApprovalRouter outcomes | pillow-approval ApprovalGateEngine queue | Single King's Approvals surface (SCR-801 + SCR-303) |
| executive_council Brain tools | pillow-executive-council service | One council path |
| G5 automation-outcome-store | canonical EKLS observation stores | One institutional memory write path |
| G2 service EKLS calls | existing G2 test-proven record functions | Activate what tests already prove |
| SCR-600 integrations panel | reality_integration.dashboard + operational-access EAR | One integrations truth |
| G7 Brain tools | module-routes.ts entries | Cockpit can dispatch live ops |
| G8 Brain tools (beyond auth centre) | module-routes.ts entries | Optional Cockpit surfaces |
| Registry G8 wired metadata | FOUNDATION_WIRED_REGISTRY_IDS | Fix misclassification only |
| Legacy frontend Pillow clients | empireai-web API client layer | One frontend stack |

**Merge principle:** Connect certified modules. Do not create new modules.

---

## 9. Dependencies

Completion ordering is constrained by these verified dependencies.

```
                    ┌─────────────────────────┐
                    │   Grand King authority   │
                    │  (approvals, version)    │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   Governance Pillow      │
                    │  (EKLS gateway — DONE)   │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
    ┌─────────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
    │  G4-09 Shell     │ │ pillow-host │ │ G5/G8 routers  │
    │  (EW — DONE)     │ │ (HTTP — DONE)│ │ (Brain — DONE) │
    └─────────┬────────┘ └──────┬──────┘ └───────┬────────┘
              │                 │                 │
              └────────────┬────┴─────────────────┘
                           │
              ┌────────────▼────────────┐
              │  CONNECT (missing link)  │
              │  EW ↔ pillow-host/Brain  │
              └────────────┬────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
  ┌──────▼──────┐  ┌───────▼──────┐  ┌──────▼──────┐
  │ Live creds  │  │  Production  │  │  Unified    │
  │ REAL-002B   │  │  persistence │  │  approvals  │
  └──────┬──────┘  └───────┬──────┘  └──────┬──────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
              ┌────────────▼────────────┐
              │  SCR sandbox→live promo │
              │  SCR-303/304/300–302    │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  PROOF-001 live revenue │
              │  (business outcome)     │
              └─────────────────────────┘
```

### Dependency table

| Step depends on | Blocker |
|-----------------|---------|
| Product Pillow NL in Cockpit | EW transport decision (HTTP vs Brain proxy) |
| SCR-304 live mode | Production OAuth credentials (REAL-002B) |
| SCR-303 live mode | Production automation persistence |
| Unified approvals | Merge policy decision (G5 vs pillow-approval) |
| G2 Brain tools | None — can add routes to existing services |
| G7 Cockpit surfaces | module-routes registration (no new code in G7) |
| PROOF-001 | Live creds + commerce publish path (CRT-002) |
| Pillow production mode | `EMPIRE_V1_OPERATIONAL_READY=true` + live proof |
| DNS live site | External — not repository |

### What does NOT block Pillow completion

- Version 2.0 designation
- New REAL programmes (including REAL-093 — **not started, not in scope**)
- Architecture redesign
- Rebuilding governance Pillow
- New EKLS gateway

---

## 10. Smallest Possible Implementation Sequence to COMPLETE Pillow

This is an **analysis sequence** — not implementation missions. Each step uses **existing code** only. Grand King authorization required before any step that changes production behaviour.

### Phase 0 — Verify (no code)

| Step | Action | Outcome |
|------|--------|---------|
| 0.1 | Accept dual-stack model: governance Pillow = done; product Pillow = connect | Prevents rebuild |
| 0.2 | Confirm empireai-web as sole V1 frontend | Retire legacy frontend path |
| 0.3 | Read `PILLOW_ARCHITECTURE_CONTRACT.md` + Version Lock Doctrine | Alignment check |

### Phase 1 — Connect product Pillow to Cockpit (smallest product gap)

| Step | Action | Existing assets used | Does NOT create |
|------|--------|---------------------|-----------------|
| 1.1 | Add empireai-web HTTP client for `/api/pillow/chat` (or stream) | pillow-host routes already in `app.ts` | New NL engine |
| 1.2 | Wire G4-09 panel "full reasoning" mode to client | `GlobalAiAssistantPanel.tsx`, host API | Parallel assistant |
| 1.3 | Surface pillow-host health in SCR-800 Development Pillow | Existing `/api/pillow/health`, supervisor view | New supervisor |
| 1.4 | Enable supervisor NL by delegating to host | `loadPillowSupervisorView` + host session | New package code |

**Completion criterion:** Grand King can hold NL Pillow conversation inside empireai-web Cockpit without legacy frontend.

### Phase 2 — Unify governance surfaces (smallest merge gap)

| Step | Action | Existing assets used | Does NOT create |
|------|--------|---------------------|-----------------|
| 2.1 | Bridge G5 approval router events to pillow-approval repository read path | Both stores exist | Third approval system |
| 2.2 | Show unified queue on SCR-801 + SCR-303 | Existing panels | New approval engine |
| 2.3 | Bridge G5 outcome store writes to canonical EKLS | G5-08 store + EKLS gateway | New memory system |

**Completion criterion:** One visible approval queue; one EKLS write path for automation outcomes.

### Phase 3 — Promote sandbox Cockpit surfaces (configuration, not architecture)

| Step | Action | Existing assets used | Does NOT create |
|------|--------|---------------------|-----------------|
| 3.1 | Promote SCR-304 when live OAuth creds connected | G8 auth centre already Brain-live | New auth framework |
| 3.2 | Promote SCR-303 when persistence configured | G5 automation centre already Brain-live | New automation engine |
| 3.3 | Update `cockpitScreenDataModes` to match Brain reality | `kpis/registry.ts` | New screens |
| 3.4 | Fix G8 registry wired metadata (12 IDs) | Loader already returns rows | New registry |

**Completion criterion:** UI data modes reflect actual Brain wiring.

### Phase 4 — Connect hidden Brain tools to Cockpit (routing only)

| Step | Action | Existing assets used | Does NOT create |
|------|--------|---------------------|-----------------|
| 4.1 | Register G7 Grand King ops in `module-routes.ts` | Tools already in `brain/index.ts` | New G7 code |
| 4.2 | Point SCR-600 at `reality_integration.dashboard` | Both modules exist | New integration hub |
| 4.3 | Wire governance policy panel to existing policy Brain tools | `policy-engine` tools exist | New policy engine |
| 4.4 | Optional: G2 infrastructure-commerce Brain tool registration | G2 services exist | New G2 architecture |

**Completion criterion:** Hidden Brain capabilities reachable from Cockpit dispatch.

### Phase 5 — Retire duplicates (after Phases 1–4 verified)

| Step | Action | Condition |
|------|--------|-----------|
| 5.1 | Archive legacy `frontend/` Pillow pages | Phase 1 verified |
| 5.2 | Remove GC-05 global-assistant HTTP if unused | Zero consumer grep |
| 5.3 | Consolidate executive council to single path | Phase 2 decision |
| 5.4 | Remove orphaned demo panel files | Engine panels confirmed sole consumers |

### Phase 6 — Production Pillow (external + config)

| Step | Action | Blocker type |
|------|--------|--------------|
| 6.1 | DNS → Vercel | External |
| 6.2 | Live credentials (REAL-002B) | External |
| 6.3 | Set `EMPIRE_V1_OPERATIONAL_READY=true` | Grand King + live proof |
| 6.4 | Enable pillow production mode gate | Step 6.3 |

**Pillow is COMPLETE when:** Governance Pillow (Phase 0 confirmed done) + Product Pillow NL accessible in empireai-web (Phase 1) + Unified approvals (Phase 2) + Sandbox surfaces honest or promoted (Phase 3) + No duplicate stacks (Phase 5).

---

## Appendix A — Pillow Completion Definition

| Layer | Complete when |
|-------|---------------|
| **Governance Pillow** | ✅ Now — EKLS gateway, G5/G6/G8/version validators operational |
| **Operating Shell Pillow** | ✅ Now — G4-09 panel, voice, session on all Cockpit routes |
| **Product Pillow** | NL `@empireai/pillow` accessible from empireai-web without legacy frontend |
| **Unified Pillow** | Single approval queue; single council path; single EKLS write path for automation |
| **Production Pillow** | Live creds + production mode gate + Grand King authorized |

---

## Appendix B — Subsystem Reconciliation Headlines

| Subsystem | Verdict | Pillow relevance |
|-----------|---------|------------------|
| Brain | Mostly COMPLETE | Dispatch hub for G4-09; missing G2/G7 routes |
| Cockpit | Mixed live/demo | G4-09 = Pillow shell; workforce/infra/governance = demo |
| Registry | COMPLETE with drift | Fix G8 wired metadata only |
| Guardian | COMPLETE | No Pillow overlap; hidden API |
| EKLS | COMPLETE core | G2/G5 bridges needed |
| Commerce | G2 DISCONNECTED | Not Pillow-blocking |
| Automation | COMPLETE | Pillow approval router done; unify with host |
| Identity (G8) | COMPLETE | Pillow governance done |
| Reality Integration | DISCONNECTED Cockpit | SCR-600 merge |
| Business Engines | HIDDEN | Not Pillow-blocking |

Full matrix: `artifacts/repository-capability-matrix.md`

---

## Appendix C — What This Plan Explicitly Excludes

Per mission directive:

- ❌ No new architecture or subsystems
- ❌ No G0–G8 redesign
- ❌ No Version 2.0 work
- ❌ No REAL programme creation (including REAL-093)
- ❌ No implementation mission documents
- ❌ No dozens of follow-up missions
- ❌ No runtime code changes in this mission

---

## Certification

| Field | Value |
|-------|-------|
| Mission | Pillow Completion Programme |
| Type | Analysis & reconciliation only |
| Code modified | None |
| Baseline | EmpireAI Version 1 Build & Hierarchy Bible |
| Pillow governance status | COMPLETE |
| Pillow product status | BUILT BUT DISCONNECTED from empireai-web |
| Recommended first connect | Phase 1 — EW client to existing `/api/pillow/chat` |
| Grand King action required | Approve connect-vs-rebuild policy before any implementation |

---

*Pillow Completion Master Plan · Repository reconciled 2026-07-03 · Version 1.0 LOCKED baseline*
