# Q11-12 Q Series Certification — Validation Checklist

- [x] Engine PILLOW-QSCRT-001 Q11-12
- [x] Codes QSCRT-001-v1, QSCRT-RPT-v1, Q11-QSCRT-v1
- [x] Session `qSeriesCertification` after `postLaunchMonitoring`
- [x] Consume `postLaunchMonitoring.getQ1112ConsumableContract()` (consumerMissionId Q11-12)
- [x] Emit `getQ1113ConsumableContract()` for Q11-13
- [x] `neverImplementQ1113OrLater: true`
- [x] Discover factories from sharedRuntimeCore / FACTORY_KEYS
- [x] Verify workers, runtimes, orchestration, governance, production readiness
- [x] Honest certify rule (FINART/EAPRT/GK/PLMRT)
- [x] Immutable certification history
- [x] Reject Q11-13+ missionId
- [x] Reject fabricate/certify-missing/bypass governance/override GK
- [x] 12 tests in q-series-certification.test.ts
- [x] Regression with post-launch-monitoring.test.ts
