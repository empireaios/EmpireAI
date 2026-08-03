# EmpireAI Service Offer Worker

PILLOW-SOW-001 / Q7-03 provides the Service Offer Worker inside the Local Business Factory.

The Service Offer Worker consumes Q7-02 Local Market Research Reports and produces structured service catalogues, packages, pricing recommendations (anchored to research pricing findings), guarantees, and fulfilment requirements. It produces machine-readable Service Offer Reports consumable by Q7-04 Booking Worker.

The Service Offer Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It links offer sessions to Local Business Factory Core projects via `businessProjectId` and to research via `sourceResearchId`.

## Workflow

1. Consume validated market research from `marketResearchReport`, `researchId` + Local Market Research Worker, or `fixtureMarketResearch` (deterministic tests).
2. Define a service catalogue from competitor services, gaps, and opportunities observed in research.
3. Define service packages (`basic`, `premium`, `enterprise`, `optional_addon`, `emergency`, `recurring`, `unknown` — extensible via config).
4. Recommend pricing structure by referencing Q7-02 `pricingFindings` (currency, typical/min/max). Never fabricate pricing evidence; mark assumptions/unknowns honestly when research is incomplete.
5. Define package inclusions and exclusions.
6. Define guarantees (satisfaction, workmanship, response time, arrival window, warranty, refund/rework) only when supported or clearly assumed.
7. Define fulfilment requirements (skills, equipment, materials, licences, manpower, prerequisites, customer preparation, completion criteria).
8. Produce a machine-readable Service Offer Report (`SOW-RPT-v1` / `SOW-001-v1`) with evidence/assumption distinction and `consumableByQ704: true`.
9. Submit findings through the Executive Reporting Runtime and preserve audit history.

## Integrations

The worker integrates with:

- Local Business Factory Core
- Local Market Research Worker
- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Worker Performance Review
- Worker Recovery System

## Boundaries

The Service Offer Worker:

- **does** consume Q7-02 research, define catalogues/packages, recommend pricing from research, define guarantees/fulfilment, and produce offer reports
- does **not** build booking systems
- does **not** build CRM
- does **not** execute customer jobs
- does **not** launch businesses
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** fabricate pricing evidence
- does **not** bypass Grand King approval
- does **not** implement Q7-04 or later

## Pricing discipline

Pricing recommendations must reference Q7-02 pricing findings. When research is missing or incomplete, the worker fails validation for offer generation without research, or marks pricing assumptions/unknowns honestly — it never invents successful pricing evidence.

## Service Offer Report

Each report includes: reportId, timestamp, businessProjectId, serviceCatalogue, servicePackages, pricingRecommendations, packageInclusions, packageExclusions, guarantees, fulfilmentRequirements, operationalAssumptions, risks, outstandingQuestions, confidenceScore, executiveSummary, metadataVersion, reportVersion, workerId, sourceResearchId, evidence/assumption distinction, boundary locks, submittedToExecutiveReporting, executiveReportId, traceabilityRefs, and `consumableByQ704: true`.

## Safety

Credentials are never exposed. Complete traceability and audit history are preserved. Sensitive values are masked in logs. Structural signals only.
