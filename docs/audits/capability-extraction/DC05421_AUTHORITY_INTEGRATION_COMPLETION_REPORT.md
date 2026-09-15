# DC-05421 — Production Authority + Shadow CEO Control-Plane Integration

**Status:** AUTHORITY AND CONTROL-PLANE INTEGRATION READY — AWAITING ONE NARROW GRAND KING INTEGRATION PROOF

**WAVE_CREDIT=0 · Wave 1=0/24 · Birth=NOT_BORN · Real commerce=locked · SC-01=FROZEN**

## Root cause (WS1)

`isCommercialArithmeticAsk` treated supplied Order A/B/C contributions as unit-econ compute → `computeCommercialContribution` demanded selling price → UNKNOWN / “Need: selling price” injected via `synthesizeCommercialArithmeticAnswer` / `repairAnswerWithCalculator` / task-contract arithmetic branch → exact four-line contract lost.

## Authority graph (WS2)

| Tier | Owner | Fields |
|------|--------|--------|
| A | `executive-fact-precedence` | Supplied Order contributions |
| B | `canonicalOperatingProjection` | SYNTHETIC, NOT_BORN, unauthorized |
| C | sum of A | Total synthetic contribution |
| E | LLM | Subordinate when typed contract applies |
| F | Safety appenders | May restrict; must not rewrite A–C |

## Typed contract (WS3)

`projectExactLineResponseContract` → exact four lines; fail-closed `PILLOW_RESPONSE_CONTRACT_BLOCKED`. Hooked in `pillow-host.routePrompt` before LLM; release-gate also re-projects.

## Shadow CEO (WS4)

Existing chat admission preserved; challenger proves full lineage + idempotency. **No SC-01 episode run.**

## Challenger (WS6)

**20/20 PASS** — `DC05421_WS6_CHALLENGER_RESULTS.json`

## Local tests

commercial-arithmetic-lock + shadow-ceo-chat-admission + dc05421-response-contract: **30/30 PASS**

## Production

| Field | Value |
|---|---|
| RUNNING_SHA | `aa0455421fffa3ec82dd970f5d4adb3e02ae4255` |
| DEPLOYMENT_ID | `27d11468-6353-4c6d-9ab3-9ab90925f366` |
| requestId | `pcr_f55e914138fb4165` |
| kind | `response_contract` |
| exact four-line match | YES |
| SELLING_PRICE invoked | NO |
| ENGINEERING_PASS | YES (`DC05421_PRODUCTION_PROOF.json`) |

Prior `beaa5da2` deploy **FAILED** on TS2339 in `validateExactLineResponse`; fixed in `aa045542`.

## Diff hygiene (resume)

- Legitimate impl: already on `beaa5da2` + `aa045542` (typed contract, fact precedence, calculator guard, pillow-host hook).
- Accidental noise left unstaged: `.tmp-*`, unrelated `docs/audits/complete-state/*` churn, stale evidence JSON edits.
- Parallel workers: prior SC-01/forensic shells finished or killed; no active stall required for exit.

## Rollback

`git revert aa045542 beaa5da2` (or redeploy prior SUCCESS `dedd57a1` / SHA `a6aedae8`); redeploy Railway.

## Remaining risks

- P1: Corrected duplicate Order labels keep first-seen key.
- P1: Exact-line detector requires “exactly N lines” or four named template fields.
- SC-01 remains frozen until Grand King integration proof.

## Exit gate

**AUTHORITY AND CONTROL-PLANE INTEGRATION READY — AWAITING ONE NARROW GRAND KING INTEGRATION PROOF**

WAVE_CREDIT=0 · Wave 1=0/24 · Birth unauthorized · real commerce locked · Cursor does not certify Pillow · SC-01 does not restart.
