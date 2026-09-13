# HELIOS W1-T1 — Single Visible Decision Authority Closure

**Status:** ENGINEERING PASS ONLY — AWAITING ONE UNSEEN GRAND KING W1-T1  
**WAVE_CREDIT:** 0 · **Wave 1:** 0/24 · **T2:** prohibited · **Birth:** unauthorized

---

## 1. Parallel workstreams

| WS | Focus | Finding |
|---|---|---|
| 1 | Helios production-path forensic | GK `Supplier Name:` packs never entered DecisionCase; false candidate `Approval` from `approval: pending` → empty eligible + DO_NOT_SELECT; LLM still selected Ember |
| 2 | Decision-authority graph | Canonical owner: `buildDecisionCaseState` / DecisionCaseState. Competing writers: synthesizers, `repairDecisionVisibility`, LLM prose, conversation-surface UNKNOWN→unproven, scope/verification appenders |
| 3 | Bounded vs live contamination | Absent DecisionCase facts → UNKNOWN gates → user-visible `unproven`; live-verification language from execution-plan scope lines on bounded commercial asks |
| 4 | Preservation / false parity | Local qualify ≠ Grand King path. Prior W1-T1 qualify used bare `Nova:` packs → Helios GK envelope escaped. Local preservation 12/12 scripts + 89/89 locks PASS |
| 5 | Adversarial design (held) | `HELIOS_W1T1_ADVERSARIAL_CASES_HELD.json` — released to runner only after implementation |

**Integration owner:** single parent agent after WS evidence; runtime Helios path authoritative.

---

## 2. Exact Helios production-path reproduction

- Envelope: cockpit `/api/pillow/chat` · SCR-800 · durable `pcr_*`
- Before (SHA `d945be34`): contradictory visible authorities — see `_TMP_HELIOS_W1T1_REPRO.json` attempt 2
- After (SHA `636f92ed`): `HELIOS_W1T1_PRODUCTION_VISIBLE_QUAL.json` ENGINEERING_PASS=true, kind=llm (stock-supersede follow-up SHA pending redeploy)

---

## 3. Root cause (runtime-backed)

1. **Parser gap:** `Supplier Ember:` headers not treated as candidates (qualify used bare `Name:` packs → false parity).
2. **False candidate:** gate field name `Approval` invented from `approval: pending` via commercial-body match.
3. **Empty DecisionCase** → synthesizers emit Eligible none + DO NOT SELECT ANY + UNKNOWN gates.
4. **Surface map:** `\bUNKNOWN\b` → `unproven` in conversation surface.
5. **LLM** independently reasoned Ember correctly → multi-authority contradiction.

---

## 4. Competing decision authorities

| Authority | Role |
|---|---|
| `buildDecisionCaseState` | Should own canonical decision |
| Bounded-decision synthesizer / repair | Was regenerating eligible/action from bad/empty state |
| LLM narrative | Independent eligibility/selection prose |
| Conversation surface | UNKNOWN→unproven rewrite |
| Scope / verification appenders | Live-EmpireAI / scenario-only tails |

---

## 5. Origin of each contradictory visible statement

| Phrase | Producer |
|---|---|
| Current Eligible set: none | DecisionCase empty set → synthesizer / repair |
| Supplier Ember (only eligible) | LLM prose (correct local reasoning) |
| Current action: DO NOT SELECT ANY | DecisionCase DO_NOT_SELECT → synthesizer |
| delivery/contribution/stock=unproven | UNKNOWN gates + surface rewrite |
| currentlyEligible=NO | Gate audit from UNKNOWN/empty DecisionCase |
| supplied scenario… not live… | Request execution-plan scope lines |

---

## 6. Why existing qualification missed it

W1-T1 qualify exercised **bare corridor packs** (`Nova:`), not Grand King **`Supplier Ember:`** headers. DecisionCase looked healthy in-process while the production Helios envelope never built a real candidate set.

