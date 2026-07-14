# ADR-044: REAL Namespace Canonicalization

> **Decision Register:** ADR-044  
> **Register note:** Full policy in this companion file. **Authority:** [`EMPIREAI_DECISIONS.md`](../../EMPIREAI_DECISIONS.md) ADR-044 · **ADR System:** [`EMPIREAI_ARCHITECTURAL_DECISION_RECORD_SYSTEM.md`](./EMPIREAI_ARCHITECTURAL_DECISION_RECORD_SYSTEM.md) (P3-07)

---

## Register note (ADR-020 slot)

**ADR-020** is permanently assigned to **Backlog Routing (BL-A, ROUTE 11)** in `EMPIREAI_DECISIONS.md` and is immutable per ADR-022 (closed Backlog Releases are not patched). This REAL namespace canonicalization policy is therefore registered as **ADR-044**. Mission references to "ADR-020 REAL Namespace Canonicalization" denote this policy document, not a replacement of backlog routing law.

**Scope of this ADR:** Documentation and governance policy only. **No runtime, contract, Journey row, or module renumbering is authorized by this ADR.**

---

## PART A — Executive Summary

EmpireAI uses the **REAL-###** prefix for Version 1 commerce/runtime missions (REAL-001 → REAL-100) and for **foundation capabilities** inside `reality-integration` (REAL-001 → REAL-005). Historical blueprints, early connector documentation, and UX drafts introduced **duplicate REAL identifiers** for different modules — most critically REAL-003/004/005 (foundation vs commerce) and REAL-055 (Executive War Room vs blueprint alias to visual debate).

This ADR permanently defines:

1. **Which REAL identifier owns which module** for governance, Journey indexing, Pillow intelligence, and Executive Audit interpretation.
2. **Rules prohibiting new duplicate REAL identifiers** without a governed numbering mission.
3. **Precedence:** runtime truth and Journey commerce series over superseded blueprint aliases.
4. **Deferred renumbering** of foundation REAL-003/004/005 until a post-V1 governed mission.

**Explicit canon (unchanged by this ADR):**

| Identifier | Canonical owner | Runtime path (V1) |
|---|---|---|
| REAL-003 | **Commerce Execution** — Marketplace Publishing | `backend/src/runtime/marketplace-publishing/` |
| REAL-004 | **Commerce Execution** — Listing Intelligence | `backend/src/runtime/listing-intelligence/` |
| REAL-005 | **Commerce Execution** — Product Media | `backend/src/runtime/product-media/` |
| REAL-007 | **Commerce Execution** — Executive Visual Debate | `backend/src/runtime/executive-visual-debate/` |
| REAL-055 | **Grand King HQ Expansion** — Executive War Room | `backend/src/runtime/executive-war-room/` |

Foundation uses of REAL-003/004/005 inside `reality-integration` remain **documented legacy labels** — formally **deferred**, not deleted — until post-V1 renumbering (e.g. REAL-00xR sub-series).

Existing V1 **runtime**, **contracts**, and **Journey numbering** remain unchanged.

---

## PART B — Problem Statement

### B.1 Duplicate REAL identifiers

| REAL ID | Commerce / runtime canonical (Journey + audits) | Foundation legacy (`reality-integration`) |
|---|---|---|
| REAL-003 | Marketplace Publishing | Human approval framework |
| REAL-004 | Listing Intelligence | Credential governance |
| REAL-005 | Product Media | Reality Readiness Dashboard |

Both lineages exist in code comments, tools, and module contracts. Assigning the same REAL-### to two modules breaks:

- Journey as canonical index (ADR-014)
- Pillow repository intelligence indexing
- Executive Audit cross-referencing
- UX contract API owner columns

### B.2 Blueprint alias drift (REAL-055)

- **Runtime + MCL + Journey:** REAL-055 = **Executive War Room** (`executive-war-room/`)
- **Historical UX blueprint:** REAL-055 incorrectly aliased to `executive-visual-debate`, which is **REAL-007**

This creates UX-012 routing ambiguity (debate vs war room).

### B.3 Governance gap

Prior audits (`JOURNEY_AUDIT.md` §6, §10; `COMBINED_EXECUTIVE_AUDIT_REAL-003-007.md`; `COMBINED_EXECUTIVE_AUDIT_REAL-051-070.md`) **reported** conflicts but did not establish **permanent policy** for:

