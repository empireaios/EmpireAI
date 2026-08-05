# EmpireAI Implementation Specification Engine System

PILLOW-ISENG-001 / Q13-01 provides governed architecture-aware implementation specifications — never executes implementations.

Implementation Specification Engine **consumes** the `Q1301ConsumableContract` from injected `aiInnovationFactory` (via `getQ1301ConsumableContract()`). It **exposes** `Q1302ConsumableContract` for Q13-02 without implementing Q13-02 (Repository Intelligence Engine).

## Workflow

1. Parse approved roadmap missions from explicit input and optional repository audit evidence.
2. Analyse repository architecture using read-only scans and injected inventories.
3. Discover implementation dependencies from session wiring and import patterns.
4. Detect existing implementations to preserve (never overwrite verified modules).
5. Generate complete `ImplementationSpecification` objects with locked fields.
6. Include validation requirements and integration requirements.
7. Preserve constitutional governance (Pillow/Grand King locks).
8. Version every specification (immutable history).
9. Produce machine-readable `ImplementationSpecificationReport`.
10. Submit via Executive Reporting Runtime when requested.
11. Expose `Q1302ConsumableContract` for Q13-02 without implementing Q13-02.

## ImplementationSpecification model

Fields: `specificationId`, `programme`, `missionId`, `missionName`, `repositoryFindings`, `dependencies`, `architectureSummary`, `filesExpected`, `requiredCapabilities`, `validationPlan`, `integrationPlan`, `risks`, `constraints`, `governanceRequirements`, `version`, `timestamp`.

## Integrations

- AI Innovation Factory (AIFRT) — consumes `getQ1301ConsumableContract()`; innovation prerequisite
- Q Series Completion — optional context
- Intelligence Context (PILLOW-003) — optional legacy repository intelligence
- Shared Runtime Core — factory inventory
- Worker Registry — worker topology
- Pillow Orchestration Runtime — workflow topology
- Audit Runtime — audit signals
- Executive Reporting Runtime — `submitWorkerReport`

## Boundaries

Implementation Specification Engine:

- **does** produce architecture-aware implementation specifications from evidence
- **does** consume Q1301 innovation prerequisite from AI Innovation Factory
- **does** expose `Q1302ConsumableContract` for Q13-02 without implementing Q13-02
- does **not** fabricate repository state
- does **not** overwrite verified implementations
- does **not** execute implementations
- does **not** auto-deploy
- does **not** bypass Pillow/Grand King governance
- does **not** implement Q13-02 or later

## Stop Boundary

Q13-01 stops at implementation specification generation. Q13-02 (Repository Intelligence Engine) is explicitly out of scope; ISENG only exposes the `Q1302ConsumableContract` for that future mission to consume.

## Distinctness

Implementation Specification Engine (`pillow/src/implementation-specification-engine/`, ISENG, Q13-01) is distinct from:

- AI Innovation Factory (AIFRT, Q12-01) — innovation research; ISENG consumes its Q1301 contract
- Repository Intelligence Engine (RIENG, Q13-02) — read-only repository intelligence; ISENG never implements it
- Empire Innovation Engine (EIN, X5-07) — separate innovation domain
