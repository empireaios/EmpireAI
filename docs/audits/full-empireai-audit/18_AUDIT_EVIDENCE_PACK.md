# 18 — Audit Evidence Pack

Exact files and paths used as evidence for audit conclusions.

---

## Repository Structure Evidence

- `backend/src/app.ts` — 160 route registrars, production earlyListen, extension route gating
- `backend/src/index.ts` — production boot flags, `EMPIRE_ENABLE_EXTENSION_ROUTES`
- `backend/src/brain/index.ts` — createBrain composition, Redis degraded mode
- `railway.toml` — Railway build/start/healthcheck
- `vercel.json`, `empireai-web/vercel.json` — dual frontend deploy
- `package.json` (root) — build:production script chain

---

## Documentation Evidence

- `EMPIREAI_REPOSITORY_MASTER_INDEX.md` — navigation spine
- `JOURNEY.md`, `EMPIREAI_STATUS.md` — operational state
- `EMPIREAI_SOUL.md` — Soul File
- `EMPIREAI_CORE_CONSTITUTION_CTD.md`, `EMPIREAI_CONSTITUTION.md`, `EMPIREAI_PILLOW_CONSTITUTION.md` — constitution stack
- `EMPIREAI_ROADMAP.md`, `PILLOW_ROADMAP.md` — roadmaps
- `artifacts/empireai-version-1-build-hierarchy-bible.md` — V1 bible
- `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` — normative architecture
- `docs/SYSTEM_ARCHITECTURE.md` — obsolete draft (conflict evidence)
- `docs/governance/EXECUTIVE_AUDIT_INDEX.md` — stale index (32 vs 38)
- `deployment/MANAGED_DEPLOYMENT.md` — production topology

---

## Mission History Evidence

- `git log --oneline` — 124 commits; REAL-101→135, Pillow phases, Phase 11 stability
- `COMBINED_EXECUTIVE_AUDIT_*.md` — 38 files at repository root
- `artifacts/g2-*` through `g8-*` — gate programme audits
- `.cursor/missions/pending/` — 19 pending mission files

---

## Pillow Evidence

- `pillow/package.json`, `pillow/src/index.ts` — package exports
- `pillow/src/validation/tests/*.test.ts` — phase 2–10 tests
- `backend/src/orchestration/pillow-host/pillow-host.ts` — productionFastPath lines ~485–503
- `backend/src/orchestration/pillow-host/routes/pillow-routes.ts` — HTTP surface, lazy boot
- `backend/src/orchestration/pillow-host/brain-llm-adapter.ts` — LLM routing
- `scripts/sync-pillow-governance.mjs` — Railway governance bundle

---

## Brain & Runtime Evidence

- `backend/src/brain/sqlite-database.ts` — debounced persist (commit 9e51bc7)
- `backend/src/brain/llm/llm-router.ts` — 45s LLM timeout
- `backend/src/runtime/event-loop-cooperative.ts` — lag monitor
- `backend/src/domain/services/executive-home-loader.ts` — cache, timeout, deprecated warmup
- `backend/src/config/env.ts` — default credentials, DATABASE_PATH, REDIS
- `backend/src/config/redis-client.ts` — degraded mode logic
- `backend/src/auth/session-store.ts` — Redis vs in-memory
- `backend/src/auth/routes.ts` — login flow

---

## Cockpit & UX Evidence

- `empireai-web/middleware.ts` — session gate, platform redirects
- `empireai-web/lib/brain/server-proxy.ts` — BFF timeouts
- `empireai-web/app/(cockpit)/cockpit/page.tsx` — Executive Home entry
- `empireai-web/components/cockpit/widgets/*Placeholder.tsx` — UX debt
- `frontend/src/routes/index.tsx` — dashboard redirect to cockpit

---

## Builder / Cursor Evidence

- `backend/src/orchestration/pillow-approval/cursor-bridge-adapter.ts`
- `pillow/src/cursor-bridge/`
- `EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md`
- `.cursor/missions/pending/bridge-*.md`

---

## Production Verification Evidence

- `backend/scripts/production-journey-verify.mjs` — automated journey
- `backend/scripts/production-long-run-stability.mjs` — 3-cycle stability PASS
- `artifacts/g4-05b-auth-verification-results.json`
- `artifacts/b6-*-evidence.json`

---

## Test Evidence

- Glob: `backend/src/validation/tests/*.test.ts` — 256 files
- Glob: `pillow/src/validation/tests/*.test.ts` — 29 files
- Grep: TODO/FIXME in backend/src, empireai-web, pillow/src — 0 matches

---

## Scan Statistics Evidence

PowerShell counts executed 2026-07-04:
- markdown=499, ts=7855, tests=285, artifacts=130, cursor=19, combined=38, commits=124

---

## Key Commit Evidence (Production Stability)

| Commit | File evidence |
|--------|---------------|
| `9e51bc7` | sqlite-database.ts, llm-router.ts, pillow-host.ts, production-long-run-stability.mjs |
| `62705a9` | operational-command-view.ts lite dispatch |
| `cf21c81` | app.ts extension route skip |
| `ea85685` | middleware stale cookie fix (empireai-web) |
| `5c2a41a` | pillow continuous-evolution phase 10 |

---

## INTENDED HIERARCHY CHECK (Not Repository Fact)

Mission brief hierarchy used as comparison reference only — no repository file defines Vision Integrity Engine or Execution Control Center.
