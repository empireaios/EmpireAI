# G6-02 — Security & Governance Certification · Executive Audit

**Mission:** G6-02 — Security & Governance Certification  
**Authority:** Grand King · Pillow §17 · EKLS · Brain · Registry System (EA-003) · G6-00/G6-01 Programme Certifications  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** Constitutional security model certification before production deployment · **certification capability only — no new runtime platform functionality**  
**Stop directive:** G6-03 **not started**

---

## Executive Summary

G6-02 implements the **Security & Governance Certification** subsystem — certifying that EmpireAI satisfies its constitutional security model before production deployment. The subsystem validates secret handling, credential protection, workspace isolation, plugin trust, registry compliance, Brain/Pillow/EKLS boundaries, and executive risk posture.

All security policies resolve through **REG-CERTIFICATION-SECURITY** registry rows. Validators iterate discovered rules — no hardcoded provider, workspace, credential, or plugin policies in validator core. Pillow governs every scan; EKLS records all findings; Brain exposes seven operational tools; Cockpit receives backend contracts only.

**G6-03 not started** per mission directive.

---

## 1. Files Created

| File | Purpose |
|------|---------|
| `security-governance/contracts/security-governance-types.ts` | Scan result, violation, risk, EKLS kind contracts |
| `security-governance/contracts/security-governance-cockpit-contracts.ts` | Cockpit Security & Governance backend view |
| `security-governance/data/security-governance-rule-seed.ts` | 15 registry-driven security rules |
| `security-governance/registry/security-governance-registry-resolver.ts` | REG-CERTIFICATION-SECURITY resolver |
| `security-governance/validation/secret-handling-validator.ts` | Secret redaction validation |
| `security-governance/validation/credential-exposure-validator.ts` | Credential/token/hardcoded detection |
| `security-governance/validation/pillow-governance-validator.ts` | Pillow authority validation |
| `security-governance/validation/registry-compliance-validator.ts` | Registry integrity compliance |
| `security-governance/validation/brain-boundary-validator.ts` | Brain execution boundary |
| `security-governance/validation/ekls-boundary-validator.ts` | EKLS ownership boundary |
| `security-governance/validation/workspace-isolation-validator.ts` | Workspace/cross-workspace isolation |
| `security-governance/validation/plugin-security-validator.ts` | Plugin trust validation |
| `security-governance/validation/boundary-validators.ts` | Commerce/automation/identity/cockpit/vault |
| `security-governance/validation/executive-risk-analyser.ts` | Risk register + recommendations |
| `security-governance/services/security-governance-scoring-service.ts` | Status derivation and scoring |
| `security-governance/services/security-governance-certification-service.ts` | Scan orchestrator |
| `security-governance/governance/security-governance-pillow-governance.ts` | Security/governance/certification authority |
| `security-governance/ekls/security-governance-observation-store.ts` | EKLS observation store |
| `security-governance/ekls/security-governance-ekls-integration.ts` | EKLS record/search integration |
| `security-governance/plugins/security-governance-plugin-host.ts` | Plugin validators without core modification |
| `security-governance/tools/security-governance-tools.ts` | 7 Brain tools |
| `validation/tests/g6-02-security-governance-certification.test.ts` | 18 validation tests |

---

## 2. Files Modified

| File | Change |
|------|--------|
| `registry/types/certification-registry-types.ts` | `g6-02-v1`, securityGovernanceRule schema, new probes |
| `registry/types/registry-ids.ts` | Added REG-CERTIFICATION-SECURITY |
| `registry/types/registry-types.ts` | Cache policy for security registry |
| `registry/validation/certification-registry-validator.ts` | Validates securityGovernanceRule config |
| `registry/sources/certification-source.ts` | Loads SECURITY_GOVERNANCE_RULE_SEED_ROWS |
| `registry/registry-loader.ts` | Routes REG-CERTIFICATION-SECURITY |
| `production-certification/data/certification-registry-seed.ts` | Security/governance check rows |
| `production-certification/contract/production-certification-module.ts` | G6-02 mission, 7 security capabilities |
| `production-certification/registry/certification-registry-resolver.ts` | 5th registry in list |
| `production-certification/services/certification-probe-registry.ts` | security_governance_scan + governance_scan probes |
| `production-certification/platform-integrity/data/platform-integrity-rule-seed.ts` | G6 expected status updated |
| `production-certification/index.ts` | Security governance public surface + test reset |
| `brain/index.ts` | Registered securityGovernanceTools |
| `validation/tests/g6-00-production-certification-framework.test.ts` | G6-02 contract + 5 registry assertions |
| `validation/tests/g6-01-platform-integrity-certification.test.ts` | G6 programme status alignment |

---

## 3. Security Domains Validated

