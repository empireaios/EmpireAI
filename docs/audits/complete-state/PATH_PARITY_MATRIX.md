# PATH PARITY MATRIX — Real Pillow Chat vs Certification

**Mission:** REAL PILLOW PATH PARITY / CERTIFICATION VALIDITY RESET  
**Generated:** 2026-08-25  
**WAVE_1=UNCERTIFIED · BIRTH_AUTHORISED=NO**

## Material differences (pre-fix)

| Dimension | Real Cockpit chat | FAST/DEPLOY/FULL gates | Production ladders (pre-fix) |
|-----------|-------------------|------------------------|-------------------------------|
| Frontend React | YES | NO | NO |
| BFF `/api/pillow/chat` | YES | NO | YES |
| Auth cookie | YES | NO | YES (login API) |
| `POST /api/pillow/session` | YES | NO | NO (fake id → rebound) |
| Session history | Persistent + localStorage turns | None | Fragile getOrCreate reuse |
| `workspaceContext` | YES (screen + 12 turns) | NO | NO |
| PillowHost `routePrompt` | YES | NO | YES |
| LLM | YES | NO | YES |
| `releaseExecutiveAnswer` | YES | Sparse | YES |
| `polishFinalVisibleAnswer` | YES | Dominant (on drafts) | YES (via release) |
| Live truth brief to LLM | YES (was always-on) | N/A | YES (was always-on) |
| Synthetic* marker required for isolation | Soft | Packs always use Synthetic* | Packs always use Synthetic* |
| FE `toExecutiveChatMessage` | YES | NO | NO |
| Code SHA provenance | Often null on `railway up` | N/A | Reads health SHA |

**PATH_PARITY_PERCENT (pre-fix, gates vs real):** ~15% (polish-only)  
**PATH_PARITY_PERCENT (pre-fix, ladders vs real):** ~70% (same BFF/host; missing session create, workspaceContext, forceNew isolation)

## Root cause (proven)

1. **Scope-marker asymmetry:** Cert packs use `Synthetic*`. Real Grand King scenarios often use operational/scenario language without that token → `CURRENT_REALITY` → Mini Fan / realised-orders / Temporal audit synthesizers.
2. **"Do not mention Mini Fan"** was **not** a scope cue.
3. **Live operational truth brief always injected** into LLM context even under synthetic scope → models echo commerce/Birth.
4. **Session rebound reused warm sessions** (≤30 min) → contaminated history for “fresh” ladder IDs.
5. **Deploy/FULL gates never hit PillowHost** — overstated readiness relative to real chat.

Local repro: `PATH_PARITY_CATASTROPHIC_CLASS_REPRO.json`.

## Fixes in this mission (systemic, not Mini Fan filters)

1. Expand synthetic/isolation markers (`analysis only`, operational scenario, owner `do not mention Mini Fan|Birth`).
2. Scope away hypothetical/comparative/historical unless live EmpireAI ask.
3. Replace live truth brief with scoped isolation brief when scoped.
4. `createSession({ forceNew })` + rebound `forceNew:true`.
5. `requestProvenance` on chat responses.
6. Real-path harness: `pillow-real-path-certification-harness.mjs`.

## Decision

CERTIFICATION_PATH_VALIDATED updates after real-path harness PASS on single SHA.
