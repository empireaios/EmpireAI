# 10 — Implementation Recommendations

**Scope:** Documentation and ADR actions only — **no production code changes in this mission**

---

## Implementation Complexity

| Workstream | Complexity | Duration | Risk |
|------------|------------|----------|------|
| Adopt reconstructed architecture as cite authority | Low | 1 day | None |
| Author Vision + production truth docs | Medium | 3–5 days | Low |
| ADR-CON-001 frontend authority | Medium (human) | 1 session | Medium if wrong |
| Update REAL-078 cockpit mapping | Low | 0.5 day | None |
| Master Index architecture classification | Medium | 2 days | None |
| ECC/VIE deferral docs | Low | 0.5 day | None |
| Physical folder renames (frontend/cockpit) | **High** | 1–2 weeks | **Defer V2** |
| Postgres migration architecture | Medium | 2–3 days doc | FUTURE impl |
| E2E architecture + Playwright | Medium | 3–5 days | FUTURE |

**Overall documentation implementation:** **Medium** (5–10 days)  
**Overall code implementation:** **Not in scope**

---

## Phase 1 — Immediate (Enable Documentation Reconstruction)

| # | Action | Output | Owner |
|---|--------|--------|-------|
| 1 | Ratify `01_CANONICAL_ARCHITECTURE.md` as reconstruction authority | Chief Architect sign-off | Architect |
| 2 | Author `EMPIREAI_VISION.md` | Tier 2 identity doc | King + Architect |
| 3 | Author `EMPIREAI_PRODUCTION_TRUTH.md` | Production mode architecture | Architect |
| 4 | Grand King ADR-CON-001 | Client authority decision | Grand King |
| 5 | Write ECC/VIE deferral stubs | Tier 6 documentation | Architect |
| 6 | Add architecture section to Master Index | Classified paths | Architect |

---

## Phase 2 — Canonical Documentation Reconstruction

| # | Action | Source |
|---|--------|--------|
| 1 | Update REAL-078 §3.2 Cockpit mapping | ADR-ARCH-001 |
| 2 | Add constitution hierarchy one-pager | Normalization CON-004 |
| 3 | Mark SYSTEM_ARCHITECTURE cluster HISTORICAL in index | Normalization CON-005 |
| 4 | Consolidate production deploy references | ADR-CON-002 |
| 5 | Publish ECNS-1 glossary as architecture appendix | Normalization 05 |
| 6 | Link Journey entries to architecture domains | Journey sync |

---

## Phase 3 — Pre-Constitution Lock

| # | Action |
|---|--------|
| 1 | ADR-CON-005 single-instance V1 declaration |
| 2 | Browser E2E architecture spec (GAP-09) |
| 3 | Placeholder panel registry linked to architecture domains |
| 4 | Constitution Lock ceremony referencing canonical architecture pack |

---

## What NOT to Implement Now

- Rename `backend/` to `brain/`  
- Rename `frontend/` or `empireai-web/` folders  
- Enable extension routes in production by default  
- Remove Pillow production minimal path  
- Merge Pillow and Brain codebases  
- Delete REAL-078 or combined audits  
- Build ECC or VIE runtime  

---

## Success Criteria Checklist

- [ ] Chief Architect can cite ONE architecture (`01_CANONICAL_ARCHITECTURE.md`)  
- [ ] Every domain has owner, tier, boundary, dependency entry  
- [ ] CURRENT / RECOMMENDED / FUTURE labeled throughout pack  
- [ ] 14 duplications have resolution path  
- [ ] 9 gaps have P0/P1 priority and owner  
- [ ] 5 required ADRs identified  
- [ ] Documentation reconstruction can begin without code changes  

**All checklist items satisfied by this audit pack.**

---

## File Placement After Implementation

| Artifact | Target location |
|----------|-----------------|
| Reconstructed architecture (living) | Promote sections into updated REAL-078 OR keep `docs/audits/canonical-architecture/` as adjunct |
| Production truth | `docs/governance/EMPIREAI_PRODUCTION_TRUTH.md` |
| Vision | `EMPIREAI_VISION.md` (root) |
| ADRs | `EMPIREAI_DECISIONS.md` |

**RECOMMENDED:** Keep this audit folder immutable as **reconstruction evidence**; merge living content into REAL-078 in Phase 2.

---

## Chief Architect Usage Guide

1. Start:`00_EXECUTIVE_SUMMARY.md`  
2. Cite:`01_CANONICAL_ARCHITECTURE.md`  
3. Layer questions:`02_ARCHITECTURE_HIERARCHY.md`  
4. Dependencies:`03_ARCHITECTURE_DEPENDENCY_GRAPH.md`  
5. Boundaries/conflicts:`04`, `07`  
6. Ownership:`05`  
7. Gaps/evolution:`06`, `08`  
8. Decisions to make:`09`  
9. Next actions:`10`  

Then begin **Canonical Documentation Reconstruction** using normalization pack + this architecture pack together.