---

## 7. Files / components changed

- `backend/src/orchestration/pillow-host/executive-decision-case-state.ts` — Supplier/Option headers; reserved gate-field names; fail-closed eligible visibility; **stock supersede** parity with delivery
- `backend/src/validation/tests/w1-t1-decision-state-propagation.test.ts` — Helios-shaped case
- `backend/scripts/w1-t1-decision-state-qualify.mjs` — Helios envelope block
- `backend/scripts/helios-w1t1-visible-decision-production.mjs` — cockpit visible consistency
- `backend/scripts/helios-w1t1-adversarial-local.mjs` — held adversarial runner
- Evidence under `docs/audits/capability-extraction/HELIOS_W1T1_*`

Commits: `636f92ed` (Supplier-header authority) · `8a25a4a4` (stock supersede + evidence)

---

## 8. New canonical decision data flow

```
supplied message
  → parse rules + candidates (Supplier|Option|… headers; reserve gate names)
  → evaluate gates once (delivery + stock later-corrected supersede)
  → DecisionCaseState { eligibleSet, selection, exclusions, counterfactual… }
  → presentation / synthesizers / repair / appenders CONSUME only
  → fail-closed visible consistency before release
```

No downstream component may independently recompute eligibility, selection, recommendation, or action.

---

## 9. Helios visible output — before vs after

**Before (`d945be34`, GK path):** Eligible set none + select Ember + DO NOT SELECT ANY (see `_TMP_HELIOS_W1T1_REPRO.json`).

**After (`e2c473b0`, cockpit SCR-800, `pcr_f6613d18dcf341cc`):**  
`Current Eligible set: Ember` · Select Ember · Flint excluded for 8-day delivery · Grove CF → Grove · no `DO NOT SELECT ANY` · no unproven gate tail · no live-verification overturn. Full text in `HELIOS_W1T1_PRODUCTION_VISIBLE_QUAL.json`.

Prior intermediate PASS also recorded on `636f92ed`.

---

## 10. Adversarial test groups

Local runner after stock fix: **14/14 held PASS** · ENGINEERING_PASS=true · WAVE_CREDIT=0  
Gaps: groups 14 (real live-action governance) and 16 (redeploy re-entry) exercised via preservation/transport suites, not duplicated in held pack IDs.

---

## 11. Preservation regression

Local: 11/11 classes PASS (12 qualify scripts + 89 lock tests).  
Prod-path parity remains non-certifying; durable delivery architecture preserved by non-interference with Tier-0 `pcr_*` path.

---

## 12. Production-equivalent path evidence

Cockpit login → forceNew session → SCR-800 chat → durable request id → full visible message checks.

---

## 13. Deployment SHA / health

- **Live production tip:** `e2c473b0fdb7b9403f48026f2f0ebe1dd2d72315`
- **Deploy ID:** `50b16ced-abc8-482a-bb5a-b3fd9ed86c7f`
- Health: ok · brain online · redis connected
- Intermediate: `636f92ed` (Supplier-header authority, Helios visible PASS) · `8a25a4a4` (stock supersede — build failed TS) · `e2c473b0` (TS null-guard, live)
- Helios cockpit repro on tip: `pcr_f6613d18dcf341cc` · ENGINEERING_PASS=true · WAVE_CREDIT=0
- Failed deploy `17a61fb9` (`8a25a4a4`) blocked by TS2322; superseded by `e2c473b0`

---

## 14. Unresolved weaknesses

- Held pack omits explicit IDs for real live-action governance + redeploy re-entry (covered indirectly).
- Cursor/local ENGINEERING_PASS ≠ Wave certification.
- Contribution supersede not generalized beyond delivery/stock (only required stock/delivery corrections for this mission).

---

## 15. Honest status

**ENGINEERING PASS ONLY — AWAITING ONE UNSEEN GRAND KING W1-T1**
