# EmpireAI Media Factory Core

PILLOW-MFC-001 / Q4-01 provides the **Media Factory Core**.

The Media Factory Core coordinates media businesses, channels, content pipelines, approval workflows, publishing coordination, analytics collection, and continuous learning under Pillow executive authority. It produces machine-readable **Media Factory Reports** for downstream workers and executive reporting.

It is **orchestration only**. It does not write scripts, generate images or videos, or publish content directly.

> Doctrine ID: **PILLOW-MFC-001**. Metadata version `MFC-001-v1`. Report version `MFC-MFR-v1`. Mission version `MFC-MBM-v1`. Worker ID: `wkr-media-factory-core-01`.

## Boundaries

The Media Factory Core:

- **does** create media business missions, register channels and pipelines, manage content lifecycle stages, coordinate downstream media workers, coordinate approval and publishing workflows, coordinate analytics and learning, track production and publishing status, and submit reports via Executive Reporting Runtime
- does **not** write scripts
- does **not** generate images
- does **not** generate videos
- does **not** publish directly
- does **not** bypass approval workflows
- does **not** implement Q4-02 or later
- does **not** override Pillow or Grand King

All boundary flags are force-locked `true` in configuration, missions, and reports.

## Media Factory Report structure

Each Media Factory Report includes:

| Field | Description |
|-------|-------------|
| `mediaMissionId` | Unique media mission identifier |
| `timestamp` | Report generation timestamp |
| `mediaBusinessId` | Associated media business |
| `channelId` | Registered channel ID |
| `channelType` | Channel type (youtube, tiktok, instagram, etc.) |
| `contentPipeline` | Pipeline type |
| `currentStage` | Content lifecycle stage |
| `assignedWorkers` | Downstream worker IDs |
| `approvalStatus` | pending, in_review, approved, rejected, blocked_bypass_attempt |
| `publishingStatus` | not_ready, queued, coordinating, published_signal, blocked_pending_approval, failed |
| `learningStatus` | idle, collecting, analyzing, applied, deferred |
| `executiveSummary` | Orchestration summary |
| `metadataVersion` | `MFC-001-v1` |

Additional orchestration fields: `productionStatus`, `missionCoordinationRef`, `executiveReportId`, `submittedToExecutiveReporting`, `assignedWorkerRoles`, `pipelineId`, `traceabilityRefs`, `preservedDecisions`, `workerId`, and force-locked boundary flags.

## Channel types

Default: youtube, tiktok, instagram, podcast, newsletter, blog, linkedin, x_twitter, multi_channel, unknown.

## Pipeline types

Default: short_form_video, long_form_video, podcast_episode, newsletter_issue, social_post, blog_article, multi_format.

## Content stages

mission_created → channel_registered → pipeline_registered → production → approval → publishing → analytics → learning → completed

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
- media_factory_core_validation

## Safety

Credentials and authentication tokens are never exposed. Mission and report creation preserves auditability and end-to-end traceability. Sensitive values are masked in logs. Approval workflows cannot be bypassed; publishing coordination requires approved status.
