# SA-001 — Architect's Final Recommendations

> **Mission:** SA-001 Supreme Executive Audit  
> **Date:** 2026-06-21  
> **Authority:** Chief Architect · CTO · Twelve-Officer Panel  
> **Status:** Official architectural and strategic recommendations  
> **Companion:** [SA-001_SUPREME_EXECUTIVE_AUDIT.md](./SA-001_SUPREME_EXECUTIVE_AUDIT.md)

---

## Executive summary

EmpireAI possesses **exceptional constitutional architecture** and **unprecedented governance depth** for an pre-revenue commerce platform. The primary failure mode is not bad design — it is **premature breadth without live proof**.

The Architect's recommendation: **compress scope, activate depth, prove one transaction, then expand.**

---

## Where EmpireAI is today

EmpireAI is a **Version 1 architecture-complete, operationally-dormant AI commerce operating system** entering its operational era with:

- **EIR-v1.0** constitutional intelligence certified  
- **103** REAL runtime modules wired  
- **G1–G8** simulation certified  
- **4 open blockers** (B5–B8) preventing live revenue  
- **Cockpit** navigation complete but **operational panels mostly demo**  
- **Live commerce modules coded but gated** (Amazon, CJ, Stripe, Meta)

**Metaphor:** A fully designed airline with simulators certified, no commercial flight yet flown.

---

## The 10 highest priorities

| Rank | Priority | Owner |
|------|----------|-------|
| 1 | Close **B5** — production deploy + readiness pass | DevOps / Runtime |
| 2 | Implement **CRIR runtime gate** (EI6-09) | Brain / Commercial Architecture |
| 3 | Inject **B6 credentials** + vault | DevOps / Security |
| 4 | Wire **Cockpit V1 path** (Launch, Orders, Fulfillment, Profit, Approval bar) | Product / Cockpit |
| 5 | Execute **GK Sandbox E2E** with King sign-off | COO / Grand King |
| 6 | Select **one profitable SKU** (EI5+EI6 + CRIR) | CCO / Intelligence |
| 7 | Obtain **B7 GK go-live approval** | Grand King |
| 8 | **Live publish** one SKU on V1 channel (`amazon-us` / `amazon-sg` / `shopee-sg`) + CJ + Stripe | Commerce |
| 9 | Achieve **PROOF-001** (B8) | CFO / COO |
| 10 | **V1-CERT** then MS-A tracking | CEO / Governance |

Full detail: [SA-001_IMPLEMENTATION_PRIORITY.md](./SA-001_IMPLEMENTATION_PRIORITY.md)

---

## What must be built next

### Immediate (P0 — next 6 weeks)

1. **Production infrastructure** — Railway backend, Vercel Cockpit, Upstash Redis, domain, monitoring  
2. **CRIR evaluator** in commerce readiness pipeline  
3. **Cockpit Brain wiring** for Commerce + Operations + Finance profit (Integrations pattern)  
4. **GlobalApprovalBar + SUCCESS-001** in CockpitShell  
5. **Credential activation path** for Amazon US/SG + Shopee SG + Shopify provision + CJ + Stripe  
6. **PROOF-001 recording artifact** (ledger + external refs + Cockpit widget)

### Not new architecture — activation and wiring of existing modules.

---

## What should never be built (V1)

| Never (V1) | Why |
|------------|-----|
| New governance/planning frameworks | SA-001 + GO-002 are baselines |
| Multi-marketplace live ops | Scope · support · credential surface |
| Pillow Layer 2 PEI | Post-V1 Certification Mode |
| Autonomous ad spend without caps | CRO · EI6 NDE exposure |
| Public customer accounts | ADR-016 · MS-B deferred |
| New REAL modules without blocker mapping | Certification Mode C1 |
| Shopify/TikTok/eBay live before PROOF | Distraction from V1 path |
| CRIR bypass for "speed" | EI6-09 · EIR-004 REAL-128 hold |
| Self-amending EI by Pillow | EIR-002 violation |
| Duplicate frontend features in third UI surface | frontend/ is legacy |

---

## What should be simplified

| Simplify | Action |
|----------|--------|
| **Documentation surface** | Archive root-level COMBINED_EXECUTIVE_AUDIT_* to `docs/archive/` post-PROOF |
| **REAL module exposure** | King Cockpit shows V1 path only; hide 80+ analytical REALs behind "Advanced" |
| **Dual frontend** | Complete cockpit migration; freeze `frontend/` except rollback |
| **Connector catalog** | King UI shows 4 live providers (Amazon, CJ, Stripe, Meta); catalog rest as admin-only |
| **Decision paths** | One launch workflow — not parallel orchestration + runtime + execution-layer confusion |
| **Env var matrix** | Single `version-1-activation` dashboard showing all flags |
| **Pillow terminology** | Executive Personality everywhere; retire "Supervisor-only" language |
| **Intelligence layers** | Three connector layers documented as one "Reality Integration" in King UI |

---

## What should be removed (post-PROOF or with rollback plan)

