# Combined Executive Audit — Executive Learning Engine (Pre-Go-Live)

> **Authority:** Grand King Design Decision · EmpireAI Version 1  
> **Mission:** Implement permanent Executive Learning Engine for Pillow before public go-live  
> **Date:** 2026-06-29  
> **Status:** ✅ Implementation complete (validation passing)

---

## 1. Intent (Section 1)

Implement a **permanent Executive Learning Engine** that continuously analyses Grand King conversations to improve Pillow's executive reasoning over time. This system is **NOT chat memory** and **NOT conversation history**. All permanent behavioural changes remain under **Grand King control**.

Aligns with Pipeline C (Executive Learning) per `docs/governance/EXECUTIVE_COGNITIVE_PIPELINES.md` · PEI-026 · PEI-021 governance.

---

## 2. Files created

| Path | Purpose |
|---|---|
| `pillow/src/learning/types.ts` | Learning categories, candidates, EKB types |
| `pillow/src/learning/patterns.ts` | Principle heuristics (profit-first, ROI, etc.) |
| `pillow/src/learning/extractor.ts` | Learning candidate extraction |
| `pillow/src/learning/classifier.ts` | Categories A–D classification |
| `pillow/src/learning/confidence.ts` | Confidence scoring |
| `pillow/src/learning/impact-analyzer.ts` | Impact analysis |
| `pillow/src/learning/pattern-detector.ts` | Repeated behavioural pattern detection |
| `pillow/src/learning/reasoning-bundle.ts` | Reasoning integration formatter |
| `pillow/src/learning/engine.ts` | ExecutiveLearningEngine orchestrator |
| `pillow/src/learning/index.ts` | Public exports |
| `pillow/src/validation/tests/executive-learning.test.ts` | Pillow unit tests |
| `backend/src/orchestration/executive-learning/service.ts` | Persistence + approval workflow |
| `backend/src/orchestration/executive-learning/repository/sqlite-executive-learning-repository.ts` | SQLite EKB |
| `backend/src/orchestration/executive-learning/routes/executive-learning-routes.ts` | REST API |
| `backend/src/orchestration/executive-learning/index.ts` | Backend exports |
| `backend/src/validation/tests/executive-learning-engine.test.ts` | Backend integration tests |
| `frontend/src/api/executive-learning.ts` | API client |
| `frontend/src/pages/dashboard/ExecutiveLearningReviewPage.tsx` | Grand King review UI |
| `frontend/src/pages/dashboard/ExecutiveLearningReviewPage.module.css` | Review styles |

---

## 3. Files modified

| Path | Change |
|---|---|
| `pillow/src/index.ts` | Export learning module |
| `pillow/src/openai/engine.ts` | Load approved EKB into LLM system prompt |
| `pillow/package.json` | Add executive-learning test |
| `backend/src/orchestration/pillow-host/pillow-host.ts` | Post-chat observation + pre-LLM reasoning bundle |
| `backend/src/app.ts` | Register executive learning routes |
| `backend/src/brain/types.ts` | Audit actions for learning lifecycle |
| `frontend/src/routes/index.tsx` | Route `/dashboard/pillow/learning` |
| `frontend/src/pages/dashboard/PillowChatPage.tsx` | Link to Executive Learning Review |

---

## 4. Executive Learning architecture

```
Conversation (Pillow chat turn)
      ↓
Learning Candidate Extraction (pillow/src/learning/extractor.ts)
      ↓
Classification A/B/C/D (classifier.ts)
      ↓
Confidence Scoring (confidence.ts + pattern-detector.ts)
      ↓
Impact Analysis (impact-analyzer.ts)
      ↓
Pending Executive Learning (SQLite executive_learning_pending)
      ↓
Grand King Approval (Executive Learning Review UI + API)
      ↓
Executive Knowledge Base (SQLite executive_knowledge_base)
      ↓
Reasoning Integration (formatExecutiveLearningForLlm → OpenAI layer)
```

**Non-blocking observation:** Learning runs after each chat turn in `pillow-host.ts`; failures do not break chat.

