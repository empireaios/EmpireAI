# Shadow CEO + Synthetic Commerce Foundation V1 — Canonical Architecture

**Mission status:** Engineering foundation only. Birth unauthorized. Wave 1 = 0/24. Real commerce locked.

## Canonical owners (single authority)

| Record | Canonical module | Must not duplicate |
|---|---|---|
| Objective / Assessment / Priority / Decision / Task / Approval / Outcome / Lesson / Intervention / Brief | `shadow-ceo/` | Do not fork into OMS / mission-command / executive-loop OutcomeRecord as competing writers |
| Operating mode + external-action gate + budget caps | `shadow-ceo-authority/` | Do not allow LLM or chat to grant approval |
| Synthetic catalog, Cost Centre, Profit Ledger, Unit Economics, Experiment, Portfolio | `synthetic-commerce/` | Never write into live Amazon/CJ/Stripe ledgers |
| Vertical slice orchestration + CEO counters + cockpit projection | `shadow-ceo-integration/` | Integration owner only |
| Challenger episodes | `docs/.../SHADOW_CEO_WS6_*` held | Independent of impl |

## Reuse (do not rebuild)

- SQLite pattern via `getDatabase()` (`executive-operating-loop/store.ts`)
- Cockpit-critical registration in `app.ts` → `registerCommerceCriticalRoutes` / `registerCockpitCriticalRoutes`
- Approval conceptual gate: `pillow-approval` (Shadow CEO keeps its own Approval records; live publish remains locked)
- PnL math inspiration: `commerce-actual-pnl.ts` — Shadow Profit Ledger is **separate** and always `source: synthetic`
- Existing executive operating loop continues for birth/presale; Shadow CEO is additive simulation plane

## Operating modes

`OBSERVE | SYNTHETIC | READ_ONLY_LIVE | APPROVAL_REQUIRED | LIVE_EXECUTION`

Mission allowed execution mode: **SYNTHETIC** only. External marketplace/money actions always fail closed.

## Objective → learning chain

```
Objective → Assessment → Priority → Decision
  → (Approval if required else skip)
  → Task(s) → Completion evidence
  → Outcome → Lesson → subsequent Decision retrieval
  → ExecutiveReturnBrief
```

## Synthetic isolation invariant

Every commerce/financial record carries `dataClass: "SYNTHETIC"`. APIs must reject emission of `liveSales`, `realisedLiveProfit`, or unlabeled profit as EmpireAI realised capital.

## Birth / Wave

BirthStatus displayed as `NOT_BORN`. WAVE_CREDIT unchanged. No Wave tests in this mission.
