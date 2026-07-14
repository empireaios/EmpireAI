# 10 — Builder and Cursor Audit

---

## Cursor Bridge Architecture

**Purpose:** Queue engineering missions from Pillow to Cursor IDE for Grand King supervised execution.

| Component | Path | Role |
|-----------|------|------|
| Pillow Cursor Bridge package | `pillow/src/cursor-bridge/` | Mission model, CLI |
| CursorBridgeAdapter | `backend/src/orchestration/pillow-approval/cursor-bridge-adapter.ts` | PILLOW-017 adapter |
| CursorHeartbeatService | `cursor-heartbeat-service.ts` | Mission monitoring |
| ApprovalGateEngine | `approval-gate-engine.ts` | Grand King approval gates |
| SqlitePillowApprovalRepository | `repository/sqlite-pillow-approval-repository.ts` | Persistence |
| HTTP routes | `pillow-approval/routes/pillow-approval-routes.ts` | `/api/pillow/cursor/dispatch`, `/status` |

**Introduced by:** Phase 5 commit `1b534cb` (PILLOW-CB-001)

---

## Production Behavior

| Setting | Effect |
|---------|--------|
| `isPillowProductionModeEnabled()` false | `dryRunLaunch: true` on Cursor bridge |
| V1 operational ready + live credentials | Live cursor launch allowed |

**Default in production:** Missions queued in dry-run — **not auto-executed in Cursor**.

---

## Builder / Store Builder

| Item | Path |
|------|------|
| Agent definition | `backend/src/agents/definitions/agents.ts` (`store-builder`) |
| UI module | `empireai-web/components/platform/modules/StoreBuilderModule.tsx` |
| Execution bridges | `agents/store-execution-bridge/`, `order-execution-bridge/` |

**Status:** Agent exists; platform module in legacy platform route group (redirected to cockpit).

---

## Cursor Mission Artifacts (Pending)

**Location:** `.cursor/missions/pending/`  
**Count:** 16 `bridge-*.md` + `PILLOW-017.md` + `REPOSITORY-SYNC.md`

**Status:** Pending queue — **not evidence of completed execution**.

---

## Governance Docs for Cursor/Builder

| Document | Purpose |
|----------|---------|
| `EMPIREAI_CURSOR_OUTPUT_STANDARD.md` | Output format law |
| `EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md` | Recovery rules |
| `docs/governance/CURSOR_OUTPUT_TEMPLATE.md` | Template |
| `EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md` | Artifact workflow |

---

## Zero-Human / ETA Rules

**Evidence in repo:**
- Cursor recovery doctrine defines autonomous recovery expectations
- Production scripts run without human approval (`production-journey-verify.mjs`)
- Pillow bridge dry-run prevents unsupervised live Cursor launch in production

**Gaps:**
- No single "Zero Human Rule" canonical file named in mission brief
- ETA reporting rules scattered across mission docs, not one registry

---

## Supervision Model

```
Grand King approval → ApprovalGateEngine → CursorBridgeAdapter → Cursor IDE
                              ↑
                    Pillow executive council (non-prod chat path)
```

**Production chat path skips executive council** — supervision via approval routes separate from chat.

---

## Audit Summary

| Question | Answer |
|----------|--------|
| What exists? | Full Cursor bridge stack + approval layer |
| Active? | ✅ Code active; dry-run default in production |
| Tested? | ✅ `pillow/src/validation/tests/cursor-bridge.test.ts` |
| Documented? | ✅ Doctrines + PILLOW-CB-001 audit trail |
| Gaps? | Pending `.cursor/missions/` not cleared; live Cursor launch gated; no ECC |

---

## Builder Health

| Area | Rating |
|------|--------|
| Code completeness | **Strong** |
| Production safety | **Strong** (dry-run default) |
| End-to-end live Cursor loop | **Not proven in production** |
| Mission queue hygiene | **Weak** — 16 pending bridge missions |
