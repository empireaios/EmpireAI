# 07 — Repository Rename Recommendations

**Status:** RECOMMENDATIONS ONLY — no renames authorised in this mission  
**Priority:** P0 = before Constitution Construction; P1 = during; P2 = optional; P3 = do not rename

---

## P0 — Display / Index Renames (No file move)

| Current reference | Recommended canonical display name | Action |
|-------------------|----------------------------------|--------|
| `docs/executive-intelligence/PILLOW_EXECUTIVE_CONSTITUTION.md` | **EI Pillow Executive Roles** | Add H1 subtitle in index; optional future filename `EI_PILLOW_EXECUTIVE_ROLES.md` |
| `frontend/` (in prose) | **Founder Shell** | Update MASTER_INDEX and deployment docs |
| `empireai-web/` (in prose) | **Cockpit** | Update MASTER_INDEX |
| "Dashboard" routes | **Legacy redirect to Cockpit** | Mark in index |
| "Autonomous Engineering Constitution" (intended) | **Engineering Constitution + Engineering Standards** | Hierarchy one-pager mapping |

---

## P1 — New Files to Author (Preferred Over Renames)

| New file | Replaces confusion from |
|----------|-------------------------|
| `EMPIREAI_VISION.md` | Missing vision + MARKETPLACE_OS_VISION partial |
| `docs/governance/EMPIREAI_CONSTITUTION_HIERARCHY.md` | Constitution title collisions |
| `docs/governance/EMPIREAI_PRODUCTION_TRUTH.md` | Scattered production docs |
| `docs/governance/EMPIREAI_ABBREVIATION_GLOSSARY.md` | ECNS-1 glossary extraction |

---

## P1 — Document Renames (Future Implementation)

| Current path | Recommended path | Reason |
|--------------|------------------|--------|
| `docs/executive-intelligence/PILLOW_EXECUTIVE_CONSTITUTION.md` | `docs/executive-intelligence/EI_PILLOW_EXECUTIVE_ROLES.md` | Eliminate title collision with root Pillow docs |
| `EMPIREAI_ARCHITECTURE.md` | `EMPIREAI_ARCHITECTURE_MEMORY.md` | Signal non-normative status |
| `docs/SYSTEM_ARCHITECTURE.md` | `docs/historical/SYSTEM_ARCHITECTURE_v0_DRAFT.md` | Obsolete isolation |
| `artifacts/empireai-master-build-bible.md` | `artifacts/historical/empireai-master-build-bible-archaeology.md` | Superseded bible |

---

## P2 — Folder Renames (High churn — defer until ADR)

| Current | Recommended | Prerequisite |
|---------|-------------|--------------|
| `frontend/` | `founder-shell/` | ADR-CON-001 + Vercel config update |
| `empireai-web/` | `cockpit/` | Vercel project rename, import path sweep |
| `backend/` | `brain/` | Railway, npm, 7000+ import paths — **not recommended for V1** |

**Recommendation:** Keep folder names `backend/`, `frontend/`, `empireai-web/` for V1 Constitution. Use **display names** only (ECNS-1).

---

## P3 — Do Not Rename (Production stability)

| Name | Reason |
|------|--------|
| `backend/` | npm, Railway, imports, CI |
| `pillow/` | `@empireai/pillow` package |
| `@empireai/pillow` | npm registry / file dependency |
| `brain/` code modules inside backend | Internal consistent naming |
| `REAL-*` mission IDs | Git, tests, artifacts immutability |
| `COMBINED_EXECUTIVE_AUDIT_*` | Evidence immutability |
| Production URLs and cookie names | Live Grand King sessions |
| Environment variable keys | Railway/Vercel deployed configs |

---

## Index-Only Relabeling (Immediate, zero risk)

Add to `EMPIREAI_REPOSITORY_MASTER_INDEX.md` for each path:

```markdown
| Path | Tier | Class | Display Name | Owner |
```

Relabel without moving:

- 38 `COMBINED_EXECUTIVE_AUDIT_*` → EVIDENCE  
- ~94 `artifacts/*-executive-audit.md` → EVIDENCE  
- 7 `*-evidence.json` → EVIDENCE  
- SYSTEM_ARCHITECTURE cluster → HISTORICAL  
- empireai-master-build-bible → HISTORICAL  

---

## Rename Implementation Complexity Estimate

| Phase | Scope | Effort | Risk |
|-------|-------|--------|------|
| Display/index only | MASTER_INDEX, hierarchy one-pager | **Low** (1–2 days) | None |
| New canonical files | Vision, production truth, glossary | **Medium** (3–5 days) | Low |
| Document renames | 4–6 markdown files | **Low** (1 day) | Link updates |
| Folder renames | frontend, empireai-web | **High** (1–2 weeks) | Deploy breakage |
| backend → brain folder | Full monorepo | **Very high** | Do not pursue V1 |

---

## ChatGPT Implementation Order

1. Author missing files (P1 new files)  
2. Update MASTER_INDEX classifications (P0)  
3. Author ADR-CON-001 frontend authority  
4. Execute P1 document renames with redirect notes in index  
5. Defer P2 folder renames to V2 unless Grand King mandates  
