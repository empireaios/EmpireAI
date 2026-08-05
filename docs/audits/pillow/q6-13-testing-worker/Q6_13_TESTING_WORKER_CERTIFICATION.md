# Q6-13 Testing Worker Certification

## Mission

- **ID:** Q6-13
- **Name:** Testing Worker
- **Doctrine:** PILLOW-TSW-001
- **Module:** `pillow/src/testing-worker/`
- **Status:** FINAL PASS

## Deliverable

Generate and execute unit, integration, end-to-end, and acceptance tests with coverage metrics, regression detection, failure evidence, remediation recommendations, and machine-readable Testing Reports.

## Repository audit findings

- Q6-01–Q6-12 FINAL PASS verified from certification evidence under `docs/audits/pillow/q6-*`.
- Existing Pillow validation suites preserved; Testing Worker does not replace deployment or certification systems.
- Pass outcomes require explicit `TestRunner` results — never fabricated.

## Capabilities verified

1. Generate unit tests
2. Generate integration tests
3. Generate end-to-end tests
4. Generate user acceptance tests
5. Execute automated test suites
6. Produce code coverage metrics (explicit coverageDelta only)
7. Detect regressions vs baseline
8. Record failures with evidence
9. Produce remediation recommendations
10. Generate Testing Reports (`TSW-RPT-v1`)

## Boundaries verified

- Does not modify unrelated production code
- Does not replace deployment
- Does not replace certification
- Never fabricates successful tests
- Does not override Pillow / Grand King / approved architecture
- Does not implement Q6-14 or later

## Prerequisites

Q6-01 through Q6-12 FINAL PASS.

## Wiring

- Session bootstrap after Notification Worker
- Barrel export + `requirePillowTestingWorker()`
- Subsystem registry id `testing-worker` (mission Q6-13)
- Host methods + authenticated routes `/api/pillow/testing-worker/*`
- Offline bridge: `testing-worker-bridge.ts`

## Evidence

- Unit suite: `pillow/src/validation/tests/testing-worker.test.ts` (12/12)
- Regression: Q6-12 Notification Worker (12/12)
- Governance: `docs/governance/EMPIREAI_TESTING_WORKER_SYSTEM.md`
- Config: `config/testing-worker.config.json`
