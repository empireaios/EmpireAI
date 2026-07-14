# 02 — Canonical Ownership

**Principle:** Every canonical artifact has exactly one **owning authority** and one **maintaining agent** (human or AI role).

---

## Authority Ownership Matrix

| Tier | Artifact / System | Owner (decides) | Maintainer (updates) | Code root (if any) |
|------|-------------------|-----------------|----------------------|-------------------|
| 0 | Grand King sovereignty | Grand King | Grand King | auth role `founder` |
| 1 | Strategic architecture | ChatGPT Chief Architect | Chief Architect + Cursor | — |
| 1 | Pillow COI identity & behaviour | Pillow Constitution | Pillow + Brain host | `pillow/`, `pillow-host/` |
| 2 | Vision File | Grand King + Architect | Chief Architect | — (doc only) |
| 2 | Soul File | Grand King | Chief Architect | `EMPIREAI_SOUL.md`, `foundation/soul-file/` |
| 3 | CTD (supreme law) | Grand King | Chief Architect | — |
| 3 | Engineering Constitution | Chief Architect | Cursor (missions) | `brain/`, `guardian/` |
| 3 | GVD / ACD / UID / CBD | Grand King + Architect | Domain owners | `foundation/*` |
| 3 | Pillow constitutions | Pillow (COI) under Grand King | Pillow + EI library | `pillow/` |
| 3 | EI library (EI0–EI10) | Executive Intelligence programme | EI maintainers | `docs/executive-intelligence/` |
| 4 | Master Roadmap | Grand King + Architect | Chief Architect | `EMPIREAI_ROADMAP.md` |
| 4 | Pillow Roadmap | Pillow COI | Pillow | `PILLOW_ROADMAP.md` |
| 4 | V1 Bible | Chief Architect | Chief Architect | `artifacts/empireai-version-1-build-hierarchy-bible.md` |
| 4 | Journey / Status | Operations | Cursor + Grand King | `JOURNEY.md`, `EMPIREAI_STATUS.md` |
| 4 | ADR register | Chief Architect | Cursor | `EMPIREAI_DECISIONS.md` |
| 5 | Brain | Engineering Constitution | Brain team / Cursor | `backend/src/brain/` |
| 5 | Cockpit UX | UID doctrine | Cockpit builders | `empireai-web/` (recommended) |
| 5 | Founder shell / marketing | UID doctrine | Frontend maintainers | `frontend/` |
| 5 | Cursor Bridge / Builder | Pillow + Engineering Standards | Pillow approval layer | `pillow-approval/`, `cursor-bridge/` |
| 5 | Runtime (REAL modules) | Architecture + Roadmap | Mission owners per REAL-### | `backend/src/runtime/` |
| 5 | Commerce engines | CBD + Commerce OS | Orchestration owners | `orchestration/`, `intelligence/` |
| 5 | Production infra | Production truth doctrine | DevOps / Grand King | `deployment/`, Railway, Vercel |
| 5 | Guardian | Engineering Constitution | Brain | `guardian/` |

---

## Runtime Subsystem Ownership (Code)

| Subsystem | Single owner module | Consumers |
|-----------|---------------------|-----------|
| Brain core | `backend/src/brain/index.ts` | All HTTP, workers |
| Pillow host | `orchestration/pillow-host/pillow-host.ts` | Cockpit Pillow, BFF |
| Auth | `auth/routes.ts`, `session-store.ts` | All protected routes |
| Executive Home | `domain/services/executive-home-loader.ts` | Cockpit command view |
| Orchestrator / dispatch | `brain/orchestrator.ts` | `/brain/dispatch` |
| Tool registry | `brain/tools/tool-registry.ts` | Agents, modules |
| Event stream | `brain/events/event-stream.ts` | Cockpit SSE |
| Cursor Bridge | `pillow-approval/cursor-bridge-adapter.ts` | Builder missions |

---

## Ownership Conflicts to Resolve (ADR Required)

| Conflict | Parties | Resolution mechanism |
|----------|---------|---------------------|
| Production Grand King UX | `frontend/` vs `empireai-web/` | **ADR-CON-001** — Grand King decides |
| Pillow full COI vs production minimal chat | Pillow constitution vs Brain stability | **Production mode doctrine** — document, don't silently trim |
| REAL HTTP vs dispatch-only in production | Architecture vs Railway ops | **Production route policy** doc |
| CTD commercial vs Engineering technical | Two constitutions | **Already resolved** — CTD wins commercial; document in one-pager |

---

## Who Owns What — Plain Language

- **Grand King** owns sovereignty, final approval, and Vision/Soul sign-off.
- **Chief Architect** owns hierarchy, constitution drafting, roadmaps, and canonical architecture target.
- **Pillow** owns operating intelligence behaviour, Cursor supervision model, and Pillow identity docs — hosted inside Brain at runtime.
- **Brain** owns execution, auth, persistence, Guardian, and production API contract.
- **Cockpit** owns Grand King daily UX — recommended owner: `empireai-web/` pending ADR.
- **Historical artifacts** are owned by **Governance archive** — immutable evidence, no living edits except index pointers.

---

## Ownership Labels for Master Index

Every file in `EMPIREAI_REPOSITORY_MASTER_INDEX.md` should gain:

```
| Path | Tier | Classification | Owner | Maintainer |
```

Classification enum: `CANONICAL` | `OPERATIONAL` | `HISTORICAL` | `EVIDENCE` | `STUB`
