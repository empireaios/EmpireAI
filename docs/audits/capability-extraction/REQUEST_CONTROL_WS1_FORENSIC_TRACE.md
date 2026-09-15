# REQUEST CONTROL — WS1 Forensic Trace

**Status:** Evidence preserved. Records not deleted.  
**WAVE_CREDIT:** 0  
**SC-01:** FROZEN  
**Birth:** unauthorized / NOT_BORN  
**Real commerce:** locked  

## Failed episode identifiers

| Kind | ID |
|------|-----|
| Objective | `obj_a599f5c610c9c8a3` |
| Correlation | `35e399b3-8cd1-410c-b3a7-fb383b9e3aaa` |
| Run key | `chat_62a734c28fc7ed18f2c9dfab` |
| Priority | `pri_792ce1e538a48d30` |
| Priority | `pri_d8257e59225f073b` |
| Task | `tsk_b014c846b4d1cfee` |
| Task | `tsk_ec0da0e125ea5b6f` |
| Decision | `dec_c6a447d01aeee220` |
| Action | `act_4704ba9a177a4d1e` |
| Action | `act_c038935136508541` |
| Approval | `apr_3dedfbdc043f1501` |
| Lesson | `les_e52970e526c66463` |

## Root cause (plain English)

Pillow admitted the Grand King chat into Shadow CEO, then **ignored the supplied candidates** and executed the **built-in vertical-slice demo** (Amazon US fixture catalog + fulfilment monitor + supplier-spend approval + synthetic ledger). The Grand King’s Kestrel / Lumen / Morrow facts never became the episode’s product set.

## Trace answers

1. **Where the request entered:** `POST /api/pillow/chat` → `pillow-host.ts` Shadow CEO admission hook → `admitAndExecuteShadowCeoFromChat` (`chat-admission.ts`).
2. **Where Kestrel/Lumen/Morrow disappeared:** Immediately inside `admitAndExecuteShadowCeoFromChat` — the message was stored as `objectiveStatement` text only; products were never bound. `inspectSyntheticState()` replaced assessment with fixture state.
3. **Why the built-in catalog replaced them:** `inspectSyntheticState()` always calls `seedSyntheticAmazonUsCatalog()` from `synthetic-commerce/fixtures.ts`.
4. **Why fulfilment / supplier-spending were created:** `runVerticalSliceDemo` (`control-plane.ts`) hardcodes those two tasks and the blocked spend approval + authorized monitor action.
5. **Where US$6.87 came from:** Chat admission ran `computeProfitLedger` on the first eligible fixture product (desk-fan economics). Fixture experiments also label `predictedContributionUsd: 6.87` in `fixtures.ts`.
6. **Why the answer format was ignored:** `formatSourceBackedBrief` always emitted the generic “Shadow CEO Executive Brief (source-backed)” prose.
7. **Old run / Redis mix?** No — this was same-request **demo substitution by design**, not cross-request Redis contamination.
8. **Retry/singleton mix?** Not required for this failure; idempotent `runKey` replayed the same demo episode.
9. **Exact functions:** `detectShadowCeoOperatingIntent`, `inspectSyntheticState`, `admitAndExecuteShadowCeoFromChat`, `formatSourceBackedBrief`, `runVerticalSliceDemo`, `seedSyntheticAmazonUsCatalog`, pillow-host Shadow CEO hook.

## Preservation

Failed IDs above remain evidence. Repair must not delete them.
