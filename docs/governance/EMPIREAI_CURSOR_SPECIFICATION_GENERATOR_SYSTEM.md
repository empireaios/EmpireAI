# EmpireAI Cursor Specification Generator System

PILLOW-CSGEN-001 / Q13-04 provides governed Cursor specification generation — never implements code; never executes Cursor missions.

Cursor Specification Generator **consumes** the `Q1304ConsumableContract` from injected `missionPlanningEngine` (via `getQ1304ConsumableContract()`). It **consumes** repository intelligence from `repositoryIntelligenceEngine` (Q1303) and **optionally observes** specifications from `implementationSpecificationEngine` (Q1302). It **exposes** `Q1305ConsumableContract` for Q13-05 without implementing Q13-05 or later.

## Workflow

1. Consume approved roadmap mission from explicit input (missionId, missionName, deliverable, programme, team).
2. Consume repository intelligence via Q1303 contract and RIENG reports.
3. Consume mission planning via Q1304 contract and MPENG plans/reports.
4. Consume implementation specifications from ISENG (optional).
5. Generate complete CursorSpecification model with constitutional markdown body.
6. Validate boundaries, governance, and completeness.
7. Produce machine-readable `CursorSpecificationReport`.
8. Submit via Executive Reporting Runtime when requested.
9. Expose `Q1305ConsumableContract` for Q13-05 without implementing Q13-05.

## CursorSpecification model

Fields: `cursorSpecificationId`, `programmeId`, `teamId`, `missionId`, `missionName`, `deliverable`, `sourceOfTruth`, `repositorySnapshotReference`, `implementationSpecificationReference`, `missionPlanReference`, `dependencies`, `existingImplementationsToPreserve`, `objective`, `requiredCapabilities`, `supportedFeatures`, `modelAndSchemaRequirements`, `mandatoryRules`, `boundaries`, `architecture`, `integrationRequirements`, `implementationRules`, `validationRequirements`, `acceptanceCriteria`, `completionRequirements`, `stopBoundary`, `specificationVersion`, `governanceStatus`, `approvalStatus`, `timestamp`, `constitutionalBody`.

## Constitutional body sections

Mission, Source of truth, Roadmap row, Implement ONLY this mission, Repository audit, Objective, Required capabilities, Supported features, Model/schema, Report schema, Mandatory rules, Boundaries, Architecture, Implementation rules, Validation, Mission completion, Stop before next mission.

## Integrations

- Mission Planning Engine (MPENG) — consumes `getQ1304ConsumableContract()`; required prerequisite
- Repository Intelligence Engine (RIENG) — consumes Q1303; required
- Implementation Specification Engine (ISENG) — optional specifications
- Empire Knowledge Engine — optional knowledge context
- Approval Runtime — governance status observation
- Grand King Acceptance Gate — governance status observation
- Pillow Orchestration Runtime — workflow topology
- Audit Runtime — audit signals
- Executive Reporting Runtime — `submitWorkerReport`
- Intelligence Context — optional legacy context

## Boundaries

Cursor Specification Generator:

- **does** generate governed Cursor specifications from approved roadmap missions and upstream engine contracts
- **does** consume Q1304 mission planning from Mission Planning Engine
- **does** expose `Q1305ConsumableContract` for Q13-05 without implementing Q13-05
- does **not** implement repository code
- does **not** execute Cursor missions
- does **not** invent missions or alter deliverables
- does **not** fabricate repository findings
- does **not** self-approve (approvalStatus pending_grand_king)
- does **not** bypass Pillow/Grand King governance
- does **not** implement Q13-05 or later

## Generation gate

If `pillowCommandConfirmed` missing, Q1304 not consumable, mission plan missing, RIENG unavailable, or missionId/deliverable missing — withhold generation and fail validation with outstanding issues.

## Stop Boundary

Q13-04 stops at Cursor specification reporting. Q13-05 is explicitly out of scope; CSGEN only exposes the `Q1305ConsumableContract` as a structural signal.

## Distinctness

Cursor Specification Generator (`pillow/src/cursor-specification-generator/`, CSGEN, Q13-04) is distinct from:

- Mission Planning Engine (MPENG, Q13-03) — mission planning; CSGEN consumes its Q1304 contract
- Repository Intelligence Engine (RIENG, Q13-02) — read-only repository analysis; CSGEN consumes Q1303
- Implementation Specification Engine (ISENG, Q13-01) — specification generation; optional input
- Legacy Mission Planner (`pillow/src/planner/`, MissionPlannerEngine) — preserved unchanged
