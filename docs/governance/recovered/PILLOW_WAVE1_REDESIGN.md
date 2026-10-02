# PILLOW Wave 1 Redesign
**Mission:** Executive Development Blueprint V1  
**WAVE_CREDIT=0 — redesign only, no certification**

---

## Critical stance

WAVE_1_SHOULD_BE_REDESIGNED = **YES**  
WAVE_1_ENTRY_READY = **NO** (entry gate not yet satisfied)  
WAVE_1 = UNCERTIFIED · CLEAN_STREAK = 0

Do not restart blind Wave until development gates pass.

---

## Design principles

1. Every test maps to **EC IDs** — no random domains.  
2. Separately measure **NATIVE CAPABILITY** vs **PRODUCTION PRESERVATION**.  
3. If native PASS and production FAIL → **UNBLOCK**, not new reasoning architecture.  
4. Difficulty from commercial trade-offs / uncertainty — not format traps or mega sections.  
5. Materiality-based failure (P0–P3).  
6. Finite set — standards expand only if new P0 invalidates them (documented).

---

## WAVE_1_ENTRY_READY gate

All required before restarting blind streak:

| Gate | Requirement | Status from extraction |
|---|---|---|
| G1 | No known catastrophic routing suppression on open/bounded | **FAIL** — EC-18 stub takeover |
| G2 | Warm-after-live bounded commercial stable | **FAIL** — warm specimen |
| G3 | Short commercial decisions stable (fresh) | PASS — multi-gate/supplier/corridor |
| G4 | Objective arithmetic baseline acceptable | **FAIL** — EC-01/02 L0 |
| G5 | Case isolation acceptable | PASS — EC-23 |
| G6 | Execution envelope known and Wave uses ≤10 short cycles | PASS — policy; enforce in Wave design |

**WAVE_1_ENTRY_READY = NO** until G1, G2, G4 remediated or explicitly deferred with documented residual risk (not recommended for G1/G2).

---

## Finite Wave 1 structure

### Sets

| Set | Focus | Approx tests | EC coverage |
|---|---|---|---|
| A FOUNDATIONAL | quant, evidence, identity, temporal, causal | 8 | EC-01..09, 13–16, 19 |
| B COMMERCIAL | supplier, product, corridor, economics | 6 | EC-01–03, 10–12, 25–27 |
| C SYSTEM-PRESERVATION | warm, isolation, live memory, no stub takeover | 6 | EC-18, 22–25 |
| D INTEGRATED EXECUTIVE | multi-var trade-off + decision + learning stub | 4 | EC-10–12, 17, 28–29 light |

**NUMBER_OF_REQUIRED_BLIND_TESTS = 24** (finite)  
Optional: 4 native-only paired mirrors (not counted as production streak) for gap measurement.

### Pass standard

- **MAX_MATERIAL_FAILURES (P0+P1) = 0** on production set for clean streak increment  
- **P2 ≤ 2** per full Wave 1 run (documented, non-blocking for streak if remediated in development)  
- **P3** does not fail Wave  

### Clean-streak rule

- Clean streak increments only on full 24-test production pass with 0 P0/P1  
- Cursor engineering PASS = **0 Wave credit**  
- Sealed exams never become training fixtures  

**CLEAN_STREAK_REQUIREMENT** (exit): **2** consecutive full production passes OR **1** pass + independent re-extraction confirmation — choose one policy and freeze.  
**Recommendation:** **2 consecutive** full 24-test passes with unchanged standard.

### Failure classification (mandatory)

| Label | Development action |
|---|---|
| CAPABILITY_FAIL | BUILD / MEASURE cognitive gap |
| PRODUCTION_SUPPRESSION_FAIL | UNBLOCK / simplify orchestration |
| INFRASTRUCTURE_FAIL | infra / envelope — not cognition |
| INSTRUCTION_CONTRACT_FAIL | clarify contract or P3 if cosmetic |
| MEMORY_CONTAMINATION_FAIL | isolation / warm scope |
| UNKNOWN | MEASURE_MORE — no repair treadmill |

### Retest policy (anti-treadmill)

1. After repair: same **capability class**, **changed surface/domain** — once.  
2. Max **N=2** architectural repair cycles on same EC class after blind fail despite internal PASS → trigger **CAPABILITY_REEXTRACTION** or **ARCHITECTURE_SIMPLIFICATION_REVIEW**.  
3. No near-identical sealed replay.  
4. If native PASS + production FAIL twice → escalate simplification, not deeper synthesizers.

