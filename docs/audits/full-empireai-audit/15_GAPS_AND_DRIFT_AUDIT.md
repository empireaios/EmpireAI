# 15 — Gaps and Drift Audit

**Legend:**  
- **VISION DRIFT** — vs intended hierarchy from mission brief  
- **ARCHITECTURE DRIFT** — vs `EMPIREAI_CANONICAL_ARCHITECTURE.md`  
- **PRODUCTION DRIFT** — vs documented production intent  
- **DOCUMENTATION DRIFT** — vs repository master index  

---

## Missing Canonical Artifacts

| Artifact | Status | Impact |
|----------|--------|--------|
| **EMPIREAI_VISION.md** (single canonical Vision file) | ❌ Missing | Vision drift — only partial `MARKETPLACE_OS_VISION.md` |
| **Vision Integrity Engine** | ❌ Not in code or docs | INTENDED HIERARCHY CHECK gap |
| **Execution Control Center (ECC)** | ❌ Not found | INTENDED HIERARCHY CHECK gap |
| **Autonomous Engineering Constitution** (named) | 🟡 Partial | Engineering constitution exists under different name |
| **Production truth doctrine** (single doc) | 🟡 Partial | Scattered across MANAGED_DEPLOYMENT, env readiness, journey scripts |
| **Constitution hierarchy one-pager** | ❌ Missing | Agents misread similarly named docs |
| **Unified mission ID registry** | ❌ Missing | Chat missions not linked to commits in repo |

---

## Vision Drift

| Intended | Repository reality |
|----------|-------------------|
| Vision sits above Soul/Bible/Roadmap | Soul exists; Vision file missing |
| Pillow as full COI in production | Production chat uses minimal LLM path |
| Full Empire OS exposed to Grand King | ~150 HTTP modules gated off |
| ECC supervises execution | No ECC module |
| Vision Integrity validates alignment | No VIE module |

---

## Architecture Drift

| Canonical target | Drift |
|------------------|-------|
| Postgres-scalable Brain DB | SQLite sql.js primary |
| Unified founder UX | Two frontends |
| Full module HTTP surface | Extension routes opt-in |
| Pillow repository intelligence in chat | Skipped in production |
| Multi-worker Brain | Workers disabled at production API boot |

---

## Production Drift

| Documented intent | Observed behavior |
|-------------------|-------------------|
| Full Brain API | Critical routes only by default |
| Durable sessions | Redis required; degraded = ephemeral |
| Pillow full intelligence | Minimal fast path |
| Grand King browser acceptance | Automated pass; human sign-off gap |
| frontend/ as founder UX | empireai-web may serve cockpit on production domain |

---

## Documentation Drift

| Issue | Evidence |
|-------|----------|
| Audit index stale | 32 vs 38 combined audits |
| docs/README stale | "scaffold only" |
| SYSTEM_ARCHITECTURE conflicts | Pre-Pillow model |
| MANAGED_DEPLOYMENT vs vercel configs | Two frontend deploy paths |
| EI architecture TODO section | Incomplete placeholder in EXECUTIVE_INTELLIGENCE_ARCHITECTURE.md |

---

## Code vs Documentation Gaps

| Documented capability | Code exists | Wired to production UX |
|----------------------|-------------|------------------------|
| G3 intelligence engines | ✅ | 🟡 Partial panels |
| G5 automation centre | ✅ | 🟡 Placeholders |
| G8 authorization centre | ✅ | 🟡 Partial |
| Cursor live missions | ✅ | ❌ Dry-run default |
| Executive learning panel | ✅ backend | ❌ "not yet implemented" UI |
| Governance panels SCR-700+ | ✅ backend routes | ❌ UI not wired |

---

## Hierarchy Alignment Gaps (INTENDED HIERARCHY CHECK)

| Layer | Gap severity |
|-------|-------------|
| Grand King | Low — implemented |
| Chief Architect + Pillow COI | Medium — Architect doc-only; Pillow trimmed in prod |
| EmpireAI OS | Medium — code exists, UX partial |
| Soul/Vision/Bible/Roadmap | **High** — Vision missing |
| VIE / ECC / Autonomous Engineering Constitution | **High** — missing or unnamed |
| Brain/Cockpit/Builder/Runtime/Commerce | Low–Medium — built but production subset |

---

## Obsolete / Unclear Items

| Item | Classification |
|------|----------------|
| `docs/SYSTEM_ARCHITECTURE.md` | Obsolete |
| `frontend/src/pages/dashboard/*` | Legacy (redirected) |
| `empireai-web/platform/*` | Legacy (redirected) |
| `artifacts/empireai-master-build-bible.md` | Historical |
| `.cursor/missions/pending/bridge-*` | Unclear — pending execution |
| `ai-agents/` | Stub |

---

## Drift Severity Summary

| Category | Severity |
|----------|----------|
| Missing Vision / ECC / VIE | **Critical for Constitution lock** |
| Dual frontend authority | **High** |
| Production route gating | **High** (intentional but under-documented) |
| Pillow production trim | **Medium** (intentional for stability) |
| Documentation volume/confusion | **Medium** |
| Test vs browser gap | **Medium** |
