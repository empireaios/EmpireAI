# Q12-01 AI Innovation Factory — Certification Pack

**Engine:** PILLOW-AIFRT-001  
**Mission:** Q12-01  
**Metadata:** AIFRT-001-v1  
**Report Version:** AIFRT-RPT-v1  
**Runtime Version:** Q12-AIFRT-v1  

## Scope

Governed AI innovation research/recommend factory. Consumes QSCPT Q1201 contract; exposes Q1301 contract for Q13-01 without implementing Q13-01.

## Locked Boundaries

| Boundary | Value |
|----------|-------|
| neverFabricateResearchEvidence | true |
| neverAutoDeployInnovations | true |
| neverBypassGovernance | true |
| neverOverridePillow | true |
| neverOverrideGrandKing | true |
| neverImplementQ1301OrLater | true |
| neverClaimQSeriesCompleteWhenIncomplete | true |

## Series-Complete Gate

- `seriesCompleteActivation=true` only when QSCPT Q1201 consumed AND `finalCompletionDecision=complete`
- Research permitted with `seriesCompleteActivation=false` when Q Series incomplete

## Validation

- 12 structural tests in `pillow/src/validation/tests/ai-innovation-factory.test.ts`
- Regression with QSCPT: 24/24 combined

## Distinctness

Distinct from empireInnovationEngine (PILLOW-EIN-001 / X5-07), research workers, opportunity-scanner.
