# Q9-08 — Investment Planning Worker

**Doctrine:** `PILLOW-IPW-001`  
**Mission:** Investment Planning Worker  
**Module:** `pillow/src/investment-planning-worker/`  
**Status:** FINAL PASS

## Summary

Implements the Capital Factory Investment Planning Worker. Evaluates caller-supplied investment opportunities, ranks them deterministically, assesses risks, and produces capital allocation recommendations and machine-readable Investment Planning Reports consumable by Q9-09. Never executes investments, approves investments, moves capital, or fabricates ROI/payback.

## Validation

```bash
node --import tsx --test "src/validation/tests/investment-planning-worker.test.ts"
```

Result: 12/12 pass. Regression: Q9-07 12/12.

## Artifacts

- `CERTIFICATION_EVIDENCE.json`
- `EXAMPLE_INVESTMENT_PLANNING_REPORT.json`
- `EXAMPLE_CAPITAL_ALLOCATION_ANALYSIS.json`
- `docs/governance/EMPIREAI_INVESTMENT_PLANNING_WORKER_SYSTEM.md`
- `config/investment-planning-worker.config.json`
