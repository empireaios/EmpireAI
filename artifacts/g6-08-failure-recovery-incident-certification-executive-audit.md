# G6-08 — Failure, Recovery & Incident Certification · Executive Audit

**Mission:** G6-08 — Failure, Recovery & Incident Certification  
**Authority:** Grand King · Pillow §17 · EKLS · Brain · Guardian · Registry System (EA-003) · G6-00 through G6-07 Programme Certifications  
**Date:** 2026-07-03  
**Status:** **COMPLETE**  
**Scope:** Certifies EmpireAI can detect failures, classify incidents, recover safely, rollback when required, escalate correctly, and preserve evidence through Pillow and EKLS · **certification capability only — no new runtime recovery functionality**  
**Stop directive:** G6-09 **not started**

---

## Executive Summary

G6-08 implements the **Failure, Recovery & Incident Certification** subsystem — validating failure detection, failure/incident classification, recovery paths, rollback paths, retry behaviour, escalation behaviour, Guardian event capture, Pillow governance, EKLS evidence capture, and domain-specific recovery across automation, commerce, infrastructure, plugins, and executive visibility.

All recovery and incident policies resolve through **REG-CERTIFICATION-FAILURE-RECOVERY** registry rows — never hardcoded recovery rules, escalation rules, or incident classes in validator core. Pillow governs every scan with no bypass; EKLS records incident events; Guardian bridge validated without redesign; Brain exposes eight failure recovery tools; Cockpit receives backend contracts only.

**G6-09 not started** per mission directive.

---

## 1. Files Created

| File | Purpose |
|------|---------|
| `failure-recovery-incident/contracts/failure-recovery-incident-types.ts` | Failure, incident, recovery, rollback certification contracts |
| `failure-recovery-incident/contracts/failure-recovery-cockpit-contracts.ts` | Cockpit backend view |
| `failure-recovery-incident/data/failure-recovery-rule-seed.ts` | 15 registry-driven failure recovery rules |
| `failure-recovery-incident/registry/failure-recovery-registry-resolver.ts` | REG-CERTIFICATION-FAILURE-RECOVERY resolver |
| `failure-recovery-incident/registry/recovery-signal-resolver.ts` | Registry-driven recovery signals + Guardian bridge |
| `failure-recovery-incident/validation/failure-recovery-certification-validator.ts` | Core validation engine |
| `failure-recovery-incident/validation/failure-detection-validator.ts` | Failure detection validator |
| `failure-recovery-incident/validation/incident-classification-validator.ts` | Incident classification validator |
| `failure-recovery-incident/validation/recovery-path-validator.ts` | Recovery path validator |
| `failure-recovery-incident/validation/rollback-path-validator.ts` | Rollback path validator |
| `failure-recovery-incident/validation/escalation-validator.ts` | Escalation validator |
| `failure-recovery-incident/validation/guardian-integration-validator.ts` | Guardian integration validator |
| `failure-recovery-incident/validation/ekls-evidence-validator.ts` | EKLS evidence validator |
| `failure-recovery-incident/services/executive-incident-score-engine.ts` | Executive incident score engine |
| `failure-recovery-incident/services/failure-recovery-certification-service.ts` | Scan orchestrator |
| `failure-recovery-incident/governance/failure-recovery-pillow-governance.ts` | Incident, recovery, rollback, escalation authority |
| `failure-recovery-incident/ekls/*` | Observation store + EKLS integration |
| `failure-recovery-incident/plugins/failure-recovery-plugin-host.ts` | Plugin validators |
| `failure-recovery-incident/tools/failure-recovery-tools.ts` | 8 Brain tools |
| `validation/tests/g6-08-failure-recovery-incident-certification.test.ts` | 15 validation tests |

---

## 2. Files Modified

