# 10 — Final Normalization Report

**Mission:** Hierarchy & Naming Normalization  
**Date:** 2026-07-04  
**Mode:** Recommendations only — no implementation  
**Source audit:** `docs/audits/full-empireai-audit/`

---

## Executive Summary

EmpireAI can reach a **single canonical hierarchy** using the five-tier model (Authority → Identity → Law → Programme → Systems) with **CTD as apex governing document**. Naming can normalize through **ECNS-1** (display names + controlled abbreviations) **without renaming production folders** in V1. **28 duplicate concept groups**, **22 naming conflicts**, and **14 hierarchy conflicts** were identified. Constitution Construction should **not begin** until four documents are authored and one ADR is decided.

---

## 1. Estimated Implementation Complexity

| Phase | Work | Complexity | Duration estimate |
|-------|------|------------|-------------------|
| **A — Documentation only** | Vision file, hierarchy one-pager, production truth, index refresh, audit index fix | **Medium** | 3–5 days |
| **B — Display renames** | EI doc display title, MASTER_INDEX classifications | **Low** | 1–2 days |
| **C — File renames (optional)** | 4–6 markdown paths, historical/ subfolder | **Low–Medium** | 1–2 days |
| **D — ADR decisions** | Frontend authority, ECC/VIE deferral | **Medium** (human) | 1 Grand King session |
| **E — Folder renames** | frontend→founder-shell, empireai-web→cockpit | **High** | 1–2 weeks — **defer V2** |
| **F — backend→brain folder** | Full monorepo | **Very High** | **Do not pursue V1** |

**Overall normalization (Phases A–D):** **Medium** — mostly documentation and index work, no production code.

---

## 2. Total Duplicate Concepts Found

**28** duplicate concept groups (see `06_DUPLICATE_TRUTH_RESOLUTION.md`)

Categories:
- Architecture stack: 4  
- Constitution/bible naming: 6  
- Frontend/Cockpit/Dashboard: 3  
- Roadmap/programme overlap: 3  
- Production truth scatter: 2  
- Index/registry stale: 2  
- Pillow identity/naming: 3  
- Runtime/REAL terminology: 2  
- Builder/agent: 2  
- Mode splits (production Pillow): 1  

---

## 3. Total Naming Conflicts

**22** distinct naming conflicts:

1. Pillow Executive Constitution (two files, same display title)  
2. "Constitution" unqualified (5+ layers)  
3. "Empire Constitution" ambiguous  
4. "Architecture" unqualified (4 docs)  
5. "Bible" unqualified (3 docs)  
6. Founder UX vs Cockpit vs Dashboard  
7. frontend/ folder name vs Cockpit reality  
8. empireai-web/ vs "Cockpit" brand  
9. Platform routes vs Cockpit routes  
10. REAL as product name vs mission namespace  
11. Backend vs Brain (folder vs concept)  
12. BFF vs Cockpit Proxy  
13. EmpireAI OS vs Pillow EOS module  
14. Autonomous Engineering Constitution vs Engineering Constitution  
15. Vision missing vs Marketplace OS Vision partial  
16. Master Roadmap vs Bible programme overlap  
17. Combined audit vs artifact audit naming  
18. Extension routes vs full Brain API expectation  
19. MCL vs Mission Control Layer visibility  
20. ESIS vs Executive Home panels  
21. G2–G8 codes without programme names  
22. docs/README "scaffold" vs 81 substantive files  

---

## 4. Total Hierarchy Conflicts

**14** hierarchy conflicts:

1. CTD apex vs multiple "constitution" peers without map  
2. Vision tier missing while Soul exists  
3. Chief Architect doc-only vs Pillow runtime COI  
4. Pillow COI full package vs production minimal chat  
5. EmpireAI OS concept vs gated extension HTTP routes  
6. Dual frontend surfaces — unclear Grand King entry  
7. ECC intended tier vs not found  
8. VIE intended tier vs not found  
9. Guardian vs Brain health — role boundaries unclear in prose  
10. Builder vs Store Builder agent hierarchy  
11. Runtime modules vs Orchestration engines — layer confusion  
12. Evidence audits cited as if current law  
13. Historical SYSTEM_ARCHITECTURE vs canonical hierarchy  
14. Journey index vs Master Index — precedence unstated  

---

## 5. Proposed Permanent Hierarchy

See **`01_CANONICAL_HIERARCHY.md`** — five tiers:

**Tier 0:** Grand King  
**Tier 1:** Chief Architect + Pillow COI  
**Tier 2:** Vision + Soul  
**Tier 3:** Law (CTD apex, doctrines, constitutions, EI library, canonical architecture)  
**Tier 4:** Programme (roadmaps, V1 Bible, Journey, ADRs)  
**Tier 5:** Systems (Brain, Cockpit, Builder, Runtime modules, Commerce, Production, Guardian)  
**Tier 6:** Deferred (VIE, ECC)

---

## 6. Proposed Permanent Naming Standard

