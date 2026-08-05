# EmpireAI Mission Planning Engine System

PILLOW-MPENG-001 / Q13-03 provides governed mission planning — never modifies repository; never executes implementation.

Mission Planning Engine **consumes** the `Q1303ConsumableContract` from injected `repositoryIntelligenceEngine` (via `getQ1303ConsumableContract()`). It **optionally observes** specifications from `implementationSpecificationEngine` (via `getQ1302ConsumableContract()` / `getLatestReport()`). It **exposes** `Q1304ConsumableContract` for Q13-04 without implementing Q13-04 or later.

## Workflow

1. Analyse approved mission from explicit input (missionId, missionName, programme).
2. Consume repository intelligence via Q1303 contract and RIENG reports.
3. Identify implementation dependencies from RIENG contract/report + optional ISENG specs.
4. Determine deterministic execution sequence (parse → preserve existing → scaffold → integrate → validate → accept).
5. Identify integration points (Pillow session, host routes, ERR, audit, orchestration).
6. Produce validation strategy and acceptance criteria.
7. Estimate implementation risks (fabrication, overwrite, governance bypass, missing RIENG, scope creep).
8. Generate complete MissionPlan model.
9. Produce machine-readable `MissionPlanningReport`.
10. Submit via Executive Reporting Runtime when requested.
11. Expose `Q1304ConsumableContract` for Q13-04 without implementing Q13-04.

## MissionPlan model

Fields: `planId`, `missionId`, `missionName`, `repositorySnapshot`, `dependencies`, `executionOrder`, `integrationPoints`, `validationStrategy`, `acceptanceCriteria`, `risks`, `constraints`, `estimatedScope`, `governanceRequirements`, `timestamp`.

## Integrations

- Repository Intelligence Engine (RIENG) — consumes `getQ1303ConsumableContract()`; required prerequisite
- Implementation Specification Engine (ISENG) — optional specifications as planning input
- Intelligence Context (PILLOW-003) — optional legacy context
- Pillow Orchestration Runtime — workflow topology
- Audit Runtime — audit signals
- Executive Reporting Runtime — `submitWorkerReport`
- Empire Knowledge Engine — optional knowledge context

## Boundaries

Mission Planning Engine:

- **does** analyse approved missions and produce deterministic mission plans
- **does** consume Q1303 repository intelligence from Repository Intelligence Engine
- **does** expose `Q1304ConsumableContract` for Q13-04 without implementing Q13-04
- does **not** modify repository files
- does **not** execute implementation
- does **not** fabricate repository state
- does **not** bypass Pillow/Grand King governance
- does **not** implement Q13-04 or later

## Stop Boundary

Q13-03 stops at mission planning reporting. Q13-04 is explicitly out of scope; MPENG only exposes the `Q1304ConsumableContract` as a structural signal.

## Distinctness

Mission Planning Engine (`pillow/src/mission-planning-engine/`, MPENG, Q13-03) is distinct from:

- Repository Intelligence Engine (RIENG, Q13-02) — read-only repository analysis; MPENG consumes its Q1303 contract
- Implementation Specification Engine (ISENG, Q13-01) — specification generation; optional planning input
- Legacy Mission Planner (`pillow/src/planner/`, MissionPlannerEngine) — preserved unchanged; soft collision only
