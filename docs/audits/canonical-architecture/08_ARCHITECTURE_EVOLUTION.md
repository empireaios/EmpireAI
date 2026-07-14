# 08 — Architecture Evolution

**Timeline model:** CURRENT (evidence) → RECOMMENDED (doc authority) → FUTURE (REAL-078 + roadmaps)

---

## Evolution Summary Table

| Domain | CURRENT | RECOMMENDED | FUTURE |
|--------|---------|-------------|--------|
| **Supreme law** | CTD exists | CTD apex until Constitution Lock | Unified master Constitution incorporating CTD Book I |
| **Vision** | Partial marketplace doc | Author EMPIREAI_VISION.md | VIE automated alignment |
| **Architecture authority** | REAL-078 + scattered | This reconstruction + REAL-078 | Single updated REAL-078 post-ADR |
| **Pillow ownership** | Code + constitution | Explicit in all arch docs | Unchanged |
| **Brain** | SQLite, single process, extension gating | Document production mode | Postgres, optional multi-instance |
| **Pillow runtime** | Minimal prod chat | Production Mode doctrine | Full COI path when capacity allows |
| **Cockpit** | empireai-web 53 pages | Canonical Grand King UI | Unified app; REAL-078 V2 chrome |
| **Founder Shell** | frontend login/marketing | Entry layer only | Merge into unified client FUTURE |
| **Cockpit Proxy** | 6 BFF routes | Standard client path | Unchanged |
| **Guardian** | Enabled; health endpoints | Layered monitoring model | Deeper auto-heal with ECC FUTURE |
| **Builder** | Cursor dry-run prod | Supervised missions documented | Live Cursor with approval FUTURE |
| **Runtime modules** | 613 files; dispatch-primary prod | REAL=mission ID namespace | commerce/ consolidation |
| **Intelligence G3** | Built; partial Cockpit | Full panel wiring roadmap | Live connector-only prod |
| **Business engines** | Scattered folders | Mapping table in canonical arch | Physical commerce/ tree |
| **Eye** | Amazon, Trends connectors | Connector boundary law | More marketplaces |
| **Foundation** | SQLite modules | Governs; runtime advises | Unchanged role |
| **EKLS** | Spec + partial runtime | Canonical memory layer | Full institutional memory |
| **Auth** | Redis with degraded fallback | Redis mandatory prod doctrine | OAuth/2FA extensions |
| **Persistence** | sql.js debounced persist | Document crash window | Postgres primary REAL-132 |
| **Task queue** | BullMQ; workers off at API boot | Separate worker deployment doc | Always-on workers |
| **Production deploy** | Railway + Vercel split | Production truth doc | Unchanged topology V1 |
| **Testing** | 285 tests + journey scripts | E2E architecture | Playwright Grand King CI |
| **ECC** | Not found | Tier 6 deferral doc | Execution supervision center |
| **VIE** | Not found | Tier 6 deferral doc | Vision integrity automation |

---

## Phase Evolution (Programme Alignment)

### Phase A — COMPLETE (Evidence)
- Brain core, Guardian, Auth, dispatch  
- Pillow package phases 2–10 + Pillow Host  
- G2–G8 gate programmes (code + tests + artifacts)  
- REAL-101–135 Cockpit wiring  
- Production journey + long-run stability scripts  
- Event-loop cooperative architecture  

### Phase B — CURRENT (In production, doc lag)
- Cockpit in empireai-web (not reflected in REAL-078 mapping)  
- Extension route production gating  
- Pillow production minimal path  
- Dual Vercel deploy configs  

### Phase C — RECOMMENDED (Documentation reconstruction — next)
- Vision file  
- Production truth architecture  
- Constitution hierarchy one-pager  
- REAL-078 mapping update  
- Master Index classification  
- Frontend authority ADR  

### Phase D — FUTURE (Normative REAL-078 + roadmaps)
- Postgres primary  
- Unified Cockpit client  
- commerce/ namespace consolidation  
- Full extension HTTP in production (if policy changes)  
- ECC + VIE  
- Multi-instance Brain  
- Full Pillow COI in production hot path  

---

## Architectural Evolution — Client Plane

```
PAST:     frontend/dashboard (Vite executive pages)
CURRENT:  empireai-web/cockpit (Next.js) + frontend redirect shell
RECOMMENDED: ADR declares empireai-web as Cockpit authority
FUTURE:   Single unified app (REAL-078 V2) — optional folder rename
```

---

## Architectural Evolution — Execution Plane

```
PAST:     Sync SQLite persist blocking event loop
CURRENT:  Debounced async persist; cooperative yields; lite Executive Home
RECOMMENDED: Document as Production Stability Architecture
FUTURE:   Postgres + worker separation + optional horizontal scale
```

---

## Architectural Evolution — Pillow

```
PAST:     PILLOW-016 Brain integration only
CURRENT:  Full 10-phase package; prod host uses minimal chat path
RECOMMENDED: Production Mode ≠ reduced ownership
FUTURE:   Full repository intelligence in chat when infra supports
```

---

## What Must NOT Evolve (Permanent)

1. Pillow sole technical ownership (Constitution §17)  
2. Single Brain dispatch path for autonomous action  
3. CTD commercial supremacy  
4. Cockpit as visualisation shell — not source of truth  
5. Connector boundary via Eye / Reality Integration  
6. CRI commercial risk gating principle (ADR-051)  

---

## Evolution Risks If Unmanaged

| Risk | Trigger | Mitigation |
|------|---------|------------|
| Architecture doc drift | New missions without REAL-078 update | ADR + Journey audit |
| Agent reads wrong architecture | 4 overlapping docs | Master Index classification |
| Production surprise | Undocumented route gating | Production truth doc |
| Dual frontend confusion | New features on wrong surface | ADR-CON-001 |
| Ownership erosion | Modules implementing own auth | ACD enforcement |

---

## Merge Timeline (Documentation Only)

| When | Merge action |
|------|--------------|
| Constitution prep | Vision + marketplace partial |
| Constitution prep | Production truth scatter → one doc |
| Post-ADR | REAL-078 cockpit mapping update |
| V2 programme | commerce/ folder consolidation plan |
| V2 programme | ECC/VIE design docs if promoted from Tier 6 |
