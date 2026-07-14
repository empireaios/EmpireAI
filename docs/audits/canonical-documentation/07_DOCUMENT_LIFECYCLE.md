# 07 — Document Lifecycle

**Purpose:** Define how documents are created, amended, superseded, and archived.

---

## 1. Lifecycle States

```
DRAFT → REVIEW → CANONICAL (ratified)
                    ↓ amendment
                 CANONICAL (revised)
                    ↓ supersession
                 HISTORICAL (frozen)
                    
OPERATIONAL → update on release → OPERATIONAL (revised)
                    ↓ obsolete
                 HISTORICAL

EVIDENCE → immutable (append-only corpus — new files only)
STUB → REPLACE or ARCHIVE
```

---

## 2. Creation Rules by Classification

| Classification | Who may create | Approval | Registration |
|----------------|----------------|----------|--------------|
| CANONICAL (Tier 2 Identity) | Chief Architect drafts | Grand King sign-off | Master Index + Journey |
| CANONICAL (Tier 3 Law) | Chief Architect / domain owner | Grand King + GVD process | Master Index + BL-C if amendment |
| CANONICAL (Tier 4 Programme) | Domain owner | Chief Architect | Master Index + Journey |
| OPERATIONAL | Maintainer | Mission PR / DevOps | Master Index optional |
| EVIDENCE | Audit author | Grand King for combined audits | EXECUTIVE_AUDIT_INDEX |
| ADR | Chief Architect | Grand King for CON-* ADRs | EMPIREAI_DECISIONS.md |

---

## 3. Amendment Rules

### 3.1 CANONICAL law (Tier 3)

**CURRENT:** Amendments via mission commits with executive audit sign-off (historical pattern).

**RECOMMENDED:**
1. Draft amendment in branch
2. BL-C register entry if enhancement-related
3. Combined executive audit or Grand King approval for Tier 3 changes
4. Update Master Index version note
5. Journey entry documenting change

**FUTURE:** Formal amendment articles in Constitution Lock framework.

### 3.2 OPERATIONAL docs

- Update with each release or production change
- `EMPIREAI_STATUS.md` updated after significant missions
- `JOURNEY.md` updated for structural changes
- No Grand King required unless production policy change

### 3.3 EVIDENCE

- **Never amend body** of existing audit
- Publish new audit file with new date/ID
- Update EXECUTIVE_AUDIT_INDEX only (add row)

### 3.4 HISTORICAL

- **No amendments**
- May add archive banner at top (documentation-only phase)
- Master Index marks superseded-by pointer

---

## 4. Supersession Rules

| When | Action | Label old doc |
|------|--------|---------------|
| New architecture normative version | Supersede prior REAL-### architecture doc | HISTORICAL or versioned CANONICAL |
| Bible V2 authored | Supersede V1 bible | V1 → HISTORICAL at Lock |
| Integration plan complete | Supersede plan with master plan | HISTORICAL (done: PILLOW_RUNTIME_INTEGRATION_PLAN) |
| Production truth consolidated | MANAGED_DEPLOYMENT remains; truth doc becomes authority | MANAGED_DEPLOYMENT stays OPERATIONAL companion |
| Vision authored | MARKETPLACE_OS_VISION remains as input | OPERATIONAL input — not superseded, merged conceptually |

---

## 5. Archive Rules

**Archive ≠ delete.** All HISTORICAL docs remain on disk.

| Step | Action |
|------|--------|
| 1 | Classify HISTORICAL in Master Index |
| 2 | Add header: `Classification: HISTORICAL | Superseded by: [path]` |
| 3 | Remove from agent navigation paths (§06) |
| 4 | Retain for evidence archaeology |

**CURRENT candidates for archive labeling (not deletion):**
- `docs/SYSTEM_ARCHITECTURE.md` cluster (7 files)
- `artifacts/empireai-master-build-bible.md`
- `PILLOW_RUNTIME_INTEGRATION_PLAN.md`

---

## 6. Document Lifecycle by Domain

| Domain | Create trigger | Update frequency | Retire trigger |
|--------|------------------|------------------|----------------|
| Vision | Constitution Construction | Rare (major pivot) | Never in V1 |
| Soul | Identity ceremony | Annual or pivot | Never in V1 |
| CTD | Ratified at V1 lock | Amendment only | V2 constitution (future) |
| Doctrines | Domain programme | Per domain milestone | Superseded doctrine version |
| Architecture normative | REAL architecture missions | Per REAL batch | New REAL supersedes |
| Roadmaps | Programme planning | Quarterly | New roadmap version |
| Bible | Major version boundary | V1 lock | V2 bible |
| Journey | Continuous | Per mission | Never |
| STATUS | Continuous | Per release | Never |
| Combined audits | Mission completion | Never (immutable) | Never |
| Production docs | Deploy change | Per deploy policy change | Never in V1 |

---

## 7. Versioning Conventions (ECNS-1)

| Doc type | Version pattern |
|----------|-----------------|
| CTD articles | CTD-### |
| REAL architecture | REAL-### |
| ADRs | ADR-### or ADR-CON-### |
| EI library | EI0–EI10 |
| Combined audits | Dated filename |
| Programme gates | G2–G8, B6 |

**Rule:** Mission IDs are traceability — not version numbers for law docs.

---

## 8. Lifecycle for Audit Packs

| Pack | Created | Lifecycle |
|------|---------|-----------|
| full-empireai-audit | 2026-07-04 | EVIDENCE — immutable |
| hierarchy-normalization | 2026-07-04 | EVIDENCE — immutable |
| canonical-architecture | 2026-07-04 | EVIDENCE — immutable |
| canonical-documentation | 2026-07-04 | EVIDENCE — immutable |

Future audits add new folders — do not overwrite these packs.

---

## 9. Constitution Lock Lifecycle (FUTURE)

```
1. Complete P0 gaps (Vision, hierarchy, production truth, ADR-CON-001)
2. Grand King reviews ECDS-1 + architecture packs
3. Ratify tier model + precedence as Schedule A/B
4. Mark V1 canonical set as LOCKED
5. Amendments require BL-C + explicit amendment article
6. V2 documents begin as DRAFT tier — not competing with locked V1
```

---

## 10. Lifecycle Ownership

| Stage | Responsible party |
|-------|-------------------|
| Draft | Chief Architect / domain maintainer |
| Review | Grand King + domain owner |
| Ratify | Grand King |
| Index | Index maintainer |
| Archive label | Index maintainer + Architect |
| Evidence publish | Audit author + governance |

---

## 11. CURRENT vs RECOMMENDED vs FUTURE

| Aspect | CURRENT | RECOMMENDED | FUTURE |
|--------|---------|-------------|--------|
| Amendment process | Mission + audit pattern | Formalize in hierarchy one-pager | Constitution Lock articles |
| Historical labeling | Partial | Label 9 docs HISTORICAL in index | historical/ subfolder (optional) |
| Evidence immutability | Observed in practice | Encode in GVD citation rules | CI check on evidence edits |
| Production truth lifecycle | Scattered | Single doc with semver | Auto-sync from deploy pipeline |