- Which lineage wins when identifiers collide
- Whether Pillow may invent REAL owners
- Whether future missions may reuse vacant-looking numbers
- How renumbering may occur without breaking V1

Without ADR-044, duplicate REAL IDs will recur in blueprints, chat missions, and enhancement registers.

---

## PART C — Decision

### C.1 Canonical REAL namespace ownership

**Primary REAL series (REAL-001 → REAL-100):** The **commerce/runtime mission series** indexed in `JOURNEY.md` under Commerce Execution, Grand King HQ Expansion, and related REAL phases is the **canonical REAL namespace** for:

- Journey rows
- Master Completion Ledger / program catalog cross-refs
- UX Implementation Contract API owners
- Combined Executive Audits (REAL-### batches)
- Pillow intelligence classifier mission markers

**Foundation REAL sub-series (REAL-001 → REAL-005 within `reality-integration`):** REAL-001 and REAL-002 are unambiguous foundation missions (Reality Integration architecture, connector framework). **REAL-003, REAL-004, REAL-005** in `reality-integration` are **legacy foundation labels** retained in code until post-V1 renumbering. They do **not** override commerce REAL-003/004/005 in Journey or audits.

**Orchestration-only REAL:** REAL-002A, REAL-002B, and similar suffixed missions are extensions of their parent foundation line — not duplicates of commerce REAL numbers.

### C.2 Rules prohibiting duplicate REAL identifiers

1. **One REAL-### → one canonical Journey owner.** No second module may claim the same REAL-### in Journey, MCL, or UX contract without ADR amendment + governed renumbering mission.
2. **No silent reuse.** New modules receive the next unallocated REAL-### from Repository Governance — never a "looks free" number with ⚠️ history.
3. **Foundation vs commerce.** Foundation capabilities inside `reality-integration` shall not adopt commerce REAL-003+ numbers for new work. New foundation missions use REAL-001/002 extensions or a future **REAL-0xxR** sub-series after renumbering mission.
4. **Blueprint discipline.** Blueprints (`EMPIREAI_UX_MASTER_BLUEPRINT.md`, archived visions) that contradict runtime REAL ownership are **historical** — not assignment authority.
5. **Chat is not authority.** Pillow, Cursor, and agents must resolve REAL owners from Journey + runtime paths — never from conversation memory alone (ADR-019, ADR-026).

### C.3 Foundation vs Commerce namespace policy

| Layer | Namespace | Authority | Examples |
|---|---|---|---|
| **Commerce / runtime** | REAL-003 → REAL-100 (Journey series) | Journey · runtime `missionId` in module services · Combined audits | REAL-003 Marketplace Publishing |
| **Foundation / connector** | REAL-001, REAL-002, REAL-002A/B, REAL-00xR (future) | `reality-integration` contract · COS-001 / ADR-013 | REAL-002B Live Commerce |
| **Legacy foundation (deferred)** | REAL-003/004/005 in `reality-integration` only | Code comments · tools · internal models — **not Journey primary title** | Approval framework, credential governance, readiness dashboard |

**Relationship:** COS-001 (ADR-013) places Connector Kernel in `reality-integration` **without duplicating** commerce kernels. Commerce REAL modules **consume** foundation readiness; they do **not share** REAL-003/004/005 identifiers in governance artifacts.

### C.4 Runtime truth precedence over historical blueprints

Per **ADR-019** (repository reality overrides planning):

1. **Runtime module `missionId` + filesystem path** are primary evidence of ownership.
2. **Journey row** reflects implemented runtime (with ⚠️ where legacy conflicts persist).
3. **Blueprints and archived visions** are design history — they do not reassign REAL-### owners when runtime disagrees.
4. **Simulation / readiness reports** may update understanding but do not renumber modules.

**REAL-055 resolution:** Runtime truth = **Executive War Room**. Blueprint mapping REAL-055 → visual debate is **superseded**. **REAL-007** remains sole owner of **Executive Visual Debate**.

### C.5 Blueprint supersession policy

When a blueprint REAL reference conflicts with Journey + runtime:

1. Mark blueprint reference as **superseded** in audit docs (do not delete history).
2. Do **not** change runtime or Journey numbering in the supersession pass.
3. UX contract and enhancement register entries shall cite **canonical REAL** from Journey.
4. Pillow Context Builder shall prefer Journey + `EMPIREAI_REPOSITORY_MASTER_INDEX.md` over blueprint tables.

Superseded until doc-only correction mission: `EMPIREAI_UX_MASTER_BLUEPRINT.md` REAL-055 → executive-visual-debate alias.

### C.6 Journey indexing policy

1. **Journey is the canonical REAL index** (ADR-014). Each REAL-### appears at most once as a primary row label in the commerce/runtime series.
2. **⚠️ icon** marks verified rows with known namespace conflict — not incomplete builds.
3. **Dual-namespace rows** (REAL-003/004/005, REAL-055) retain commerce/runtime titles; audit footnote documents foundation or blueprint legacy.
4. **No Journey renumbering** in doc-only reconciliation — rows are never silently renamed or deleted (BL-A / ADR-014).
5. New REAL missions append rows; structural changes log in `JOURNEY_AUDIT.md`.

### C.7 Pillow intelligence indexing policy

1. Pillow **must read REAL position from Journey** (`pillow/src/intelligence/classifier.ts`, bootstrap, objective criteria) — not invent parallel REAL tables.
2. When Pillow encounters ⚠️ REAL rows, it shall surface **both** audit-documented meanings and state **commerce/runtime as canonical** for mission planning.
3. Pillow mission proposals referencing REAL-003+ shall target **commerce/runtime owners** unless explicitly scoped to `reality-integration` foundation with legacy label disclaimer.
4. Pillow shall **not** assign REAL-### to new capabilities without Grand King approval and Journey row creation.
5. GC-03/GC-05 and other GC rows are **UX governance** labels — not REAL namespace — and must not collide with REAL-### numbering.

### C.8 Executive Audit interpretation policy

1. **Combined Executive Audits** (REAL-### batches) describe **commerce/runtime** modules unless the audit header explicitly scopes `reality-integration` foundation.
2. When audits reference REAL-003→007 pipeline, foundation REAL-003/004/005 meanings are **out of scope** for that audit narrative.
3. **Owner Justification** (ADR-021) for REAL audits shall cite runtime path + Journey row — not blueprint alias.
4. Audits **report** namespace conflicts; **ADR-044** **governs** interpretation — conflicts are not resolved by audit alone.
5. REAL-055 audits describe **Executive War Room** facade over REAL-007 debate inputs — intentional wrapper, not duplicate ownership of REAL-007.

### C.9 Future REAL numbering governance

1. **Allocation authority:** Repository Governance + Grand King approval via Backlog Release (ADR-020 routing, ROUTE 02).
2. **Next number:** Highest allocated REAL in Journey + MCL; no gaps filled retroactively without renumbering mission.
3. **Sub-series:** Foundation renumbering may introduce **REAL-00xR** (or equivalent) — requires dedicated post-V1 mission, Executive Audit, and Journey structural log.
4. **REAL-003/004/005 foundation renumbering:** **Formally deferred** until governed post-V1 numbering mission. Until then, legacy labels remain in `reality-integration` code only.
5. **Suffixed missions (REAL-002A, REAL-002B):** Allowed for phased foundation work; must not collide with integer commerce REAL IDs in Journey primary rows.

### C.10 Migration principles for any future renumbering

A future renumbering mission **must**:

1. Publish Executive Audit with before/after mapping table.
2. Log structural change in `JOURNEY_AUDIT.md` — no silent row removal.
3. Update `EMPIREAI_REPOSITORY_MASTER_INDEX.md` and Pillow classifier in the same release.
4. Prefer **alias period**: old foundation REAL-003 comments deprecated but functional until code migration completes.
5. **Never** break V1 runtime API routes or module contracts in a doc-only pass.
6. Run full validation: backend typecheck, affected validation tests, Journey sync report.
7. Grand King approval required — renumbering is irreversible governance.

**Until that mission executes:** V1 runtime, contracts, and Journey numbers **remain frozen** per this ADR.

---

## PART D — Consequences

### Positive

- Single interpretation authority for REAL-### across Journey, Pillow, UX, and audits.
- Prevents new duplicate REAL assignments in enhancement registers and agent missions.
- Clarifies REAL-055 vs REAL-007 without code changes.
- Aligns with ADR-019 (runtime > blueprint) and ADR-014 (Journey as index).

### Negative / accepted debt

- `reality-integration` code retains REAL-003/004/005 comments until post-V1 renumbering — developers must read ADR-044.
- Journey rows REAL-003/004/005 and REAL-055 keep ⚠️ until foundation renumbering or blueprint doc correction.
- UX blueprint REAL-055 alias remains a known doc drift until optional doc-only fix mission.

### Explicit non-consequences (forbidden by this ADR)

- ❌ Renumbering any module  
- ❌ Modifying runtime services, routes, or contracts  
- ❌ Changing Journey REAL row labels or removing ⚠️ via renumbering  
- ❌ Merging Executive War Room and Executive Visual Debate modules  

---

## PART E — Migration Strategy

### E.1 Current state (V1 freeze)

| Action | Status |
|---|---|
| Document canonical ownership (this ADR) | ✅ ADR-044 |
| Keep Journey commerce titles + ⚠️ footnotes | ✅ unchanged |
| Keep foundation code labels REAL-003/004/005 | ✅ unchanged |
| Keep REAL-055 = Executive War Room in runtime | ✅ unchanged |
| Keep REAL-007 = Executive Visual Debate | ✅ unchanged |

### E.2 Post-V1 phased migration (when authorized)

**Phase 1 — Documentation alignment (low risk)**  
- Correct `EMPIREAI_UX_MASTER_BLUEPRINT.md` REAL-055 alias → Executive War Room (doc-only).  
- Update UX enhancement register cross-refs to REAL-007 for visual debate, REAL-055 for war room.

**Phase 2 — Foundation renumbering (governed mission)**  
- Assign REAL-00xR (or approved sub-series) to approval framework, credential governance, readiness dashboard.  
- Deprecate REAL-003/004/005 in `reality-integration` comments over alias period.  
- Remove ⚠️ from Journey REAL-003/004/005 rows after code + Journey sync.

**Phase 3 — Validation**  
- Executive Audit · Journey sync · Pillow classifier update · typecheck + tests.

**No phase may begin without Grand King approval and Backlog Release routing (ADR-020 ROUTE 02).**

---

## PART F — Repository Governance Rules

1. **Before any mission cites REAL-###:** verify owner in `JOURNEY.md` + this ADR.  
2. **Before adding Journey REAL row:** confirm number unused; log in `JOURNEY_AUDIT.md`.  
3. **Before Pillow publishes mission with REAL ID:** cross-check Journey + Master Index.  
4. **On namespace conflict discovery:** report in `JOURNEY_AUDIT.md` §10 — do not silently fix by renumbering.  
5. **Combined audits** must reference ADR-044 when interpreting ⚠️ REAL rows.  
6. **Enhancement register** entries (`docs/governance/UX_ENHANCEMENT_REGISTER.md`) shall use canonical REAL from Journey.  
7. **Master Index** (`EMPIREAI_REPOSITORY_MASTER_INDEX.md`) §8.2 conflict table remains until Phase 2 completes — then update, don't delete history.

---

## PART G — Future Numbering Policy

| Rule | Policy |
|---|---|
| New commerce module | Next sequential REAL-### in Journey series; Executive Audit required |
| New foundation module | REAL-001/002 line or post-renumber REAL-00xR — never commerce REAL-003+ |
| Extension missions | Suffix allowed (REAL-002B); document parent in Journey audit |
| Retired modules | Journey row annotated, never deleted (ADR-014) |
| REAL-003/004/005 foundation | **Deferred** — no reassignment until post-V1 numbering mission |
| REAL-055 | **Executive War Room** — permanent unless Grand King renames module |
| REAL-007 | **Executive Visual Debate** — permanent; not merged into REAL-055 |
| Agent-invented REAL IDs | **Forbidden** without Journey row + Grand King approval |

---

## Cross-references

| Artifact | Role |
|---|---|
| ADR-013 | COS-001 — Connector Kernel in `reality-integration` without commerce duplication |
| ADR-014 | Journey as canonical living roadmap |
| ADR-019 | Repository reality overrides planning |
| ADR-020 | Backlog routing (ROUTE 02) — **separate from this policy** |
| ADR-021 | Executive Audit owner justification |
| ADR-022 | Closed BL immutable — ADR-020 not repurposed |
| `JOURNEY_AUDIT.md` §6, §10 | Conflict registry |
| `COMBINED_EXECUTIVE_AUDIT_REAL-003-007.md` | Commerce REAL-003→007 canonical audit |
| `COMBINED_EXECUTIVE_AUDIT_REAL-051-070.md` | REAL-055 Executive War Room audit |
| `EMPIREAI_REPOSITORY_MASTER_INDEX.md` §8.2 | REAL namespace conflict table |

---

*Documentation only. No runtime modifications authorized by this ADR.*
