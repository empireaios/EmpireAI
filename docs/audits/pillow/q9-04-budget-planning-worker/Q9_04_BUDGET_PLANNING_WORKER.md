# Q9-04 — Budget Planning Worker

**Doctrine:** `PILLOW-BPW-001`  
**Status:** FINAL PASS  
**Module:** `pillow/src/budget-planning-worker/`  
**Worker ID:** `wkr-budget-planning-01`

## Purpose

Isolated Capital Factory worker that creates and monitors operational budgets (project, business, advertising, infrastructure, and extensible categories), tracks utilisation against verified actuals, detects variances, and recommends adjustments for Pillow / Grand King.

BPW plans and monitors. It does **not** approve expenditure, execute payments, forecast revenue, or replace the Profitability Worker.

## Money model

Integer minor units (`MoneyMinor`). Utilisation and variance percentages use integer basis-point division. Floating-point arithmetic is forbidden for budget math.

## Architecture

- `BudgetPlanningWorker` engine + controller + manager
- Append-aware budget store with revision history
- Consumes CAPFC / ACCW / CFW via DI; binds Worker Registry/Lifecycle/Assignment, ERR, Audit, Recovery
- Downstream: `getQ905ConsumableContract` / `consumableByQ905`
- Distinct from legacy `budget-management-engine` (untouched)

## Evidence artifacts

- `EXAMPLE_BUDGET_PLANNING_REPORT.json`
- `EXAMPLE_PROJECT_BUDGET.json`
- `EXAMPLE_VARIANCE_ANALYSIS.json`
- `CERTIFICATION_EVIDENCE.json`

## Validation

```bash
node --import tsx --test "src/validation/tests/budget-planning-worker.test.ts"
```

Result: 12/12 pass. Regression: Q9-02 12/12, Q9-03 13/13.
