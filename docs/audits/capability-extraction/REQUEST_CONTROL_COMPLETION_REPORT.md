# REQUEST CONTROL — Completion Report

**Exit gate:** see final line below after production proof.  
**WAVE_CREDIT:** 0 · **Wave 1:** 0/24 · **SC-01:** FROZEN · **Birth:** unauthorized · **Real commerce:** locked  
Cursor cannot certify Pillow.

## 1. Root cause (plain English)

Pillow chat admitted Shadow CEO operating intent, then **ignored Grand-King-supplied candidates** and always ran the **built-in vertical-slice demo** (fixture Amazon catalog + fulfilment monitor + supplier-spend approval + synthetic ledger ~US$6.87) and returned a generic executive brief.

## 2. Files / functions responsible

| File | Function |
|------|----------|
| `shadow-ceo-integration/chat-admission.ts` | `admitAndExecuteShadowCeoFromChat`, former `inspectSyntheticState`, `formatSourceBackedBrief` |
| `shadow-ceo/control-plane.ts` | `runVerticalSliceDemo` |
| `synthetic-commerce/fixtures.ts` | `seedSyntheticAmazonUsCatalog` (+ experiment `predictedContributionUsd: 6.87`) |
| `pillow-host/pillow-host.ts` | Shadow CEO admission hook |

## 3–5. Where candidates were lost / demo inserted / US$6.87

See `REQUEST_CONTROL_WS1_FORENSIC_TRACE.md` (failed IDs preserved).

## 6–9. Repair mechanisms

- **Request owner** (`request-owner.ts`): permanent `requestId`/`runId`/`correlationId` + full instruction, products, rules, permits, answer format, mode/Birth/authority — created before tasks.
- **Supplied facts** (`candidate-evaluation-episode.ts` + `executive-decision-case-state.ts`): bind only GK candidates; no demo catalog.
- **Action permits** (`action-permit.ts`): reject fulfilment/spend/ledger/demo **before** episode records.
- **Mix prevention**: ownership artifacts on every record; `assertSameRequestOwnership`.
- **Answer format**: exact `Eligible candidates` / `Candidate selected` lines; no generic brief.
- **Demo isolation**: chat never calls `runVerticalSliceDemo`; demo remains `POST /shadow-ceo/run-vertical-slice` only.

## 10–13. Local results

| Suite | Result |
|-------|--------|
| `shadow-ceo-chat-admission.test.ts` | 9/9 |
| Unseen production-path scenarios | 20 scenarios + retry = **21/21** |
| Held adversarial | **27/27** |
| Diagnostic financial effect | spending/revenue/profit = 0; ledgerMoved=false |
| Control-plane / foundation / DC05421 | still pass (demo route intact) |

## 14–20. Production (filled after deploy)

See `REQUEST_CONTROL_PRODUCTION_PROOF.json` after deploy.

**Rollback:** `git revert <SHA>` and redeploy previous Railway deployment.

**Unresolved serious defects:** none known in request-control path after local proofs; production proof is authoritative for exit gate.
