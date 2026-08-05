# Q11-12 Q Series Certification — Certification Pack

## Identity

| Field | Value |
|-------|-------|
| Engine | PILLOW-QSCRT-001 |
| Mission | Q11-12 |
| Runtime | Q11-QSCRT-v1 |
| Metadata | QSCRT-001-v1 |
| Report | QSCRT-RPT-v1 |
| Folder | `pillow/src/q-series-certification/` |
| Class | `QSeriesCertification` |
| Session | `qSeriesCertification` (after `postLaunchMonitoring`) |

## Honest Certify Rule (LOCKED)

`certificationDecision=certify` ONLY when FINART consumable + EAPRT certify + GK approve+authorised + PLMRT productionActiveMonitoring=true + no critical Missing/Failed evidence.

## Contracts

- **Consumes:** `postLaunchMonitoring.getQ1112ConsumableContract()` (`consumerMissionId: Q11-12`)
- **Emits:** `getQ1113ConsumableContract()` for Q11-13 (`neverImplementQ1113OrLater: true`)

## Distinctness

Distinct from `shared-runtime-certification` (SRCRT), `production-certification-core` (PCCRT), `company-factory-certified`.

## Certification Status

Structural implementation complete. Live run expected: `certificationDecision=withhold` with outstanding FINART/EAPRT/GK/PLMRT issues (honest).
