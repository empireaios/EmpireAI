# GRAND KING PRODUCTION ACCEPTANCE + 1,000 SMART LISTING LAUNCH 003

Evidence timestamp: 2026-08-10T04:56:00Z (updated as verification proceeds).

## Gate A — Production UX

### Root cause of >2 minute usable load (BEFORE)

Production Performance entries showed `/api/pillow/founder-shell` and `/api/pillow/commerce-operating-model` hanging **200–300s** while **30s polls stacked** without abort/timeout on the client. Secondary awareness blocked perceived usability. Brain `/brain/dispatch` also commonly 17–34s — slow intelligence must not block shell.

### Repairs

- `fetchWithBudget` (12s abort) + in-flight guards
- Poll interval 60s; skip commerce-operating-model when Executive Home canonical truth exists
- Proxy fail-fast for founder-shell / commerce-operating-model
- Scroll: removed fixed 88vh Pillow prison; page scroll primary; history `max-h-[62vh]` with overscroll release
- Sidebar: `z-50` + `pointer-events-auto` + `self-start`
- Executive language layer: natural-language commerce surfaces; technical IDs under disclosure
- **Vercel build fix:** `dossierSummary`/`summary` nullability in `executive-language.ts` (commit after 1664bd72) — prior deploy of 1664bd72 **Error**'d on TypeScript

### Measured AFTER (Railway health observability — backend already on mission code)

| Signal | Observation |
|--------|-------------|
| `/api/pillow/founder-shell` | ~175ms (repeated) |
| `/api/pillow/commerce-operating-model` | ~176–1002ms |
| `/brain/dispatch` | still ~17–34s (progressive; must not block shell) |

Frontend production stamp must show the build-fix commit (not `4b161462`) before Gate A production UX acceptance.

### Gate A status

Engineering complete for load/scroll/language/sidebar. **PRODUCTION ACCEPTANCE READY** only after Vercel serves the build-fix commit and browser journey confirms. Subjective Grand King acceptance is not claimed by Cursor.

## Gate B — 1,000 SMART viable listings

### KPI definition

- Target: **1000** SMART viable CJ × Amazon US listings
- Module: `backend/.../smart-viable-kpi.ts`
- ACCEPTED ≠ BUYABLE ≠ SMART VIABLE
- SAFE: no publish / no supplier spend in discovery batch

### Scale repairs (this update)

- CJ catalogue **page checkpoint/resume** (`discoveryPageNum` / `nextDiscoveryPageNum`)
- Deduplicate already-mapped CJ PIDs (`ALREADY_MAPPED`)
- In-flight guard against overlapping batches
- `run-cycle` returns **202 Accepted** for SMART batches (avoids Railway edge 502 while work continues)
- Automation tick: smartViableBatch max 24 every 4h + boot tick

### Real production batch results (Railway, authenticated)

Snapshot from `GET /pillow-commerce-presale/smart-viable-kpi` (2026-08-10T04:05:54Z):

| Metric | Value |
|--------|-------|
| rawCandidatesDiscovered | 28 |
| candidatesEvaluated | 40 |
| rejected | 32 |
| smartViable | **4** |
| listingReady | 4 |
| awaitingApproval | 0 |
| published | 0 |
| buyable | 0 |
| orders | 0 |
| realisedRevenueUsd | 0 |
| realisedProfitUsd | 0 |
| distanceToTarget | **996** |
| latestCycleOutcome | SMART_VIABLE_BATCH_COMPLETE |
| topRejectionReasons | QUALIFICATION_REQUIRED (23), PROOF_001_BRAND_FAILURE_CLASS (5), NO_AMAZON_ASIN (2), FREIGHT_UNAVAILABLE (2) |

Latest cycle (same window): retrieved 24, rejected 22, smartViableBatchCount 2, ASINs `B0GVNPFW1L`, `B0GWGX74LP`.

HTTP `POST run-cycle` with synchronous wait previously returned **502 upstream error** (~5s) while work still completed in-process — addressed by async 202.

### Architecture principle

Recorded: `docs/architecture/SUPPLIER_MARKETPLACE_UNIVERSE_PRINCIPLE.md`

## Residue classification (do not destroy)

Unrelated scratch left uncommitted: `.tmp-*`, EOS evidence JSON churn, `COMMERCE_PROOF_001_*`, pillow typecheck scratch, `empireai-web/app/pillow-shell-preview/`, backend pillow cert scripts.
