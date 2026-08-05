# Q9-02 — Accounting Worker

**Doctrine:** `PILLOW-ACCW-001`  
**Status:** FINAL PASS  
**Module:** `pillow/src/accounting-worker/`  
**Worker ID:** `wkr-accounting-01`

## Purpose

Isolated Capital Factory worker that maintains EmpireAI financial ledgers: income, expenses, assets, liabilities, transfers, and general ledger history. Produces machine-readable Accounting Reports consumable by Q9-03 Cashflow Worker.

ACCW records. It does **not** forecast finances, approve investments, or replace the Budget Planning Worker.

## Architecture

- `AccountingWorker` engine + controller + `AccountingManager`
- Append-only `ledger-store` with double-entry `ledger-builder`
- Force-locked never-boundaries in configuration
- Integrates Capital Factory Core (Q902 contract / capital business IDs), Worker Registry/Lifecycle, ERR, Audit, Worker Recovery
- Downstream: `getQ903ConsumableContract` / `consumableByQ903`

## Evidence artifacts

- `EXAMPLE_ACCOUNTING_REPORT.json`
- `EXAMPLE_LEDGER_ENTRIES.json`
- `EXAMPLE_FINANCIAL_SUMMARY.json`
- `CERTIFICATION_EVIDENCE.json`

## Validation

```bash
node --import tsx --test "src/validation/tests/accounting-worker.test.ts"
```

Result: 12/12 pass. Regression: Q9-01 Capital Factory Core 12/12.
