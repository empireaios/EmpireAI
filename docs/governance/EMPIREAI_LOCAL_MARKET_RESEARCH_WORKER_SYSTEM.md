# EmpireAI Local Market Research Worker

PILLOW-LMRW-001 / Q7-02 provides the Local Market Research Worker inside the Local Business Factory.

The Local Market Research Worker researches local demand, competitors, pricing signals, customer pain points, service gaps, and market attractiveness for a specified country, city, service area, and service category. It produces machine-readable Local Market Research Reports consumable by Q7-03 Service Offer Worker.

The Local Market Research Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It links research sessions to Local Business Factory Core projects via `businessProjectId`.

## Workflow

1. Receive a validated research request for location + service category (linked to LBFC project when provided).
2. Research local demand indicators, search patterns, frequency, urgency, seasonality, residential/commercial mix, segment differences, geographic concentration, and repeat/emergency potential.
3. Identify customer segments; research and profile competitors (dedupe by normalized name + service area); research competitor services.
4. Research market pricing signals (typical/min/max, fees, packages, surcharges) — never recommend final prices.
5. Identify customer pain points and service gaps; analyze service opportunities from observed evidence only.
6. Assess market attractiveness dimensions with evidence-backed scores only.
7. Produce a machine-readable Local Market Research Report (`LMRW-RPT-v1` / `LMRW-001-v1`) with evidence classes (`verified | estimated | inference | unknown`) and evidence modes (`fixture | sandbox | cached | live`).
8. Submit findings through the Executive Reporting Runtime and preserve audit history.

## Integrations

The worker integrates with:

- Local Business Factory Core
- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Worker Performance Review
- Worker Recovery System

Optional soft dependencies (used only when injected): research fixture provider, memory runtime, API integration runtime, tool runtime.

## Boundaries

The Local Market Research Worker:

- **does** research local markets, profile competitors, collect pricing signals, identify pain points/gaps/opportunities, and produce research reports
- does **not** finalize service packages
- does **not** set final prices
- does **not** make launch decisions
- does **not** build booking systems or websites
- does **not** contact customers or competitors without approval
- does **not** purchase data or advertising without approval
- does **not** fabricate demand, pricing, or competitor data
- does **not** override Pillow
- does **not** override Grand King
- does **not** bypass Grand King approval
- does **not** implement Q7-03 or later

## Evidence discipline

Findings must label evidence class and evidence mode. When no fixture/sandbox/cached/live evidence is supplied, the worker records honest unknowns and empty arrays — it never invents successful findings.

## Local Market Research Report

Each report includes: researchId, timestamp, businessProjectId, targetCountry, targetCity, targetServiceArea, serviceCategory, customerSegments, demandFindings, competitorProfiles, pricingFindings, customerPainPoints, serviceGaps, opportunityFindings, marketAttractivenessAssessment, risks, assumptions, unknowns, evidenceSources, confidenceScore, recommendedResearchFollowUps, executiveSummary, metadataVersion, reportVersion, workerId, boundary locks, submittedToExecutiveReporting, executiveReportId, traceabilityRefs, evidenceMode, and `consumableByQ703: true`.

## Safety

Credentials and prohibited personal data are never exposed. Complete traceability and audit history are preserved. Sensitive values are masked in logs. Structural signals only.
