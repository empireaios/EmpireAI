# EmpireAI Local Business Factory Core

PILLOW-LBFC-001 / Q7-01 provides the **Local Business Factory Core**.

The Local Business Factory Core coordinates discovery, registration, launch readiness, customer acquisition, fulfilment, and ongoing operations for local service businesses under Pillow executive authority. It orchestrates workers across the local-business lifecycle and produces machine-readable **Local Business Factory Reports** for downstream workers and executive reporting.

It is **orchestration only**. It does not perform specialist Q7 worker functions, replace Q7 workers, or fabricate operational status.

> Doctrine ID: **PILLOW-LBFC-001**. Metadata version `LBFC-001-v1`. Report version `LBFC-RPT-v1`. Mission version `LBFC-LBM-v1`. Factory version `Q7-LBFC-v1`. Worker ID: `wkr-local-business-factory-core-01`. Module ID: `local-business-factory-core`.

## Scope

Q7-01 covers Local Business Factory Core coordination only. Downstream specialist workers (Q7-02 and later) remain out of scope and must not be implemented by this module.

## Boundaries

The Local Business Factory Core:

- **does** register local business projects, coordinate lifecycle stages, assign/coordinate workers as structural signals, coordinate approval workflows, coordinate launch readiness / customer acquisition / fulfilment / ongoing operations, track project progress, produce Local Business Factory Reports, and submit reports via Executive Reporting Runtime
- does **not** perform specialist worker functions
- does **not** replace Q7 workers
- does **not** modify unrelated factories
- does **not** override approved architecture
- does **not** override Pillow or Grand King
- does **not** fabricate operational status
- does **not** bypass Grand King approval workflows
- does **not** implement Q7-02 or later
- does **not** expose credentials or authentication tokens

All boundary flags are force-locked `true` in configuration, projects, and reports.

## Local Business Factory Report structure

Each Local Business Factory Report includes:

| Field | Description |
|-------|-------------|
| `factoryId` | Factory identifier (`local-business-factory-core`) |
| `timestamp` | Report generation timestamp |
| `businessProjectId` | Associated local business project |
| `businessCategory` | Business category taxonomy value |
| `businessName` | Business display name |
| `currentLifecycleStage` | Local business lifecycle stage |
| `assignedWorkers` | Downstream worker IDs |
| `launchReadiness` | not_started, in_progress, ready, blocked, launched |
| `customerAcquisitionStatus` | not_started, coordinating, active, paused, completed, blocked |
| `operationalStatus` | not_started, coordinating, operating, degraded, blocked, completed |
| `outstandingIssues` | Observed outstanding issues (never fabricated) |
| `executiveSummary` | Orchestration summary |
| `confidenceScore` | 0–100 from observed fields only |
| `metadataVersion` | `LBFC-001-v1` |

Additional orchestration fields: `reportVersion`, `workerId`, `factoryMissionId`, `approvalStatus`, `missionCoordinationRef`, `executiveReportId`, `submittedToExecutiveReporting`, `assignedWorkerRoles`, `preservedDecisions`, `traceabilityRefs`, and force-locked boundary flags.

## Business categories

Default (extensible via config merge — never redesign required): handyman, cleaning, plumbing, electrical, air_conditioning_servicing, painting, renovation, pest_control, tutoring, beauty_services, car_detailing, pet_services, home_services, unknown.

## Lifecycle stages

opportunity_discovered → project_registered → workers_assigned → preparation → launch_readiness → launched → customer_acquisition → fulfilment → ongoing_operations → completed

## Mission statuses

drafted, active, coordinating, awaiting_approval, preparing, launch_ready, launched, acquiring_customers, fulfilling, operating, completed, rejected

## Integrations

- worker_registry
- worker_lifecycle
- worker_assignment_engine
- mission_coordination_engine
- executive_reporting_runtime
- worker_performance_review
- worker_recovery_system
- health_monitoring
- recovery_management
- local_business_factory_core_validation

## Safety

Credentials and authentication tokens are never exposed. Project and report creation preserves auditability and end-to-end traceability. Sensitive values are masked in logs. Approval workflows cannot be bypassed. Operational status is never fabricated — confidence scores derive only from observed fields. All coordination is structural signals only. Never implement Q7-02 or later inside this module.
