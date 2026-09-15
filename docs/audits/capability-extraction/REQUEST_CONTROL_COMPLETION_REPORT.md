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

## 14–20. Production proof (deployed)

| Field | Value |
|-------|--------|
| SHA | `e45cb0517e551b913df372ce623e6a3963adaadd` |
| Deployment | `fbba4c02-be53-4bf2-b042-da19ac4c0c91` SUCCESS |
| Health | worker online · brain online |
| Request | `pcr_ae5eb6e67e494b59` |
| Response | `Eligible candidates: Kestrel` / `Candidate selected: Kestrel` |
| Ownership | requestId `req_efb7210b19ff4173` · runKey `run_330ad7d960310cd12db61abf` · objectiveId `obj_5cc6d2e9ac45548f` · products Kestrel,Lumen,Morrow |
| Finance | spending/revenue/profit = 0 · ledgerMoved=false |
| Demo | none |

**Rollback:** `git revert e45cb051` (and `50e50e7d` if needed) then redeploy.

**Unresolved serious defects:** none in request-control path after production proof.

---

## PRODUCTION REQUEST CONTROL PASSED — AWAITING ONE SHORT GRAND KING TEST

WAVE_CREDIT=0 · Wave 1 remains 0/24 · Birth unauthorized · Real commerce locked · SC-01 frozen · Cursor cannot certify Pillow.