| File | Change |
|------|--------|
| `registry/types/certification-registry-types.ts` | `g6-08-v1`, failureRecoveryRule schema, probes, domain |
| `registry/types/registry-ids.ts` | Added REG-CERTIFICATION-FAILURE-RECOVERY |
| `registry/types/registry-types.ts` | Cache policy for failure recovery registry |
| `registry/validation/certification-registry-validator.ts` | Validates failureRecoveryRule |
| `registry/sources/certification-source.ts` | Loads failure recovery rule seed |
| `registry/registry-loader.ts` | Routes REG-CERTIFICATION-FAILURE-RECOVERY |
| `production-certification/data/certification-registry-seed.ts` | Failure recovery scan + status checks, domain label |
| `production-certification/contract/production-certification-module.ts` | G6-08 mission, 8 failure recovery capabilities |
| `production-certification/platform-integrity/data/platform-integrity-rule-seed.ts` | G6 expected status updated |
| `production-certification/registry/certification-registry-resolver.ts` | 11th registry in list |
| `production-certification/services/certification-probe-registry.ts` | failure_recovery_scan + status probes |
| `production-certification/index.ts` | Public surface + test reset |
| `brain/index.ts` | Registered failureRecoveryTools |
| G6-00 through G6-07 tests | G6-08 contract + 11 registry assertions |

---

## 3. Certification Domains Validated (15 rules)

Failure detection · Failure classification · Incident classification · Recovery paths · Rollback paths · Retry behaviour · Escalation behaviour · Guardian event capture · Pillow governance · EKLS evidence capture · Automation recovery · Commerce recovery · Infrastructure recovery · Plugin recovery · Executive visibility

---

## 4. Result States (5)

`pass` · `pass_with_conditions` · `warning` · `blocked` · `fail`

---

## 5. Validation Checks Detected

Missing recovery path · Missing rollback path · Missing incident classification · Missing escalation route · Missing Guardian event · Missing EKLS evidence · Unsafe retry · Unsafe rollback · Unrecoverable failure without escalation · Silent failure · Unreported failure · Manual intervention required

All checks resolve through registry rules — **no hardcoded recovery paths, rollback paths, or escalation rules in validator core**.

---

## 6. Brain Tools (8)

| Tool | Purpose |
|------|---------|
| `failure_recovery_overview` | Overview + Cockpit view |
| `failure_recovery_scan` | Full failure recovery certification scan |
| `incident_status` | Incident certification status |
| `incident_risk_register` | Incident risk register |
| `recovery_path_validation` | Recovery path validation |
| `rollback_path_validation` | Rollback path validation |
| `failure_recovery_recommendations` | Executive recommendations |
| `failure_recovery_status` | Latest certification status + Cockpit view |

---

## 7. Pillow Governance

Validates:

- Incident certification authority
- Recovery authority
- Rollback authority
- Escalation authority
- Override authority
- Evidence integrity

**No certification bypass.**

---

## 8. EKLS Records (7 kinds)

| Kind | Trigger |
|------|---------|
| `failure_recovery_scan_completed` | Scan finished |
| `incident_detected` | Incident detected |
| `incident_classified` | Classification validated |
| `recovery_path_validated` | Recovery path ready |
| `rollback_path_validated` | Rollback path ready |
| `escalation_required` | Escalation needed |
| `failure_recovery_certified` | Pass / pass_with_conditions |

---

## 9. Guardian Validation

Validates Guardian bridge receives and records (via `guardian-recovery-bridge`):

- Failure events
- Recovery events
- Rollback events
- Incident events (capture path wired)
- Escalation events

**Guardian not redesigned** — certification validates existing bridge only.

---

## 10. Cockpit Backend Contracts

| Contract | Source |
|----------|--------|
| Failure & Incident Overview | `buildCockpitFailureRecoveryView` |
| Recovery Readiness | Scan `recoveryReadiness` |
| Rollback Readiness | Scan `rollbackReadiness` |
| Incident Register | Scan `incidents` |
| Escalation Status | Scan `escalationStatus` |
| Risk Register | Scan `riskRegister` |
| Certification Status | Scan status |
| Recommendations | Scan recommendations |

**Cockpit UI not redesigned** — backend contracts only.

---

## 11. Security

Never exposes:

- Credentials
- Tokens
- Private infrastructure
- Private customer data
- Sensitive incident payloads

---

## 12. Validation Results

| Check | Result |
|-------|--------|
| Backend typecheck | ✅ Pass |
| Frontend typecheck | ✅ Pass |
| G6 test suite | ✅ 132/132 pass |
| Executive audit | ✅ Generated |

---

## 13. Programme Status

| Programme | Mission | Status |
|-----------|---------|--------|
| G6 Production Certification | G6-08 | `failure-recovery-incident-certified` |

**G6-09 not started.**

---

*End of G6-08 Failure, Recovery & Incident Certification Executive Audit*
