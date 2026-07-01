# G7 — King's Operation Preparation Programme

**Gate:** G7  
**Date:** 2026-06-21  
**Status:** PREPARED (simulation — no live spend)

## Missions completed in preparation chain

| Gate | Missions | Status |
|------|----------|--------|
| G4 | REAL-124–127 | Complete |
| G5 | REAL-128–133 | Complete |
| G6 | REAL-134–135 | Complete |
| G7 | This programme | Complete |

## Preparation checklist (B7 pre-flight)

| Item | Status | Evidence |
|------|--------|----------|
| Single Cockpit URL space | Ready | `/platform/*` → `/cockpit/*` middleware redirects (REAL-124) |
| Vite dashboard deprecated | Ready | `frontend/DEPRECATED.md`, route redirect (REAL-126) |
| Ledger-backed KPIs | Ready | `useLedgerKpiValues` + Brain `dashboard.load_view` (REAL-127) |
| Live PIE connector mode | Ready | `createProductIntelligenceConnectorRegistry()` (REAL-128) |
| Fulfillment sandbox/live split | Ready | `shouldUseDeterministicFulfillmentMocks()` (REAL-129/130) |
| Admin real metrics | Ready | `loadAdminView()` queries Brain DB (REAL-131) |
| Postgres migration path | Ready | `DATABASE_URL` + `npm run db:migrate:postgres` (REAL-132) |
| Integrations truth grid | Ready | `integrations.load_view` (REAL-133) |
| ActionButtons wired | Ready | Platform modules dispatch Brain actions (REAL-134) |
| Revenue smoke test | Pass | `cockpit-grand-king-revenue-smoke.test.ts` (REAL-135) |

## Blockers before B7 sign-off (King's approval required)

| Blocker | Description |
|---------|-------------|
| B6 | Production credentials (`CJ_DROPSHIPPING_API_KEY`, `AMAZON_SP_API_*`) not injected |
| B7 | Grand King explicit go-live signature not obtained |
| PROOF-001 | No verified live net profit event posted |

## Architecture certification

- Canonical IA preserved per REAL-080 (`/cockpit/*` only user-facing surface)
- PlatformShell and platform route files retained for rollback
- CockpitShell, CockpitDepartmentLayout, cockpitNavigation unchanged
- Brain dispatch remains single orchestration path

## Mission certification

All G4–G6 REAL missions validated:

- `empireai-web`: typecheck, lint, build — pass
- `backend`: typecheck — pass
- REAL-135 smoke: 2/2 tests pass

## Gate certification

**G7 — King's Operation Preparation: CERTIFIED (pre-live)**

System is architecturally ready for King's Operation (G8). Live execution requires B6 credentials and B7 approval before any real-world commerce actions.
