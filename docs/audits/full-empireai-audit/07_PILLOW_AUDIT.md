# 07 — Pillow Audit

**Package:** `pillow/` (`@empireai/pillow`)  
**Brain integration:** `backend/src/orchestration/pillow-host/`  
**Introduced by:** PILLOW-016 commit series through Phase 10 (CEV-001)

---

## What Exists

### Pillow Package Subsystems

| Subsystem | Path | Purpose | Tested? |
|-----------|------|---------|---------|
| Bootstrap | `pillow/src/bootstrap/` | Repo root, governance knowledge | ✅ bootstrap.test.ts |
| Repository Intelligence | `repository-intelligence/` | Phase 2 repo scanning | ✅ cert tests |
| Technical Chief | `technical-chief/` | Phase 3 engineering authority | ✅ |
| UX Designer | `ux-designer/` | Phase 4 UX authority | ✅ |
| Cursor Bridge | `cursor-bridge/` | Phase 5 Cursor missions | ✅ |
| Infrastructure Commander | `infrastructure-commander/` | Phase 6 infra | ✅ |
| Commerce Intelligence | `commerce-intelligence/` | Phase 7 commerce exec | ✅ |
| Empire Commander | `empire-commander/` | Phase 8 | ✅ |
| Empire Operating System | `empire-operating-system/` | Phase 9 EOS | ✅ |
| Continuous Evolution | `continuous-evolution/` | Phase 10 CEV | ✅ |
| Context, intelligence, memory, planner, supervisor, recovery, command, openai, learning, objective, executive-perspectives | Various | Core Pillow runtime | ✅ partial |

### Brain Pillow Host

| Component | File | Role |
|-----------|------|------|
| PillowHost singleton | `pillow-host.ts` | Lifecycle, routePrompt, sessions |
| HTTP routes | `routes/pillow-routes.ts` | `/api/pillow/*` |
| Session store | `session-store.ts` | In-memory workspace sessions |
| LLM adapter | `brain-llm-adapter.ts` | Routes to Brain LLMRouter |
| Repo root resolution | `resolve-repo-root.ts` | Governance bundle on Railway |
| Approval layer | `pillow-approval/` | Cursor bridge, approval gates |

---

## Identity & Governance

| Document | Role |
|----------|------|
| `EMPIREAI_PILLOW_CONSTITUTION.md` | **Master Pillow identity** |
| `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` | Cognition/learning layer |
| `PILLOW_ARCHITECTURE_CONTRACT.md` | Frozen contract |
| `docs/governance/PILLOW_PRODUCT_INTEGRATION_MASTER_PLAN.md` | Integration plan |
| `.pillow-governance-bundle/` | Railway build-time governance mirror |

**Boot requirement:** Governance knowledge files must exist at resolved repo root or startup fails.

---

## Production Behavior (Critical)

| Behavior | Production | Non-production |
|----------|------------|----------------|
| Pillow auto-boot | ❌ Lazy on first session/chat | ✅ After 5s delay |
| Chat command processing | ❌ Skipped (minimal response) | ✅ Full |
| Repository context slices | ❌ Skipped | ✅ Built |
| Executive reasoning | ❌ Skipped | ✅ Composed |
| Executive council | ❌ Skipped | ✅ When triggered |
| Executive learning observation | ❌ Skipped | ✅ |
| LLM completion | ✅ Via LLMRouter (45s timeout) | ✅ |
| Cursor bridge dry-run | ✅ Unless V1 operational ready | Configurable |

**Why production trim exists:** Event-loop protection on Railway single-process Brain (commits `78c4cf8`, `c6c0003`, `62705a9`).

---

## Session & Chat Flow

1. `POST /api/pillow/session` — creates in-memory session (founder/admin only)
2. `POST /api/pillow/chat` — `routePrompt()` → LLM → audit log `pillow.request`
3. `GET /api/pillow/history` — conversation history from memory
4. SSE: `/api/pillow/chat/stream`, `/api/pillow/events/stream`

**Risk:** Sessions lost on Brain restart. No Redis backing for Pillow chat state.

---

## OpenAI / LLM Path

```
routePrompt → llmLayer.complete() → createBrainLLMAdapter → LLMRouter → OpenAIProvider
```

Providers: openai, anthropic, gemini (env keys). Default from `DEFAULT_LLM_PROVIDER`.

---

## Commerce Intelligence / Empire Commander / EOS / CEV

**Code status:** All phases committed with validation tests in `pillow/src/validation/tests/`.

**Production connection:** Subsystems exist in package; Brain production fast path **does not invoke** full commerce/commander/EOS pipelines during chat.

---

## Pillow Health States

Lifecycle: `stopped` → `starting` → `running` | `error`  
Health: Idle, Running, Busy, Recovering, Error  
Boot timeout: 120s (`PILLOW_BOOT_TIMEOUT_MS`); stuck recovery at 130s.

---

## Audit Questions Answered

| Question | Answer |
|----------|--------|
| What exists? | Full 10-phase Pillow package + Brain host |
| Where implemented? | `pillow/`, `backend/src/orchestration/pillow-host/` |
| Why? | PILLOW-016 Brain integration + phased capability expansion |
| Which mission? | Commits `e9dac19`–`5c2a41a`, combined Pillow audits |
| Who owns? | Pillow constitution; hosted by Brain |
| Active or obsolete? | **Active** — production trimmed, not obsolete |
| Documented? | **Yes** — extensive |
| Tested? | **Yes** — pillow + backend pillow tests |
| Production-connected? | **Partial** — chat works; full intelligence trimmed |
| Aligned with hierarchy? | **Partial** — COI role documented; production doesn't expose full COI |

---

## Top Pillow Risks

1. Production minimal path hides most Pillow intelligence from Grand King chat
2. Ephemeral chat sessions
3. Governance boot failure if bundle missing
4. Hung boot recovery added recently (`9e51bc7`) — monitor
5. Name collision between Pillow constitution docs
