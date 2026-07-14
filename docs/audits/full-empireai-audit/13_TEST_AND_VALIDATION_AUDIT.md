# 13 — Test and Validation Audit

**Total test files (`*.test.ts`):** 285  
**Backend validation tests:** 256 (`backend/src/validation/tests/`)  
**Pillow package tests:** ~29 (`pillow/src/validation/tests/`)  

---

## Test Architecture

**Runner:** Node test harness via `backend/package.json` scripts (`test`, `validate`, `validate:full`)  
**Not conventional Jest unit tests** — integration/validation specs against Brain modules.

**Typecheck:** `tsc --noEmit` on backend, frontend, empireai-web, pillow.

---

## Test Categories (Backend)

| Category | Approx count | Examples |
|----------|-------------:|---------|
| G2 commerce integration | 10 | `g2-01-commerce-registry-foundation.test.ts` |
| G3 intelligence engines | 11 | `g3-01-product-intelligence-engine.test.ts` |
| G5 automation / Pillow approval | 10 | `g5-05-pillow-approval-router.test.ts` |
| G6 production certification | 11 | `g6-10-final-production-readiness-certification.test.ts` |
| G7 Grand King live ops | 11 | `g7-10-grand-king-live-operations-certification-version-1-launch.test.ts` |
| G8 identity / authorization | 11 | `g8-10-identity-authorization-production-readiness.test.ts` |
| Intelligence engines (misc) | 51 | `pricing-intelligence`, `marketing-campaign-intelligence` |
| Eye connectors | 7 | Amazon, Google Trends |
| Cockpit / Executive Home | 5+ | `executive-home-loader.test.ts`, `cockpit-panel-views.test.ts` |
| Pillow host | 4+ | `pillow-host`, `pillow-governance-knowledge` |
| Empire V1 lock / activation | 7 | `empire-version-1-lock`, `empire-v1-activation` |
| Auth verification | 1 | `auth-verification.test.ts` |
| REAL / reality | 4 | `reality-002a`, `reality-002b` |
| Foundation / domain | 10+ | `foundation`, `domain`, `guardian` |
| Live commerce (Stripe/CJ) | 7 | `stripe-webhook-verification`, `cj-order-fulfillment` |
| Remaining mission-specific | 80+ | Various REAL and orchestration tests |

---

## Pillow Package Tests

| Test file | Subsystem |
|-----------|-----------|
| `bootstrap.test.ts` | Bootstrap |
| `repository-intelligence.test.ts` | Phase 2 |
| `repository-intelligence-certification.test.ts` | Phase 2 cert |
| `technical-chief.test.ts` | Phase 3 |
| `ux-designer.test.ts` | Phase 4 |
| `cursor-bridge.test.ts` | Phase 5 |
| `infrastructure-commander.test.ts` | Phase 6 |
| `commerce-intelligence.test.ts` | Phase 7 |
| `empire-commander.test.ts` | Phase 8 |
| `empire-operating-system.test.ts` | Phase 9 |
| `continuous-evolution.test.ts` | Phase 10 |

---

## Production Verification Scripts (Not unit tests)

| Script | Purpose | Last known result |
|--------|---------|-------------------|
| `production-journey-verify.mjs` | Single journey login→Pillow | PASS (post 62705a9) |
| `production-long-run-stability.mjs` | 3 cycles + rapid re-login | PASS (post 9e51bc7) |
| `verify-production-deploy.mjs` | Deploy smoke | Documented in npm script |
| `g4-05b-auth-http-verification.ts` | Auth HTTP proof | Evidence JSON exists |

---

## Certification Logic

**G6 framework** defines production certification ladder — tests assert framework compliance, not live production state alone.

**V1 lock tests:** `empire-version-1-lock.test.ts`, `v1-absolute-completion.test.ts`

**Pillow completion:** `empire-pillow-completion.test.ts`

---

## Gaps: Automated Tests vs Grand King Browser Reality

| Area | Automated | Browser |
|------|-----------|---------|
| Login path | ✅ Same BFF route | 🟡 UI error messages generic on 504 |
| Executive Home | ✅ Dispatch test | 🟡 Loading UX |
| Pillow chat | ✅ 3 messages | 🟡 King confirmation pending |
| Long-run stability | ✅ 3 cycles | 🟡 Extended idle not tested >15s gaps only |
| Cockpit panel wiring | 🟡 Partial unit tests | Many panels placeholder |
| Cursor live missions | ❌ Dry-run only | Not browser tested |
| Extension module HTTP | ❌ Off in production | Not tested live |
| Multi-tab / SSE stress | ❌ | Not tested |

---

## TODO/FIXME in Source

| Location | Count |
|----------|------:|
| `backend/src` | 0 |
| `empireai-web` | 0 |
| `pillow/src` | 0 |

Debt marked via `@deprecated`, stubs, and "not yet implemented" UI strings instead.

---

## Test Health Summary

| Dimension | Assessment |
|-----------|------------|
| Breadth | **Exceptional** — 285 files, programme-aligned |
| Depth on production path | **Good** — journey + stability scripts |
| Cockpit E2E (Playwright/Cypress) | **Not found** |
| Browser vs API parity | **Improved** but King sign-off gap |
| Test vs production config drift | **Present** — tests hit production URLs; extension routes differ from full module test assumptions |
