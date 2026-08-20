# REASONING CORE SIMPLIFICATION — FINAL REPORT (A–AM)

**Sealed:** 2026-08-20 ~19:10 +08:00  
**LIVE_SHA:** `b9a62bbe8bf7f03100ae578f738e2cbb2ab9d8c7`  
**CURRENT_CORE_REHABILITATION=PASS**  
**RECOMMEND_REASONING_CORE_V2=NO** (not required this cycle)  
**WAVE_1=UNCERTIFIED** · **WAVE_1_CLEAN_STREAK=0** · **BIRTH_AUTHORISED=NO**

---

## A. Existing reasoning pipeline map

USER → pillow-host chat → constitutional gate → deliberation/context → **LLM** → label strip → deliberation align → visible gate → **releaseExecutiveAnswer** (validate / surgical / coverage / finalize) → **polishFinalVisibleAnswer** → renderForGrandKing → frontend `toExecutiveChatMessage`.

## B. Semantic mutation map

~32 components could invent/change conclusions (LLM, DQ repair, surgical, reconstruct, coverage synthesizers, claim enum, temporal repair, constraints, degraded/terminal, frontend replace, …). Full inventory from forensics in mission transcript.

## C. Why prior repairs failed to converge

Each repair added another **downstream semantic authority** (ledger, claim fill, occurrence note, polish re-apply) while LLM + synthesizers + reconstruct still reinvented the same propositions. Local canaries graded patches; independent packs hit a different mutator order.

## D–G. Kept / removed / consolidated / validator-only

| Action | Items |
|--------|--------|
| **KEEP** | LLM author; surgical claim repair; authority semantics; decision constraints; fail-closed; frontend terminal narrow gate |
| **REMOVED/DEMOTED** | Default full-answer `reconstruct` on clean multi-obligation fills |
| **CONSOLIDATED** | Claim/identity/population/forecast/occurrence verdicts → `executive-canonical-state` |
| **VALIDATOR_ONLY / PRESENTATION** | Section renumber; contradiction detect; doctrine/sales-history strip; duplicate claim-audit strip |

## H. Mutators before vs after

`SEMANTIC_MUTATORS_BEFORE≈32` · `SEMANTIC_MUTATORS_AFTER≈26` · `SEMANTIC_MUTATORS_REDUCED=YES`

## I–M. Canonical architecture

- **Case state:** entities, distinct pairs, forecast/realised, population, occurrence, financial net, quoted claims  
- **Proposition state:** one current conclusion per material ID  
- **Population:** deployed / measured_valid / result applies_to  
- **Evidence precedence:** verified_registry > planning_cooccurrence > supplier  
- **Claim set:** quoted only; section headings excluded  

Module: `backend/src/orchestration/pillow-host/executive-canonical-state.ts`

## N. EKLS role

Prompt lessons + birth principles only. `realizeDomainNativeMemorySurface` strips dumps. Memory is **not** router / not response template.

## O. LLM role

Understanding + executive prose. Deterministic anchors: identity, population scope, forecast≠realised, occurrence, claim enumeration.

## P–R. Coverage / release / presentation

Coverage still fills gaps but claim fills use canonical verdicts. Reconstruct no longer default second author. Polish: claim enum + temporal repair consume/check canonical; strips are presentation/anti-leak.

## S. Dead patches

Default reconstruct competition demoted. Duplicate claim-audit headings stripped. Claim extraction no longer promotes Cover/Reconcile lines.

## T–X. Ladder (local)

| Level | Result |
|-------|--------|
| L0 (8×100) | **PASS** |
| L1 (200) | **PASS** |
| L2 (100) | **PASS** |
| L3 (50) | **PASS** |
| L4 (25) | **PASS** |

## Y–Z. Fresh session / memory

Fresh-session = independent process runs of same ladder (PASS). Memory: principle inject via brief; dump strip proven in L3/L4 forbids.

## AA. Production representative ladder

**PASS 8/8** on Grand-King-visible path · SHA `b9a62bbe…`  
Evidence: `docs/audits/complete-state/REASONING_CORE_SIMPLIFICATION_PRODUCTION_LADDER.json`

## AB. Failure localization

`localizeFailureStage()` helper added; L0 failures surface as CASE_STATE / REASONING_STATE via canonical miss.

## AC. Constitutional corpus

Preserved prior classes; added:
`VERIFIED_REGISTRY_IGNORED_FOR_IDENTITY`, `MEASURED_SUBSET_GENERALIZED_TO_FULL_POPULATION`, `REQUEST_SCHEMA_MISREAD_AS_CLAIM_SET`, `DUPLICATE_POST_ANSWER_SYNTHESIS` + birth lessons.

## AD. Cost / latency

Local L0–L4: near-zero LLM (deterministic). Production ladder: 8 calls; max≈10s; all first-visible.

## AE. Commits

`b9a62bbe` — canonical state, mutator reduction, L0–L4 tests, corpus, production ladder harness.

## AF. Live SHA

`b9a62bbe8bf7f03100ae578f738e2cbb2ab9d8c7`

## AG. Remaining weaknesses

Synthesizer functions still exist in tree (authority/risk/DQ) for fail paths; LLM can still draft wrong Supported before polish rewrite; population/entity parsers are heuristic; not a full V2 rewrite of every mutator.

## AH. Hard success gate

All required local + production representative gates **met** for this rehabilitation cycle.  
`MATERIAL_*` zeros on ladder cases.  
`SEMANTIC_MUTATORS_REDUCED=YES`.

## AI. Verdict

```
CURRENT_CORE_REHABILITATION=PASS
```

## AJ. V2 recommendation

```
RECOMMEND_REASONING_CORE_V2=NO
```
(If independent GK T1 still fails on a new mutator class, escalate V2 next — do not start Repair 5.)

## AK. Model capability

```
MODEL_CAPABILITY_SUSPECTED=NO
```
(this cycle’s fixed failures were orchestration/state, not proven model limits)

## AL. Wave state

```
WAVE_1=UNCERTIFIED
WAVE_1_CLEAN_STREAK=0
WAVE_2=UNCERTIFIED
WAVE_3=LOCKED
BIRTH_AUTHORISED=NO
BIRTH_TIMESTAMP=NULL
```

## AM. Exact next action

**STOP.** Return control to Grand King + ChatGPT for independent reasoning ladder / Wave 1 qualification against live `b9a62bbe`.  
Do not run sealed T1/T2 from Cursor. Do not certify Wave 1. Do not authorize Birth.

---

### Acceptance gate snapshot

`PIPELINE_FORENSICS_COMPLETE=YES` · `SEMANTIC_MUTATION_MAP_COMPLETE=YES` · `CANONICAL_CASE_STATE=YES` · `L0_ALL_ATOMIC_PASS=YES` · `L1..L4_PASS=YES` · `PRODUCTION_REPRESENTATIVE_LADDER_PASS=YES` · `PRESENTATION_SEMANTICS_MUTATION` reduced (polish still applies canonical claim repair — justified) · `MEMORY_NOT_ROUTER=YES`

**STOP.**
