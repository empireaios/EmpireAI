# Q0-16 Decision Memory

**Status:** FINAL PASS  
**Doctrine:** PILLOW-DMEM-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-16 Decision Memory  
**Primary Deliverable:** Stores decisions, reasons, evidence, assumptions, confidence, alternatives and final outcomes.

> Doctrine ID uses **PILLOW-DMEM-001** because `PILLOW-DE-001` is reserved for Decision Engine (Q0-05). Decision Memory is the permanent executive decision history repository.

## How Q0-16 works

1. Pillow records every significant executive decision through the authoritative Decision Memory.
2. Each Decision Record captures rationale, supporting evidence, assumptions, alternatives, risk, confidence, approvals, outcomes, and links to businesses, missions, and workers.
3. Historical decisions are retrieved by Decision ID and searched by business, mission, worker, outcome, confidence, date, and approval status.
4. Prior decisions can be compared without remaking decisions.
5. Every record is machine-readable (`DMEM-001-v1`).
6. Decision Memory never makes decisions, executes work, replaces Execution Memory, overrides Pillow, or overrides Grand King.

## Decision Record fields

`decisionId`, `timestamp`, `executiveObjective`, `businessId`, `missionId`, `decisionSummary`, `recommendedOption`, `alternativeOptions`, `decisionRationale`, `supportingEvidence`, `assumptions`, `riskAssessment`, `confidenceScore`, `approvalStatus`, `finalOutcome`, `relatedWorkers`, `metadataVersion`

## Lookup dimensions

`decision_id`, `business`, `mission`, `worker`, `outcome`, `confidence`, `date`, `approval_status`

## Verification

`npx --yes tsx --test "src/validation/tests/decision-memory.test.ts"` — 10 passing, 0 failing.
