# 06 — Document Navigation

**Purpose:** Define how agents and humans navigate the documentation system and cite documents correctly.

---

## 1. Navigation Root

**Single entry point:** `EMPIREAI_REPOSITORY_MASTER_INDEX.md`

**Secondary live index:** `JOURNEY.md` (operational status — not law)

**Rule:** Master Index = catalog; Journey = "what changed recently."

---

## 2. Agent Navigation Paths

### Path A — New agent onboarding

```
1. EMPIREAI_REPOSITORY_MASTER_INDEX.md
2. docs/governance/EMPIREAI_CONSTITUTION_HIERARCHY.md (when authored)
3. EMPIREAI_CORE_CONSTITUTION_CTD.md
4. EMPIREAI_SOUL.md
5. EMPIREAI_VISION.md (when authored)
6. JOURNEY.md + EMPIREAI_STATUS.md
7. docs/ARCHITECTURE.md (operational map)
```

### Path B — Legal / governance question

```
1. CTD
2. Relevant domain doctrine (GVD, ACD, UID, CBD, BL-C)
3. Domain constitution (Engineering, Pillow, EI volume)
4. EMPIREAI_DECISIONS.md for ADR
```

### Path C — Architecture question

```
1. docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md
2. Domain architecture (Pillow, Eye, cockpit specs)
3. docs/ARCHITECTURE.md
4. EMPIREAI_STATUS.md for current wiring
```

### Path D — Production / deployment question

```
1. docs/governance/EMPIREAI_PRODUCTION_TRUTH.md (when authored)
2. deployment/MANAGED_DEPLOYMENT.md
3. EMPIREAI_STATUS.md
4. Env templates in deployment/
```

### Path E — Pillow behaviour question

```
1. EMPIREAI_PILLOW_CONSTITUTION.md
2. EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md
3. EMPIREAI_PILLOW_MEMORY_DOCTRINE.md
4. PILLOW_ARCHITECTURE_CONTRACT.md
5. Production Truth for Production Mode limits
```

### Path F — Audit / certification evidence

```
1. docs/governance/EXECUTIVE_AUDIT_INDEX.md
2. Specific COMBINED_EXECUTIVE_AUDIT_*.md
3. Matching artifacts/*-executive-audit.md
4. Evidence JSON if applicable
```

### Path G — Constitution Construction (meta)

```
1. docs/audits/canonical-documentation/00_EXECUTIVE_SUMMARY.md
2. docs/audits/hierarchy-normalization/01_CANONICAL_HIERARCHY.md
3. docs/audits/canonical-architecture/01_CANONICAL_ARCHITECTURE.md
4. docs/audits/full-empireai-audit/00_EXECUTIVE_SUMMARY.md
```

---

## 3. Navigation Graph (Simplified)

```
                    ┌─────────────────────────┐
                    │  MASTER INDEX (START)   │
                    └───────────┬─────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
   ┌───────────┐         ┌───────────┐         ┌───────────┐
   │ Tier 2    │         │ Tier 3    │         │ Tier 4    │
   │ Vision    │         │ CTD apex  │         │ Roadmaps  │
   │ Soul      │         │ Doctrines │         │ Bible     │
   └─────┬─────┘         │ Constitutions        │ Journey   │
         │               │ Architecture│       │ ADRs      │
         │               └─────┬─────┘         └─────┬─────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
                    ┌─────────────────────────┐
                    │ Tier 5 Operational      │
                    │ ARCHITECTURE.md         │
                    │ MANAGED_DEPLOYMENT      │
                    │ PRODUCTION_TRUTH        │
                    │ STATUS                  │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │ Evidence / Historical   │
                    │ (leaf nodes — no back)  │
                    └─────────────────────────┘
```

---

## 4. Citation Rules

### 4.1 Mandatory citation format

When citing EmpireAI law in documents or agent output:

```markdown
Per [Document Title](path) (Tier N, CANONICAL):
```

When citing operational truth:

```markdown
Per [Document Title](path) (OPERATIONAL — current as of DATE):
```

When citing evidence:

```markdown
Evidence: [Audit Title](path) (EVIDENCE — point-in-time, not current law)
```

### 4.2 Prohibited citations

