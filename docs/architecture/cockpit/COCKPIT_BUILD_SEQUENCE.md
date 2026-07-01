# Cockpit Build Sequence

**Mission:** REAL-080  
**Version:** 1.0  

---

## 1. Sprint Model

- **Sprint length:** 1 week  
- **Team assumption:** 1–2 frontend engineers + 1 backend engineer (part-time on blockers)  
- **Definition of Done:** Route live on Vercel preview; typecheck + build pass; ESIS nav entry; data mode badge where applicable  

---

## 2. Master Build Sequence

### Sprint 0 — Prerequisites (ops, not REAL code)

| # | Task | Owner | Output |
|---|------|-------|--------|
| 0.1 | Set `BRAIN_API_URL` on Vercel | DevOps | Auth works on preview |
| 0.2 | Confirm Redis on Railway | DevOps | Sessions stable |
| 0.3 | Review REAL-079 wireframes with Grand King | Product | Sign-off on Home/Command/Missions |

---

### Sprint 1 — REAL-081, 082, 083 (P0 scaffold)

| Order | REAL | Deliverable | Complexity |
|-------|------|-------------|------------|
| 1 | REAL-081 | `app/(cockpit)/` route group; folder structure (see Migration Plan) | S |
| 2 | REAL-082 | Middleware validates session on `/cockpit/*`; redirect to login | M |
| 3 | REAL-083 | `lib/cockpit/navigation.ts` canonical tree; types | S |

**Exit:** Navigate to `/cockpit` (empty shell page) authenticated.

---

### Sprint 2 — REAL-084, 088 (P0 shell + widgets)

| Order | REAL | Deliverable | Complexity |
|-------|------|-------------|------------|
| 4 | REAL-084 | CockpitShell: sidebar, topbar, content area, mobile nav | L |
| 5 | REAL-088 | `CockpitKpiStrip`, `DataModeBadge`, widget registry types | M |

**Exit:** Shell renders with sidebar matching canonical tree; placeholder content area.

**Parallel:** Backend engineer starts REAL-127 spike (ledger read path).

---

### Sprint 3 — REAL-085, 086, 087 (P0 command core)

| Order | REAL | Deliverable | Complexity |
|-------|------|-------------|------------|
| 6 | REAL-085 | Executive Home (SCR-001) | L |
| 7 | REAL-086 | Command Centre merge (SCR-010) | L |
| 8 | REAL-087 | Mission Centre + client-side mission aggregator (SCR-020) | L |

**Exit:** Grand King morning workflow: Home → Command → Missions → approve one decision.

---

### Sprint 4 — REAL-105, 106 + REAL-094, 095 (P1 Infra + Intel start)

| Order | REAL | Deliverable | Complexity |
|-------|------|-------------|------------|
| 9 | REAL-105 | Infrastructure department layout + tabs | S |
| 10 | REAL-106 | Integrations grid (port IntegrationsHubPage) | M |
| 11 | REAL-094 | Intelligence department layout + tabs | S |
| 12 | REAL-095 | Products + Suppliers (merge empireai-web modules) | M |

**Parallel track B starts Sprint 4.**

---

### Sprint 5 — REAL-089, 090, 098, 099 (P1 Commerce + Ops)

| Order | REAL | Deliverable | Complexity |
|-------|------|-------------|------------|
| 13 | REAL-089 | Commerce department layout + tabs | S |
| 14 | REAL-090 | Store panel + mount store-builder orphans | L |
| 15 | REAL-098 | Operations department layout | S |
| 16 | REAL-099 | Orders + FulfillmentReadinessPanel | M |

---

### Sprint 6 — REAL-101, 102, 091, 092 (P1 Finance + Commerce depth)

| Order | REAL | Deliverable | Complexity |
|-------|------|-------------|------------|
| 17 | REAL-101 | Finance department layout | S |
| 18 | REAL-102 | Profit tab (port ProfitPage) | M |
| 19 | REAL-091 | Marketing + Ads tabs; wire actions where backend exists | M |
| 20 | REAL-092 | Launch tab (port LaunchCenterPage) | M |

---

### Sprint 7 — REAL-096, 097, 100, 103, 107 (P1 remaining tabs)

| Order | REAL | Deliverable | Complexity |
|-------|------|-------------|------------|
| 21 | REAL-096 | Discovery port | M |
| 22 | REAL-097 | Marketplace port | M |
| 23 | REAL-100 | Support tab | S |
| 24 | REAL-103 | Billing port | M |
| 25 | REAL-107 | Health + deployments UI (basic) | M |

---

### Sprint 8 — REAL-109, 110, 114, 117 (P2 Governance + Workforce start)

| Order | REAL | Deliverable | Complexity |
|-------|------|-------------|------------|
| 26 | REAL-109 | Governance department layout | S |
| 27 | REAL-110 | Settings save wiring | M |
| 28 | REAL-114 | AI Workforce roster grid | M |
| 29 | REAL-117 | Development department layout | S |

---

### Sprint 9 — REAL-111, 112, 113, 118, 121 (P2 depth + overlays)

| Order | REAL | Deliverable | Complexity |
|-------|------|-------------|------------|
| 30 | REAL-111 | Soul + decisions port | M |
| 31 | REAL-112 | Council port | M |
| 32 | REAL-113 | V1 certification port | M |
| 33 | REAL-118 | Pillow drawer in Cockpit shell | M |
| 34 | REAL-121 | Notification drawer | M |

