# Combined Executive Audit — Pillow Product Integration Master Plan

> **Authority:** Grand King · Pillow Architecture  
> **Mission:** Produce canonical plan for integrating Pillow into live EmpireAI product (PILLOW-016…019)  
> **Date:** 2026-06-29 · **Synchronized:** 2026-06-29 (Executive Perspectives · Constitutional Laws)  
> **Status:** ✅ Planning complete — canonical plan current; no runtime modified

---

## 1. Intent

Establish the **canonical master plan** for Pillow product integration covering frontend, backend, OpenAI, Cursor Bridge, Brain, Executive Perspectives (single Pillow intelligence), session lifecycle, approval gates, chat interface, and migration strategy.

---

## 2. Plan deliverable

| Artifact | Path |
|---|---|
| **Canonical plan** | `docs/governance/PILLOW_PRODUCT_INTEGRATION_MASTER_PLAN.md` |

Supersedes `PILLOW_RUNTIME_INTEGRATION_PLAN.md` for **product-level** integration scope (historical plan retained as Phase 1–3 archaeology).

---

## 3. Scope covered

| Area | Plan section | Current baseline |
|---|---|---|
| **PILLOW-016** | §4 Brain + OpenAI | ✅ `pillow-host` · `brain-llm-adapter` · `pillow/src/openai/` |
| **PILLOW-017** | §5 Approval + Cursor Bridge | ✅ `pillow-approval/` · objective gate in host |
| **PILLOW-018** | §6 Chat UI | ✅ `PillowChatPage.tsx` · `frontend/src/api/pillow.ts` |
| **PILLOW-019** | §7 Objective orchestrator | ✅ `pillow/src/objective/` · `/api/pillow/objective` |
| **Frontend** | §6 | Components in `frontend/src/components/pillow/` |
| **Backend** | §4–§5 | `pillow-host` · `pillow-approval` · `pillow-executive-council` |
| **OpenAI** | §4.3 | Brain `LLMRouter` via adapter — ADR-010 compliant |
| **Cursor Bridge** | §5.4 | Dry-run default · heartbeat ingress · supervisor |
| **Brain** | §4 | Singleton host at app startup · audit · SQLite |
| **Executive Perspectives** | §8 | `pillow/src/executive-perspectives/` · Pillow synthesis · API alias `/executive-council/` |
| **Session lifecycle** | §9 | Host + workspace session state machines |
| **Approval gates** | §5 | Unified gate · PILLOW-019 objective filter |
| **Chat interface** | §6 | `/dashboard/pillow` · SSE streaming |
| **Migration strategy** | §10 | Phase 0 ✅ · Phases 1–4 planned |

---

## 4. Architectural principles certified

| Principle | Plan enforcement |
|---|---|
| Pillow = Executive Intelligence | §3 three-layer model · ADR-047 |
| GC-03/GC-05 = interface layers only | §3 · §6.5 |
| Cursor Sovereignty | §5.4 · §8.2 — no auto-dispatch |
| Grand King exclusivity | §6.4 · ADR-016 |
| One Objective / Builder Mode | §7 · PILLOW-019 |
| Dual-track Empire vs Pillow governance | §5.5 · §8.1 |

---

## 5. Product integration phases (summary)

| Phase | Status | Focus |
|---|---|---|
| **0 — Runtime wiring** | ✅ Complete | PILLOW-016…019 · Perspectives · Constitutional Laws |
| **1 — Product hardening** | 🔵 Planned | Constitutional UI · perspective UI copy · vault review |
| **2 — Surface federation** | 🔵 Planned | GC-03/GC-05 ↔ Pillow Chat coordination |
| **3 — Go-live readiness** | 🔵 Gated | GK-GOLIVE · PROOF-001 · dry-run off |
| **4 — Layer 2 on product** | 🔵 Post-V1 | PEI missions on chat pipeline |

---

## 6. Explicit non-changes

This planning mission **did not modify**:

- GC-03 / GC-05 implementations  
- Pillow host runtime behaviour  
- API contracts  
- Frontend components  
- `@empireai/pillow` package logic  

---

## 7. Certification

The **Pillow Product Integration Master Plan** is the canonical reference for integrating Pillow into the live EmpireAI product across PILLOW-016, PILLOW-017, PILLOW-018, and PILLOW-019.

Runtime integration is complete. Remaining work is **product hardening and federation** (Phases 1–4), each requiring Grand King-approved engineering missions.

---

_Executive Audit complete — planning mission stopped._
