# SA-001 — Implementation Priority

> **Mission:** SA-001 Supreme Executive Audit  
> **Date:** 2026-06-21  
> **Authority:** Grand King  
> **Status:** Official implementation priority baseline until PROOF-001  
> **Supersedes for execution:** All prior ad-hoc priority lists except [GO-002_GRAND_KING_OPERATIONAL_MASTER_PLAN.md](./GO-002_GRAND_KING_OPERATIONAL_MASTER_PLAN.md) phase detail  
> **Companion:** [SA-001_ARCHITECTS_FINAL_RECOMMENDATIONS.md](./SA-001_ARCHITECTS_FINAL_RECOMMENDATIONS.md)

---

## Priority framework

| Tier | Label | Rule |
|------|-------|------|
| **P0** | Critical path | Must complete before PROOF-001; blocks revenue |
| **P1** | High | Required for King operability or risk reduction on V1 path |
| **P2** | Medium | Improves probability of success; not blocking first profit |
| **P3** | Low | Post-PROOF-001 or explicit defer |
| **P∞** | Never (V1) | Do not build until PROOF-001 or King exception |

Every implementation mission **shall** declare: `SA-001 priority tier`, `blocker ID (B5–B8 if applicable)`, `GO-002 phase`, `EI citation`.

---

## P0 — Critical path (10 items)

| Rank | ID | Work | Blocker | GO-002 phase | REAL / artifact |
|------|-----|------|---------|--------------|-----------------|
| **P0-1** | Production deploy + B5 | Railway + Vercel + Redis + SSL + health monitoring | B5 | Phase 1 | REAL-047 |
| **P0-2** | CRIR runtime gate | Wire EI6-09 into `commerce-readiness-engine` | CB-08 | Phase 2 | REAL-006 ext |
| **P0-3** | B6 credentials | Amazon SP-API + CJ + vault key + Stripe | B6 | Phase 1/5 | REAL-002B |
| **P0-4** | Cockpit Commerce wiring | Launch, Store, Workspace → Brain | CB-09 | Phase 4 | REAL-089–093 |
| **P0-5** | Cockpit Operations wiring | Orders + Fulfillment live path | CB-09 | Phase 4 | REAL-098–100, 129–130 |
| **P0-6** | GlobalApprovalBar + SUCCESS-001 | Mount in CockpitShell | UX | Phase 4 | REAL-121–123 |
| **P0-7** | One SKU selection | EI5+EI6 paired evaluation + CRIR document | — | Phase 5 | Pillow research |
| **P0-8** | Sandbox E2E | Full 10-step GK Sandbox workflow pass | — | Phase 8 | REAL-135 ext |
| **P0-9** | B7 go-live approval | GK signature on REAL-099 checklist | B7 | Phase 9 | REAL-099 |
| **P0-10** | PROOF-001 | First verified positive net profit | B8 | Phase 10 | REAL-110 |

---

## P1 — High priority (12 items)

| Rank | ID | Work | Rationale |
|------|-----|------|-----------|
| **P1-1** | Finance Cockpit wiring | Profit panel ledger-backed (extend REAL-127) | King must see margin |
| **P1-2** | REAL-128 live PIE | Replace mock product intelligence for SKU research | Discovery quality |
| **P1-3** | Pillow Phase 2 federation | GC-03/05, Mission Home chip, UX-014 mirror | Executive workflow |
| **P1-4** | Stripe live activation | Webhooks + `LIVE_PAYMENT_ENABLED` | Customer money in |
| **P1-5** | CJ live fulfilment activation | `LIVE_CJ_FULFILLMENT_ENABLED` + approval | Order completion |
| **P1-6** | REAL-003 live publish | Single SKU Amazon listing | Revenue surface |
| **P1-7** | Command Centre live data | SCR-010 replace placeholders | Daily King workflow |
| **P1-8** | Brain intelligence wiring | product-scout + product-intelligence registry | Beyond supplier-only |
| **P1-9** | PROOF-001 widget | Command Centre progress surface | Outcome visibility |
| **P1-10** | Production secret rotation | Remove dev defaults; rotate SESSION_SECRET | CISO |
| **P1-11** | Rollback drill | Sandbox revert tested in production | Risk |
| **P1-12** | Journey + blocker sync | Close B5–B8 with evidence artifacts | Governance |

