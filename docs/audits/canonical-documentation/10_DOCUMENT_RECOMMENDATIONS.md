# 10 — Document Recommendations

**Purpose:** Prioritized actions for Canonical Documentation System adoption.  
Every recommendation distinguishes **CURRENT**, **RECOMMENDED**, and **FUTURE**.

---

## Top 20 Recommendations

### 1. Author EMPIREAI_VISION.md (P0)

| | |
|---|---|
| **CURRENT** | Vision file missing; `MARKETPLACE_OS_VISION.md` is partial input only |
| **RECOMMENDED** | Grand King + Chief Architect author `EMPIREAI_VISION.md` from Soul, CTD preamble, marketplace vision |
| **FUTURE** | Vision Integrity Engine validates doc-code alignment |
| **Owner** | Grand King |
| **Effort** | Medium — 1–2 days |

---

### 2. Author Constitution Hierarchy One-Pager (P0)

| | |
|---|---|
| **CURRENT** | 5+ "constitution" files; agents misread similarly named docs |
| **RECOMMENDED** | Create `docs/governance/EMPIREAI_CONSTITUTION_HIERARCHY.md` with stack diagram + when-to-read-which |
| **FUTURE** | Ratify as Constitution Lock Schedule A |
| **Owner** | Chief Architect |
| **Effort** | Low — 4–8 hours |

---

### 3. Author Production Truth Doctrine (P0)

| | |
|---|---|
| **CURRENT** | Production policy scattered; code defaults win silently |
| **RECOMMENDED** | Create `docs/governance/EMPIREAI_PRODUCTION_TRUTH.md` consolidating MANAGED_DEPLOYMENT, route policy, Pillow Production Mode, Redis/SQLite behaviour |
| **FUTURE** | Auto-sync from deploy pipeline |
| **Owner** | Chief Architect + Grand King approval |
| **Effort** | Medium — 1–2 days |

---

### 4. Decide ADR-CON-001 — Production Cockpit Authority (P0)

| | |
|---|---|
| **CURRENT** | `frontend/` (Founder Shell) and `empireai-web/` (53-page Cockpit) both in production path |
| **RECOMMENDED** | Grand King records decision in `EMPIREAI_DECISIONS.md`: which surface is authoritative Grand King UX |
| **FUTURE** | Optional folder rename (`frontend/` → `founder-shell/`) in V2 |
| **Owner** | Grand King |
| **Effort** | Low decision — 1 session |

---

### 5. Write Tier 6 Deferral for ECC and VIE (P0)

| | |
|---|---|
| **CURRENT** | Intended hierarchy references ECC/VIE; neither exists in repo |
| **RECOMMENDED** | ADR or annex: "Tier 6 deferred to V2" with explicit non-blocking statement for Constitution Lock |
| **FUTURE** | Design and build if programme approved |
| **Owner** | Chief Architect |
| **Effort** | Low — 2–4 hours |

---

### 6. Fix EXECUTIVE_AUDIT_INDEX (P1)

| | |
|---|---|
| **CURRENT** | Index lists 32 combined audits; 38 exist on disk |
| **RECOMMENDED** | Add 6 missing entries with dates and mission IDs |
| **FUTURE** | Script validates index vs glob |
| **Owner** | Governance maintainer |
| **Effort** | Low — 2 hours |

---

### 7. Apply ECDS-1 Columns to Master Index (P1)

| | |
|---|---|
| **CURRENT** | Master Index is path catalog without full tier/class/owner matrix |
| **RECOMMENDED** | Add Tier, Classification, Owner, Maintainer, Authority columns per `06_DOCUMENT_NAVIGATION.md` |
| **FUTURE** | CI fails on unclassified new markdown |
| **Owner** | Chief Architect |
| **Effort** | Medium — 2–3 days |

---

### 8. Label Historical Cluster (P1)

| | |
|---|---|
| **CURRENT** | `docs/SYSTEM_ARCHITECTURE.md` + 6 companions discoverable; conflict with Pillow hierarchy |
| **RECOMMENDED** | HISTORICAL banner + Master Index superseded-by pointers; do not delete |
| **FUTURE** | Optional `docs/historical/` subfolder |
| **Owner** | Index maintainer |
| **Effort** | Low — 4 hours |

---

### 9. Record ADR-CON-002 Production Mode (P1)

