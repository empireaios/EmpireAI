# Combined Executive Audit — Pillow Executive Council

> **Authority:** Grand King Design Decision · EmpireAI Version 1 · Pillow Constitution  
> **Mission:** Implement Executive Council as permanent internal reasoning model of Pillow  
> **Date:** 2026-06-29  
> **Status:** ✅ Implementation complete

---

## 1. Intent

The **Pillow Executive Council** is the permanent **internal executive reasoning architecture** of Pillow — **NOT** a multi-agent framework and **NOT** visible as competing voices to Grand King by default.

Grand King interacts **only with Pillow**. The council debates behind the scenes; the **CEO synthesizes exactly ONE recommendation**.

Aligns with Pipeline B (Executive Reasoning) · PEI-015 · Constitution §4 Executive perspectives.

---

## 2. Executive Council architecture

```
Grand King message (proposal detected)
      ↓
Internal Executive Debate (7 executives — not CEO)
      ↓
Dissent extraction (minority opinions preserved)
      ↓
CEO Synthesis → ONE recommendation
      ↓
Pillow LLM response (single voice, natural dialogue)
      ↓
Grand King UI — recommendation card (Approve / Reject / Defer)
      ↓
Optional: View Executive Debate (dissent + opinions)
      ↓
Grand King approval → separate Cursor path (never auto-dispatch)
```

**Separation from REAL Executive Council (`backend/src/executive-council/`):**  
REAL council serves Empire-wide UX (Executive Debate page · REAL-007). **Pillow Executive Council** is scoped to Pillow chat internal reasoning per Pillow Constitution.

---

## 3. Executives implemented

| Role | Title | Responsibilities |
|---|---|---|
| **CEO** | Chief Executive Officer | Final synthesis · objective alignment · final recommendation |
| **CFO** | Chief Financial Officer | ROI · profitability · engineering/infrastructure cost · long-term financial impact |
| **CTO** | Chief Technology Officer | Architecture · quality · maintainability · technical debt |
| **COO** | Chief Operating Officer | Execution · workflow · efficiency · feasibility |
| **CRO** | Chief Risk Officer | Operational · security · business · recovery risk |
| **CCO** | Chief Commercial Officer | Customers · suppliers · marketplace · conversion · revenue |
| **CRO_REPO** | Chief Repository Officer | Repository · Journey · documentation · architecture consistency |
| **CSO** | Chief Strategy Officer | Long-term direction · objective sequencing · opportunity cost · alignment |

Defined in `pillow/src/executive-council/personas.ts`.

---

## 4. Debate engine

| Component | Path | Behaviour |
|---|---|---|
| Proposal detector | `proposal-detector.ts` | Triggers council on recommendation/decision language |
| Debate engine | `debate-engine.ts` | Each non-CEO executive evaluates independently — may disagree, challenge, propose alternatives |
| CEO synthesis | `council-engine.ts` | Produces single recommendation with profit/cost/risk/confidence/alignment |
| Dissent model | `council-engine.ts` | Minority opinions preserved in `dissents[]` — hidden unless View Debate |

---

## 5. CEO synthesis output

```typescript
CeoExecutiveRecommendation {
  recommendation, reason,
  expectedProfitImpact, expectedEngineeringCost, expectedRisk,
  confidence, objectiveAlignment,
  status: "awaiting_grand_king" | "approved" | "rejected" | "deferred"
}
```

---

## 6. Files created

| Path | Purpose |
|---|---|
| `pillow/src/executive-council/types.ts` | Council types |
| `pillow/src/executive-council/personas.ts` | 8 permanent executives |
| `pillow/src/executive-council/proposal-detector.ts` | When to run council |
| `pillow/src/executive-council/debate-engine.ts` | Internal debate |
| `pillow/src/executive-council/council-engine.ts` | CEO synthesis + LLM formatter |
| `pillow/src/executive-council/index.ts` | Exports |
| `pillow/src/validation/tests/executive-council.test.ts` | Pillow tests |
| `backend/src/orchestration/pillow-executive-council/` | Persistence + API |
| `backend/src/validation/tests/pillow-executive-council.test.ts` | Backend tests |
| `frontend/src/api/pillow-executive-council.ts` | API client |
| `frontend/src/components/pillow/PillowExecutiveRecommendationCard.tsx` | GK recommendation UI |

---

## 7. Files modified

| Path | Change |
|---|---|
| `pillow/src/index.ts` | Export executive council |
| `pillow/src/openai/engine.ts` | CEO recommendation in system prompt (single voice) |
| `pillow/package.json` | Council test |
| `backend/src/orchestration/pillow-host/pillow-host.ts` | Run council before LLM on proposals |
| `backend/src/orchestration/pillow-host/types.ts` | `executiveRecommendation` on chat result |
| `backend/src/app.ts` | Register council routes |
| `backend/src/brain/types.ts` | Audit actions |
| `frontend/src/api/pillow.ts` | Recommendation type on chat result |
| `frontend/src/components/pillow/PillowCards.tsx` | Recommendation card in assistant bubbles |

---

## 8. API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/pillow/executive-council/pending` | Pending recommendations |
| GET | `/api/pillow/executive-council/recommendation/:requestId` | Public recommendation only |
| GET | `/api/pillow/executive-council/debate/:debateId` | Full debate (View Debate) |
| POST | `/api/pillow/executive-council/recommendation/:id/decide` | Approve / Reject / Defer |

---

## 9. Cursor rule

**Executive Council NEVER communicates with Cursor.**

- `decide` endpoint returns explicit `cursorRule: no_auto_dispatch`
- Implementation work requires **separate** Grand King approval via PILLOW-017
- Council approval alone does not register Cursor missions

---

## 10. Validation

| Check | Result |
|---|---|
| Internal executive debate | ✅ 7 independent opinions |
| Single CEO recommendation | ✅ |
| Dissent preservation | ✅ `dissents[]` + View Debate API |
| Objective alignment | ✅ `objectiveAlignment` field |
| Cursor sovereignty | ✅ no auto-dispatch |
| Grand King approval | ✅ Approve/Reject/Defer API |
| Pillow tests | ✅ 4/4 |
| Backend tests | ✅ 4/4 |

---

## 11. Remaining work

| Item | Notes |
|---|---|
| Streaming chat path | Mirror council hook on `/api/pillow/chat/stream` |
| LLM-assisted debate depth | V1 uses heuristic engine; PEI-015 Master Plan may add model depth |
| Link approved recommendation → Cursor mission draft | Manual GK step via existing approval gate |
| Journey row registration | Governance sync when Grand King promotes to formal mission |

---

*Pillow Executive Council · Internal reasoning only · Stop.*