---

### Sprint 10 — REAL-122, 123, 115, 116, 119, 120 (P2 complete)

| Order | REAL | Deliverable | Complexity |
|-------|------|-------------|------------|
| 35 | REAL-122 | Global approval bar | S |
| 36 | REAL-123 | Pillow FAB + keyboard shortcuts | S |
| 37 | REAL-115 | Workforce activity page | M |
| 38 | REAL-116 | Audit log viewer | M |
| 39 | REAL-119 | Approvals dedupe with Mission Centre | S |
| 40 | REAL-120 | ESIS + learning port | M |

---

### Sprint 11–12 — REAL-124, 125, 126 (P3 consolidation)

| Order | REAL | Deliverable | Complexity |
|-------|------|-------------|------------|
| 41 | REAL-124 | HTTP redirects `/dashboard/*` → `/cockpit/*` in frontend | M |
| 42 | REAL-125 | Extract shared `cockpit/ui` (optional monorepo package) | L |
| 43 | REAL-126 | Mark Vite dashboard deprecated; docs update | S |

---

### Sprint 13+ — REAL-127–135 (P3 production)

| Order | REAL | Deliverable | Complexity |
|-------|------|-------------|------------|
| 44 | REAL-127 | Ledger-backed module views | L |
| 45 | REAL-128 | Live PIE connectors in UI | L |
| 46 | REAL-129 | Remove deterministic mocks from fulfillment UI | M |
| 47 | REAL-130 | Live CJ fulfillment UI path | L |
| 48 | REAL-131 | Admin real metrics | M |
| 49 | REAL-132 | Postgres migration | XL |
| 50 | REAL-133 | Connector live mode + Integrations truth | L |
| 51 | REAL-134 | Wire all unwired ActionButtons | M |
| 52 | REAL-135 | E2E smoke: Grand King revenue path | L |

---

## 3. Complexity Key

| Rating | Meaning | Typical effort |
|--------|---------|----------------|
| S | Small | 1–2 days |
| M | Medium | 3–5 days |
| L | Large | 1–2 weeks |
| XL | Extra large | 2+ weeks, backend |

---

## 4. Department Build Order (Detail)

### Intelligence (REAL-094–097)

```
094 shell → 095 products/suppliers → 096 discovery → 097 marketplace
```

| Step | Screen | Source | New work |
|------|--------|--------|----------|
| 1 | Department template | CMP-003 | Tab bar |
| 2 | Products | IntelligenceModule | DataModeBadge, scan category |
| 3 | Suppliers | SuppliersModule | Port as-is |
| 4 | Discovery | ProductDiscoveryPage | API client port |
| 5 | Marketplace | MarketplaceIntelligencePage | API client port |

### Commerce (REAL-089–093)

```
089 shell → 200 store → 201 launch → 202 marketing → 203 ads → 204 workspace
```

| Step | Screen | Source | New work |
|------|--------|--------|----------|
| 1 | Store | StoreBuilderModule + orphans | Mount preview, pipeline hook |
| 2 | Launch | LaunchCenterPage | Port page |
| 3 | Marketing | MarketingAiModule | Wire generate |
| 4 | Ads | AdManagerModule + AdsPage | Merge best-of |
| 5 | Workspace | BusinessWorkspacePage | Port + dynamic routes |

### Operations (REAL-098–100)

```
098 shell → 300 orders → 301 fulfillment → 302 support
```

### Finance (REAL-101–104)

```
101 shell → 400 profit → 401 pl → 402 billing → 403 costs
```

### Infrastructure (REAL-105–108)

```
105 shell → 600 integrations → 601 deployments → 602 health → 603 admin
```

### Governance (REAL-109–113)

```
109 shell → 700 settings → 701 soul → 702 decisions → 703 council → 704 v1
```

### AI Workforce (REAL-114–116)

```
114 roster → 501 activity → 502 audit
```

### Development (REAL-117–120)

```
117 shell → 800 pillow → 801 approvals → 802 inspection → 803 learning
```

---

## 5. Milestone Gates

| Milestone | After sprint | Criteria |
|-----------|--------------|----------|
| **M1 — Cockpit Alpha** | Sprint 3 | Home + Command + Missions usable |
| **M2 — Department Beta** | Sprint 7 | All P1 departments navigable |
| **M3 — Cockpit Feature Complete** | Sprint 10 | All 42 screens + overlays |
| **M4 — Single Frontend** | Sprint 12 | Redirects; one primary URL space |
| **M5 — Production Grand King** | Sprint 13+ | Live data; first revenue path in Cockpit |

---

## 6. Implementation Order Summary (Single Thread)

If only one engineer:

1. REAL-081 → 082 → 083 → 084 → 088  
2. REAL-085 → 086 → 087  
3. REAL-105 → 106 (integrations unblock everything)  
4. REAL-089 → 090 → 098 → 099  
5. REAL-101 → 102  
6. REAL-094 → 095 → 096  
7. REAL-091 → 092 → 100  
8. REAL-109 → 110 → 114  
9. REAL-117 → 118 → 121 → 122  
10. REAL-124 → 127 → 129 → 130  

---

*REAL-080 — Cockpit Build Sequence v1.0*
