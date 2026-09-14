# SC-01 — Production Shadow CEO Path Forensic + Operating-Loop Integration

**Status:** ENGINEERING INTEGRATION PASS — AWAITING NEW INDEPENDENT SHADOW CEO EPISODE

**Birth:** NOT_BORN · **Wave 1:** 0/24 · **Real commerce:** locked · **Certification credit:** none

---

## 1. Parallel workstreams and file ownership

| WS | Owner (this mission) | Primary artifacts |
|----|----------------------|-------------------|
| WS1 Exact production trace | Integration owner | `SC01_WS1_PRODUCTION_TRACE.json`, `sc01-production-path-forensic.mjs` |
| WS2 Control-plane / DB | Integration owner | `SC01_WS2_CONTROL_PLANE_FORENSIC.json`, `sc01-ws2-control-plane-forensic.mjs` |
| WS3 Tool / capability admission | Forensic (read-only) | `SC01_WS3_TOOL_ADMISSION.json` |
| WS4 Response provenance | Forensic (read-only) | `SC01_WS4_RESPONSE_PROVENANCE.json` |
| WS5 Cockpit / BFF parity | Forensic + owner (routes) | `SC01_WS5_COCKPIT_PARITY.json` |
| WS6 Held challenger | Independent pack + runner after impl | `SC01_WS6_INTEGRATION_CHALLENGER_HELD.json`, `…_RESULTS.json` |
| Integration boundary | **Single owner** | `pillow-host.ts` ↔ `chat-admission.ts` only |

No competing intent recognizers were added outside `detectShadowCeoOperatingIntent`.

---

## 2. Exact SC-01 production trace (pre-fix)

- **SHA:** `0f98cdd5dba6a850e36c756c5bb8290393216a08`
- **Deploy:** `318bfc92-93ac-4719-afa1-3ab5f74a9dd5`
- **requestId:** `pcr_196de6fd0e00452d`
- **kind:** `llm` (ordinary chat completion)
- **Failure stage:** after constitutional gate → command/LLM/post-process; **Shadow CEO admission never ran**
- Cockpit without `objectiveId` returned only run instructions — no episode

## 3. Database before/after

**Production SC-01:** all control-plane record types **absent** (Objective, Assessment, Priorities, Decision, Approval, Task, Action, Outcome, Lesson, Brief, ledger binding).

**Post-integration local admission:** full linked chain created (see `SC01_WS2_CONTROL_PLANE_FORENSIC.json`).

## 4. Tool / capability admission

Ordinary Pillow chat had **no** Shadow CEO tools, no mid-chat tool loop, and no control-plane writers. Expected posture was **merely answer in chat**. Shadow CEO existed only on founder HTTP `/shadow-ceo/*`.

## 5. Provenance of SC-01 response statements

| Claim | Source | Supported? |
|-------|--------|------------|
| Limited eligible products / plan prose | Ordinary LLM | Unsupported |
| `DO NOT SELECT ANY` / mandatory gate | `repairDecisionVisibility` + false DecisionCase (prompt misparsed as supplier pack) | Unsupported as Shadow CEO |
| Fake Episode/Objective ID `SC-01 — …` | LLM template prose | Not `obj_*` |

## 6. Cockpit / BFF / Brain parity

Wiring present; Vercel BFF proxies `/api/shadow-ceo/*` → Brain. Chat and cockpit now share `shadow-ceo.db` via `resolveShadowCeoDbPath()`. Cockpit lists `recentObjectives` and loads chains by `?objectiveId=`. Frontend lag is a separate deploy surface from Brain cognition.

## 7. Root cause

**Hypothesis A confirmed:** Grand King Pillow chat bypassed the Shadow CEO runtime entirely. Foundation health was OK but unused. DNS tail was a DecisionCase mis-parse of the operating prompt, not Shadow CEO eligibility.

## 8. Architecture before → after

**Before:** Chat → LLM + executive polish. Shadow CEO only via cockpit HTTP demo.

**After:** Chat → DS gate → **`admitAndExecuteShadowCeoFromChat`** (if intent) → durable episode + source-backed brief (or `SHADOW_CEO_EXECUTION_BLOCKED`). No LLM / DNS appenders on this path. Ordinary chat unchanged.

## 9. Files / schemas changed

- `backend/src/orchestration/shadow-ceo-integration/chat-admission.ts` (new)
- `backend/src/orchestration/shadow-ceo-integration/durable-paths.ts` (new)
- `backend/src/orchestration/shadow-ceo-integration/index.ts`
- `backend/src/orchestration/shadow-ceo-integration/routes.ts`
- `backend/src/orchestration/shadow-ceo/control-plane.ts` (arbitrary objective + assessment override)
- `backend/src/orchestration/shadow-ceo/repository.ts` (`listRecentObjectives`, data-dir env)
- `backend/src/orchestration/pillow-host/pillow-host.ts` (single admission hook)
- Tests + forensic/challenger scripts + audit JSON

## 10. Plan-as-execution prevention

- Operating responses are **record-derived briefs**, not LLM plans.
- `shadowCeoPlanAsExecutionViolations` blocks DNS-on-brief and unsupported first-person execution claims.
- Fail-closed: `SHADOW_CEO_EXECUTION_BLOCKED` with stage + correlation ID — no silent plan fallback.

## 11. Arbitrary objectives enter the runtime

Generic intent detection (Shadow CEO / SYNTHETIC commerce operate language — **not** keyed to SC-01, $1000, or $250). User text becomes `objective.statement`; assessment from inspected synthetic catalog.

## 12. Source-backed vertical slice evidence

Local admission + foundation tests + WS2 forensic: Objective→Assessment→Priorities→Decision→Tasks→Actions→Outcome→Lesson→Brief with synthetic ledger and authority gates.

## 13. Synthetic / real authority

Synthetic experiment **ALLOWED**; live listing **BLOCKED**; approval pending ≠ granted.

## 14. Restart / idempotency

Same workspace + normalized objective text → same `runKey` / `obj_*` (idempotent upsert).

## 15. Held challenger

**19/19 PASS** — `SC01_WS6_INTEGRATION_CHALLENGER_RESULTS.json` (`HELD_CHALLENGER_PASS`).

## 16–17. Deployment

To be filled after push: Brain SHA, Railway deployment ID, frontend SHA/status.

## 18. Remaining P0/P1 risks

- **P0:** Production Brain must deploy this SHA before Grand King path works externally.
- **P1:** Cockpit “run vertical slice” still uses ephemeral integrated DB for demos; chat episodes use shared `shadow-ceo.db` — load via `objectiveId`.
- **P1:** Intent detector is conservative; ultra-ambiguous commerce chat without synthetic/operate cues remains ordinary LLM (by design).
- Multi-day profit chase still needs continued episodes — this mission wires admission, not CEO certification.

## 19. Honest status

**ENGINEERING INTEGRATION PASS — AWAITING NEW INDEPENDENT SHADOW CEO EPISODE**

No Birth, Wave, or CEO-certification credit.
