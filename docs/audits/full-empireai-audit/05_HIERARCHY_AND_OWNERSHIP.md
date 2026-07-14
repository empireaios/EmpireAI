# 05 — Hierarchy and Ownership

**Comparison reference:** INTENDED HIERARCHY CHECK (from mission brief)  
**Repository fact:** What is explicitly documented vs implemented.

---

## Intended Hierarchy (Mission Reference — Not Repository Fact)

```
Grand King
  ↓
ChatGPT Chief Architect + Pillow Chief Operating Intelligence
  ↓
EmpireAI Operating System
  ↓
Soul File · Vision · EmpireAI Bible · Master Roadmap
  ↓
Autonomous Engineering Constitution · Vision Integrity Engine · Execution Control Center
  ↓
Brain · Cockpit · Builder / Cursor Bridge · Runtime · Commerce · Business Engines · Production
```

---

## Documented Ownership (Repository Evidence)

| Entity | Documented role | Evidence file |
|--------|-----------------|---------------|
| **Grand King** | Supreme operator, founder access | `EMPIREAI_GOVERNANCE_DOCTRINE_GVD.md`, auth seed users, Cockpit "Grand King Access" UI |
| **ChatGPT Chief Architect** | Strategic architecture authority | Referenced in governance docs; **not a code module** |
| **Pillow** | Chief Operating Intelligence | `EMPIREAI_PILLOW_CONSTITUTION.md` §17 hierarchy, `pillow-host.ts` |
| **EmpireAI OS** | Operating system layer | `pillow/empire-operating-system/`, PILLOW-EOS-001 commits |
| **Soul File** | Identity memory | `EMPIREAI_SOUL.md`, `foundation/soul-file/` |
| **Vision** | Strategic north star | **GAP** — no canonical Vision file |
| **Bible** | Build hierarchy | `artifacts/empireai-version-1-build-hierarchy-bible.md` |
| **Master Roadmap** | Programme direction | `EMPIREAI_ROADMAP.md` |
| **Brain** | Execution kernel | `backend/src/brain/`, `EMPIREAI_CONSTITUTION.md` |
| **Cockpit** | Executive UX | `empireai-web/`, G4 artefacts |
| **Builder / Cursor Bridge** | Engineering missions to Cursor | `pillow/cursor-bridge/`, `cursor-bridge-adapter.ts` |
| **Guardian** | Health/risk engine | `guardian/guardian-engine.ts` |
| **Runtime (REAL modules)** | 100+ domain runtimes | `backend/src/runtime/` |
| **Commerce** | Integration + intelligence | G2/G3, `orchestration/commerce-*` |
| **Production** | Railway + Vercel | `deployment/MANAGED_DEPLOYMENT.md` |

---

## Hierarchy Alignment Audit

| Intended layer | In repo? | Aligned? | Notes |
|----------------|----------|----------|-------|
| Grand King | ✅ | ✅ | Auth role `founder`, Cockpit UX |
| Chief Architect | 🟡 | 🟡 | Doc-only; no runtime agent |
| Pillow COI | ✅ | 🟡 | Full package exists; production trimmed |
| EmpireAI OS | ✅ | 🟡 | Code exists; not sole UX entry |
| Soul File | ✅ | ✅ | Doc + modules |
| Vision | ❌ | ❌ | Missing canonical file |
| Bible | ✅ | 🟡 | Multiple bibles; hierarchy bible canonical |
| Master Roadmap | ✅ | 🟡 | Layered roadmaps, not one doc |
| Autonomous Engineering Constitution | 🟡 | 🟡 | Engineering constitution partial fit |
| Vision Integrity Engine | ❌ | ❌ | Not found |
| Execution Control Center | ❌ | ❌ | Not found |
| Brain | ✅ | ✅ | Production active |
| Cockpit | ✅ | 🟡 | Dual frontend surfaces |
| Builder / Cursor Bridge | ✅ | 🟡 | Dry-run default in production |
| Runtime | ✅ | 🟡 | Routes gated off in production |
| Commerce | ✅ | 🟡 | Built; live mode gated |
| Business Engines | ✅ | 🟡 | Extensive code; extension routes off |
| Production | ✅ | 🟡 | Working journey; policy gaps |

---

## Subsystem Ownership (Code-Level)

| Subsystem | Owner module path | Depends on | Depended on by |
|-----------|-------------------|------------|----------------|
| Brain core | `backend/src/brain/` | Redis, SQLite, env | All routes, Pillow host |
| Pillow host | `orchestration/pillow-host/` | `@empireai/pillow`, LLMRouter | Cockpit Pillow panel, BFF |
| Auth | `auth/` | Session store, SQLite users | All protected routes |
| Executive Home | `domain/services/executive-home-*` | Operational command view, SQLite | `/brain/dispatch` |
| Guardian | `guardian/` | Brain subsystems | `/health`, `/guardian/*` |
| Task queue | `brain/task-queue.ts` | Redis/BullMQ | Agents, workflows |
| Cursor Bridge | `pillow-approval/cursor-bridge-adapter.ts` | Pillow session, SQLite approvals | `/api/pillow/cursor/*` |
| Cockpit UI | `empireai-web/` | BFF, Brain | Grand King UX |
| Founder SPA | `frontend/` | Brain direct API | Vercel primary per root vercel.json |

---

## Authority Conflicts Found

1. **Two UX authorities:** `frontend/` (V1 contract in deployment docs) vs `empireai-web/` (actual Cockpit with BFF) — **unclear which is production Grand King surface for empire-ai.co**.
2. **Pillow identity:** Root `EMPIREAI_PILLOW_CONSTITUTION.md` vs `docs/executive-intelligence/PILLOW_EXECUTIVE_CONSTITUTION.md` — different documents, similar names.
3. **Commercial supreme law:** CTD vs Engineering Constitution — documented deferral exists but agents may confuse.
4. **REAL module HTTP vs dispatch-only:** Production disables extension routes — hierarchy implies full Empire OS; production serves critical subset.

---

## Recommended Canonical Ownership Map (Evidence-Based Proposal)

| Domain | Canonical owner doc | Canonical code root |
|--------|---------------------|---------------------|
| Empire identity | `EMPIREAI_SOUL.md` | `foundation/soul-file/` |
| Empire law (commercial) | `EMPIREAI_CORE_CONSTITUTION_CTD.md` | — |
| Empire law (engineering) | `EMPIREAI_CONSTITUTION.md` | `brain/`, `guardian/` |
| Pillow identity | `EMPIREAI_PILLOW_CONSTITUTION.md` | `pillow/`, `pillow-host/` |
| Architecture target | `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` | — |
| Build programme | `artifacts/empireai-version-1-build-hierarchy-bible.md` | — |
| Navigation | `EMPIREAI_REPOSITORY_MASTER_INDEX.md` | — |
| Production ops | `deployment/MANAGED_DEPLOYMENT.md` | `railway.toml`, vercel configs |
