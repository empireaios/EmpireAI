# 08 — Historical Documents

Documents recommended for **HISTORICAL** classification — immutable or superseded; **not cited as current law or architecture**.

---

## Obsolete (Conflicts with Current Hierarchy)

| Path | Reason | Superseded by |
|------|--------|---------------|
| `docs/SYSTEM_ARCHITECTURE.md` | Pre-Pillow "Commerce SaaS" model | Canonical Architecture |
| `docs/DATABASE_SCHEMA.md` | Legacy companion to SYSTEM_ARCHITECTURE | `backend/src/brain/database.ts` migration |
| `docs/DASHBOARD_SCREENS.md` | Legacy UX spec | Cockpit specs in `docs/architecture/cockpit/` |
| `docs/AI_EMPLOYEES.md` | Early product concept | Agents module + UID |
| `docs/FOUNDER_EXPERIENCE.md` | Early UX draft | UID doctrine + Cockpit |
| `docs/NAVIGATION.md` | Early nav spec | Cockpit IA docs |
| `docs/PRODUCT_INTELLIGENCE_ENGINE.md` | Early PIE spec | G3-01 + intelligence module |

---

## Superseded Programme Docs

| Path | Reason | Superseded by |
|------|--------|---------------|
| `artifacts/empireai-master-build-bible.md` | Archaeology snapshot 2026-07-02 | `empireai-version-1-build-hierarchy-bible.md` |
| `PILLOW_RUNTIME_INTEGRATION_PLAN.md` | Integration complete | `PILLOW_PRODUCT_INTEGRATION_MASTER_PLAN.md` |

---

## Evidence — Historical (Immutable, Do Not Edit)

### Combined Executive Audits (38 root files)

`COMBINED_EXECUTIVE_AUDIT_*.md` — batch sign-offs for closed missions.  
**Rule:** Add new combined audits; never amend bodies.

### Artifact Executive Audits (~94 files)

`artifacts/g2-*` through `g8-*`, `b6-*`, `ea-*`, `empire-v1-*`, `pillow-*` executive audits.

### Evidence JSON (7 files)

- `artifacts/b5-production-deploy-evidence.json`
- `artifacts/b6-01a-amazon-sp-api-evidence.json`
- `artifacts/b6-02b-live-cj-auth-evidence.json`
- `artifacts/b6-03b-stripe-live-auth-evidence.json`
- `artifacts/b6-04-production-vault-evidence.json`
- `artifacts/b6-04b-live-vault-certification-evidence.json`
- `artifacts/g4-05b-auth-verification-results.json`

### Programme Completion Summaries

- `artifacts/g2-programme-roadmap-status.md`
- `artifacts/g5-business-automation-completion-summary.md`
- `artifacts/g6-production-certification-completion-summary.md`
- `artifacts/g7-grand-king-live-operations-completion-summary.md`
- `artifacts/g8-identity-authorization-completion-summary.md`
- `artifacts/pillow-completion-report.md` (+ audit, master-plan)

### Supreme Audit Bundle (SA-001)

- `SA-001_SUPREME_EXECUTIVE_AUDIT.md`
- `SA-001_EXECUTIVE_SCORECARD.md`
- `SA-001_ARCHITECTS_FINAL_RECOMMENDATIONS.md`
- `SA-001_IMPLEMENTATION_PRIORITY.md`
- `SA-001_OPERATIONAL_READINESS.md`

### Cursor / Empire Return Reports

- `CURSOR_PROGRESS_REPORT.md`
- `CURSOR_PROGRESS_REPORT_REAL-002A.md`
- `EMPIRE_RETURN_PACKAGE.md`
- `EMPIRE_REVIEW_PACKAGE.md`
- `JOURNEY_SYNCHRONIZATION_REPORT.md`
- BL-A/BL-B validation and sync reports

### EIR Programme Reports

- `docs/executive-intelligence/EIR-001` through `EIR-006`

### Full All-Angle Audit (2026-07-04)

- `docs/audits/full-empireai-audit/*` — point-in-time evidence

---

## Operational Memory (Not Historical — But Not Normative)

| Path | Treatment |
|------|-----------|
| `EMPIREAI_ARCHITECTURE.md` | OPERATIONAL MEMORY — changelog-style; do not cite as law |
| Analytical reports (TOTAL_VIEW, ARCHITECT_REPORT, COST_REPORT, etc.) | EVIDENCE snapshots |

---

## Legacy Code Paths (Document as Historical — No Deletion)

| Path | Note |
|------|------|
| `frontend/src/pages/dashboard/*` | Redirects to Cockpit |
| `empireai-web/app/(platform)/platform/*` | Redirects to Cockpit |
| `@deprecated` adapters in backend | Mark in operational architecture guide |

---

## Historical Label Template (For Master Index)

```markdown
> **Classification:** HISTORICAL  
> **Superseded by:** [canonical doc]  
> **Cite for:** mission evidence only — not current law
```

---

## Count Summary

| Category | Approx count |
|----------|-------------|
| Obsolete docs cluster | 7 |
| Superseded programme docs | 2 |
| Combined executive audits | 38 |
| Artifact executive audits | ~94 |
| Evidence JSON | 7 |
| Progress/completion reports | ~25 |
| **Total historical/evidence items** | **~170+** |