---

## P2 — Medium priority (10 items)

| Rank | ID | Work | Defer until |
|------|-----|------|-------------|
| **P2-1** | Pillow Phase 3 go-live | M5 operational ready posture | After sandbox pass |
| **P2-2** | REAL-132 Postgres cutover | Production DB HA | Scale or B5 evidence |
| **P2-3** | Meta ads live (capped budget) | Optional acquisition | After fulfilment proven |
| **P2-4** | Analytics conversion (REAL-106) | Attribution | After first orders |
| **P2-5** | CRIR Cockpit surface | Launch screen risk visibility | With P0-2 |
| **P2-6** | Master Index EI row | EIR-003 recommendation | Post-PROOF housekeeping |
| **P2-7** | REAL EI citation template | Future REAL planning | Post-PROOF |
| **P2-8** | Pillow 14-criteria readiness | PILLOW-ENH-012 full | Before MS-A scale |
| **P2-9** | V1-CERT path | REAL-070 + REAL-100 | After B8 |
| **P2-10** | Repository root cleanup | Archive untracked audit MDs | Post-PROOF |

---

## P3 — Low priority (8 items)

| Item | Work |
|------|------|
| P3-1 | Shopify / TikTok / eBay live adapters |
| P3-2 | PayPal live payments |
| P3-3 | Pillow Layer 2 PEI |
| P3-4 | EI7–EI9 full section drafting |
| P3-5 | Multi-marketplace simultaneous ops |
| P3-6 | BL-C enhancement implementation |
| P3-7 | ADR-044 REAL namespace cleanup |
| P3-8 | `frontend/` Vite removal (post-stable cockpit) |

---

## P∞ — Never build (V1 scope lock)

| Item | Reason |
|------|--------|
| New constitutional governance frameworks | GO-002 is final plan until PROOF |
| Additional marketplaces before PROOF-001 | Scope explosion · support burden |
| Layer 2 Pillow PEI | Post-V1 per Certification Mode |
| Live ads at scale before fulfilment proof | Spend risk |
| REAL-128–130 live without CRIR clearance | EIR-004 hold |
| New REAL modules without blocker closure | Certification Mode C1 |
| Public/customer accounts (MS-B) | ADR-016 Grand King only until MS-A |
| Autonomous spend without founder approval | EI2 · Decision Engine L3/L4 |

---

## Sequenced execution calendar (reference)

Aligns with [GO-002_GRAND_KING_OPERATIONAL_MASTER_PLAN.md](./GO-002_GRAND_KING_OPERATIONAL_MASTER_PLAN.md):

```
Week 1–2:  P0-1, P1-10, P1-11
Week 2–3:  P0-2, P0-4, P0-5, P0-6, P1-7
Week 3–4:  P0-3, P1-2, P1-3, P0-7
Week 4–5:  P0-8, P1-4, P1-5, P1-6 (staging)
Week 5–6:  P2-1 prep, sandbox rehearsal complete
Week 6:    P0-9, live publish
Week 7–10: P0-10, P2-9
```

---

## Priority vs certification blockers

| Blocker | Priority items that close it |
|---------|---------------------------|
| **B5** | P0-1 |
| **B6** | P0-3 |
| **B7** | P0-8, P0-9 |
| **B8** | P0-10 |
| **V1-CERT** | P2-9 (after B8) |

---

## Mission declaration template (mandatory)

```
SA-001 Priority: P0 | P1 | P2 | P3
GO-002 Phase: [1–10]
Blocker(s): B# | CB-#
EI Reference: EI# [, EI#]
Expected evidence: [artifact / test / PROOF field]
Register update: VERSION_1_CERTIFICATION_BLOCKER_REGISTER.md | Journey
```

---

*SA-001 Implementation Priority · Official baseline · 2026-06-21*
