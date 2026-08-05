# Q9-10 — Capital Risk Worker

**Doctrine:** `PILLOW-CAPRW-001`  
**Mission:** Capital Risk Worker  
**Module:** `pillow/src/capital-risk-worker/`  
**Status:** FINAL PASS

## Summary

Implements the Capital Factory Capital Risk Worker. Detects capital risks from verified upstream financial snapshots consumed from Q9-01 through Q9-09 and produces executive risk summaries, enterprise risk dashboards, and Capital Risk Reports consumable by Q9-11. Never approves financial decisions, executes investments, moves capital, fabricates risks, or automatically executes mitigation.

## Validation

```bash
node --import tsx --test "src/validation/tests/capital-risk-worker.test.ts"
```

Result: 12/12 pass. Regression: Q9-09 financial-reporting-worker 12/12.

## Artifacts

- `CERTIFICATION_EVIDENCE.json`
- `EXAMPLE_ENTERPRISE_RISK_DASHBOARD.json`
- `EXAMPLE_CAPITAL_RISK_REPORT.json`
- `docs/governance/EMPIREAI_CAPITAL_RISK_WORKER_SYSTEM.md`
- `config/capital-risk-worker.config.json`