**No silent constitutional change:** Category A/B promotion requires explicit Grand King approval API call. Category D auto-expires (4h TTL).

---

## 5. Knowledge Base structure

### Pending record (`PendingExecutiveLearning`)

- `learningId`, `workspaceId`, `title`, `description`, `category` (A–D)
- `status`: pending_confirmation · pending_approval · rejected · merged · expired
- `observation`, `evidence[]`, `confidence`, `reasoningAreas[]`
- `impactSummary`, `source`, `sessionId`, `requestId`
- `discoveredAt`, `updatedAt`, `expiresAt`, `requiresGrandKingApproval`

### Approved record (`ExecutiveKnowledgeEntry`)

- All pending fields promoted + `approvedAt`, `approvedBy`
- `status`: approved · archived · superseded
- `supersededBy`, `affectedReasoningAreas[]`

### SQLite tables

- `executive_learning_pending`
- `executive_knowledge_base`

---

## 6. Learning categories

| Cat | Name | Approval | Storage |
|---|---|---|---|
| **A** | Permanent Executive Principle | Grand King required | EKB on approve |
| **B** | EmpireAI Strategic Knowledge | Confirmation + approve | EKB on approve |
| **C** | Project Working Knowledge | Confirmation | EKB on approve |
| **D** | Temporary Session Context | None | Auto-expires — never EKB |

---

## 7. Reasoning integration

Before LLM completion, Pillow loads:

1. **Current Objective** (PILLOW-019 ObjectiveEngine)
2. **Executive Constitution** (Executive Briefing anchor)
3. **Executive Knowledge Base** (approved A/B/C only)
4. **Project Working Knowledge** (approved B/C)
5. **Session Context** (category D pending, non-expired)
6. **Executive Perspectives** (reasoning notes)

Only **approved** Executive Knowledge influences long-term reasoning via `formatExecutiveLearningForLlm`.

---

## 8. API routes

| Method | Route | Action |
|---|---|---|
| GET | `/api/pillow/executive-learning/review` | Stats + pending + EKB |
| POST | `/api/pillow/executive-learning/:id/approve` | Promote to EKB |
| POST | `/api/pillow/executive-learning/:id/reject` | Reject candidate |
| PATCH | `/api/pillow/executive-learning/:id` | Edit pending |
| POST | `/api/pillow/executive-learning/merge` | Merge candidates |
| POST | `/api/pillow/executive-learning/:id/archive` | Archive |

Founder/admin auth required.

---

## 9. Validation

| Check | Result |
|---|---|
| Learning candidate extraction | ✅ `executive-learning.test.ts` |
| Classification A–D | ✅ |
| Confidence scoring | ✅ |
| Approval workflow | ✅ `executive-learning-engine.test.ts` |
| Knowledge retrieval | ✅ |
| Reasoning integration | ✅ bundle formatter tests |
| No permanent learning without approval | ✅ EKB empty until approve API |

---

## 10. Remaining work

| Item | Priority | Notes |
|---|---|---|
| LLM-assisted extraction depth | Post-V1 | Heuristic engine is V1 baseline; PEI-026 Master Plan may add model-based reflection |
| Merge UI in review screen | Low | API exists; UI uses prompt-based edit only |
| Evidence Source adapters (PEI-022–025) | Layer 2 tranche | Commercial/runtime/audit feeds into same pipeline |
| Journey row for mission ID | Governance | Register when Grand King promotes to formal PEI mission |
| Streaming chat path | Medium | `/api/pillow/chat/stream` should mirror observe hook |
| Supersede chain UI | Low | `supersededBy` field present; UI not built |

---

## 11. Governance preserved

- GC-02 / PILLOW-017 approval gates unchanged for money-moving actions
- Learning promotion is **separate** dedicated workflow — no bypass
- Recommend-only intelligence doctrine maintained
- Constitution §3 chain respected — candidates only until GK approves

---

*Executive Learning Engine · Pre-Go-Live · Stop.*
