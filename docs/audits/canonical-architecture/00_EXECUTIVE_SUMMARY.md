# Canonical Architecture Reconstruction — Executive Summary

**Mission date:** 2026-07-04  
**Mode:** Documentation reconstruction — no production changes  
**Sources:** Full All-Angle Audit, Hierarchy Normalization, `EMPIREAI_CANONICAL_ARCHITECTURE.md` (REAL-078), production evidence (HEAD `9e51bc7`)

---

## Purpose

This mission reconstructs **ONE canonical architecture** from existing repository evidence. It does **not** redesign EmpireAI. It merges normative documents, implementation reality, and normalization recommendations into a single architectural authority for Constitution-era roadmap construction.

---

## The One Architecture (Plain Language)

EmpireAI is a **Pillow-owned, Brain-executed, Cockpit-operated** commerce intelligence platform:

1. **Grand King** acts through **Cockpit** (executive UI + proxy).
2. **Pillow** is sole technical owner — COI package + Brain host.
3. **Brain** is the mandatory execution kernel — dispatch, tools, Guardian, persistence.
4. **Domain code** (Runtime modules, Orchestration engines, Intelligence engines, Eye, Foundation) implements Pillow-owned capabilities in `backend/src/`.
5. **Production** runs Brain on Railway, UI on Vercel, Redis on Upstash, SQLite on volume.

**Authority chain:** CTD (law) → Canonical Architecture (normative) → Operational Architecture Guide (dev map) → `EMPIREAI_STATUS.md` (current state).

---

## Reconstruction Verdict

| Metric | Value |
|--------|------:|
| Architecture completeness | **~81%** |
| Architecture domains catalogued | **38** |
| Duplicate architecture groups | **14** |
| Missing architecture groups | **9** |
| Architecture conflicts (unresolved) | **11** |

---

## Three States (Used Throughout This Pack)

| Label | Meaning |
|-------|---------|
| **CURRENT** | What exists and runs today (evidence-based) |
| **RECOMMENDED** | What canonical docs + normalization say should be cited as authority |
| **FUTURE** | Normative target not yet fully implemented (from REAL-078, roadmaps) |

---

## Single Architectural Authority

**Primary document after this mission:**

→ **`01_CANONICAL_ARCHITECTURE.md`** in this folder

**Normative source it reconciles:**

→ `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` (REAL-078)

**Operational companion (not law):**

→ `docs/ARCHITECTURE.md`

---

## Critical CURRENT vs RECOMMENDED Gaps

| Area | CURRENT | RECOMMENDED |
|------|---------|-------------|
| Grand King UI | Cockpit in `empireai-web/` + Founder Shell in `frontend/` | One production Cockpit authority (ADR pending) |
| Brain HTTP surface | Critical routes only in production | Document extension route policy explicitly |
| Pillow chat | Minimal LLM production path | Document as **Production Mode**, not absence of COI |
| Cockpit mapping in REAL-078 | Lists `frontend/dashboard` as executive depth | **empireai-web/cockpit** is CURRENT executive depth |
| Persistence | SQLite primary | Postgres = FUTURE migration path (REAL-132) |
| ECC / VIE | Not found | FUTURE Tier 6 or explicit deferral |

---

## Constitution Documentation Readiness

**Is architecture sufficiently complete for Canonical Documentation Reconstruction?**

**YES — with conditions**

Architecture is **81% complete** — enough to begin documentation reconstruction **if** the 9 missing groups are tracked as explicit FUTURE/deferred slots and the 11 conflicts are resolved in documentation (not code) via ADRs and production truth doctrine.

**Blockers for permanent Constitution (not this mission):** Vision file, production truth doc, frontend ADR, ECC/VIE deferral in writing.

---

## Deliverables Index

| File | Content |
|------|---------|
| `01_CANONICAL_ARCHITECTURE.md` | **THE** unified architecture |
| `02_ARCHITECTURE_HIERARCHY.md` | Tiers and layers |
| `03_ARCHITECTURE_DEPENDENCY_GRAPH.md` | Dependencies, cycles, leaves |
| `04_ARCHITECTURE_BOUNDARIES.md` | In/out of scope per subsystem |
| `05_ARCHITECTURE_RESPONSIBILITIES.md` | Ownership and duties |
| `06_ARCHITECTURE_GAPS.md` | Missing architecture |
| `07_ARCHITECTURE_DUPLICATION.md` | Duplicate definitions |
| `08_ARCHITECTURE_EVOLUTION.md` | CURRENT → RECOMMENDED → FUTURE |
| `09_ARCHITECTURE_DECISIONS.md` | Required ADRs |
| `10_IMPLEMENTATION_RECOMMENDATIONS.md` | Doc-only next steps |
