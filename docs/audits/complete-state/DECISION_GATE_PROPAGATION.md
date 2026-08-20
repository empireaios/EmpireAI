# DECISION-GATE PROPAGATION — FINAL REPORT

**FINAL_LIVE_QUALIFIED_SHA (code):** `60c42111f5006d2d4cd587d95b9ed22651993194`  
**Sealed:** 2026-08-21 ~01:20 +08:00  
**WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · BIRTH_AUTHORISED=NO**

Preserves Reasoning Core Simplification + Foundation Repairs 1–4.

---

## 1. Root cause

Independent T2 improved arithmetic / evidence / constraints / recommendation / structure / isolation, but failed a **systemic multi-gate class**:

Pillow correctly identified multiple binding blockers, then proposed next evidence that cleared **only one** gate and narrated it as capable of changing the recommendation while another independent gate remained FAIL.

Invariant violated: **CLEARING ONE BLOCKER ≠ DECISION UNLOCK**.

---

## 2. Canonical gate architecture

Integrated into simplified canonical state (`executive-canonical-state.ts` → `decisionActions`):

- Per action/candidate: `REQUIRED_GATES` with `PASS|FAIL|UNKNOWN`, `CURRENTLY_ELIGIBLE`
- Constraint classes extended: `PERFORMANCE_THRESHOLD`, `EXPENDITURE_CEILING` (+ authority/safety, operating evidence, capacity, economics, …)
- Brief injected via `formatCanonicalStateBrief` / task-contract prompt
- Core logic in `executive-decision-constraints.ts`: `buildActionEligibilityStates`, `evaluateEvidenceGateImpact`, `synthesizeNextEvidenceDecisionImpact`, `synthesizeReversalConditions`

Hard gates:

```
MULTI_GATE_STATE_CANONICAL=YES
CLEARING_ONE_GATE_NOT_FULL_UNLOCK=YES
NEXT_EVIDENCE_DECISION_IMPACT=YES
REMAINING_GATES_PROPAGATED=YES
REVERSAL_CONDITIONS_COMPLETE=YES
ELIGIBILITY_DISTINCT_FROM_PREFERENCE=YES
```

---

## 3. Next-evidence logic

Distinguishes uncertainty reduction vs single-blocker clear vs actual decision-state change.

If the ask is evidence that could **CHANGE** the recommendation and no single item clears all blockers: state that explicitly, name **REMAINING_GATES**, and offer highest-value next verification without pretending it unlocks the decision.

Release-gate repair uses the **owner ask** and appends canonical gate impact when the draft narrates a false unlock.

---

## 4. Reversal logic

`synthesizeReversalConditions` requires every currently binding gate = PASS **and** comparative preference among eligible options.

---

## 5. Eligibility vs preference

`ELIGIBLE ≠ BEST` in briefs, synthesizers, and birth lesson `birth.lesson.eligibility_ne_preference`.

---

## 6. Atomic results

`decision-gate-propagation-atomic.test.ts`: **100/100** + paired/multi PASS.

`DECISION_GATE_ATOMIC=100/100` · `PAIRED_PASS=YES` · `MULTI_VARIABLE_PASS=YES`

---

## 7. Full reasoning-ladder results

Local on `60c42111`:

| Suite | Result |
|-------|--------|
| Reasoning Core L0–L4 + corpus | PASS |
| Decision-gate Level A + atomic | PASS |
| Repair 2/3/4 + hetero + foundation-reset | **85/85 PASS** |

Production RCS ladder on live `60c42111`: **8/8 PASS**

`FULL_REASONING_LADDER_PASS=YES`

---

## 8. Constitutional regression

Specimen `cr.next_evidence_multi_gate` added; corpus synthesizer gate PASS.

`CONSTITUTIONAL_CORPUS_PASS=YES`

---

## 9. Production results

Live brain + frontend stamp: `60c42111…`  
Ladder: `backend/scripts/pillow-decision-gate-propagation-ladder.mjs`  
Evidence: `DECISION_GATE_PROPAGATION_PRODUCTION_LADDER.json`

**Serial re-run (stricter graders): 6/6 PASS** on unchanged live `60c42111`.

Visible answers for multi-gate change/next-evidence asks include release-gate blocks:

- `CLEARING ONE BLOCKER ≠ DECISION UNLOCK`
- `REMAINING_GATES` with performance + expenditure (or equivalent)

`PRODUCTION_PASS=YES`

Note: a first parallel run concurrent with RCS ladder showed one cross-contaminated preview (HT-77 content). Serial re-run was clean. Prefer serial production ladders.

---

## 10. Final unchanged live SHA

`60c42111f5006d2d4cd587d95b9ed22651993194`

`FINAL_CANDIDATE_SINGLE_SHA=YES` (qualified live code SHA; docs/evidence commits may tip later without further host logic changes)

---

## 11. Remaining weaknesses

- Pattern-based gate extraction may miss novel phrasings.
- LLM preamble can still over-claim before the gate inject; inject is authoritative on the visible surface.
- Prefer serial production probes (parallel same-user chats can contaminate).
- Preference among multiple eligible candidates remains light-touch.

---

## 12. Exact next action

Grand King + ChatGPT independent qualification against live `60c42111`.  
Do **not** run sealed Grand King / Vertex exams from Cursor.  
Do **not** certify Wave 1. Do **not** authorize Birth.

```
WAVE_1=UNCERTIFIED
WAVE_1_CLEAN_STREAK=0
BIRTH_AUTHORISED=NO
```

**STOP.**
