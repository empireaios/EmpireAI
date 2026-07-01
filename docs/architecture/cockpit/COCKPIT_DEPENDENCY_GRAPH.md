# Cockpit Dependency Graph

**Mission:** REAL-080  
**Version:** 1.0  

---

## 1. Critical Path (Must Build First)

```mermaid
flowchart TD
    A[REAL-081 Route scaffold] --> B[REAL-082 Auth validation]
    B --> C[REAL-083 Nav registry]
    C --> D[REAL-084 CockpitShell]
    D --> E[REAL-088 Widget/KPI lib]
    E --> F[REAL-085 Executive Home]
    E --> G[REAL-086 Command Centre]
    E --> H[REAL-087 Mission Centre]
    F --> I[P1 Departments]
    G --> I
    H --> I
    I --> J[P2 Overlays + Governance]
    J --> K[P3 Consolidation]
    K --> L[P3 Production placeholders]
```

**Critical path length:** REAL-081 → REAL-088 → REAL-085/086/087 → first P1 department → REAL-124 → REAL-127 (live data).

---

## 2. Full Dependency Graph

```mermaid
flowchart TB
    subgraph P0_Foundation["P0 — Foundation"]
        R081[REAL-081 Scaffold]
        R082[REAL-082 Auth]
        R083[REAL-083 Nav]
        R084[REAL-084 Shell]
        R088[REAL-088 Widgets]
        R085[REAL-085 Home]
        R086[REAL-086 Command]
        R087[REAL-087 Missions]
    end

    subgraph P1_Depts["P1 — Departments"]
        R089[REAL-089 Commerce shell]
        R094[REAL-094 Intelligence shell]
        R098[REAL-098 Operations shell]
        R101[REAL-101 Finance shell]
        R105[REAL-105 Infrastructure shell]
    end

    subgraph P1_Detail["P1 — Department screens"]
        R090[REAL-090 Store]
        R095[REAL-095 Intel products]
        R099[REAL-099 Orders]
        R102[REAL-102 Profit]
        R106[REAL-106 Integrations]
    end

    subgraph P2["P2 — Depth"]
        R109[REAL-109 Governance]
        R114[REAL-114 Workforce]
        R117[REAL-117 Development]
        R121[REAL-121 Notifications]
    end

    subgraph P3["P3 — Consolidation"]
        R124[REAL-124 Redirects]
        R127[REAL-127 Live ledger]
        R133[REAL-133 Live connectors]
    end

    subgraph Backend["Backend blockers — parallel track"]
        B082[BRAIN_API_URL env]
        B127[Postgres migration]
        B129[Remove sandbox mocks]
        B133[Connector live mode]
    end

    R081 --> R082 --> R083 --> R084
    R084 --> R088
    R088 --> R085 & R086 & R087
    R084 --> R089 & R094 & R098 & R101 & R105

    R089 --> R090
    R094 --> R095
    R098 --> R099
    R101 --> R102
    R105 --> R106

    R085 --> R109 & R114 & R117
    R084 --> R121

    R090 & R099 & R102 & R106 --> R124
    R124 --> R127

    B082 -.-> R082
    B127 -.-> R127
    B129 -.-> R099
    B133 -.-> R106

    R127 --> R133
```

---

## 3. Parallel Work Tracks

Three tracks can run concurrently after REAL-084 (CockpitShell) lands:

| Track | Owner focus | Missions | Can start after |
|-------|-------------|----------|-----------------|
| **Track A — Core UX** | Cockpit command surfaces | REAL-085, 086, 087, 088 | REAL-084 |
| **Track B — Commerce path** | Commerce + Ops + Finance | REAL-089–104 | REAL-088 |
| **Track C — Intel + Infra** | Intelligence + Infrastructure | REAL-094–097, 105–108 | REAL-088 |
| **Track D — Backend prod** | Placeholders, connectors, DB | REAL-127–133 (backend) | Independent |
| **Track E — Governance depth** | P2 departments | REAL-109–120 | REAL-085 |
| **Track F — Overlays** | Global chrome | REAL-121–123 | REAL-087 |