See **`05_CANONICAL_NAMING_STANDARD.md` (ECNS-1)**

Core rules:
- Readable English in constitutional prose  
- Qualified constitution names always  
- Mission IDs for traceability only  
- Frozen production code/folder names for V1  
- Classification tag on every indexed document  
- One display title per tier-slot  

---

## 7. Top 20 Normalization Recommendations

1. **Ratify CTD as apex** governing document until master Constitution Lock  
2. **Author `EMPIREAI_VISION.md`** — merge Marketplace OS Vision input  
3. **Author `EMPIREAI_CONSTITUTION_HIERARCHY.md`** — one-page law map  
4. **Author `EMPIREAI_PRODUCTION_TRUTH.md`** — routes, Pillow mode, Redis/SQLite policy  
5. **Refresh `EMPIREAI_REPOSITORY_MASTER_INDEX.md`** with Tier + Class + Display Name + Owner  
6. **Fix EXECUTIVE_AUDIT_INDEX** — add 6 missing combined audits (38 total)  
7. **Reclassify SYSTEM_ARCHITECTURE cluster** as HISTORICAL in index  
8. **Reclassify master build bible** as HISTORICAL; cite hierarchy bible as V1 canonical  
9. **ADR-CON-001:** Decide production Grand King surface (frontend vs empireai-web)  
10. **Rename display** of EI `PILLOW_EXECUTIVE_CONSTITUTION.md` → "EI Pillow Executive Roles"  
11. **Retire "Dashboard"** in canonical prose — use Founder Shell + Cockpit  
12. **Map "Autonomous Engineering Constitution"** to Engineering Constitution + Cursor Standards  
13. **Defer ECC and VIE to Tier 6** explicitly in hierarchy — or author design docs  
14. **Document REAL-### as mission namespace** — "Runtime modules" as code term  
15. **Update docs/README.md** — remove "scaffold only" statement  
16. **Add ECNS-1 glossary** as `EMPIREAI_ABBREVIATION_GLOSSARY.md`  
17. **Label all COMBINED_EXECUTIVE_AUDIT_* as EVIDENCE** — never law  
18. **Do not rename `backend/` folder** in V1 — use "Brain" in prose only  
19. **Consolidate production docs** before Constitution references production behaviour  
20. **Constitution Lock ceremony** only after CON-001 through CON-006 complete  

---

## 8. Constitution Construction Readiness

### Is EmpireAI ready for Constitution Construction?

**NO**

### What exactly blocks it

| Blocker | ID | Must complete |
|---------|-----|---------------|
| Canonical Vision File missing | CON-001 | Author `EMPIREAI_VISION.md` |
| Constitution hierarchy one-pager missing | CON-004 | Author hierarchy map |
| Production truth not consolidated | CON-009 | Author production truth doc |
| Frontend production authority undecided | CON-006 | ADR-CON-001 Grand King decision |
| Master Index not classification-tagged | CON-002 | Index refresh |
| Executive audit index stale | CON-003 | 38/38 alignment |
| ECC/VIE undefined | CON-013, CON-014 | Design or explicit V2 deferral in writing |
| Historical docs still citably ambiguous | CON-005 | Label SYSTEM_ARCHITECTURE cluster |

**Minimum gate to start Constitution Construction:** CON-001, CON-004, CON-006, CON-002 (Phase A + D of implementation plan).

---

## Deliverables Checklist

| File | Status |
|------|--------|
| 00_EXECUTIVE_RECOMMENDATION.md | ✅ |
| 01_CANONICAL_HIERARCHY.md | ✅ |
| 02_CANONICAL_OWNERSHIP.md | ✅ |
| 03_CANONICAL_DOCUMENT_TREE.md | ✅ |
| 04_CANONICAL_ARCHITECTURE_TREE.md | ✅ |
| 05_CANONICAL_NAMING_STANDARD.md | ✅ |
| 06_DUPLICATE_TRUTH_RESOLUTION.md | ✅ |
| 07_REPOSITORY_RENAME_RECOMMENDATIONS.md | ✅ |
| 08_HISTORICAL_DOCUMENTS.md | ✅ |
| 09_CANONICAL_DOCUMENTS.md | ✅ |
| 10_FINAL_NORMALIZATION_REPORT.md | ✅ |

---

## Mission Success Statement

ChatGPT can now use these outputs to:

1. **Rename the hierarchy** — apply `01_CANONICAL_HIERARCHY.md`  
2. **Rename canonical documents** — apply `07_REPOSITORY_RENAME_RECOMMENDATIONS.md` + `09_CANONICAL_DOCUMENTS.md`  
3. **Rename the roadmap structure** — tier-4 programme slots in `03_CANONICAL_DOCUMENT_TREE.md`  
4. **Rename the architecture** — apply `04_CANONICAL_ARCHITECTURE_TREE.md` + ECNS-1  
5. **Construct the permanent Constitution** — after blockers cleared, using CTD as Book I foundation  

**No production code was modified in this mission.**
