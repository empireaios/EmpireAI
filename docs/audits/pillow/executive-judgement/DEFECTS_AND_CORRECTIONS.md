# Executive Judgement — Defects & Corrections

## D1 — Weak risk signal detection

**Symptom:** Scenarios A–I returned `challengeStance: agree` and `Proceed exactly as requested`.  
**Root cause:** `detectChallengeStance` / `POOR_DECISION` missed skip-validation phrasing, mass scale, capital-all-in, refund-unclear, blanket pre-approval, rewrite-for-local-failure.  
**Location:** `pillow/src/executive-deliberation/signals.ts`  
**Correction:** `detectExecutiveRiskThemes()` + mapped stance/significance/uncertainty.  
**Regression:** `executive-deliberation.test.ts` scenario tests A–I equivalents.

## D2 — Non-domain alternatives

**Symptom:** Selected approach was generic even when stance was correct.  
**Location:** `pillow/src/executive-deliberation/engine.ts`  
**Correction:** Theme-aware selected summaries + hidden risks + objective inference.  
**Regression:** selectedApproachSummary assertions per theme.

## D3 — Visible-answer fidelity gap

**Symptom:** Deliberation only soft-guided LLM; no cert evidence; blind agreement possible.  
**Location:** `engine.ts` (`formatExecutiveDeliberationForLlm`, `alignVisibleAnswerWithDeliberation`), `pillow-host.ts`  
**Correction:** Decisiveness prompt rules; soft fidelity aligner; `executiveDeliberation` on chat result.  
**Regression:** `alignVisibleAnswerWithDeliberation repairs blind agreement`.

## D4 — Missing live judgement harness

**Symptom:** Existing conversation cert did not assert deliberation vs visible answer.  
**Correction:** `backend/scripts/pillow-executive-judgement-live-cert.mjs` + structural cert script.

## D5 — Post-LLM constitutional false refusal (CRITICAL for live cert)

**Symptom (live 11/15):** Scenarios D, F, M returned `kind: constitutional_refusal` after LLM generation, wiping decisive advisory answers.  
**Root cause:**  
1. `BYPASS_ACTIONS` included bare `replace` and `APPROVAL_OBJECTS` included bare `approval`, so “replace X with Y … requires approval” matched as approval_bypass.  
2. Post-answer gate hard-refused any S8-OWNER-APPROVAL finding, including answers that *seek* approval.  
**Location:** `constitutional-intent.ts`, `executive-conversation-gate.ts` (`gateExecutiveVisibleAnswer`)  
**Correction:** Narrow replace/approval composition; allow advisory answers that require owner approval while still refusing true bypass language.  
**Regression:** Digital Soul gate tests — advisory allow / bypass refuse / replace+approval allow.  
**Live retest:** 15/15 PASS after Railway `c9b11492…`.

## D6 — High-uncertainty answers omitted provisional language

**Symptom (live):** Scenario I recommended a business without stating uncertainty/provisional framing.  
**Location:** `alignVisibleAnswerWithDeliberation` in `engine.ts`  
**Correction:** When `uncertaintyLevel === high` and answer lacks uncertainty language, prepend provisional lead-in.  
**Regression:** `alignVisibleAnswerWithDeliberation surfaces uncertainty under high uncertainty`.  
**Live retest:** I PASS with fidelityAdjusted lead-in present.
