# G6-01 — Platform Integrity Certification · Executive Audit

**Mission:** G6-01 — Platform Integrity Certification  
**Authority:** Grand King · Pillow §17 · EKLS · Brain · Registry System (EA-003) · G6-00 Production Certification Framework  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** First certification domain — validates unified platform architecture, ownership boundaries, dependency integrity, and architectural drift · **certification capability only — no new runtime platform functionality**  
**Stop directive:** G6-02 **not started**

---

## Executive Summary

G6-01 implements the **Platform Integrity Certification** subsystem — the first domain under the G6 Production Certification Programme. The subsystem certifies that EmpireAI remains one unified architecture: ownership boundaries intact, dependencies legal, programmes constitutionally compliant, and no architectural drift detected.

All validation rules resolve through **REG-CERTIFICATION-INTEGRITY** registry rows. Validators iterate discovered rules — no hardcoded programme lists in validator core. Pillow governs every scan; EKLS records all findings; Brain exposes six operational tools; Cockpit receives backend contracts only (no UI redesign).

**G6-02 not started** per mission directive.

---

## 1. Files Created

| File | Purpose |
|------|---------|
| `platform-integrity/contracts/platform-integrity-types.ts` | Scan result, violation, matrix, EKLS kind contracts |
| `platform-integrity/contracts/platform-integrity-cockpit-contracts.ts` | Cockpit Platform Integrity backend view |
| `platform-integrity/data/platform-integrity-rule-seed.ts` | 19 registry-driven integrity rules |
| `platform-integrity/registry/platform-integrity-registry-resolver.ts` | REG-CERTIFICATION-INTEGRITY resolver |
| `platform-integrity/registry/programme-module-resolver.ts` | moduleResolverRef → module contracts |
| `platform-integrity/validation/ownership-validator.ts` | Ownership matrix + missing/invalid detection |
| `platform-integrity/validation/duplicate-ownership-detector.ts` | Duplicate ownership re-export |
| `platform-integrity/validation/dependency-validator.ts` | Dependency matrix + forbidden dep detection |
| `platform-integrity/validation/circular-dependency-validator.ts` | Circular dependency re-export |
| `platform-integrity/validation/architecture-drift-detector.ts` | Drift + missing certification detection |
| `platform-integrity/validation/programme-integrity-validator.ts` | Programme, module, subsystem validators |
| `platform-integrity/validation/module-integrity-validator.ts` | Module integrity re-export |
| `platform-integrity/validation/subsystem-integrity-validator.ts` | Subsystem integrity re-export |
| `platform-integrity/services/platform-integrity-scoring-service.ts` | Status derivation and scoring |
| `platform-integrity/services/platform-integrity-certification-service.ts` | Scan orchestrator |
| `platform-integrity/governance/platform-integrity-pillow-governance.ts` | Certification/ownership/override authority |
| `platform-integrity/ekls/platform-integrity-observation-store.ts` | EKLS observation store |
| `platform-integrity/ekls/platform-integrity-ekls-integration.ts` | EKLS record/search integration |
| `platform-integrity/plugins/platform-integrity-plugin-host.ts` | Plugin validators without core modification |
| `platform-integrity/tools/platform-integrity-tools.ts` | 6 Brain tools |
| `validation/tests/g6-01-platform-integrity-certification.test.ts` | 15 validation tests |

---

## 2. Files Modified

| File | Change |
|------|--------|
| `registry/types/certification-registry-types.ts` | Added `probe:platform_integrity_scan`, integrity rule schema |
| `registry/types/registry-ids.ts` | Added REG-CERTIFICATION-INTEGRITY; fixed DERIVED_VIEW_IDS |
| `registry/types/registry-types.ts` | Cache policy for integrity registry |
| `registry/validation/certification-registry-validator.ts` | Validates platformIntegrityRule config |
| `registry/sources/certification-source.ts` | Loads PLATFORM_INTEGRITY_RULE_SEED_ROWS |
| `registry/registry-loader.ts` | Routes REG-CERTIFICATION-INTEGRITY |
| `production-certification/data/certification-registry-seed.ts` | Added cert-check-platform-integrity-scan |
| `production-certification/contract/production-certification-module.ts` | G6-01 mission, platform integrity capabilities |
| `production-certification/registry/certification-registry-resolver.ts` | 4th registry in listCertificationRegistryIds |
| `production-certification/services/certification-probe-registry.ts` | probe:platform_integrity_scan handler |
| `production-certification/index.ts` | Platform integrity public surface + test reset |
| `brain/index.ts` | Registered platformIntegrityTools |
| `validation/tests/g6-00-production-certification-framework.test.ts` | Updated G6-01 contract + 4 registry assertions |

---

## 3. Certification Domains Validated

