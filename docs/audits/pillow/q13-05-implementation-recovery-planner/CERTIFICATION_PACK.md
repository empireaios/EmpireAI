# Q13-05 Implementation Recovery Planner — Certification Pack

**Engine:** PILLOW-IRPLN-001  
**Mission:** Q13-05  
**Version:** IRPLN-001-v1 / Q13-IRPLN-v1

## Scope

Implementation recovery planning only. Consumes Q1305 from Cursor Specification Generator; exposes Q1306 for Q13-06 without implementing Q13-06+.

## Boundaries (locked)

- neverExecuteRecovery
- neverModifyRepository
- neverImplementQ1306OrLater
- neverOverwriteVerifiedImplementations
- neverDeleteProductionCodeWithoutEvidence
- neverRestartCompletedWorkUnnecessarily
- neverFabricateRepositoryFindings
- neverBypassGovernance

## Certification status

Recovery planner module implemented with 12/12 IRPLN tests + 12/12 CSGEN regression = 24/24.
