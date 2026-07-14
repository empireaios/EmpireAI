# 05 — Document Classification

**Purpose:** Classify every documentation domain with disposition fields.  
**Legend:** C=Canonical O=Operational E=Evidence H=Historical S=Stub

---

## 1. Classification Counts (Repository-Wide)

| Classification | Count | Notes |
|----------------|------:|-------|
| **CANONICAL** (target set) | **56** | 52 existing + 4 to author |
| **OPERATIONAL** | **~285** | Dev guides, READMEs, governance working docs, status, scoped bibles |
| **EVIDENCE** | **~170** | Audits, artifact proofs, JSON, mission reports, audit packs |
| **HISTORICAL** | **~12** | Obsolete/superseded prose cluster |
| **STUB** | **~5** | docs/README scaffold claim, ai-agents/, incomplete placeholders |
| **Total markdown scanned** | **~499** | Excl. node_modules |

**Documentation completeness:** **~79%** — canonical set 93% present (52/56); full corpus classification applied ~79% (Master Index not yet fully labeled).

---

## 2. Disposition Key

| Field | Values |
|-------|--------|
| Canonical? | YES / NO / TO AUTHOR |
| Operational? | YES / NO |
| Historical? | YES / NO |
| Evidence? | YES / NO |
| Stub? | YES / NO |
| Replace? | YES / NO — replace with named target |
| Merge? | YES / NO — conceptual merge into target (no file deletion this mission) |
| Retain? | YES / NO |
| Archive? | YES / NO — label HISTORICAL, keep on disk |

---

## 3. Vision Domain

| Document | Purpose | Owner | Maintainer | Authority | Tier | Class | Dependencies | Consumers | Canonical | Operational | Historical | Evidence | Stub | Replace | Merge | Retain | Archive |
|----------|---------|-------|------------|-----------|------|-------|--------------|-----------|-----------|-------------|------------|----------|------|---------|-------|--------|---------|
| `EMPIREAI_VISION.md` | Single empire vision — why we exist | Grand King | Chief Architect | A2 | 2 | **TO AUTHOR** | Soul, CTD preamble, MARKETPLACE_OS_VISION | All agents, Constitution | **TO AUTHOR** | NO | NO | NO | NO | NO | YES→inputs | YES | NO |
| `MARKETPLACE_OS_VISION.md` | Partial commerce vision input | Grand King | Architect | A4 | 4 | O | CTD, CBD | Vision authoring | NO | YES | NO | NO | NO | NO | YES→VISION | YES | NO |

---

## 4. Soul Domain

| Document | Purpose | Owner | Maintainer | Authority | Tier | Class | Dependencies | Consumers | Canonical | Operational | Historical | Evidence | Stub | Replace | Merge | Retain | Archive |
|----------|---------|-------|------------|-----------|------|-------|--------------|-----------|-----------|-------------|------------|----------|------|---------|-------|--------|---------|
| `EMPIREAI_SOUL.md` | Identity & mission memory | Grand King | Chief Architect | A2 | 2 | C | Vision (future) | CTD, agents, foundation/soul-file | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `foundation/soul-file/` (runtime) | Soul runtime mirror | Chief Architect | Engineering | A5 | 5 | O | EMPIREAI_SOUL.md | Brain foundation | NO | YES | NO | NO | NO | NO | NO | YES | NO |

---

## 5. CTD Domain

| Document | Purpose | Owner | Maintainer | Authority | Tier | Class | Dependencies | Consumers | Canonical | Operational | Historical | Evidence | Stub | Replace | Merge | Retain | Archive |
|----------|---------|-------|------------|-----------|------|-------|--------------|-----------|-----------|-------------|------------|----------|------|---------|-------|--------|---------|
| `EMPIREAI_CORE_CONSTITUTION_CTD.md` | Supreme V1 commercial law CTD-001→040 | Grand King | Chief Architect | **A1** | 3 | C | Vision, Soul | All law, systems | YES | NO | NO | NO | NO | NO | NO | YES | NO |

---

## 6. Engineering Constitution Domain

