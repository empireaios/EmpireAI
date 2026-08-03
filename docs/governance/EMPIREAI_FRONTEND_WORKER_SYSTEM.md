# EmpireAI Frontend Worker

PILLOW-FEW-001 / Q6-04 provides the Frontend Worker.

The Frontend Worker transforms approved Requirements Reports and Architecture Reports into production-ready user interface build signals (layouts, dashboards, pages, forms, workflows, API integrations, responsive and accessible UI). It produces machine-readable Frontend Build Reports with complete traceability to approved requirements and architecture. It **does** receive approved requirements and architecture, build application layouts, dashboards, pages, forms with input validation, user workflows, integrate approved APIs, and support responsive/accessible UI. It does **not** implement backend business logic, design databases, deploy applications, override Pillow or Grand King, or implement Q6-05 or later.

> Note: Doctrine ID is **PILLOW-FEW-001**. Metadata version `FEW-001-v1`. Report version `FEW-RPT-v1`. Worker ID: `wkr-frontend-01`. Module ID: `frontend-worker`. Factory: `enterprise-platform-factory`. Role: `role-frontend-builder`. Build IDs: `few-bld-*`. Component IDs: `few-comp-*`. Page IDs: `few-page-*`. Dashboard IDs: `few-dash-*`. Form IDs: `few-form-*`. Workflow IDs: `few-wf-*`. API IDs: `few-api-*`. Validation IDs: `few-val-*`. Engine IDs: `few-eng-*`. Run IDs: `few-run-*`. Executive report IDs: `ert-few-*`.

## Boundaries

The Frontend Worker:

- **does** receive approved requirements reports; receive approved architecture reports; build application layouts; build dashboards; build pages; build forms and input validation; build user workflows; integrate approved APIs; support responsive and accessible UI; and produce machine-readable Frontend Build Reports
- does **not** implement backend business logic
- does **not** design databases
- does **not** deploy applications
- does **not** implement Q6-05 or later
- does **not** override Pillow or Grand King
- follows approved requirements and architecture and preserves complete traceability
- builds reusable components
- validates accessibility and responsiveness
- preserves audit history
- emits structural frontend build signals — never backend services, database schemas, or deployments

## Frontend Build Report

Each report includes: Build ID (`few-bld-*`), Timestamp, Platform ID, UI Components, Pages Created, Dashboards Created, Forms Created, Workflow Screens, API Integrations, Accessibility Status, Build Status, Confidence Score, and Metadata version (`FEW-001-v1`).

Orchestration extras include requirementsReportId, architectureReportId, factoryMissionId, businessId, businessObjective, layouts, responsiveVerified, accessibilityFindings, buildSteps, selfReviewPassed, selfReviewFindings, qualityReview, complianceReview, workerId, reportVersion, traceabilityRefs, preservedDecisions, executive reporting submission fields, and force-locked boundary flags.

## Supported UI components

UI components (extensible): `dashboards`, `forms`, `tables`, `lists`, `detail_pages`, `navigation`, `authentication_screens`, `settings_pages`, `responsive_layouts`, `reusable_components`, `unknown`.

## Prerequisites

- Q6-01 Enterprise Platform Factory Core (`PILLOW-EPFC-001`)
- Q6-02 Requirements Worker (`PILLOW-RQW-001`)
- Q6-03 Architecture Worker (`PILLOW-ARW-001`)

## Safety

Frontend builds are never fabricated beyond approved requirements and architecture. When inputs are thin, structural UI signals are tied to provided reports and incomplete context is listed in self-review findings. Frontend Build Reports are submitted through the Executive Reporting Runtime with missionId `Q6-04`. Frontend build is structural signal only — never backend business logic, database design, or deployment.
