# EmpireAI Forecasting Worker

PILLOW-FRCW-001 / Q9-06 provides the Forecasting Worker inside the Capital Factory.

The Forecasting Worker is the deterministic revenue, cost, cashflow, and profit forecasting layer for EmpireAI businesses. It consumes verified historical evidence (`HistoricalPoint` records — supplied directly by the caller or seeded via configuration) — plus verified Q9-02 Accounting Worker, Q9-03 Cashflow Worker, Q9-04 Budget Planning Worker, and Q9-05 Profitability Worker records consumed for traceability and context only — to project future revenue, cost, cashflow, and profit; estimate cash runway; recommend structural reinvestment options; and compare best/expected/worst-case scenarios. It produces machine-readable Forecasting Reports consumable by Q9-07 (Tax Support Worker) and later capital workers. It integrates with the Q9-01 Capital Factory Core and Q9-02..Q9-05 workers exclusively through dependency injection — it never reimplements their orchestration.

The Forecasting Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never fabricates historical financial data, never presents forecasts as guaranteed outcomes, never executes investments, never approves budgets, never replaces the Investment Planning Worker, never modifies accounting records, and never overrides approved architecture, Pillow, or Grand King.

## Money model

All forecasting arithmetic — revenue, cost, cashflow, profit, cash-runway burn/surplus, and reinvestment sizing — is performed on integer minor units (e.g. cents) via a dedicated `MoneyMinor` helper (`add`/`sub`/`compare`/`equals`/`sum`). Verified decimal amounts are converted to minor units at a single, explicit parse boundary (`moneyFromDecimal`) — the only point at which rounding is ever applied. Growth rates are represented exclusively as integer basis points; a metric is rolled forward by repeatedly applying `amount + trunc(amount * growthRateBps / 10000)` — never a floating-point projection. Reinvestment recommendations are sized as integer basis-point portions of the monthly surplus (`trunc(pool * tierBps / 10000)`) — never a fractional or invented split. Decimal display values are derived strictly for report presentation and are never fed back into further money math.

## Historical evidence — the sole substrate for a forecast baseline

The Forecasting Worker never infers a historical baseline from raw, uncategorised Accounting Worker ledger lines, Cashflow Worker reports, Budget Planning Worker reports, or Profitability Worker reports. Those verified upstream records are consumed and preserved purely for traceability and contextual evidence. The sole authoritative substrate for a forecast's revenue, cost, cash, profit, net-cashflow, or closing-cash baseline is the verified `HistoricalPoint` — supplied directly by the caller (`FrcwInput.historicalSeries`) or seeded via configuration — every one of which carries `isHistorical: true, fabricated: false` set exclusively by its verified source. When no verified historical points are available for the requested metric/business/currency, the Forecasting Worker never fabricates a baseline: it fails validation and declines to produce that forecast.

## Forecasting methodology (deterministic)

1. Require verified historical points (injected directly or via configuration seed). If none are available for the requested metric, validation fails — historical data is never fabricated to manufacture a forecast.
2. Historical trend: the growth rate applied to project a metric forward is either the caller-supplied `growthRateBps`/`costGrowthRateBps`, or — when absent — derived purely from the last two verified historical points via integer basis points (`((last-prev)*10000)/prev`). When fewer than two historical points exist and no rate was supplied, the growth rate defaults to `0 bps`, explicitly documented via an assumption tagged `zero_growth_default_due_to_insufficient_history` — never a fabricated non-zero assumption.
3. Rolling forecast: the resolved growth rate is applied repeatedly to roll the metric forward the requested `horizonPeriods` (e.g. 3/6/12) from the last verified historical period.
4. Scenarios: `best_case = growthRateBps + sensitivityDeltaBps`, `expected = growthRateBps`, `worst_case = max(growthRateBps - sensitivityDeltaBps, -10000)`. The sensitivity delta defaults to `500 bps` unless the caller supplies `sensitivityDeltaBps` explicitly — always documented via an assumption.
5. Revenue and cost are each forecast independently from their own verified historical trend. Cashflow is forecast as `revenue - cost`, period-aligned, per scenario. Profit is forecast from its own verified historical trend when historical profit points exist; otherwise it is derived as `revenue - cost`, per scenario — always tagged `profit_projection`.
6. Cash runway: `monthlyNetBurn = max(0, -avgNetCashflow)`, where `avgNetCashflow` is derived from verified `net_cashflow` historical points (simple integer average) or, when absent, from period-over-period `closing_cash` deltas. `runwayMonths = trunc(openingCash / monthlyNetBurn)` when burning; when the average net cashflow is zero or positive, the business is recorded as being in indefinite surplus (`runwayMonths: null`) rather than a fabricated ceiling.
7. Reinvestment options: when a real monthly surplus exists, structural suggestions are recommended sized as basis-point portions (25%/50%/75% by default) of that surplus — always labelled as non-binding suggestions, never an instruction to execute.
8. Every forecast point is labelled `isForecast: true, isHistorical: false`; every historical point is labelled `isHistorical: true, fabricated: false` — the two are never mixed or conflated in a `ForecastingReport`'s `historicalBaseline` versus its forecast series fields.
9. `confidenceScore` (integer 0-100) is derived from the completeness of verified historical evidence and assumption coverage — never a fabricated confidence figure.

## Integrations

- Capital Factory Core (Q9-01) — dependency injection only
- Accounting Worker (Q9-02) — dependency injection only
- Cashflow Worker (Q9-03) — dependency injection only
- Budget Planning Worker (Q9-04) — dependency injection only
- Profitability Worker (Q9-05) — dependency injection only
- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Audit Runtime
- Worker Recovery System

## Boundaries

The Forecasting Worker:

- DOES project real revenue, cost, cashflow, and profit forecasts from verified historical evidence; estimate cash runway; recommend structural reinvestment options; compare best/expected/worst-case scenarios; and produce deterministic Forecasting Reports.
- DOES NOT fabricate historical financial data — every forecast baseline traces to a verified `HistoricalPoint`; missing evidence causes the forecast to fail validation rather than being fabricated or assumed.
- DOES NOT present forecasts as guaranteed outcomes — every forecast point and report is clearly labelled `isForecast: true`, separated from historical data, and carries its own confidence figure.
- DOES NOT execute investments or approve budgets — reinvestment options are structural suggestions only.
- DOES NOT replace the Investment Planning Worker.
- DOES NOT modify accounting records — the Accounting Worker's ledger is immutable and read-only from the Forecasting Worker's perspective.
- DOES NOT override approved architecture, Pillow, or Grand King, or bypass Grand King approval.
- DOES NOT implement Q9-07 or later — it exposes a Q9-07 consumable contract instead.
