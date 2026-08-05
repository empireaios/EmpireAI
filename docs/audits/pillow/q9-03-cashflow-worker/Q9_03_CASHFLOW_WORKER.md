# Q9-03 — Cashflow Worker

**Doctrine:** `PILLOW-CFW-001`  
**Status:** FINAL PASS  
**Module:** `pillow/src/cashflow-worker/`  
**Worker ID:** `wkr-cashflow-01`

## Purpose

Isolated Capital Factory worker that monitors actual cash entering, leaving, and remaining across EmpireAI. Consumes verified Accounting Worker records, produces daily/weekly/monthly/annual/custom cashflow views, and emits machine-readable Cashflow Reports consumable by Q9-04 Budget Planning Worker.

CFW monitors. It does **not** create budgets, forecast cashflow, approve spending, or move money.

## Money model

All monetary arithmetic uses integer minor units (`MoneyMinor.minorUnits`). Floating-point math is forbidden for cash calculations. Example: `10.50` → `1050` cents.

## Architecture

- `CashflowWorker` engine + controller + `CashflowManager`
- `money.ts` integer helpers + `cashflow-calculator.ts` period aggregation
- Consumes ACCW entries via DI; binds CAPFC, Worker Registry/Lifecycle/Assignment, ERR, Audit, Recovery
- Downstream: `getQ904ConsumableContract` / `consumableByQ904`

## Evidence artifacts

- `EXAMPLE_CASHFLOW_REPORT.json`
- `EXAMPLE_DAILY_CASHFLOW_VIEW.json`
- `EXAMPLE_MONTHLY_CONSOLIDATED_VIEW.json`
- `CERTIFICATION_EVIDENCE.json`

## Validation

```bash
node --import tsx --test "src/validation/tests/cashflow-worker.test.ts"
```

Result: 13/13 pass. Regression: Q9-01 12/12, Q9-02 12/12.
