# Hierarchy & Naming Normalization — Executive Recommendation

**Mission date:** 2026-07-04  
**Source:** Full All-Angle Audit (`docs/audits/full-empireai-audit/`)  
**Authority:** Recommendations only — **not authorised to implement**

---

## Recommendation in One Paragraph

EmpireAI should adopt a **five-tier canonical hierarchy** (Authority → Identity → Law → Programme → Systems) with **one supreme governing document** (`EMPIREAI_CORE_CONSTITUTION_CTD.md`), **one missing Vision file to be authored** (`EMPIREAI_VISION.md`), and **one navigation spine** (`EMPIREAI_REPOSITORY_MASTER_INDEX.md`). All other documents must be classified as **Canonical**, **Operational**, or **Historical** — never competing at the same tier. Production code names (`Brain`, `Pillow`, `Cockpit`, `REAL`) remain unchanged; document and display names normalize around readable English with a controlled abbreviation glossary. Implementation is **documentation-first** (indexes, labels, one-pagers, ADRs) before any file renames.

---

## Answers to the 15 Specific Questions

### 1. What is the highest governing document?

**`EMPIREAI_CORE_CONSTITUTION_CTD.md`** — Supreme V1 commercial law (CTD-001→040). Engineering, Pillow, and EI layers defer to CTD on commercial conflicts. The CTD is the apex until a future Constitution Lock ceremony ratifies a unified master Constitution that explicitly incorporates CTD as Book I.

### 2. Should Vision, Soul, Bible, Roadmap and Constitution all exist?

**Yes — all five should exist, at distinct tiers:**

| Artifact | Should exist? | Tier | Status |
|----------|-------------|------|--------|
| **Vision** | Yes | Identity (Tier 2) | **Must be authored** — `EMPIREAI_VISION.md` |
| **Soul** | Yes | Identity (Tier 2) | Exists — `EMPIREAI_SOUL.md` |
| **Bible** | Yes | Programme (Tier 4) | Exists — one canonical V1 bible only |
| **Roadmap** | Yes | Programme (Tier 4) | Exists — empire + domain roadmaps |
| **Constitution** | Yes | Law (Tier 3) | Exists — **layered stack**, not one file |

They must **not** duplicate each other's role. Vision = why; Soul = who we are; Constitution = law; Bible = build hierarchy; Roadmap = when/sequence.

### 3. Which documents overlap?

See `06_DUPLICATE_TRUTH_RESOLUTION.md`. Major overlaps: four architecture docs, three bible docs, two Pillow "executive constitution" titles, CTD vs Engineering Constitution scope, `docs/ARCHITECTURE.md` vs canonical architecture.

### 4. Which documents conflict?

- `docs/SYSTEM_ARCHITECTURE.md` + companions vs current Pillow-owned hierarchy (**obsolete conflict**)
- `EMPIREAI_ARCHITECTURE.md` vs `EMPIREAI_CANONICAL_ARCHITECTURE.md` (terminology drift)
- `deployment/MANAGED_DEPLOYMENT.md` (frontend/ as founder UX) vs `empireai-web/` (actual Cockpit) (**production authority conflict**)
- Root Pillow constitutions vs similarly named EI library doc (**naming conflict**, not content conflict)

### 5. Which documents duplicate truth?

28 duplicate concept groups identified (see Final Report). Highest impact: architecture stack, constitution naming, bible versions, frontend/Cockpit naming.

### 6. Which names should change?

**Documents (future rename phase):** See `07_REPOSITORY_RENAME_RECOMMENDATIONS.md`.  
**Display/canonical names (immediate):** Use glossary in `05_CANONICAL_NAMING_STANDARD.md`.  
**Do not rename yet:** `backend/`, `pillow/`, production env vars, Railway/Vercel project names.

### 7. Which abbreviations should disappear from canonical prose?

