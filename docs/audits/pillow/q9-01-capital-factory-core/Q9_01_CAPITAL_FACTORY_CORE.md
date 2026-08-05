# Q9-01 — Capital Factory Core

**Doctrine:** `PILLOW-CAPFC-001`  
**Status:** FINAL PASS  
**Module:** `pillow/src/capital-factory-core/`  
**Worker ID:** `wkr-capital-factory-core-01`

## Purpose

Isolated Factory Core that protects, manages, grows, and allocates EmpireAI capital by coordinating Capital Factory workers, maintaining enterprise capital state, tracking allocation and readiness, and producing machine-readable Capital Factory Reports for Pillow.

CAPFC orchestrates. It does **not** perform accounting, forecast finances, or execute investments.

## Architecture

- `CapitalFactoryCore` engine + controller + `CapitalFactoryManager`
- Project builder / store / validator
- Configuration force-locks never-boundaries
- Integrations: Worker Registry, Worker Lifecycle, Executive Reporting Runtime, Audit Runtime, Mission Runtime, Queue Runtime, Shared Runtime, Worker Recovery System
- Consumable contract for Q9-02 Accounting Worker (`getQ902ConsumableContract` / `consumableByQ902`)

## Evidence artifacts

- `EXAMPLE_CAPITAL_FACTORY_REPORT.json`
- `EXAMPLE_CAPITAL_LIFECYCLE.json`
- `EXAMPLE_WORKER_ORCHESTRATION.json`
- `CERTIFICATION_EVIDENCE.json`

## Validation

```bash
node --import tsx --test "src/validation/tests/capital-factory-core.test.ts"
```

Result: 12/12 pass. Regression: Q8-08 12/12, Q8-09 12/12.
