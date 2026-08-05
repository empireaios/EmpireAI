# EmpireAI Implementation Recovery Planner System

PILLOW-IRPLN-001 / Q13-05 provides governed implementation recovery planning — never executes recovery; never modifies repository code.

Implementation Recovery Planner **consumes** the `Q1305ConsumableContract` from injected `cursorSpecificationGenerator` (via `getQ1305ConsumableContract()`). It **integrates** with `repositoryIntelligenceEngine`, `implementationSpecificationEngine`, `missionPlanningEngine`, and optionally `empireKnowledgeEngine`. It **exposes** `Q1306ConsumableContract` for Q13-06 without implementing Q13-06 or later.

## Workflow

1. Detect interrupted or incomplete mission from explicit input (missionId, interruptionReason, expectedPaths).
2. Analyse current repository state read-only via RIENG handle and/or `fs.existsSync` on expected paths.
3. Compare repository findings against CSGEN/ISENG/MPENG approved specification.
4. Detect completed, partial, missing, and conflicting implementations.
5. Generate recovery strategy preserving completed work.
6. Generate RecoveryPlan and production-grade Recovery Specification (constitutional body for Cursor resume).
7. Produce machine-readable `RecoveryReport`.
8. Submit via Executive Reporting Runtime when requested.
9. Expose `Q1306ConsumableContract` for Q13-06 without implementing Q13-06.

## RecoveryPlan model

Fields: `recoveryId`, `programme`, `missionId`, `repositorySnapshot`, `approvedMissionSpecification`, `repositoryFindings`, `completedComponents`, `partialComponents`, `missingComponents`, `conflictingComponents`, `filesToPreserve`, `filesRequiringExtension`, `recoverySequence`, `validationPlan`, `acceptanceCriteria`, `risks`, `estimatedRecoveryScope`, `timestamp`.

## Recovery Specification sections

Mission, Approved specification, Repository audit, Completed work to preserve, Partial work to extend, Missing implementation, Conflicts, Recovery sequence, Validation, Acceptance, Stop boundary.

## Integrations

- Cursor Specification Generator (CSGEN) — consumes `getQ1305ConsumableContract()`; required prerequisite
- Repository Intelligence Engine (RIENG) — read-only repository snapshot
- Implementation Specification Engine (ISENG) — optional specifications
- Mission Planning Engine (MPENG) — optional planning context
- Empire Knowledge Engine — optional knowledge context
- Pillow Orchestration Runtime — workflow topology
- Audit Runtime — audit signals
- Executive Reporting Runtime — `submitWorkerReport`

## Boundaries

Implementation Recovery Planner:

- **does** plan recovery from interrupted missions using read-only repository analysis
- **does** consume Q1305 cursor specification from Cursor Specification Generator
- **does** expose `Q1306ConsumableContract` for Q13-06 without implementing Q13-06
- does **not** execute recovery or modify repository code
- does **not** overwrite verified implementations
- does **not** delete production code without evidence
- does **not** restart completed work unnecessarily
- does **not** fabricate repository findings
- does **not** bypass Pillow/Grand King governance
- does **not** implement Q13-06 or later

## Recovery gate

If `pillowCommandConfirmed` missing, Q1305 not consumable, repository not analysed, or interruptionReason missing — withhold recovery plan and fail validation with outstanding issues.

## Stop Boundary

Q13-05 stops at recovery planning and reporting. Q13-06 is explicitly out of scope; IRPLN only exposes the `Q1306ConsumableContract` as a structural signal. Do not auto-execute recovery.

## Distinctness

Implementation Recovery Planner (`pillow/src/implementation-recovery-planner/`, IRPLN, Q13-05) is distinct from:

- Cursor Specification Generator (CSGEN, Q13-04) — cursor specification generation; IRPLN consumes its Q1305 contract
- Legacy Recovery Runtime (`pillow/src/recovery-runtime/`) — preserved unchanged; soft collision, not replaced
- Legacy Recovery Audit (`pillow/src/recovery-audit/`) — preserved unchanged; soft collision, not replaced