Platform architecture · Subsystem boundaries · Programme ownership · Registry ownership · Brain ownership · Pillow ownership · EKLS ownership · Cockpit ownership · Plugin ownership · Business Engine ownership · Identity ownership · Commerce ownership · Automation ownership

Programmes validated via registry rules: EKLS · G0–G5 · G8 · Registry · Brain · Pillow · Guardian · Business Engines · Plugin Framework

---

## 4. Platform Integrity Result States (5)

pass · pass_with_conditions · warning · blocked · fail

---

## 5. REG-CERTIFICATION-INTEGRITY Rules (19)

| Rule Kind | Count | Coverage |
|-----------|-------|----------|
| ownership | 10 | commerce, automation, pillow, brain, ekls, registry, cockpit, identity, plugin-framework |
| dependency | 2 | commerce, automation integration boundaries |
| programme | 4 | G2, G3, G5, G6 module contracts |
| module | 1 | identity-registry |
| subsystem | 1 | business-engines |
| drift | 2 | commerce/cockpit separation, engine/governance separation |

---

## 6. Validation Rules Enforced

- Duplicate ownership detection (conflicting owners per subsystem)
- Missing ownership detection
- Invalid ownership detection (canonical owner in forbidden list)
- Architectural drift detection (forbidden integrations)
- Illegal dependency detection (forbiddenDependencies)
- Circular dependency detection (bidirectional integration paths)
- Programme integrity (expectedProgrammeStatus via moduleResolverRef)
- Module integrity (moduleId matches canonicalOwner)
- Subsystem integrity (registryRef resolution)
- Missing certification records (failed programme status)
- Plugin validator extensions (integrity, dependency, ownership, risk_analyser)

---

## 7. Brain Tools (6)

| Tool | Authority | Purpose |
|------|-----------|---------|
| `platform_integrity_overview` | L1 | Framework overview + Cockpit view |
| `platform_integrity_scan` | L2 | Full registry-driven integrity scan |
| `ownership_matrix` | L1 | Ownership matrix + duplicate findings |
| `dependency_matrix` | L1 | Dependency matrix + circular findings |
| `architecture_drift_report` | L1 | Drift findings report |
| `platform_integrity_status` | L1 | Latest scan status + Cockpit view |

---

## 8. Pillow Governance

Validates on every scan:
- Certification authority
- Ownership authority
- Override authority (override_request operation)
- Evidence integrity
- Constitutional compliance

**No certification bypass** — Pillow governance required on all operations.

---

## 9. EKLS Records (5 kinds)

| Kind | Trigger |
|------|---------|
| `platform_integrity_scan` | Every scan completion |
| `ownership_violation` | Ownership rule violations |
| `architecture_drift` | Drift rule findings |
| `dependency_violation` | Forbidden dependency findings |
| `integrity_certified` | pass or pass_with_conditions outcome |

Channel: `production-certification` (Pillow-governed)

---

## 10. Cockpit Backend Contracts

`CockpitPlatformIntegrityView` exposes:
- Platform Integrity overview
- Architecture Health (status, score, label)
- Ownership Matrix
- Dependency Matrix
- Certification Status
- Risk Summary (violation/drift/duplicate/circular counts + top risks)

Presentation deferred — backend contract only per mission directive.

---

## 11. Plugin Support

`platform-integrity-plugin-host` registers plugins for:
- integrity validators
- dependency validators
- ownership validators
- risk analysers

Plugins require Pillow governance manifest; hooks run during scan without modifying certification core.

---

## 12. Security

- No credentials, tokens, vault references, or private infrastructure exposed in scan output
- Reuses G6-00 evidence redaction patterns for certification probe evidence

---

## 13. Programme Contract Update

| Field | G6-00 | G6-01 |
|-------|-------|-------|
| missionId | G6-00 | G6-01 |
| programmeStatus | framework-complete | platform-integrity-certified |
| New capabilities | — | 6 platform integrity Brain tool capabilities |

---

## 14. Validation Results

| Check | Result |
|-------|--------|
| Backend typecheck | **PASS** |
| Frontend typecheck | **PASS** |
| G6-00 tests (11) | **PASS** |
| G6-01 tests (15) | **PASS** |
| Total G6 tests | **26/26 PASS** |

---

## 15. Mission Completion Checklist

- [x] Platform integrity contracts
- [x] Ownership validator
- [x] Dependency validator
- [x] Architecture drift detector
- [x] Duplicate ownership detector
- [x] Circular dependency validator
- [x] Module integrity validator
- [x] Subsystem integrity validator
- [x] Programme integrity validator
- [x] Brain integration (6 tools)
- [x] Pillow governance
- [x] EKLS certification recording
- [x] Cockpit certification contracts
- [x] Plugin support
- [x] Tests
- [x] Executive audit generated
- [x] G6-02 **not started**

---

**Mission G6-01: COMPLETE**
