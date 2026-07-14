# 09 — Document Conflicts

**Purpose:** Catalog unresolved documentation conflicts.  
**Total documentation conflicts:** **31**

Sources: Hierarchy normalization (22 naming + 14 hierarchy, deduplicated), Full audit (duplicate truth), Canonical architecture (11 architecture conflicts, documentation-relevant subset).

---

## 1. Conflict Severity

| Severity | Definition |
|----------|------------|
| **CRITICAL** | Agents may cite wrong law or architecture |
| **HIGH** | Production authority unclear |
| **MEDIUM** | Navigation confusion; resolvable by index |
| **LOW** | Display naming; no content contradiction |

---

## 2. CRITICAL Conflicts (6)

| ID | Conflict | Doc A | Doc B | CURRENT winner | RECOMMENDED resolution | FUTURE |
|----|----------|-------|-------|----------------|------------------------|--------|
| CON-DOC-001 | Pre-Pillow vs Pillow hierarchy | `docs/SYSTEM_ARCHITECTURE.md` | CTD + Canonical Architecture | CTD (implicit) | Label SYSTEM_ARCHITECTURE HISTORICAL | Archive banner |
| CON-DOC-002 | Vision missing vs Soul exists | EMPIREAI_SOUL.md | Intended Vision tier | Soul only | Author EMPIREAI_VISION.md | VIE validates |
| CON-DOC-003 | CTD apex vs unqualified "Constitution" | CTD | 5+ constitution files | CTD (unstated to agents) | Constitution hierarchy one-pager | Lock Schedule A |
| CON-DOC-004 | EI1 vs CTD empire law | EI1_EMPIRE_CONSTITUTION | CTD | CTD (should defer) | Explicit deferral in hierarchy map | — |
| CON-DOC-005 | Evidence cited as law | Combined audits | Tier 3 law | Law should win | Citation rules §06 | CI lint |
| CON-DOC-006 | Missing production truth | Code production defaults | MANAGED_DEPLOYMENT prose | Code wins silently | EMPIREAI_PRODUCTION_TRUTH.md | Deploy manifest |

---

## 3. HIGH Conflicts (8)

| ID | Conflict | Doc A | Doc B | CURRENT | RECOMMENDED | FUTURE |
|----|----------|-------|-------|---------|-------------|--------|
| CON-DOC-007 | Production Grand King UI | MANAGED_DEPLOYMENT (frontend/) | empireai-web/ Cockpit (53 pages) | Both deployed | ADR-CON-001 | Single authority |
| CON-DOC-008 | Architecture normative vs operational | Canonical Architecture | docs/ARCHITECTURE.md | Both cited interchangeably | Precedence chain §03 | — |
| CON-DOC-009 | Pillow full COI vs prod minimal chat | Pillow Constitution | Brain production path | Code trims | Production Mode in Production Truth | Full mode toggle |
| CON-DOC-010 | Extension routes vs full Brain API | Architecture prose | `EMPIRE_ENABLE_EXTENSION_ROUTES` default off | Code wins | ADR-CON-002 + Production Truth | — |
| CON-DOC-011 | REAL-078 Cockpit path | REAL-078 (frontend/dashboard) | Production (empireai-web/cockpit) | Production | Amend REAL-078 or ADR footnote | — |
| CON-DOC-012 | Dual bible authority | hierarchy bible | master build bible | Hierarchy wins (implicit) | Label master HISTORICAL | — |
| CON-DOC-013 | ECC intended vs absent | Mission brief hierarchy | Repository | Absent | Tier 6 deferral doc | ECC built |
| CON-DOC-014 | VIE intended vs absent | Mission brief hierarchy | Repository | Absent | Tier 6 deferral doc | VIE built |

---

## 4. MEDIUM Conflicts (12)

| ID | Conflict | CURRENT | RECOMMENDED |
|----|----------|---------|-------------|
| CON-DOC-015 | Pillow Executive Constitution — two files, same display title | Both exist | Display rename EI copy |
| CON-DOC-016 | "Empire Constitution" ambiguous | Multiple files | Qualified names in ECNS-1 |
| CON-DOC-017 | "Architecture" unqualified (4 docs) | Confusion | Canonical / Operational / Historical labels |
| CON-DOC-018 | Founder UX vs Cockpit vs Dashboard | Overlapping terms | UID + ECNS-1: retire "Dashboard" in canon |
| CON-DOC-019 | frontend/ folder name vs Cockpit reality | Name mismatch | ADR-CON-001; folder rename deferred V2 |
| CON-DOC-020 | Platform routes vs Cockpit routes | Redirects exist | Document legacy alias in ops guide |
| CON-DOC-021 | Master Index vs Journey precedence | Unstated | Index=catalog; Journey=status |
| CON-DOC-022 | Audit index 32 vs 38 on disk | Stale index | Update EXECUTIVE_AUDIT_INDEX |
| CON-DOC-023 | docs/README scaffold vs 81 files | Contradiction | Rewrite docs/README |
| CON-DOC-024 | EMPIREAI_ARCHITECTURE.md vs canonical | Terminology drift | OPERATIONAL MEMORY label |
| CON-DOC-025 | Roadmap vs Bible programme overlap | Complementary but unclear | Precedence: Roadmap=when, Bible=structure |
| CON-DOC-026 | MANAGED_DEPLOYMENT vs vercel configs | Two deploy paths | Production Truth consolidates |

