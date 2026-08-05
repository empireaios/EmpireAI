# Q7-01 Local Business Factory Core

## Mission

- **ID:** Q7-01
- **Name:** Local Business Factory Core
- **Doctrine:** `PILLOW-LBFC-001`
- **Module:** `pillow/src/local-business-factory-core/`
- **Worker ID:** `wkr-local-business-factory-core-01`
- **Status:** **FINAL PASS**

## Prior gate

Q6-15 Platform Certification evidence verified as `FINAL PASS` at `docs/audits/pillow/q6-15-platform-certification/CERTIFICATION_EVIDENCE.json`.

## Deliverable

Coordinate local business projects from opportunity discovery through ongoing operations — executive orchestration only under Pillow. Produces machine-readable Local Business Factory Reports with confidence scores derived from observed fields only.

## Capabilities verified

1. Register local business projects
2. Support multiple (extensible) business categories
3. Coordinate local business lifecycle / track project progress
4. Coordinate and assign workers
5. Coordinate approval workflows (reject bypass)
6. Coordinate launch readiness
7. Coordinate customer acquisition, fulfilment, ongoing operations
8. Produce executive cockpit / dashboard snapshot
9. Preserve audit trail
10. Produce machine-readable Local Business Factory Reports
11. Submit reports through Executive Reporting Runtime

## Boundaries verified

- Does not perform specialist worker functions
- Does not replace Q7 workers
- Does not modify unrelated factories
- Does not override approved architecture / Pillow / Grand King
- Does not fabricate operational status
- Does not bypass Grand King approval
- Does not implement Q7-02 or later

## Business categories

handyman, cleaning, plumbing, electrical, air_conditioning_servicing, painting, renovation, pest_control, tutoring, beauty_services, car_detailing, pet_services, home_services, unknown

## Lifecycle stages

opportunity_discovered → project_registered → workers_assigned → preparation → launch_readiness → launched → customer_acquisition → fulfilment → ongoing_operations → completed

## Wiring evidence

- Session: `createLocalBusinessFactoryCore` + `bindIntegrations` + `requirePillowLocalBusinessFactoryCore`
- Barrel: `pillow/src/index.ts`
- Orchestrator: `SubsystemId` `local-business-factory-core` + registry probe (mission Q7-01)
- Host: `pillow-host.ts` Local Business Factory Core methods
- Routes: `/api/pillow/local-business-factory-core/*`
- Bridge: `local-business-factory-core-bridge.ts`
- Governance: `docs/governance/EMPIREAI_LOCAL_BUSINESS_FACTORY_CORE_SYSTEM.md`
- Config: `config/local-business-factory-core.config.json`

## Observed validation

On 2026-08-02:

```text
npx --yes tsx --test "src/validation/tests/local-business-factory-core.test.ts"
# 12 pass / 0 fail

npx --yes tsx --test "src/validation/tests/platform-certification.test.ts"
# 13 pass / 0 fail
```
