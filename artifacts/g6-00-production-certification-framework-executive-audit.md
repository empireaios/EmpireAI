# G6-00 — Production Certification Framework · Executive Audit

**Mission:** G6-00 — Production Certification Framework  
**Authority:** Grand King · Pillow §17 · EKLS · Brain · Registry System (EA-003) · G2–G5 Programme Certifications  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** Canonical production certification layer — validates, audits, certifies, blocks, or approves production readiness · **no new product capability**  
**Stop directive:** G6-01 **not started**

---

## Executive Summary

G6-00 implements the **Production Certification Framework** — the canonical certification layer that determines whether the completed EmpireAI platform is production-ready for Grand King live operations. The framework provides registry-driven certification definitions, a Pillow-governed certification runner, gate model, result/blocker/risk/evidence models, scoring, Brain tools, EKLS records, and Cockpit backend contracts — **without creating new product capabilities**.

**G6-01 not started** per mission directive.

---

## 1. Files Created

| File | Purpose |
|------|---------|
| `registry/types/certification-registry-types.ts` | Domain, check, gate schemas; 15 domains; 10 probe refs |
| `registry/validation/certification-registry-validator.ts` | Registry row validation |
| `registry/sources/certification-source.ts` | EA-004 seed importer |
| `production-certification/contracts/production-certification-types.ts` | Check/run contracts, 8 result states |
| `production-certification/contract/production-certification-module.ts` | Brain module `production-certification` |
| `production-certification/contract/cockpit-certification-module.ts` | Certification Centre backend contract |
| `production-certification/data/certification-registry-seed.ts` | 15 domains, 15 checks, 15 gates |
| `production-certification/registry/certification-registry-resolver.ts` | RegistryLoader resolver |
| `production-certification/governance/certification-pillow-governance.ts` | Pillow certification authority |
| `production-certification/ekls/*` | Observation store, governance, integration |
| `production-certification/services/certification-evidence-service.ts` | Secret redaction |
| `production-certification/services/certification-scoring-service.ts` | Score aggregation |
| `production-certification/services/certification-probe-registry.ts` | Registry-driven probe execution |
| `production-certification/services/certification-runner-service.ts` | Certification runner |
| `production-certification/tools/production-certification-tools.ts` | 8 Brain tools + 3 list tools |
| `production-certification/index.ts` | Public surface + test reset |
| `validation/tests/g6-00-production-certification-framework.test.ts` | 11 validation tests |

---

## 2. Files Modified

| File | Change |
|------|--------|
| `registry/types/registry-ids.ts` | Added REG-CERTIFICATION-DOMAIN/CHECK/GATE |
| `registry/types/registry-types.ts` | Cache policies for certification registries |
| `registry/registry-loader.ts` | Routes certification registries through loader |
| `registry/index.ts` | Exported certification registry surface |
| `pillow/ekls/services/ekls-governance-gateway.ts` | Added `production-certification` consumer channel |
| `brain/index.ts` | Registered `productionCertificationTools` |

---

## 3. Certification Domains (15)

Platform Integrity · Pillow Governance · Brain Execution · EKLS Memory · Registry Compliance · G2 Commerce · G3 Intelligence · G4 Cockpit · G5 Automation · G8 Identity & Authorization · Security · Infrastructure · Production Deployment · Operational Readiness · Grand King Readiness

All defined as **REG-CERTIFICATION-DOMAIN** rows — no hardcoded domain assumptions in runner core.

---

## 4. Certification Result States (8)

pass · pass_with_conditions · warning · blocked · fail · not_applicable · not_tested · unknown

---

## 5. Certification Contract

Every check result includes: certificationId, domain, checkId, checkName, scope, status, severity, evidence, blockers, risks, recommendations, owner, timestamp, correlationId, governanceState, score.

---

## 6. Registry Integration

| Registry | Rows | Purpose |
|----------|------|---------|
| REG-CERTIFICATION-DOMAIN | 15 | Certification domains |
| REG-CERTIFICATION-CHECK | 15 | Probe-driven checks |
| REG-CERTIFICATION-GATE | 15 | Production gates |

Checks reference `probeRef` values resolved at runtime — **no hardcoded gates in runner**.

---

## 7. Pillow Governance

Pillow validates: certification authority, scope, evidence integrity, blocker severity, override eligibility, production eligibility. **No certification bypasses Pillow.**

---

## 8. Brain Integration

Module: `production-certification`

| Tool | Purpose |
|------|---------|
| certification_overview | Framework overview + Cockpit contract |
| run_certification_check | Single check execution |
| run_certification_domain | Domain-level run |
| run_full_certification | Full Empire certification |
| certification_status | Run status |
| certification_blockers | Blocker list |
| certification_risk_register | Risk register |
| certification_evidence | Redacted evidence |

---

## 9. EKLS Integration

Observation kinds: certification_started, certification_passed, certification_failed, certification_blocked, certification_risk_recorded, certification_evidence_recorded, certification_override_requested

All recorded through Pillow-governed EKLS on channel `production-certification`.

---

## 10. Cockpit Integration

Backend contract `cockpit-certification-centre` exposed via `buildCockpitCertificationCentreView()`. Route registration deferred (`presentationDeferred: true`, future mission G6-01+). **No full UI built.**

---

## 11. Security

Evidence uses redacted metadata only. Secret patterns (password, api_key, token, sk_live_, etc.) redacted to `[REDACTED]`. `assertNoSecretsInEvidence()` validates before results finalize.

---

## 12. Validation Results

| Check | Result |
|-------|--------|
| Backend typecheck | **PASS** |
| Frontend typecheck | **PASS** |
| G6-00 tests | **11/11 PASS** |
| Version | `g6-00-v1` |

---

## 13. Stop Directive

Mission G6-00 complete. **G6-01 not started.**

---

*G6-00 Production Certification Framework · Executive Audit · 2026-06-21 · Grand King Authority*
