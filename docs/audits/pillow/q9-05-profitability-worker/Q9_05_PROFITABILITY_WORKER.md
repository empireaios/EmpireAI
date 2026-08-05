# Q9-05 — Profitability Worker

**Doctrine:** `PILLOW-PRFW-001`  
**Status:** FINAL PASS  
**Module:** `pillow/src/profitability-worker/`  
**Worker ID:** `wkr-profitability-01`

## Purpose

Isolated Capital Factory worker that calculates true gross, operating, and net profitability from verified Accounting, Cashflow, and Budget Planning inputs — after operational costs, fees, refunds, ads, and taxes — and produces machine-readable Profitability Reports for Pillow / Grand King and Q9-06 Forecasting Worker.

PRFW calculates realised profitability. It does **not** forecast profits, approve spending, execute transactions, or modify accounting records.

## Money model

Integer minor units (`MoneyMinor`). Margins via integer basis points. Shared costs allocated by integer proportional net-revenue weight.

## Architecture

- `ProfitabilityWorker` engine + controller + manager + calculator
- Consumes CAPFC / ACCW / CFW / BPW via DI
- Binds Worker Registry/Lifecycle/Assignment, ERR, Audit, Recovery
- Downstream: `getQ906ConsumableContract` / `consumableByQ906`

## Evidence artifacts

- `EXAMPLE_PROFITABILITY_REPORT.json`
- `EXAMPLE_BUSINESS_PROFITABILITY_ANALYSIS.json`
- `CERTIFICATION_EVIDENCE.json`

## Validation

```bash
node --import tsx --test "src/validation/tests/profitability-worker.test.ts"
```

Result: 12/12 pass. Regression: Q9-04 12/12, Q9-03 13/13.