| Do NOT cite as current law | Why |
|----------------------------|-----|
| `docs/SYSTEM_ARCHITECTURE.md` | HISTORICAL — pre-Pillow |
| `artifacts/empireai-master-build-bible.md` | HISTORICAL — superseded |
| `COMBINED_EXECUTIVE_AUDIT_*` as law | EVIDENCE only |
| `EMPIREAI_ARCHITECTURE.md` as normative | OPERATIONAL MEMORY |
| Audit packs (`docs/audits/*`) as ratified law | EVIDENCE until Constitution Lock |

### 4.3 Qualified names required

Always qualify:

- "Constitution" → Commercial (CTD) / Engineering / Pillow / BL-C / EI#
- "Architecture" → Canonical / Operational / Historical
- "Bible" → V1 Hierarchy Bible
- "Roadmap" → Empire / Pillow / EI / Cockpit
- "Frontend" → Founder Shell (`frontend/`) vs Cockpit (`empireai-web/`) — until ADR-CON-001

---

## 5. Master Index Required Columns (RECOMMENDED)

Every row in Master Index should include:

| Column | Example |
|--------|---------|
| Path | `EMPIREAI_CORE_CONSTITUTION_CTD.md` |
| Tier | 3 |
| Classification | CANONICAL |
| Owner | Grand King |
| Maintainer | Chief Architect |
| Authority | A1 |
| Supersedes | — |
| Superseded by | — |

**CURRENT:** Partial — path catalog exists; classification columns incomplete.  
**FUTURE:** Automated validation script on index drift.

---

## 6. Cross-Reference Conventions

| From | Should link to |
|------|----------------|
| Any Tier 3 law doc | CTD (supremacy statement) |
| Engineering Constitution | CTD deferral clause |
| Pillow docs | Pillow Constitution |
| Cockpit specs | UID doctrine |
| Roadmaps | Relevant constitution + Vision (when exists) |
| Operational architecture | Canonical Architecture (normative pointer) |
| Journey entries | Changed canonical/operational doc paths |

---

## 7. Domain Quick Reference

| I need… | Go to… |
|---------|--------|
| Why we exist | EMPIREAI_VISION.md (future) |
| Who we are | EMPIREAI_SOUL.md |
| Supreme law | EMPIREAI_CORE_CONSTITUTION_CTD.md |
| Which constitution to read | EMPIREAI_CONSTITUTION_HIERARCHY.md (future) |
| How to build Brain | EMPIREAI_CONSTITUTION.md + docs/ARCHITECTURE.md |
| Cockpit screens | docs/architecture/cockpit/ |
| What Pillow may do | EMPIREAI_PILLOW_CONSTITUTION.md |
| EI roles | docs/executive-intelligence/EI_INDEX.md |
| V1 structure | artifacts/empireai-version-1-build-hierarchy-bible.md |
| What's live now | EMPIREAI_STATUS.md |
| How to deploy | deployment/MANAGED_DEPLOYMENT.md |
| Past audit proof | docs/governance/EXECUTIVE_AUDIT_INDEX.md |
| Everything | EMPIREAI_REPOSITORY_MASTER_INDEX.md |

---

## 8. Navigation Anti-Patterns

| Anti-pattern | Correct path |
|--------------|--------------|
| Start with SYSTEM_ARCHITECTURE | Start with Canonical Architecture |
| Read random COMBINED audit for law | Read CTD + doctrine |
| Assume frontend/ is only UI | Check STATUS + pending ADR |
| Use "REAL" as architecture name | Say "Runtime modules"; REAL-### = mission ID |
| Search repo without Master Index | Master Index first |
| Treat docs/README "scaffold" literally | Ignore — docs/ has 81 substantive files |

---

## 9. Navigation Evolution (FUTURE)

| Phase | Change |
|-------|--------|
| Constitution Construction | Add hierarchy one-pager to all agent paths |
| Constitution Lock | Ratify navigation graph as Schedule B |
| V2 | Optional docs site generated from classified Master Index |

---

## 10. This Pack's Navigation Role

Files in `docs/audits/canonical-documentation/` are **EVIDENCE** for Constitution Construction. Navigate here for **documentation system design** — not for runtime law.
