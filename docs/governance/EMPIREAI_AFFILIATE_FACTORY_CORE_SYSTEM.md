# EmpireAI Affiliate Factory Core

PILLOW-AFC-001 / Q8-01 provides the **Affiliate Factory Core**.

The Affiliate Factory Core orchestrates affiliate business projects: registration, lifecycle coordination, structural worker role slot coordination, dependency management between roles, business metadata maintenance, factory-wide readiness monitoring, and production of machine-readable **Affiliate Factory Reports** for downstream workers and executive reporting.

It is **orchestration only**. It does **not** discover affiliate programmes, does **not** generate affiliate content, and does **not** launch businesses automatically. Those capabilities belong to Q8-02 and later specialist workers, which are out of scope for this module and must never be implemented here.

> Doctrine ID: **PILLOW-AFC-001**. Metadata version `AFC-001-v1`. Report version `AFC-RPT-v1`. Project version `AFC-ABP-v1`. Factory version `Q8-AFC-v1`. Worker ID: `wkr-affiliate-factory-core-01`. Module ID: `affiliate-factory-core`.

## Scope

Q8-01 covers Affiliate Factory Core coordination only. Downstream specialist workers (Q8-02 and later — opportunity discovery, content generation, link tracking, conversion optimization, analytics, etc.) remain out of scope and must not be implemented by this module.

## Boundaries

The Affiliate Factory Core:

- **does** register affiliate business projects, coordinate lifecycle stages, register structural worker role slots (coordinate/assign workers), manage dependency edges between worker roles, maintain business metadata, monitor factory-wide readiness, track project status/progress, produce Affiliate Factory Reports, and submit reports via Executive Reporting Runtime
- does **not** discover affiliate programmes
- does **not** generate affiliate content
- does **not** launch businesses automatically
- does **not** fabricate worker status — worker status matrices reflect registered/coordinated workers from the project store only; an empty coordination state remains empty/unknown, never invented as healthy
- does **not** override approved architecture
- does **not** override Pillow or Grand King
- does **not** bypass Grand King approval workflows
- does **not** implement Q8-02 or later
- does **not** expose credentials or authentication tokens

All boundary flags are force-locked `true` in configuration, projects, and reports.

## Affiliate Factory Report structure

Each Affiliate Factory Report includes:

| Field | Description |
|-------|-------------|
| `reportId` | Report identifier |
| `timestamp` | Report generation timestamp |
| `affiliateBusinessId` | Associated affiliate business |
| `businessName` | Business display name |
| `lifecycleStatus` | Affiliate business lifecycle status |
| `workerStatusMatrix` | Structural worker role slots and observed status |
| `readinessStatus` | not_ready, partial, ready, blocked, unknown |
| `outstandingTasks` | Observed outstanding tasks (never fabricated) |
| `risks` | Observed risks (never fabricated) |
| `executiveSummary` | Orchestration summary |
| `auditStatus` | not_audited, pending, passed, partial, failed |
| `confidenceScore` | 0–100 from observed fields only |
| `metadataVersion` | `AFC-001-v1` |

Additional orchestration fields: `reportVersion`, `workerId`, `factoryId`, `businessCategory`, `metadata`, `dependencyGraph`, `progressSummary`, `validation`, `runTimestamp`, `consumableByQ802`, `submittedToExecutiveReporting`, `executiveReportId`, `traceabilityRefs`, and force-locked boundary flags: `neverDiscoverAffiliateProgrammes`, `neverGenerateAffiliateContent`, `neverLaunchBusinessesAutomatically`, `neverFabricateWorkerStatus`, `neverOverrideApprovedArchitecture`, `neverOverridePillow`, `neverOverrideGrandKing`, `neverBypassGrandKingApproval`, `neverImplementQ802OrLater`.

## Affiliate niches

Default (extensible via config merge — never redesign required): travel_gear, health_and_wellness, personal_finance, technology_and_gadgets, home_and_garden, beauty_and_skincare, fitness_and_sports, pet_products, fashion_and_apparel, education_and_courses, software_and_saas, outdoor_and_camping, unknown.

## Lifecycle statuses

project_registered → workers_coordinated → preparation → readiness_review → operating → paused → completed → archived

The engine never advances a project to `operating` (or later) without first passing through `workers_coordinated`.

## Worker role placeholders

opportunity_discovery_worker, content_creation_worker, compliance_review_worker, link_tracking_worker, conversion_optimization_worker, analytics_reporting_worker, unknown — structural slots only. AFC never implements these specialist Q8-02+ workers itself.

## Integrations

- worker_registry
- worker_lifecycle
- executive_reporting_runtime
- worker_recovery_system
- audit_runtime
- mission_runtime
- queue_runtime
- memory_runtime
- affiliate_factory_core_validation

## Safety

Credentials and authentication tokens are never exposed. Project and report creation preserves auditability and end-to-end traceability. Sensitive values are masked in logs. Approval workflows cannot be bypassed. Worker status is never fabricated — the worker status matrix and confidence scores derive only from observed store state. All coordination is structural signals only. Never implement Q8-02 or later inside this module.