| Document | Purpose | Owner | Maintainer | Authority | Tier | Class | Dependencies | Consumers | Canonical | Operational | Historical | Evidence | Stub | Replace | Merge | Retain | Archive |
|----------|---------|-------|------------|-----------|------|-------|--------------|-----------|-----------|-------------|------------|----------|------|---------|-------|--------|---------|
| `EMPIREAI_CONSTITUTION.md` | Brain/Guardian engineering law | Chief Architect | Cursor | A2 | 3 | C | CTD, ACD | Brain, Guardian, missions | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `EMPIREAI_CURSOR_OUTPUT_STANDARD.md` | Cursor output law | Chief Architect | Cursor | A2 | 3 | C | Engineering Constitution | Builder agents | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md` | Recovery doctrine | Chief Architect | Cursor | A2 | 3 | C | Engineering Constitution | Builder agents | YES | NO | NO | NO | NO | NO | NO | YES | NO |

---

## 7. Governance Domain

| Document | Purpose | Owner | Maintainer | Authority | Tier | Class | Dependencies | Consumers | Canonical | Operational | Historical | Evidence | Stub | Replace | Merge | Retain | Archive |
|----------|---------|-------|------------|-----------|------|-------|--------------|-----------|-----------|-------------|------------|----------|------|---------|-------|--------|---------|
| `EMPIREAI_GOVERNANCE_DOCTRINE_GVD.md` | Roles, approval, audit | Grand King | Governance | A2 | 3 | C | CTD | All governance | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/governance/EMPIREAI_CONSTITUTION_HIERARCHY.md` | One-page law map | Chief Architect | Architect | A2 | 3 | **TO AUTHOR** | All Tier 3 law | Agents | **TO AUTHOR** | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/governance/EXECUTIVE_AUDIT_INDEX.md` | Audit registry | Governance | Audit maintainer | A4 | 4 | C | Combined audits | Auditors | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/governance/VERSION_1_CERTIFICATION_MODE.md` | V1 certification rules | Grand King | Governance | A4 | 4 | C | CTD, GVD | Certification | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/governance/VERSION_1_GO_LIVE_PREPARATION_CHECKLIST.md` | Go-live checklist | Grand King | Operations | A4 | 4 | C | Certification mode | DevOps, GK | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/governance/PILLOW_PRODUCT_INTEGRATION_MASTER_PLAN.md` | Pillow integration programme | Pillow | Pillow | A4 | 4 | C | Pillow Constitution | Pillow team | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/governance/PILLOW_ENHANCEMENT_REGISTER.md` | Pillow enhancements | BL-C owner | Pillow | A4 | 4 | C | BL-C | Pillow | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/governance/UX_ENHANCEMENT_REGISTER.md` | UX enhancements | UID owner | Cockpit | A4 | 4 | C | UID | Cockpit | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| Other `docs/governance/*` (~16 files) | Domain governance, ADRs, CRI, certification | Domain owners | Maintainers | A4–A5 | 4–5 | O/C mix | CTD, domain law | Specialists | Partial | Partial | NO | NO | NO | NO | NO | YES | NO |

---

## 8. Architecture Domain