Secret handling · Credential protection · Vault integration · Workspace isolation · Cross-workspace isolation · Plugin trust · Registry integrity · Brain execution boundary · Pillow governance · EKLS ownership · Cockpit presentation boundary · Business Automation boundary · Commerce boundary · Identity boundary · Constitutional governance aggregate

---

## 4. Security Checks Enforced

- Secret leakage detection (evidence redaction probe)
- Credential leakage detection (redaction validation)
- Token exposure detection
- Hardcoded credential detection
- Vault bypass detection
- Brain bypass detection
- Pillow bypass detection
- Registry bypass detection (on resolution failure)
- EKLS bypass detection
- Cross-workspace leakage detection
- Plugin privilege escalation detection
- Unauthorized execution detection
- Unsafe logging/artifacts registration (extensible via registry)

---

## 5. REG-CERTIFICATION-SECURITY Rules (15)

| Rule Kind | Count | Coverage |
|-----------|-------|----------|
| secret_handling | 1 | certification evidence redaction |
| credential_protection | 1 | platform credentials |
| vault_integration | 1 | vault gateway |
| workspace_isolation | 1 | workspace scope |
| cross_workspace | 1 | tenant boundary |
| plugin_trust | 1 | plugin framework |
| registry_integrity | 1 | REG-DOCTRINE |
| brain_boundary | 1 | Brain execution |
| pillow_governance | 1 | Pillow authority |
| ekls_boundary | 1 | EKLS ownership |
| cockpit_boundary | 1 | presentation layer |
| automation_boundary | 1 | G5 business automation |
| commerce_boundary | 1 | G2 infrastructure commerce |
| identity_boundary | 1 | identity registry |
| governance | 1 | constitutional aggregate |

---

## 6. Brain Tools (7)

| Tool | Authority | Purpose |
|------|-----------|---------|
| `security_overview` | L1 | Overview + Cockpit view |
| `security_scan` | L2 | Security-focused scan |
| `governance_scan` | L2 | Governance-focused scan |
| `workspace_security` | L1 | Workspace isolation findings |
| `plugin_security` | L1 | Plugin trust findings |
| `security_risk_register` | L1 | Risk register + recommendations |
| `security_status` | L1 | Latest status + Cockpit view |

---

## 7. Pillow Governance

Validates on every operation:
- Security authority
- Governance authority
- Certification authority
- Override authority (override_request)
- Constitutional compliance

**No certification bypass permitted.**

---

## 8. EKLS Records (7 kinds)

| Kind | Trigger |
|------|---------|
| `security_scan_completed` | Security scan completion |
| `governance_scan_completed` | Governance scan completion |
| `security_violation` | Security rule violations |
| `credential_exposure_detected` | Credential findings |
| `workspace_violation` | Workspace isolation findings |
| `plugin_violation` | Plugin security findings |
| `security_certified` | pass or pass_with_conditions outcome |

Channel: `production-certification` (Pillow-governed)

---

## 9. Cockpit Backend Contracts

`CockpitSecurityGovernanceView` exposes:
- Security Overview
- Governance Status (status, score, label)
- Security Findings
- Risk Register
- Certification Status
- Executive Recommendations

Presentation deferred — backend contract only per mission directive.

---

## 10. Plugin Support

`security-governance-plugin-host` registers plugins for:
- security validators
- governance validators
- risk analysers
- credential validators
- workspace validators

Plugins require Pillow governance manifest; hooks run during scan without modifying certification core.

---

## 11. Security Guarantees

Never exposes in scan output:
- credentials, tokens, refresh tokens, API keys, secret keys
- vault paths, private infrastructure references

Reuses G6-00 `certification-evidence-service.ts` redaction infrastructure.

---

## 12. Programme Contract Update

| Field | G6-01 | G6-02 |
|-------|-------|-------|
| missionId | G6-01 | G6-02 |
| programmeStatus | platform-integrity-certified | security-governance-certified |
| New capabilities | — | 7 security governance Brain tool capabilities |

---

## 13. Validation Results

| Check | Result |
|-------|--------|
| Backend typecheck | **PASS** |
| Frontend typecheck | **PASS** |
| G6-00 tests (11) | **PASS** |
| G6-01 tests (15) | **PASS** |
| G6-02 tests (18) | **PASS** |
| Total G6 tests | **44/44 PASS** |

---

## 14. Mission Completion Checklist

- [x] Security certification contracts
- [x] Governance certification contracts
- [x] Secret handling validator
- [x] Credential exposure validator
- [x] Pillow governance validator
- [x] Registry compliance validator
- [x] Brain boundary validator
- [x] EKLS boundary validator
- [x] Workspace isolation validator
- [x] Plugin security validator
- [x] Executive risk analyser
- [x] Brain integration (7 tools)
- [x] Pillow governance
- [x] EKLS certification recording
- [x] Cockpit backend contracts
- [x] Plugin support
- [x] Tests
- [x] Executive audit generated
- [x] G6-03 **not started**

---

**Mission G6-02: COMPLETE**