From user-facing and constitutional prose: **MCL, ESIS, SCR** (use screen IDs only in cockpit specs), **BFF** (say "Cockpit proxy"), **REAL** as standalone noun (say "Runtime modules" with REAL-### as mission IDs only).  
**Keep in mission IDs and code:** REAL-###, PILLOW-###, G2–G8, B6, CTD, GVD, ACD, UID, CBD, EI, EKLS.

### 8. Which architecture documents become historical?

- `docs/SYSTEM_ARCHITECTURE.md` → **HISTORICAL**
- `docs/DATABASE_SCHEMA.md`, `DASHBOARD_SCREENS.md`, `AI_EMPLOYEES.md`, `FOUNDER_EXPERIENCE.md`, `NAVIGATION.md`, `PRODUCT_INTELLIGENCE_ENGINE.md` (legacy companions) → **HISTORICAL**
- `EMPIREAI_ARCHITECTURE.md` → **OPERATIONAL MEMORY** (not normative; do not cite as law)
- `artifacts/empireai-master-build-bible.md` → **HISTORICAL**

### 9. Which hierarchy should become permanent?

The **Permanent EmpireAI Hierarchy** in `01_CANONICAL_HIERARCHY.md` — five tiers from Grand King through Systems.

### 10. Which naming convention should govern the repository?

**EmpireAI Canonical Naming Standard (ECNS-1)** — `05_CANONICAL_NAMING_STANDARD.md`: readable English for canon; mission IDs for traceability; tier labels on every doc; no duplicate titles at same tier.

### 11. Which production names should remain unchanged?

| Name | Reason |
|------|--------|
| `Brain` / `backend/` | Production URL, Railway, env vars, 3,373 files |
| `Pillow` / `pillow/` / `@empireai/pillow` | Package name, npm, governance bundle |
| `Cockpit` | UX brand, 53 pages, middleware routes |
| `empireai-web/` | Deploy config, Vercel project |
| `frontend/` | Root vercel.json build path |
| `Guardian`, `Grand King`, `founder` role | Auth, UI, API |
| `REAL-###` mission IDs | 124+ commits, tests, artifacts |
| `empireai_session`, `/health/live`, `/brain/dispatch` | Production cookies and endpoints |

### 12. Which names will cause confusion five years from now?

1. Two files both called "Pillow Executive Constitution"
2. "Founder UX" vs "Cockpit" vs "Dashboard" for the same journey
3. "EmpireAI Architecture" without specifying canonical vs operational vs historical
4. "REAL" as a product name instead of mission namespace
5. "Bible" without V1/V2 version qualifier
6. "Constitution" without layer (Commercial / Engineering / Pillow / EI)
7. `frontend/` folder name implying it is the only frontend
8. "Extension routes" without linking to production policy
9. Gate codes G2–G8 without programme names in prose
10. "Empire Operating System" vs "EmpireAI Operating System" interchangeably

### 13. Which concepts should merge?

| Merge (conceptual) | Into | Notes |
|--------------------|------|-------|
| Autonomous Engineering Constitution (intended name) | `EMPIREAI_CONSTITUTION.md` + Cursor doctrines | Rename in hierarchy map, not file merge |
| Production truth scattered docs | One `EMPIREAI_PRODUCTION_TRUTH.md` (future) | Consolidate MANAGED_DEPLOYMENT + readiness |
| Marketplace OS Vision (partial) | Future `EMPIREAI_VISION.md` | Author, don't delete source |
| Operational architecture views | Single entry point citing canonical + operational docs | Index merge, not file deletion |

### 14. Which concepts should separate?

| Must stay separate | Reason |
|--------------------|--------|
| CTD (commercial supreme) vs Engineering Constitution | Different jurisdiction |
| Pillow Constitution vs Pillow EI Constitution vs EI PILLOW_EXECUTIVE_CONSTITUTION | Identity vs cognition vs EI library roles |
| Empire Roadmap vs Pillow Roadmap vs Cockpit Roadmap | Different owners and horizons |
| Brain vs Pillow vs Cockpit | Different runtime surfaces |
| Canonical vs Operational vs Historical classification | Prevents truth collapse |
| Builder (Cursor Bridge) vs Store Builder agent | Different capabilities |
| Runtime modules vs Orchestration engines | Different code layers |

### 15. What should be the permanent EmpireAI hierarchy?

See `01_CANONICAL_HIERARCHY.md` — full permanent tree.

---

## Normalization Verdict

| Question | Answer |
|----------|--------|
| Ready for Constitution Construction? | **NO** |
| Blockers | Missing Vision file; frontend authority ADR; constitution one-pager; historical labeling; ECC/VIE deferral or design |

**Next step after this mission:** Implement Phase 1 of constitution backlog (CON-001 through CON-005) — documentation only, no production code.
