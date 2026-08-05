# Q8-01 Affiliate Factory Core

## Mission

- **ID:** Q8-01
- **Name:** Affiliate Factory Core
- **Doctrine:** `PILLOW-AFC-001`
- **Module:** `pillow/src/affiliate-factory-core/`
- **Worker ID:** `wkr-affiliate-factory-core-01`
- **Status:** **FINAL PASS**

## Prior gates

| Series | Status |
|---|---|
| Q7-01 … Q7-11 | FINAL PASS |

## Deliverable

Central orchestration for affiliate content businesses: project registration, lifecycle, structural worker coordination, dependency management, readiness monitoring, executive reporting. Emits Q8-02-consumable Affiliate Factory Reports.

Does **not** discover affiliate programmes, generate content, or launch businesses automatically.

## Wiring evidence

- Session: `pillow/src/session.ts` (`affiliateFactoryCore`, `requirePillowAffiliateFactoryCore`)
- Barrel: `pillow/src/index.ts`
- Subsystem: `affiliate-factory-core` in `orchestrator/types.ts` + `subsystem-registry.ts`
- Host: `backend/src/orchestration/pillow-host/pillow-host.ts`
- Routes: `/api/pillow/affiliate-factory-core/*`
- Offline bridge: `backend/src/orchestration/pillow-host/affiliate-factory-core-bridge.ts`
- Governance: `docs/governance/EMPIREAI_AFFILIATE_FACTORY_CORE_SYSTEM.md`
- Config: `config/affiliate-factory-core.config.json`

## Observed validation

On 2026-08-02:

```text
node --import tsx --test \
  "src/validation/tests/affiliate-factory-core.test.ts" \
  "src/validation/tests/local-business-factory-core.test.ts" \
  "src/validation/tests/local-business-certification.test.ts"
# 36 pass / 0 fail
```

## Stop

Q8-01 complete. Do not begin Q8-02.
