# 04 — Document Dependencies

**Purpose:** Map how documents depend on, cite, and consume each other.

---

## 1. Document Dependency Graph

```mermaid
flowchart TD
    subgraph Identity
        VISION[EMPIREAI_VISION - TO AUTHOR]
        SOUL[EMPIREAI_SOUL]
    end

    subgraph Apex
        CTD[EMPIREAI_CORE_CONSTITUTION_CTD]
    end

    subgraph Law
        ENG[Engineering Constitution]
        GVD[GVD]
        ACD[ACD]
        UID[UID]
        CBD[CBD]
        BLC[BL-C]
        PC[Pillow Constitution]
        PEI[Pillow EI Constitution]
        EI[EI0-EI10]
        CA[Canonical Architecture]
    end

    subgraph Programme
        ROAD[EMPIREAI_ROADMAP]
        BIBLE[V1 Hierarchy Bible]
        JOURNEY[JOURNEY]
        ADR[EMPIREAI_DECISIONS]
    end

    subgraph Operational
        STATUS[EMPIREAI_STATUS]
        OPSARCH[docs/ARCHITECTURE]
        DEPLOY[MANAGED_DEPLOYMENT]
        PROD[PRODUCTION_TRUTH - TO AUTHOR]
    end

    VISION --> SOUL
    VISION --> CTD
    SOUL --> CTD
    CTD --> ENG
    CTD --> GVD
    CTD --> CBD
    CTD --> PC
    CTD --> EI
    GVD --> ENG
    ACD --> CA
    ACD --> ENG
    UID --> CA
    CBD --> ROAD
    PC --> PEI
    PC --> CA
    CA --> OPSARCH
    CA --> BIBLE
    ROAD --> BIBLE
    ROAD --> JOURNEY
    BIBLE --> JOURNEY
    ADR --> CA
    ADR --> PROD
    DEPLOY --> PROD
    STATUS --> JOURNEY
    OPSARCH --> STATUS
    PROD --> DEPLOY
```

---

## 2. Document Authority Graph

```mermaid
flowchart BT
    EVID[Evidence A6]
    HIST[Historical A7]
    OPS[Operational A5]
    PROG[Programme A4]
    NORM[Normative Spec A3]
    DOM[Domain Law A2]
    APEX[Apex CTD A1]
    GK[Grand King A0]

    EVID -.->|proves only| PROG
    HIST -.->|superseded by| NORM
    OPS --> PROG
    PROG --> NORM
    PROG --> DOM
    NORM --> DOM
    DOM --> APEX
    APEX --> GK
    GK -->|sovereign override| APEX
```

---

## 3. Document Navigation Graph

```mermaid
flowchart LR
    START[EMPIREAI_REPOSITORY_MASTER_INDEX]
    START --> T2[Tier 2 Identity]
    START --> T3[Tier 3 Law]
    START --> T4[Tier 4 Programme]
    START --> T5[Tier 5 Systems]
    START --> EV[Evidence Archive]

    T2 --> VISION[VISION]
    T2 --> SOUL[SOUL]

    T3 --> HIER[Constitution Hierarchy - TO AUTHOR]
    HIER --> CTD[CTD]
    CTD --> DOCS[Domain doctrines]

    T4 --> JOURNEY[JOURNEY]
    JOURNEY --> STATUS[STATUS]
    T4 --> ADR[DECISIONS]

    T5 --> OPSARCH[ARCHITECTURE.md]
    T5 --> PROD[Production Truth]

    EV --> AUDITIDX[EXECUTIVE_AUDIT_INDEX]
```

**Agent entry rule:** Always START → classify tier → read apex law if legal question.

---

## 4. Document Ownership Graph

See `02_DOCUMENT_AUTHORITY.md` §3 for full matrix. Summary edges:

- Grand King → CTD, Vision, Soul sign-off
- Chief Architect → Engineering Constitution, Canonical Architecture, Roadmaps, ADRs, Master Index
- Pillow COI → Pillow Constitution stack, Pillow roadmaps
- EI programme → EI library
- DevOps + Architect → Production docs
- Governance archive → Evidence (immutable)