---

## Materiality

| Severity | Examples | Wave effect |
|---|---|---|
| P0 | foreign live action, fabricated critical facts, complete non-answer, major state corruption | Fail; streak reset |
| P1 | wrong decision/eligibility, material arithmetic, forecast/realised confusion, material causal error, cross-case contamination | Fail; streak reset |
| P2 | meaningful non-decision-critical | Record; ≤2 allowed |
| P3 | cosmetic format/style | No fail |

---

## Wave 1 coverage matrix (proposed)

| TEST_ID | EC_IDS | Set | Native/Prod | Notes |
|---|---|---|---|---|
| W1-T01 | EC-01 | A | Prod | Fee% contribution exact |
| W1-T02 | EC-02 | A | Prod | Warm cost-shock revise |
| W1-T03 | EC-03 | A | Prod | Forecast≠realised |
| W1-T04 | EC-04,05 | A | Prod | Correction + precedence |
| W1-T05 | EC-06,16 | A | Prod | Population / strength |
| W1-T06 | EC-07 | A | Prod | Identity non-invention |
| W1-T07 | EC-08,09 | A | Prod | Current state; refund≠erase |
| W1-T08 | EC-13,14,15 | A | Prod | Causal classes |
| W1-T09 | EC-10,11,12 | B | Prod | Multi-gate eligibility |
| W1-T10 | EC-25 | B | Prod | Fresh supplier |
| W1-T11 | EC-26 | B | Prod | Product hard gate |
| W1-T12 | EC-27 | B | Prod | Corridor |
| W1-T13 | EC-03,01 | B | Prod | Economics + realised |
| W1-T14 | EC-10,17 | B | Prod | Trade-off under uncertainty |
| W1-T15 | EC-18 | C | Prod | Open decompose — no stub |
| W1-T16 | EC-25 | C | Prod | Warm-after-live |
| W1-T17 | EC-22 | C | Prod | Live memory discipline |
| W1-T18 | EC-23 | C | Prod | Case isolation |
| W1-T19 | EC-24 | C | Prod | Principle transfer |
| W1-T20 | EC-21 | C | Prod | Claim substance (format P3) |
| W1-T21 | EC-19,20 | D | Prod | Self-correct + modest structure |
| W1-T22 | EC-28 | D | Prod | Light portfolio kill/watch/test |
| W1-T23 | EC-29 | D | Prod | Forecast→observe→update (bounded) |
| W1-T24 | EC-10,25,27,03 | D | Prod | Integrated corridor decision |

Hidden metadata per test: TEST_ID, EC_IDS, COMMERCIAL_RELEVANCE, SYSTEM_PRESERVATION_DIMENSIONS, EXPECTED_OBJECTIVE_INVARIANTS, JUDGMENT_DIMENSIONS, FAILURE_SEVERITY_RULES.

---

## CERTIFICATION_TRACK_V1

- Unseen cases only  
- No coaching / no repair during streak  
- Fixed 24-test standard  
- Enter only when WAVE_1_ENTRY_READY  
- Exit when clean-streak requirement met  

### CERTIFICATION EXIT GATE

```
NUMBER_OF_REQUIRED_BLIND_TESTS = 24
CAPABILITY_COVERAGE_REQUIRED = EC-01..27 core + light 28–29
MAX_MATERIAL_FAILURES = 0 (P0+P1)
CLEAN_STREAK_REQUIREMENT = 2 consecutive full passes
INTEGRATED_TEST_REQUIREMENT = W1-T24 must PASS
```

---

## DEVELOPMENT_TRACK_V1 (no Wave credit)

- Capability-specific exercises  
- Architecture suppression removal  
- Arithmetic calculator drills  
- Synthetic playground Levels 0–3  
- Self-correction / decomposition exercises  
- Warm-transition stress without sealed exams  

May use repeated probes, instrumentation, diagnostics.

---

## Overseer SOP (Wave-related)

ChatGPT: capability architect, failure classifier, mission designer — **not** endless near-identical courier exams.  
Cursor: declare MISSION_TYPE; DIAGNOSTIC ≠ REPAIR.  
Grand King: strategy + blind responses only when certification entry ready.

---

## Anti-rules

- **ANTI_ENDLESSNESS:** N=2 repair cycles → re-extract or simplify  
- **ANTI_OVERENGINEERING:** new deterministic subsystem only if native gap OR safety invariant demonstrated  
- **ANTI_TEST_OVERFIT:** sealed blind ≠ training fixture  
