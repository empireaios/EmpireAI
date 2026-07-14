# 08 — Document Gaps

**Purpose:** Catalog missing documents, incomplete slots, and documentation drift.  
**Total gaps identified:** **24**

---

## 1. Gap Severity Legend

| Severity | Meaning |
|----------|---------|
| **P0** | Blocks Constitution Lock |
| **P1** | Blocks confident Constitution Construction |
| **P2** | Should fix before V1 certification complete |
| **P3** | Quality / navigation improvement |

---

## 2. P0 Gaps — Constitution Lock Blockers

| ID | Gap | CURRENT | RECOMMENDED | FUTURE | Owner |
|----|-----|---------|-------------|--------|-------|
| GAP-DOC-001 | **EMPIREAI_VISION.md missing** | Soul exists; MARKETPLACE_OS_VISION partial only | Author single Vision file from Soul + CTD + marketplace input | Vision Integrity Engine validates alignment | Grand King + Architect |
| GAP-DOC-002 | **Constitution hierarchy one-pager missing** | 5+ "constitution" files without map | Author `docs/governance/EMPIREAI_CONSTITUTION_HIERARCHY.md` | Embedded in Constitution Lock Schedule A | Chief Architect |
| GAP-DOC-003 | **Production truth doctrine missing** | Scattered across MANAGED_DEPLOYMENT, env, code defaults | Author `docs/governance/EMPIREAI_PRODUCTION_TRUTH.md` | Auto-generated deploy manifest | Chief Architect + GK |
| GAP-DOC-004 | **ADR-CON-001 not decided** | Dual frontend (`frontend/` vs `empireai-web/`) | Record Grand King decision in EMPIREAI_DECISIONS.md | Single Cockpit deploy path | Grand King |
| GAP-DOC-005 | **ECC not found** | Referenced in intended hierarchy | Design doc OR explicit Tier 6 deferral ADR | ECC module if built | Chief Architect |
| GAP-DOC-006 | **VIE not found** | Referenced in intended hierarchy | Design doc OR explicit Tier 6 deferral ADR | VIE module if built | Chief Architect |

---

## 3. P1 Gaps — Constitution Construction Blockers

| ID | Gap | CURRENT | RECOMMENDED | FUTURE |
|----|-----|---------|-------------|--------|
| GAP-DOC-007 | EXECUTIVE_AUDIT_INDEX stale | Lists 32; disk has 38 combined audits | Add 6 missing entries | Automated index sync |
| GAP-DOC-008 | Master Index classification incomplete | Path catalog without full tier/class/owner columns | Apply ECDS-1 columns to all entries | CI validation |
| GAP-DOC-009 | docs/README stale | Says "scaffold only" | Rewrite as docs/ navigation entry | — |
| GAP-DOC-010 | ADR-CON-002 Production Mode undocumented | Minimal Pillow chat; extension routes off | Document as Production Mode policy | Full COI mode toggle |
| GAP-DOC-011 | REAL-078 Cockpit path drift | Lists frontend/dashboard; production uses empireai-web/cockpit | Footnote or REAL-078 amendment at Lock | — |
| GAP-DOC-012 | EI architecture TODO incomplete | EXECUTIVE_INTELLIGENCE_ARCHITECTURE placeholder section | Complete or mark FUTURE explicitly | EI V2 architecture |
| GAP-DOC-013 | Unified mission ID registry missing | Chat missions not linked to commits | Mission registry doc or Journey convention | Automated linking |
| GAP-DOC-014 | Autonomous Engineering Constitution (named) | Exists as Engineering Constitution + Cursor docs | Map intended name in hierarchy one-pager | No separate file |

---

## 4. P2 Gaps — Certification & Agent Clarity

| ID | Gap | CURRENT | RECOMMENDED | FUTURE |
|----|-----|---------|-------------|--------|
| GAP-DOC-015 | Historical cluster unlabeled | SYSTEM_ARCHITECTURE etc. still discoverable | HISTORICAL banners + Master Index | historical/ subfolder |
| GAP-DOC-016 | EMPIREAI_ARCHITECTURE.md role unclear | Living memory without classification | Mark OPERATIONAL MEMORY in index | Merge into operational guide pointers |
| GAP-DOC-017 | Pillow Executive Constitution title collision | Two files, similar display names | Display rename: "EI Pillow Executive Roles" | File rename (optional V2) |
| GAP-DOC-018 | Glossary not centralized | Abbreviations in audit only | ECNS-1 glossary appendix in Master Index | Interactive glossary |
| GAP-DOC-019 | Testing documentation scattered | REAL tests + governance refs | Single testing navigation section in Master Index | Test doctrine doc |
| GAP-DOC-020 | Deployment dual-path confusion | MANAGED_DEPLOYMENT vs vercel configs | Production Truth consolidates | — |
| GAP-DOC-021 | Grand King browser sign-off gap | Automated stability pass; human confirmation pending | Document in certification checklist | — |
| GAP-DOC-022 | Postgres migration path | SQLite primary; REAL-132 future | Mark FUTURE in Production Truth | Migration ADR |