```mermaid
gantt
    title Cockpit Parallel Tracks (after REAL-084)
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Track A
    Home Command Missions     :a1, 2026-07-01, 14d

    section Track B
    Commerce Ops Finance      :b1, 2026-07-08, 28d

    section Track C
    Intelligence Infrastructure :c1, 2026-07-08, 21d

    section Track D
    Backend prod placeholders   :d1, 2026-07-01, 35d

    section Track E
    Governance Workforce Dev    :e1, 2026-07-22, 21d
```

---

## 4. Blocker Registry

| Blocker ID | Description | Blocks | Owner | Resolution |
|------------|-------------|--------|-------|------------|
| BLK-001 | `BRAIN_API_URL` not set on Vercel | All Cockpit data | DevOps | Set env + redeploy |
| BLK-002 | No server-side session validation | Production auth | REAL-082 | Middleware validates `/cockpit/*` |
| BLK-003 | No Mission aggregator API | Mission Centre | REAL-087 | Client-side merge initially; API later |
| BLK-004 | Seed data in module-views | Live KPI badges | REAL-127 | Ledger-backed views |
| BLK-005 | Sandbox fulfillment only | Operations go-live | REAL-129, 130 | live-cj-fulfillment path |
| BLK-006 | Mock connectors default | Integrations grid truth | REAL-133 | LIVE_COMMERCE mode |
| BLK-007 | Dual frontend routing confusion | User navigation | REAL-124 | Redirects |
| BLK-008 | Orphaned store-builder components | Store panel completeness | REAL-090 | Mount components |
| BLK-009 | sql.js non-persistent DB | Revenue durability | REAL-132 | Postgres |
| BLK-010 | No shared component package | Duplication during port | REAL-125 (optional) | Extract `cockpit/ui` |

---

## 5. Dependency Matrix

Rows depend on columns (✓ = hard dependency).

|  | R081 | R082 | R083 | R084 | R088 | R085 | R086 | R087 | P1 | P2 | P3 |
|--|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| R082 | ✓ | | | | | | | | | | |
| R083 | ✓ | ✓ | | | | | | | | | |
| R084 | ✓ | ✓ | ✓ | | | | | | | | |
| R088 | | | ✓ | ✓ | | | | | | | |
| R085 | | ✓ | ✓ | ✓ | ✓ | | | | | | |
| R086 | | ✓ | ✓ | ✓ | ✓ | | | | | | |
| R087 | | ✓ | ✓ | ✓ | ✓ | | | | | | |
| P1 depts | | ✓ | ✓ | ✓ | ✓ | | | | | | |
| P2 depts | | ✓ | ✓ | ✓ | ✓ | ✓ | | | ✓ | | |
| R124 | | | ✓ | ✓ | | | | | ✓ | ✓ | |
| R127 | | | | | | | | | ✓ | | ✓ |

---

## 6. External Dependencies

| External | Required for | Phase |
|----------|--------------|-------|
| Railway Brain API | All Cockpit screens | P0 |
| Vercel empireai-web deploy | Cockpit host | P0 |
| Redis sessions | Auth stability | P0 |
| Stripe (test → live) | Finance live KPIs | P3 |
| CJ Dropshipping API | Operations live | P3 |
| Meta Ads OAuth | Commerce ads live | P3 |
| Postgres | Production persistence | P3 |

---

## 7. Risk Dependencies

```mermaid
flowchart LR
    subgraph High["High risk if delayed"]
        H1[Mission aggregator]
        H2[Store orphan mount]
        H3[Dual frontend merge]
    end
    subgraph Medium["Medium risk"]
        M1[Settings save]
        M2[Admin real metrics]
        M3[ESIS port]
    end
    subgraph Low["Low risk — deferrable"]
        L1[Workforce audit viewer]
        L2[Reports page]
        L3[Expansion page]
    end
```

---

*REAL-080 — Cockpit Dependency Graph v1.0*