| Remove / deprecate | Timing | Condition |
|--------------------|--------|-----------|
| `frontend/` Vite dashboard | Post-PROOF | Cockpit parity verified |
| Root untracked audit markdown sprawl | Housekeeping | Archive not delete |
| Mock provider defaults in production | Phase 9 | Flags force live |
| Placeholder cockpit widgets (22) | Phase 4 | Replaced with live or removed from nav |
| `node_modules` from workspace if committed | Immediate | .gitignore enforcement |
| Duplicate Pillow constitution paths | Documentation | EIR-002 supreme doc only |
| Deterministic fulfilment mocks in prod | Phase 9 | REAL-129 complete |

**Do not remove:** REAL mission history, EI library, governance SSOTs, platform rollback routes.

---

## What should be accelerated

| Accelerate | Rationale |
|------------|-----------|
| **B5 + B6** in parallel with Cockpit wiring | Credentials procurement is often calendar-critical path |
| **CRIR gate** before any other commerce feature | Highest risk gap · EI6-09 |
| **REAL-135 extended E2E** | Cheapest integration test of full chain |
| **Stripe test mode in Sandbox** | Validates payment path before live |
| **Single SKU discipline** | Fastest path to PROOF-001 |
| **Pillow Phase 2 federation** | King visibility during live window |
| **Production secret rotation** | Security debt compounds at go-live |

---

## What will most likely produce first verified net profit

### The V1 profit machine (minimum viable)

```
One SKU (CJ sourced)
  → Amazon listing (REAL-003)
  → Organic or minimal Meta traffic (optional)
  → Stripe checkout (REAL-103)
  → CJ fulfilment (REAL-105)
  → Ledger reconciliation
  → PROOF-001
```

### Success probability factors

| Factor | Impact on PROOF-001 probability |
|--------|--------------------------------|
| SKU margin > 40% after all fees | **Critical** |
| Amazon seller account healthy | **Critical** |
| CJ product quality + ship time | **High** |
| Cockpit King can monitor order | **High** |
| CRIR completed before publish | **High** |
| Sandbox E2E passed | **High** |
| Multi-SKU launch | **Negative** — delays proof |
| Paid ads before fulfilment test | **Negative** — spend risk |

### Architect's bet

**Highest probability path:** Conservative SKU · Amazon organic · CJ · Stripe · no ads until after first fulfilled order · PROOF-001 within 10 weeks of implementation start.

---

## Technical architecture recommendations

### Brain

- Wire **product-scout** and **product-intelligence** to contract registry before second SKU  
- Keep Decision Engine **minimal** until live data proves need for scoring engine  
- Enforce **Guardian** on every live commerce tool call  
- Prefer **SQLite on Railway volume** for PROOF-001; Postgres migration after B8  

### Pillow

- Complete **Phase 2 federation** before live — King must see blockers  
- Do not start Layer 2 PEI until MS-A progress  
- All live missions require **EI citation** in planner output  

### Cockpit

- **Integrations panel pattern** is the template for all departments  
- Mount **GlobalApprovalBar** immediately — UX contract already closed  
- Data mode badges mandatory (Live/Sandbox/Demo)  

### Connectors

- **V1 live execution adapters:** Amazon US, Amazon SG, Shopee SG + CJ supplier · **Shopify architecture provision** (ADR-052)  
- Intelligence connectors: REAL-128 before second product research cycle  
- Do not build Shopify/TikTok live until PROOF-001 + 30 days stable ops  

### Security

- Rotate all dev defaults before B6  
- Never log credential vault contents  
- Webhook HMAC verification mandatory for Stripe live  
- Run rollback drill before B7  

---

## Organizational recommendations

| Role | Focus until PROOF-001 |
|------|----------------------|
| **Grand King** | SKU approval · B7 sign-off · PROOF verification |
| **Runtime Engineering** | B5, B6, live module activation |
| **Product/Cockpit** | Phase 4 wiring |
| **Commercial Architecture** | CRIR gate · readiness engine |
| **Intelligence** | One SKU research packet |
| **Finance** | Margin model · PROOF reconciliation |
| **DevOps** | Production deploy · monitoring |
| **Pillow Architecture** | Phase 2 federation only |

**Defer:** BL-C implementation, EI7–EI9 drafting, multi-marketplace strategy, MS-B planning.

---

## Risk recommendations (CRO)

1. **No launch without CRIR** — non-negotiable  
2. **Cap ad spend at $0** until first fulfilled order  
3. **Single marketplace** until 30 days stable  
4. **Manual fulfilment fallback runbook** if CJ API fails  
5. **Daily Guardian health review** first 14 days live  
6. **Refund policy documented** before first sale  

---

## Final architect's verdict

EmpireAI should **stop building breadth** and **start proving depth**.

The repository is ready for **operational implementation** guided by SA-001, GO-002, and EIR-v1.0 — not for **new architecture or governance**.

**Next action:** P0-1 from [SA-001_IMPLEMENTATION_PRIORITY.md](./SA-001_IMPLEMENTATION_PRIORITY.md) — production deploy and B5 closure.

---

*SA-001 Architect's Final Recommendations · Official baseline · 2026-06-21*
