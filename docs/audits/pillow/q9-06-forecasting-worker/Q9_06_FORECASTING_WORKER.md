# Q9-06 — Forecasting Worker

**Doctrine:** `PILLOW-FRCW-001`  
**Status:** FINAL PASS  
**Module:** `pillow/src/forecasting-worker/`  
**Worker ID:** `wkr-forecasting-01`

## Purpose

Isolated Capital Factory worker that generates evidence-based forecasts for revenue, costs, cashflow, cash runway, profitability, and reinvestment options from verified historical financial records — clearly distinguishing forecast values from history.

FRCW forecasts. It does **not** execute investments, approve budgets, or modify accounting records.

## Forecasting methodology

- Integer minor-unit money; growth via integer basis points
- Historical trend / rolling / scenario / sensitivity / cash runway / profit projection / reinvestment modelling
- Scenarios: best / expected / worst (documented sensitivity delta)
- Every forecast point `isForecast: true`; baseline `isHistorical: true`
- Forecasts never presented as guaranteed outcomes

## Architecture

- `ForecastingWorker` engine + controller + manager + calculator
- Consumes CAPFC / ACCW / CFW / BPW / PRFW via DI
- Binds Worker Registry/Lifecycle/Assignment, ERR, Audit, Recovery
- Downstream: `getQ907ConsumableContract` / `consumableByQ907`

## Evidence artifacts

- `EXAMPLE_FORECASTING_REPORT.json`
- `EXAMPLE_REVENUE_FORECAST.json`
- `EXAMPLE_CASH_RUNWAY_ANALYSIS.json`
- `CERTIFICATION_EVIDENCE.json`

## Validation

```bash
node --import tsx --test "src/validation/tests/forecasting-worker.test.ts"
```

Result: 12/12 pass. Regression: Q9-05 12/12, Q9-04 12/12.