---

## 5. LOW Conflicts (5)

| ID | Conflict | RECOMMENDED |
|----|----------|-------------|
| CON-DOC-027 | REAL as product name vs mission namespace | ECNS-1: "Runtime modules" + REAL-### IDs |
| CON-DOC-028 | Backend folder vs Brain concept | Document equivalence in ops guide |
| CON-DOC-029 | BFF vs Cockpit Proxy | Use "Cockpit proxy" in constitutional prose |
| CON-DOC-030 | G2–G8 codes without programme names | Glossary in Master Index |
| CON-DOC-031 | MCL visibility vs Mission Control Build Bible | Scoped operational label |

---

## 6. Conflict Resolution Order (When Docs Disagree)

Apply in sequence:

1. Grand King explicit decision  
2. CTD  
3. Domain doctrine / domain constitution  
4. Engineering Constitution  
5. Canonical Architecture  
6. Programme (Roadmap, Bible, ADR)  
7. Operational (STATUS, ARCHITECTURE.md, Production Truth)  
8. Evidence — never wins over 1–7  
9. Historical — never wins  

*Full precedence: `03_DOCUMENT_PRECEDENCE.md`*

---

## 7. Duplicate Concept Groups (Documentation-Relevant)

From normalization — **28 groups**; documentation system resolves by **reclassification**, not merge:

| Group | Resolution status |
|-------|-------------------|
| Architecture stack (4+1 obsolete) | RECOMMENDED — labels applied |
| Constitution naming (6 groups) | PENDING — hierarchy one-pager |
| Frontend/Cockpit (3 groups) | PENDING — ADR-CON-001 |
| Production truth scatter (2 groups) | PENDING — Production Truth doc |
| Index stale (2 groups) | PENDING — index refresh |
| Pillow naming (3 groups) | PARTIAL — display rename recommended |
| Mode splits — production Pillow (1 group) | PENDING — Production Mode doc |

---

## 7. Architecture Conflicts (Documentation Cross-Reference)

From canonical-architecture pack — **11 conflicts**; documentation-relevant:

| Arch conflict | Doc impact |
|---------------|------------|
| Dual frontend | CON-DOC-007 |
| Extension routes | CON-DOC-010 |
| Pillow production trim | CON-DOC-009 |
| SQLite vs Postgres REAL-132 | GAP-DOC-022 |
| Cockpit path REAL-078 | CON-DOC-011 |
| Redis degraded sessions | Production Truth |
| ESIS skipped in prod dispatch | Operational doc note |
| Workers disabled prod | Production Truth |
| Guardian vs health/live | Ops guide clarification |
| Empire OS vs gated HTTP | CON-DOC-010 |
| Multi-instance V1 | ADR-CON-005 (future) |

---

## 8. Conflicts Resolved by Prior Missions (Do Not Re-Open)

| Conflict | Resolution |
|----------|------------|
| CTD vs Engineering commercial | CTD wins — stated in Engineering Constitution |
| hierarchy bible vs master bible | Hierarchy CANONICAL; master HISTORICAL |
| PILLOW integration plan vs master plan | Plan HISTORICAL; master plan CANONICAL |
| CTD vs CBD | CBD subordinate to CTD |

---

## 9. Conflict Count Summary

| Severity | Count |
|----------|------:|
| CRITICAL | 6 |
| HIGH | 8 |
| MEDIUM | 12 |
| LOW | 5 |
| **Total unresolved** | **31** |

**Resolved (documented, not open):** 4  
**Duplicate groups tracked separately:** 28 (overlap with above)

---

## 10. King Action Required

| Conflict | King decision needed? |
|----------|----------------------|
| CON-DOC-007 (frontend authority) | **YES** — ADR-CON-001 |
| CON-DOC-009/010 (production mode policy) | **YES** — approve Production Truth |
| CON-DOC-001–006 | NO — documentation fixes |
| CON-DOC-013/014 (ECC/VIE) | **YES** — defer or design |

**All other conflicts:** Chief Architect + documentation maintenance.
