# EmpireAI Digital Products Factory Core

PILLOW-DPF-001 / Q5-01 provides the **Digital Products Factory Core**.

The Digital Products Factory Core coordinates digital product businesses, product creation pipelines, design and branding workflows, sales-page and checkout coordination signals, fulfilment and customer delivery orchestration, analytics collection, and continuous learning under Pillow executive authority. It produces machine-readable **Digital Products Factory Reports** for downstream workers and executive reporting.

It is **orchestration only**. It does not create ebooks or courses, build sales pages, or process payments.

> Doctrine ID: **PILLOW-DPF-001**. Metadata version `DPF-001-v1`. Report version `DPF-DFR-v1`. Mission version `DPF-DPM-v1`. Worker ID: `wkr-digital-products-factory-core-01`.

## Boundaries

The Digital Products Factory Core:

- **does** create digital product business missions, register digital product businesses, coordinate product creation / design-branding / sales-page / checkout / fulfilment / customer-delivery / analytics / learning workflows as structural signals, track business lifecycle stages, coordinate downstream digital products workers, coordinate approval workflows, and submit reports via Executive Reporting Runtime
- does **not** create ebooks
- does **not** create courses
- does **not** build sales pages
- does **not** process payments
- does **not** bypass approval workflows
- does **not** implement Q5-02 or later
- does **not** override Pillow or Grand King

All boundary flags are force-locked `true` in configuration, missions, and reports.

## Digital Products Factory Report structure

Each Digital Products Factory Report includes:

| Field | Description |
|-------|-------------|
| `factoryMissionId` | Unique factory mission identifier |
| `timestamp` | Report generation timestamp |
| `businessId` | Associated digital product business |
| `productPortfolio` | Portfolio product identifiers |
| `activeProducts` | Currently active product identifiers |
| `currentPipelineStage` | Pipeline lifecycle stage |
| `assignedWorkers` | Downstream worker IDs |
| `fulfilmentStatus` | not_ready, queued, coordinating, fulfilled_signal, blocked_pending_approval, failed |
| `analyticsStatus` | idle, collecting, analyzing, reported, deferred |
| `learningStatus` | idle, collecting, analyzing, applied, deferred |
| `executiveSummary` | Orchestration summary |
| `metadataVersion` | `DPF-001-v1` |

Additional orchestration fields: `approvalStatus`, `productionStatus`, `missionCoordinationRef`, `executiveReportId`, `submittedToExecutiveReporting`, `assignedWorkerRoles`, `pipelineId`, `pipelineType`, `productType`, `businessName`, `traceabilityRefs`, `preservedDecisions`, `workerId`, `reportVersion`, and force-locked boundary flags.

## Product types

Default creatable types: template, toolkit, printable, software_tool, membership, bundle, digital_download, unknown.

Ebook and course creation are out of scope (force-locked boundaries).

## Pipeline types

Default: product_creation, design_branding, sales_page, checkout, fulfilment, customer_delivery, analytics, learning, multi_stage.

## Pipeline stages

mission_created → business_registered → product_creation → design_branding → sales_page → checkout → fulfilment → customer_delivery → analytics → learning → completed

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
- digital_products_factory_core_validation

## Safety

Credentials and authentication tokens are never exposed. Mission and report creation preserves auditability and end-to-end traceability. Sensitive values are masked in logs. Approval workflows cannot be bypassed; fulfilment coordination requires approved status. Sales-page and checkout coordination are structural signals only.
