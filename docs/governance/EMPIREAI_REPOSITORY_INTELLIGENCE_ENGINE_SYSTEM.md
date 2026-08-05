# EmpireAI Repository Intelligence Engine System

PILLOW-RIENG-001 / Q13-02 provides governed read-only repository intelligence — never modifies analyzed files.

Repository Intelligence Engine **consumes** the `Q1302ConsumableContract` from injected `implementationSpecificationEngine` (via `getQ1302ConsumableContract()`). It **optionally observes** `Q1301ConsumableContract` from `aiInnovationFactory` for secondary innovation context. It **exposes** `Q1303ConsumableContract` for Q13-03 without implementing Q13-03 or later.

## Workflow

1. Discover repository structure via read-only scanner.
2. Analyse modules and services from scanned evidence.
3. Build dependency and integration graphs.
4. Detect implementation relationships and architectural boundaries.
5. Detect existing implementations and reusable components.
6. Detect conflicts, duplicates, and technical debt.
7. Maintain immutable repository knowledge history.
8. Produce machine-readable `RepositoryIntelligenceReport`.
9. Submit via Executive Reporting Runtime when requested.
10. Expose `Q1303ConsumableContract` for Q13-03 without implementing Q13-03.

## RepositoryIntelligenceSnapshot model

Fields: `repositorySnapshotId`, `repositoryVersion`, `repositoryFingerprint`, `moduleInventory`, `serviceInventory`, `dependencyGraph`, `integrationGraph`, `architectureLayers`, `existingImplementations`, `reusableComponents`, `technicalDebtFindings`, `conflicts`, `risks`, `timestamp`.

## Integrations

- Implementation Specification Engine (ISENG) — consumes `getQ1302ConsumableContract()`; specification prerequisite
- AI Innovation Factory (AIFRT) — optional `getQ1301ConsumableContract()` observation
- Intelligence Context (PILLOW-003) — optional legacy repository intelligence
- Pillow Orchestration Runtime — workflow topology
- Audit Runtime — audit signals
- Executive Reporting Runtime — `submitWorkerReport`
- Empire Knowledge Engine — optional knowledge context
- Monitoring Runtime — optional health signals

## Boundaries

Repository Intelligence Engine:

- **does** perform read-only repository structure discovery and analysis
- **does** consume Q1302 specification prerequisite from Implementation Specification Engine
- **does** expose `Q1303ConsumableContract` for Q13-03 without implementing Q13-03
- does **not** modify analyzed repository files
- does **not** fabricate repository state
- does **not** certify Q13-01
- does **not** bypass Pillow/Grand King governance
- does **not** implement Q13-03 or later

## Stop Boundary

Q13-02 stops at repository intelligence reporting. Q13-03 is explicitly out of scope; RIENG only exposes the `Q1303ConsumableContract` as a structural signal.

## Distinctness

Repository Intelligence Engine (`pillow/src/repository-intelligence-engine/`, RIENG, Q13-02) is distinct from:

- Implementation Specification Engine (ISENG, Q13-01) — specification generation; RIENG consumes its Q1302 contract
- Repository Intelligence (PILLOW-RI-002) — legacy module at `pillow/src/repository-intelligence/`; preserved unchanged; optional read-only observation only
- AI Innovation Factory (AIFRT, Q12-01) — innovation research; optional secondary observation