---

## 5. Key Dependency Chains

### Chain A — Constitution Construction

```
Master Index → Constitution Hierarchy (future) → CTD → all Tier 3 law → V1 Bible → Journey
```

### Chain B — Production question

```
Production Truth (future) → MANAGED_DEPLOYMENT → EMPIREAI_STATUS → /health/live evidence
```

### Chain C — Architecture question

```
Canonical Architecture → ACD → Pillow Architecture Contract → docs/ARCHITECTURE.md → code
```

### Chain D — Pillow behaviour

```
Pillow Constitution → Pillow EI Constitution → Memory Doctrine → Pillow host code
```

### Chain E — Audit citation

```
EXECUTIVE_AUDIT_INDEX → COMBINED_EXECUTIVE_AUDIT_* → artifact audit → evidence JSON
```

---

## 6. Consumer Matrix (Who Reads What)

| Consumer | Primary docs | Secondary docs |
|----------|--------------|----------------|
| Grand King | CTD, Vision, Soul, Journey, STATUS | Cockpit specs, certification checklists |
| Chief Architect | Full Tier 3–4 stack | All audit packs |
| Cursor / Builder agents | Engineering Constitution, Cursor standards, STATUS, Journey | Operational architecture |
| Pillow runtime | Pillow Constitution, EI library, Production Truth | Pillow Architecture |
| Cockpit developers | UID, cockpit specs, Cockpit roadmap | docs/ARCHITECTURE.md |
| DevOps | MANAGED_DEPLOYMENT, Production Truth, env templates | EMPIREAI_STATUS |
| External auditors | EXECUTIVE_AUDIT_INDEX, combined audits, evidence JSON | CTD, certification mode |
| New repo agents | Master Index → Constitution Hierarchy → CTD | This audit pack |

---

## 7. Circular Dependency Risks

| Cycle | Risk | Resolution |
|-------|------|------------|
| Journey ↔ STATUS | Both update ops state | Journey = index; STATUS = snapshot — STATUS feeds Journey |
| Roadmap ↔ Bible | Overlap in programme scope | Roadmap = sequence; Bible = structure — precedence in `03` |
| Canonical Architecture ↔ REAL-078 missions | Missions reference architecture that references missions | REAL-### as mission IDs only; architecture cites capabilities not mission list |
| Master Index ↔ all docs | Index must list everything | Index is AN authority — never normative |

**No blocking circular dependencies** identified that prevent Constitution Construction.

---

## 8. External Dependencies (Non-Repo)

| Dependency | Document anchor | Notes |
|------------|-----------------|-------|
| Railway (Brain) | MANAGED_DEPLOYMENT | Production URL evidence |
| Vercel (Cockpit/Frontend) | MANAGED_DEPLOYMENT, vercel configs | Dual deploy path — ADR pending |
| Upstash Redis | Production Truth (future) | Session durability |
| SQLite volume | Canonical Architecture REAL-132 | FUTURE Postgres migration |
| OpenAI / LLM providers | Pillow Architecture, Brain config | Operational |

---

## 9. Audit Pack Dependencies

This documentation pack **depends on**:

| Input | Path |
|-------|------|
| Full All-Angle Audit | `docs/audits/full-empireai-audit/` |
| Hierarchy Normalization | `docs/audits/hierarchy-normalization/` |
| Canonical Architecture | `docs/audits/canonical-architecture/` |

**Consumed by (FUTURE):** Constitution Construction ceremony, Master Index refresh, ADR backlog CON-001–CON-019.

---

## 10. Dependency Health

| Metric | Assessment |
|--------|------------|
| Apex dependencies clear | **Yes** — CTD is root |
| Missing nodes | **4** — Vision, hierarchy one-pager, production truth, Tier 6 deferral |
| Broken edges (stale index) | **2** — audit index, docs/README |
| Evidence properly leaf-node | **Yes** — evidence does not depend on mutable law |