| | |
|---|---|
| **CURRENT** | Minimal Pillow LLM path and extension routes off — intentional but undocumented as policy |
| **RECOMMENDED** | ADR in EMPIREAI_DECISIONS: Production Mode = stability subset; not absence of Pillow COI |
| **FUTURE** | Full COI mode when stability proven |
| **Owner** | Chief Architect + Grand King |
| **Effort** | Low — 2 hours |

---

### 10. Resolve REAL-078 Cockpit Path Drift (P1)

| | |
|---|---|
| **CURRENT** | REAL-078 references `frontend/dashboard`; production executive depth is `empireai-web/cockpit` |
| **RECOMMENDED** | Amendment footnote at Constitution Lock OR ADR cross-reference in Production Truth |
| **FUTURE** | REAL-078 revision batch |
| **Owner** | Chief Architect |
| **Effort** | Low — 1 hour |

---

### 11. Rename Display Title — EI Pillow Executive Roles (P2)

| | |
|---|---|
| **CURRENT** | Two "Pillow Executive Constitution" titles |
| **RECOMMENDED** | Display: `docs/executive-intelligence/PILLOW_EXECUTIVE_CONSTITUTION.md` → "EI Pillow Executive Roles" |
| **FUTURE** | Optional file rename |
| **Owner** | EI maintainer |
| **Effort** | Low — 30 minutes |

---

### 12. Rewrite docs/README.md (P2)

| | |
|---|---|
| **CURRENT** | Claims "scaffold only" — contradicts 81 substantive files |
| **RECOMMENDED** | Docs folder navigation entry pointing to governance, EI, architecture subfolders |
| **FUTURE** | — |
| **Owner** | Index maintainer |
| **Effort** | Low — 1 hour |

---

### 13. Mark EMPIREAI_ARCHITECTURE.md OPERATIONAL MEMORY (P2)

| | |
|---|---|
| **CURRENT** | Living changelog architecture doc; sometimes cited as normative |
| **RECOMMENDED** | Master Index classification OPERATIONAL MEMORY; citation rules prohibit as law |
| **FUTURE** | — |
| **Owner** | Chief Architect |
| **Effort** | Low — 30 minutes |

---

### 14. Label master build bible HISTORICAL (P2)

| | |
|---|---|
| **CURRENT** | `artifacts/empireai-master-build-bible.md` coexists with hierarchy bible |
| **RECOMMENDED** | HISTORICAL label; superseded by `empireai-version-1-build-hierarchy-bible.md` |
| **FUTURE** | — |
| **Owner** | Index maintainer |
| **Effort** | Low — 15 minutes |

---

### 15. Centralize ECNS-1 Glossary in Master Index (P2)

| | |
|---|---|
| **CURRENT** | Glossary in audit pack only |
| **RECOMMENDED** | Appendix in Master Index: CTD, REAL, EI, G2–G8, etc. |
| **FUTURE** | Searchable glossary page |
| **Owner** | Chief Architect |
| **Effort** | Low — 2 hours |

---

### 16. Complete or Mark FUTURE — EI Architecture TODO (P2)

| | |
|---|---|
| **CURRENT** | `EXECUTIVE_INTELLIGENCE_ARCHITECTURE.md` has incomplete TODO section |
| **RECOMMENDED** | Either complete section or explicit FUTURE banner referencing Canonical Architecture |
| **FUTURE** | EI V2 architecture programme |
| **Owner** | EI maintainer |
| **Effort** | Low–Medium |

---

### 17. Ratify ECDS-1 at Constitution Lock (FUTURE)

| | |
|---|---|
| **CURRENT** | Documentation system defined in audit evidence only |
| **RECOMMENDED** | Grand King ratifies this pack + normalization + architecture packs as constitutional input |
| **FUTURE** | Locked schedules for hierarchy, precedence, navigation |
| **Owner** | Grand King |
| **Effort** | Ceremony — 1 session |

---

### 18. Track CON-001–CON-019 Constitution Backlog (P2)

| | |
|---|---|
| **CURRENT** | Backlog in `docs/audits/full-empireai-audit/16_RECOMMENDED_CONSTITUTION_BACKLOG.md` |
| **RECOMMENDED** | Mirror P0/P1 items in governance register or EMPIREAI_DECISIONS |
| **FUTURE** | Close items at Lock |
| **Owner** | Chief Architect |
| **Effort** | Low |

---