---

## 5. P3 Gaps — Quality Improvements

| ID | Gap | CURRENT | RECOMMENDED |
|----|-----|---------|-------------|
| GAP-DOC-023 | ai-agents/ stub | Empty/stub directory | Classify STUB in index |
| GAP-DOC-024 | Constitution backlog CON-001–CON-019 | Listed in full audit | Track in EMPIREAI_DECISIONS or governance register |

---

## 6. Missing Document Slots (To Author — Not Invented)

These are **named gaps from prior audits** — not new document inventions:

| Document | Tier | Source evidence |
|----------|------|-----------------|
| `EMPIREAI_VISION.md` | 2 | Normalization 03, Full audit 02 |
| `docs/governance/EMPIREAI_CONSTITUTION_HIERARCHY.md` | 3 | Normalization 06, Executive recommendation Q4 |
| `docs/governance/EMPIREAI_PRODUCTION_TRUTH.md` | 5 | Architecture 00, Normalization 06 #17 |
| ADR-CON-001 entry | 4 | Normalization 02, Architecture 09 |
| ADR-CON-002 Production Mode | 4 | Architecture 09 |
| Tier 6 deferral annex (ECC/VIE) | 6 | Full audit 15, Normalization 01 Tier 6 |

---

## 7. Documentation vs Code Gaps (Cross-Reference)

| Documented | Document gap | Code reality |
|------------|--------------|--------------|
| Full Pillow COI | Production Mode doc missing | Minimal LLM path in prod |
| Full Brain HTTP | Extension route policy missing | Routes off by default |
| Unified Cockpit | ADR pending | Two frontends deployed |
| Durable sessions | Redis fallback under-documented | Ephemeral when Redis degraded |
| Executive learning panel | UI gap noted in STATUS | Backend exists; UI stub |

*These are operational truth gaps — addressed by GAP-DOC-003 and GAP-DOC-010.*

---

## 8. Gap Count by Domain

| Domain | P0 | P1 | P2 | P3 | Total |
|--------|---:|---:|---:|---:|------:|
| Identity (Vision) | 1 | 0 | 0 | 0 | 1 |
| Law (hierarchy) | 1 | 1 | 0 | 0 | 2 |
| Production | 1 | +2 | 2 | 0 | 4 |
| Architecture | 0 | 2 | 1 | 0 | 3 |
| Navigation/Index | 0 | 3 | 2 | 1 | 6 |
| Tier 6 (ECC/VIE) | 2 | 0 | 0 | 0 | 2 |
| EI | 0 | 1 | 1 | 0 | 2 |
| Registers/ADR | 1 | 1 | 0 | 1 | 3 |
| Historical labeling | 0 | 0 | 2 | 0 | 2 |
| **Total** | **6** | **8** | **8** | **2** | **24** |

---

## 9. Gap Closure Sequence (RECOMMENDED)

```
Phase 1 (P0 — 3–5 days documentation only):
  GAP-DOC-001 Vision
  GAP-DOC-002 Hierarchy one-pager
  GAP-DOC-003 Production truth
  GAP-DOC-004 ADR-CON-001 (Grand King session)
  GAP-DOC-005/006 Tier 6 deferral writing

Phase 2 (P1 — 2–3 days):
  GAP-DOC-007 through GAP-DOC-014

Phase 3 (P2 — ongoing):
  Labeling, glossary, certification updates
```

---

## 10. Completeness Impact

| Metric | Without P0 fixes | With P0 fixes |
|--------|------------------|---------------|
| Canonical set | 52/56 (93%) | 56/56 (100%) |
| Documentation completeness | ~79% | ~88% |
| Constitution Construction ready | NO | YES (drafting) |
| Constitution Lock ready | NO | NO (requires Lock ceremony + P1) |
