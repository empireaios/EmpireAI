# 16 — Recommended Constitution Backlog

Evidence-based backlog for Constitution Lock preparation.  
**Dep** = dependency task IDs. **Own** = owning domain. **Dest** = destination artifact or system.

| Ph | ID | Cat | Task | Desc | Dep | Own | Dest | ✓ |
|----|-----|-----|------|------|-----|-----|------|---|
| 1 | CON-001 | Vision | Author canonical Vision File | Create `EMPIREAI_VISION.md` reconciling Soul, Marketplace OS Vision, and CTD commercial intent | — | Grand King + Architect | Root docs | ☐ |
| 1 | CON-002 | Index | Update master navigation index | Refresh `EMPIREAI_REPOSITORY_MASTER_INDEX.md` with audit classifications (canonical/historical/obsolete) | — | Architect | Root docs | ☐ |
| 1 | CON-003 | Index | Fix executive audit index | Align `docs/governance/EXECUTIVE_AUDIT_INDEX.md` to all 38 combined audits on disk | — | Governance | docs/governance | ☐ |
| 1 | CON-004 | Docs | Constitution hierarchy one-pager | Single map: CTD → Engineering → Pillow → EI library; when to read which | CON-002 | Governance | docs/governance | ☐ |
| 1 | CON-005 | Docs | Mark obsolete architecture cluster | Label `docs/SYSTEM_ARCHITECTURE.md` + companions as HISTORICAL in index | CON-002 | Architect | docs/ | ☐ |
| 2 | CON-006 | UX | Resolve production frontend authority | ADR: which Vercel project (`frontend/` vs `empireai-web/`) serves empire-ai.co Grand King | — | Grand King | EMPIREAI_DECISIONS.md | ☐ |
| 2 | CON-007 | Prod | Document production route policy | Doctrine: when `EMPIRE_ENABLE_EXTENSION_ROUTES` is enabled; critical vs extension surface | — | Brain | deployment/ | ☐ |
| 2 | CON-008 | Prod | Document Pillow production mode | Explain minimal chat path vs full Pillow COI; Grand King expectations | CON-007 | Pillow | docs/governance | ☐ |
| 2 | CON-009 | Prod | Production truth doctrine | Consolidate MANAGED_DEPLOYMENT + readiness checks + journey scripts into one canonical doc | CON-007 | Production | docs/governance | ☐ |
| 3 | CON-010 | Brain | Redis production hard requirement | Fail fast or explicit degraded banner when Redis unavailable in production | CON-009 | Brain | backend/config | ☐ |
| 3 | CON-011 | Brain | Session durability plan | Redis-backed Pillow sessions or documented ephemeral policy in Constitution | CON-008 | Brain | pillow-host | ☐ |
| 3 | CON-012 | Brain | SQLite durability doctrine | Document debounced persist + crash window; Postgres migration decision | CON-009 | Brain | docs/architecture | ☐ |
| 4 | CON-013 | ECC | Define Execution Control Center scope | INTENDED HIERARCHY CHECK — design doc or explicit V2 deferral in Constitution | CON-001 | Architect | docs/governance | ☐ |
| 4 | CON-014 | VIE | Define Vision Integrity Engine scope | INTENDED HIERARCHY CHECK — design doc or explicit V2 deferral | CON-001 | Architect | docs/governance | ☐ |
| 4 | CON-015 | Eng | Name Autonomous Engineering Constitution | Map existing engineering constitution + Cursor doctrines to intended name or amend hierarchy | CON-004 | Governance | Root docs | ☐ |
| 5 | CON-016 | Cockpit | Placeholder panel registry | List all "not yet implemented" SCR panels with target missions | CON-006 | Cockpit | empireai-web | ☐ |
| 5 | CON-017 | Test | Browser E2E acceptance suite | Playwright/Cypress Grand King journey matching production scripts | CON-006 | QA | backend/scripts | ☐ |
| 5 | CON-018 | Cursor | Clear pending bridge missions | Execute or archive `.cursor/missions/pending/bridge-*` | — | Builder | .cursor/missions | ☐ |
| 6 | CON-019 | Lock | Constitution Lock ceremony | Grand King + Architect sign-off on canonical doc set listed in CON-004 | CON-001..018 | Grand King | docs/governance | ☐ |

---

## Priority Notes

- **Ph 1** unblocks ChatGPT reconstruction of Vision/Soul/Bible/Roadmap hierarchy.
- **Ph 2** closes production truth gaps found in audits 08, 09, 12.
- **Ph 3** addresses long-run stability and durability risks (audit 08, 15).
- **Ph 4** resolves INTENDED HIERARCHY CHECK gaps without inventing code.
- **Ph 5–6** closes Cockpit/test/Cursor gaps before lock.

**Not included (explicit defer):** Refactors, renames, code fixes — out of scope for this read-only audit mission.
