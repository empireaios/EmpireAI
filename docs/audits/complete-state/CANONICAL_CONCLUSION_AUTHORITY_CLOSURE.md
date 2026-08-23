# CANONICAL CONCLUSION AUTHORITY CLOSURE

**Sealed locally pending deploy/prod ladder.**  
**WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · BIRTH_AUTHORISED=NO**

Preserves: Foundation Reset, Repairs 1–4, Reasoning Core, decision-gate, causal state, prior canonical-conclusion compound work, timestamps-are-not-tasks.

---

## A. Atlas failure-class synthesis (generic — no sealed exam encoding)

Earlier sections correctly established:

1. Actor currently eligible (all gates satisfied; historical failure cleared).
2. Peer’s current capacity problem resulted from inventory redirected after the actor’s earlier failure.

Later explicit claim audit returned **SUPPORTED** for:

1. “Actor should remain blocked because it failed earlier today.” (true historical premise + false current-block conclusion)
2. “Peer problem is unrelated to Actor because Peer has no \<different-mechanism\> failure.” (true mechanism-absent premise + false unrelatedness conclusion)

---

## B. First divergence

**FIRST_DIVERGENCE_LAYER=** claim-proposition decomposition + claim-verdict enforcement  

Established conclusions existed in narrative and (after this fix) in `actorStates` / causal links, but claim audits did not map `because`-compounds or eligibility/history propositions into the same authority used by verdict rendering. When assessment fell through as generic `unproven`, `enforceClaimEnumeration` kept the LLM **Supported** surface (`mustRegen` only when `fromLedger != null`).

---

## C. Why previous canonical enforcement failed

**WHY_PREVIOUS_CANONICAL_ENFORCEMENT_DID_NOT_CONTROL_ATLAS=**

1. Compound split only handled so/therefore/thus/hence — **not** conclusion-first `because`/`since`.
2. No `actorStates` / current-vs-historical eligibility propositions — “remain blocked because failed earlier” stayed generic.
3. Redirect / “resulted from redirected inventory” causal patterns were not parsed → unrelatedness could not be contradicted by path.
4. Enforcement hole: generic `unproven` ⇒ `fromLedger=null` ⇒ existing Claim block with **Supported** retained.
5. Prior qualification covered different-root+therefore-unrelated with explicit failover chains already in state — not eligibility/history compounds, redirect causality, or the generic-unproven→keep-Supported path.

---

## D. Implementation chosen

Proposition/evidence semantics (not phrase patches):

- `parseActorStates` + merge into `decisionActions`
- Causal redirect / resulted-from → `INDIRECT_CAUSAL_DEPENDENCY`
- `because`/`since` compound decomposition; kinds: `currently_blocked`, `historical_impairment`, `mechanism_absent`
- Compound overall: true premise + false/unproven conclusion ⇒ not SUPPORTED
- Always regenerate claim slices when canonical exists

---

## E. Changed / reused

- Reused: `assessClaimAgainstCanonical`, `enforceClaimEnumeration`, polish claim path
- Extended: `executive-canonical-state`, `executive-causal-state`, `executive-claim-proposition`, `executive-conclusion-ledger`
- Corpus: `cr.eligibility_history_because_compound`
- Did not disturb timestamps-are-not-tasks task-contract logic

---

## F–J. Qualification (local)

| Gate | Result |
|------|--------|
| Compound because-claim 100/100 | PASS |
| Cross-domain (8 domains) in that suite | PASS |
| Multipart eligibility+redirect polish | PASS |
| Prior atomic 100/100 | PASS |
| Timestamps-are-not-tasks atomic | PASS |
| Causal + decision-gate atomic | PASS |
| Reasoning L0–L4 + corpus synthesizer | PASS |
| Foundation constitutional corpus | PASS |

---

## K–O. Production / certification

Production ladder + live SHA filled after deploy.  
**WAVE_1 remains UNCERTIFIED. Birth not authorised.** Cursor PASS = zero Wave credit.