| Document | Purpose | Owner | Maintainer | Authority | Tier | Class | Dependencies | Consumers | Canonical | Operational | Historical | Evidence | Stub | Replace | Merge | Retain | Archive |
|----------|---------|-------|------------|-----------|------|-------|--------------|-----------|-----------|-------------|------------|----------|------|---------|-------|--------|---------|
| `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` | Normative architecture REAL-078 | Chief Architect | Architecture | A3 | 3 | C | ACD, CTD | All engineering | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/architecture/DEVELOPMENT_DOCTRINE.md` | Development doctrine | Chief Architect | Engineering | A3 | 3 | C | ACD | Developers | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/ARCHITECTURE.md` | Developer operational map | Chief Architect | Engineering | A5 | 5 | O | Canonical Architecture | Developers | NO | YES | NO | NO | NO | NO | NO | YES | NO |
| `EMPIREAI_ARCHITECTURE.md` | Living architecture memory | Chief Architect | Engineering | A5 | 5 | O | Canonical Architecture | Architects | NO | YES | NO | NO | NO | NO | NO | YES | NO |
| `docs/SYSTEM_ARCHITECTURE.md` | Pre-Pillow SaaS draft | — | — | A7 | — | H | — | None (obsolete) | NO | NO | YES | NO | NO | YES | NO | YES | YES |
| `docs/DATABASE_SCHEMA.md` etc. (6 legacy) | Legacy companions | — | — | A7 | — | H | SYSTEM_ARCHITECTURE | None | NO | NO | YES | NO | NO | YES | NO | YES | YES |
| `PILLOW_ARCHITECTURE_CONTRACT.md` | Frozen Pillow contract | Pillow | Pillow | A3 | 3 | C | Pillow Constitution | Brain, Pillow | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `EMPIREAI_PILLOW_ARCHITECTURE.md` | Pillow domain architecture | Pillow | Pillow | A3 | 3 | C | Pillow Constitution | Pillow team | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `EMPIREAI_EYE_ARCHITECTURE.md` | Eye connector architecture | Chief Architect | Eye owner | A3 | 3 | C | Canonical Architecture | Eye module | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `EMPIREAI_GLOBAL_PRODUCT_INTELLIGENCE_ARCHITECTURE.md` | Product intelligence arch | Chief Architect | Intelligence | A3 | 3 | C | G3 programme | Intelligence | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/architecture/cockpit/*` (7 files) | Cockpit specification set | UID owner | Cockpit | A3 | 3 | C | UID | Cockpit builders | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/audits/canonical-architecture/01_CANONICAL_ARCHITECTURE.md` | Reconstructed architecture | Chief Architect | Audit | A6 | — | E | All architecture docs | Constitution Construction | NO | NO | NO | YES | NO | NO | NO | YES | NO |

---

## 9. Pillow Domain

| Document | Purpose | Owner | Maintainer | Authority | Tier | Class | Dependencies | Consumers | Canonical | Operational | Historical | Evidence | Stub | Replace | Merge | Retain | Archive |
|----------|---------|-------|------------|-----------|------|-------|--------------|-----------|-----------|-------------|------------|----------|------|---------|-------|--------|---------|
| `EMPIREAI_PILLOW_CONSTITUTION.md` | Pillow master V1 identity | Pillow COI | Pillow | A2 | 3 | C | CTD | Pillow host, agents | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` | Pillow cognition/learning | Pillow COI | Pillow | A2 | 3 | C | Pillow Constitution | Pillow runtime | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `EMPIREAI_PILLOW_MEMORY_DOCTRINE.md` | Memory doctrine | Pillow COI | Pillow | A2 | 3 | C | Pillow Constitution | Pillow memory | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `PILLOW_ROADMAP.md` | Pillow programme sequence | Pillow | Pillow | A4 | 4 | C | Pillow Constitution | Pillow team | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `PILLOW_RUNTIME_INTEGRATION_PLAN.md` | Completed integration plan | — | — | A7 | 4 | H | — | Evidence only | NO | NO | YES | NO | NO | YES | NO | YES | YES |
| `artifacts/pillow-*` (4 files) | Pillow completion evidence | Governance | — | A6 | — | E | Pillow missions | Auditors | NO | NO | NO | YES | NO | NO | NO | YES | NO |

---

## 10. Executive Intelligence Domain

| Document | Purpose | Owner | Maintainer | Authority | Tier | Class | Dependencies | Consumers | Canonical | Operational | Historical | Evidence | Stub | Replace | Merge | Retain | Archive |
|----------|---------|-------|------------|-----------|------|-------|--------------|-----------|-----------|-------------|------------|----------|------|---------|-------|--------|---------|
| `docs/executive-intelligence/EI_INDEX.md` | EI library entry | EI programme | EI maintainers | A2 | 3 | C | CTD | All EI readers | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/executive-intelligence/EI0–EI10` | EI library volumes | EI programme | EI maintainers | A2 | 3 | C | EI_INDEX, CTD | Pillow, architects | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/executive-intelligence/PILLOW_EXECUTIVE_CONSTITUTION.md` | EI Pillow executive roles | EI programme | EI maintainers | A2 | 3 | C | EI library | EI agents | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/executive-intelligence/EXECUTIVE_INTELLIGENCE_MANIFEST.md` | EI manifest | EI programme | EI maintainers | A2 | 3 | C | EI_INDEX | EI programme | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/executive-intelligence/EXECUTIVE_INTELLIGENCE_ARCHITECTURE.md` | EI architecture | EI programme | EI maintainers | A3 | 3 | C | Canonical Architecture | EI (TODO section incomplete) | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/executive-intelligence/EXECUTIVE_INTELLIGENCE_ROADMAP_v1.md` | EI roadmap | EI programme | EI maintainers | A4 | 4 | C | EI library | EI programme | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `docs/executive-intelligence/EIR-001–006` | EI release reports | EI programme | — | A6 | — | E | EI missions | Auditors | NO | NO | NO | YES | NO | NO | NO | YES | NO |
| Other EI docs (~20) | EI reports, updates, governance | EI programme | EI maintainers | A4–A6 | 4 | O/E | EI library | Specialists | Partial | Partial | NO | Partial | NO | NO | NO | YES | NO |

---

## 11. Commerce Domain

| Document | Purpose | Owner | Maintainer | Authority | Tier | Class | Dependencies | Consumers | Canonical | Operational | Historical | Evidence | Stub | Replace | Merge | Retain | Archive |
|----------|---------|-------|------------|-----------|------|-------|--------------|-----------|-----------|-------------|------------|----------|------|---------|-------|--------|---------|
| `EMPIREAI_COMMERCIAL_BUSINESS_DOCTRINE_CBD.md` | Commercial soul law | Grand King | Commerce | A2 | 3 | C | CTD | Commerce engines | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `COMMERCE_OS_BLUEPRINT.md` | Commerce OS blueprint | Grand King | Commerce | A4 | 4 | C | CBD | Commerce build | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `EMPIREAI_COMMERCE_CANON.md` | Commerce canon | Grand King | Commerce | A4 | 4 | C | CBD | Commerce ops | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `artifacts/g2-*` (~10+) | Commerce integration evidence | Governance | — | A6 | — | E | G2 programme | Auditors | NO | NO | NO | YES | NO | NO | NO | YES | NO |

---

## 12. Cockpit / Brain / Production Domains

| Document | Purpose | Owner | Maintainer | Authority | Tier | Class | Dependencies | Consumers | Canonical | Operational | Historical | Evidence | Stub | Replace | Merge | Retain | Archive |
|----------|---------|-------|------------|-----------|------|-------|--------------|-----------|-----------|-------------|------------|----------|------|---------|-------|--------|---------|
| `docs/architecture/cockpit/COCKPIT_IMPLEMENTATION_ROADMAP.md` | Cockpit build sequence | UID owner | Cockpit | A4 | 4 | C | Cockpit specs | Cockpit team | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `EMPIREAI_UX_IDENTITY_DOCTRINE_UID.md` | Founder UX law | Grand King | Cockpit UX | A2 | 3 | C | CTD | Cockpit, frontend | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `backend/README.md` | Brain package entry | Engineering | Brain team | A5 | 5 | O | Engineering Constitution | Developers | NO | YES | NO | NO | NO | NO | NO | YES | NO |
| `backend/MISSION_CONTROL_BUILD_BIBLE.md` | MCL/backend scoped bible | Engineering | Brain team | A5 | 5 | O | Engineering Constitution | Backend only | NO | YES | NO | NO | NO | NO | NO | YES | NO |
| `deployment/MANAGED_DEPLOYMENT.md` | Production deploy sequence | DevOps | DevOps | A5 | 5 | C/O | CTD, architecture | DevOps, GK | YES | YES | NO | NO | NO | NO | YES→PROD_TRUTH | YES | NO |
| `docs/governance/EMPIREAI_PRODUCTION_TRUTH.md` | Single production authority | Grand King | Architect | A5 | 5 | **TO AUTHOR** | MANAGED_DEPLOYMENT, STATUS | All production questions | **TO AUTHOR** | YES | NO | NO | NO | NO | YES→consolidate | YES | NO |
| `deployment/*.env.template` | Env templates | DevOps | DevOps | A5 | 5 | O | MANAGED_DEPLOYMENT | DevOps | NO | YES | NO | NO | NO | NO | NO | YES | NO |

---

## 13. Journey / Roadmaps / Bible / Master Index

| Document | Purpose | Owner | Maintainer | Authority | Tier | Class | Dependencies | Consumers | Canonical | Operational | Historical | Evidence | Stub | Replace | Merge | Retain | Archive |
|----------|---------|-------|------------|-----------|------|-------|--------------|-----------|-----------|-------------|------------|----------|------|---------|-------|--------|---------|
| `EMPIREAI_ROADMAP.md` | Empire master roadmap | Grand King | Architect | A4 | 4 | C | CTD, Vision | Programme | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `JOURNEY.md` | Live ops status index | Operations | Cursor + GK | A4 | 4 | C | STATUS, roadmaps | All agents | YES | YES | NO | NO | NO | NO | NO | YES | NO |
| `JOURNEY_AUDIT.md` | Journey change log | Operations | Cursor | A4 | 4 | C | JOURNEY | Governance | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `EMPIREAI_STATUS.md` | Current implementation state | Operations | Cursor + GK | A5 | 4 | C/O | Code, Journey | Agents | YES | YES | NO | NO | NO | NO | NO | YES | NO |
| `artifacts/empireai-version-1-build-hierarchy-bible.md` | V1 hierarchy bible | Chief Architect | Architect | A4 | 4 | C | CTD, roadmaps | V1 build | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `artifacts/empireai-master-build-bible.md` | Superseded bible | — | — | A7 | 4 | H | — | Archaeology | NO | NO | YES | NO | NO | YES | NO | YES | YES |
| `EMPIREAI_REPOSITORY_MASTER_INDEX.md` | Master navigation catalog | Chief Architect | Index maintainer | AN | — | C/O | All docs | All agents | YES | YES | NO | NO | NO | NO | NO | YES | NO |
| `EMPIREAI_DECISIONS.md` | ADR register | Chief Architect | Cursor | A4 | 4 | C | Architecture | All decisions | YES | NO | NO | NO | NO | NO | NO | YES | NO |
| `README.md` | Repo entry | Chief Architect | Engineering | A5 | 5 | O | Master Index | New contributors | NO | YES | NO | NO | NO | NO | NO | YES | NO |

---

## 14. ADR / Standards / Specifications

| Document | Purpose | Owner | Maintainer | Authority | Tier | Class | Canonical | Operational | Historical | Evidence |
|----------|---------|-------|------------|-----------|------|-------|-----------|-------------|------------|----------|
| `EMPIREAI_DECISIONS.md` | ADR register | Chief Architect | Cursor | A4 | 4 | C | YES | NO | NO | NO |
| `docs/governance/ADR-*` (~5 files) | Individual ADRs | Chief Architect | Cursor | A4 | 4 | C/O | YES | Partial | NO | NO |
| `docs/audits/hierarchy-normalization/05_CANONICAL_NAMING_STANDARD.md` | ECNS-1 naming | Chief Architect | Architect | A6 | — | E | NO | NO | NO | YES |
| `CANONICAL_EKLS_SPECIFICATION.md` | Knowledge system spec | Chief Architect | Knowledge | A3 | 3 | C | YES | NO | NO | NO |
| Cockpit specs, Pillow contract | Interface specifications | Domain owners | Maintainers | A3 | 3 | C | YES | NO | NO | NO |

---

## 15. Audits / Evidence / Historical / Mission Reports

| Category | Count | Class | Canonical | Operational | Historical | Evidence | Retain | Archive |
|----------|------:|-------|-----------|-------------|------------|----------|--------|---------|
| Combined executive audits (root) | 38 | E | NO | NO | NO | YES | YES | NO |
| Artifact executive audits | ~94 | E | NO | NO | NO | YES | YES | NO |
| Evidence JSON | 7 | E | NO | NO | NO | YES | YES | NO |
| SA-001 bundle | 5 | E | NO | NO | NO | YES | YES | NO |
| Progress/completion reports | ~25 | E | NO | NO | NO | YES | YES | NO |
| Full + normalization + architecture + doc audit packs | ~60 | E | NO | NO | NO | YES | YES | NO |
| Obsolete docs cluster | 7 | H | NO | NO | YES | NO | YES | YES |
| Superseded programme docs | 2 | H | NO | NO | YES | NO | YES | YES |

---

## 16. Registers Summary

| Register | Path | Class | Canonical |
|----------|------|-------|-----------|
| Executive Audit Index | `docs/governance/EXECUTIVE_AUDIT_INDEX.md` | C | YES (needs 6 entries) |
| Pillow Enhancement | `docs/governance/PILLOW_ENHANCEMENT_REGISTER.md` | C | YES |
| UX Enhancement | `docs/governance/UX_ENHANCEMENT_REGISTER.md` | C | YES |
| V1 Certification Blocker | `docs/governance/VERSION_1_CERTIFICATION_BLOCKER_REGISTER.md` | O/C | Partial |
| Master Completion Ledger | `MASTER_COMPLETION_LEDGER.md` | O/E | NO — operational ledger |

---

## 17. Stub Documents

| Path | Issue | Disposition |
|------|-------|-------------|
| `docs/README.md` | Claims "scaffold only" — contradicts 81 files | **Replace** text — OPERATIONAL fix |
| `ai-agents/` | Stub directory | Retain; classify STUB until implemented |
| EI architecture TODO section | Incomplete placeholder | Complete at V2 or mark FUTURE in doc |
| `EMPIREAI_VISION.md` | Missing file | **TO AUTHOR** — not stub |

---

## 18. Canonical Set Summary

| Status | Count |
|--------|------:|
| Existing canonical documents | 52 |
| To author before Constitution Lock | 4 |
| **Target canonical total** | **56** |

**Four to author:** Vision, Constitution Hierarchy, Production Truth, ADR-CON-001 (record in DECISIONS).