### 19. Add Testing Navigation Section to Master Index (P3)

| | |
|---|---|
| **CURRENT** | 285 tests; testing docs scattered |
| **RECOMMENDED** | Master Index section: REAL tests, gate tests, production scripts |
| **FUTURE** | Test doctrine doc if programme grows |
| **Owner** | Engineering |
| **Effort** | Low |

---

### 20. Do NOT Rename Production Folders in V1 (RECOMMENDED)

| | |
|---|---|
| **CURRENT** | Normalization recommends deferring `frontend/` and `empireai-web/` renames |
| **RECOMMENDED** | Documentation-first normalization only; ECNS-1 display names |
| **FUTURE** | V2 folder rename after ADR-CON-001 stable |
| **Owner** | Chief Architect |
| **Effort** | N/A — avoidance recommendation |

---

## Implementation Phases

| Phase | Scope | Duration | Blocks |
|-------|-------|----------|--------|
| **A — P0 docs** | Vision, hierarchy, production truth, ADR-CON-001, Tier 6 deferral | 3–5 days | Constitution Construction |
| **B — P1 index** | Audit index, Master Index columns, historical labels, ADR-CON-002 | 2–3 days | Constitution Lock prep |
| **C — P2 quality** | Display renames, README, glossary, EI architecture | 2–3 days | Certification polish |
| **D — Ratification** | Constitution Lock ceremony | 1 session | Permanent framework |

---

## What NOT To Do (This Mission Boundary)

| Action | Status |
|--------|--------|
| Merge constitution files | **Do not** — layered stack is intentional |
| Delete historical docs | **Do not** — label only |
| Rename production folders | **Defer V2** |
| Invent new governing documents beyond named gaps | **Do not** |
| Implement code changes | **Out of scope** |

---

## Success Criteria Checklist

After Phase A–B, Chief Architect can:

- [x] Construct constitutional document hierarchy (ECDS-1 Tier 0–6)
- [x] Construct constitutional document authority (`02_DOCUMENT_AUTHORITY.md`)
- [x] Construct constitutional document precedence (`03_DOCUMENT_PRECEDENCE.md`)
- [ ] Construct permanent constitutional framework — **pending P0 + Lock ceremony**

---

## Recommendation Summary Table

| # | Recommendation | Priority | King? |
|---|----------------|----------|-------|
| 1 | Author Vision | P0 | Sign-off |
| 2 | Constitution hierarchy one-pager | P0 | No |
| 3 | Production truth doctrine | P0 | Approve |
| 4 | ADR-CON-001 frontend | P0 | **Yes** |
| 5 | ECC/VIE deferral | P0 | **Yes** |
| 6 | Fix audit index | P1 | No |
| 7 | Master Index columns | P1 | No |
| 8 | Historical labels | P1 | No |
| 9 | ADR-CON-002 Production Mode | P1 | Approve |
| 10 | REAL-078 cockpit drift | P1 | No |
| 11 | EI display rename | P2 | No |
| 12 | docs/README fix | P2 | No |
| 13 | ARCHITECTURE.md memory label | P2 | No |
| 14 | master bible historical | P2 | No |
| 15 | Glossary in index | P2 | No |
| 16 | EI architecture TODO | P2 | No |
| 17 | Ratify ECDS-1 at Lock | FUTURE | **Yes** |
| 18 | Constitution backlog tracking | P2 | No |
| 19 | Testing nav section | P3 | No |
| 20 | No folder renames V1 | REC | No |

---

## Evidence Lineage

This recommendations file synthesizes:

- `docs/audits/full-empireai-audit/14_DUPLICATE_TRUTH_AND_NAMING_AUDIT.md`
- `docs/audits/full-empireai-audit/15_GAPS_AND_DRIFT_AUDIT.md`
- `docs/audits/full-empireai-audit/16_RECOMMENDED_CONSTITUTION_BACKLOG.md`
- `docs/audits/hierarchy-normalization/06_DUPLICATE_TRUTH_RESOLUTION.md`
- `docs/audits/hierarchy-normalization/10_FINAL_NORMALIZATION_REPORT.md`
- `docs/audits/canonical-architecture/09_ARCHITECTURE_DECISIONS.md`
- `docs/audits/canonical-architecture/10_IMPLEMENTATION_RECOMMENDATIONS.md`

**Classification of this pack:** EVIDENCE — input to Constitution Construction, not ratified law.
