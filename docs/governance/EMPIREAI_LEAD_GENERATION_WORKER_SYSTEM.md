# EmpireAI Lead Generation Worker

PILLOW-LGW-001 / Q7-08 provides the Lead Generation Worker inside the Local Business Factory.

The Lead Generation Worker consumes Q7-07 Local SEO Reports (landing page context, keywords) and prepares structural lead funnels: enquiry forms, lead capture, qualification, scoring, CRM routing (via injected CRM Worker), booking routing for qualified leads (via injected Booking Worker), conversion stage tracking, and funnel performance measurement from observed captures only. It produces machine-readable Lead Generation Reports consumable by Q7-09.

The Lead Generation Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It links funnels to Local Business Factory Core projects via `businessProjectId` and to SEO packages via `sourceSeoReportId`. CRM and booking are never replaced — routing uses injected workers only.

## Workflow

1. Create a lead funnel from Local SEO context (`localSeoReport`, `seoReportId` + Local SEO Worker, or `fixtureLocalSeo` for deterministic tests).
2. Generate enquiry forms bound to the funnel and landing page refs.
3. Capture leads from form submissions / WhatsApp / contact sources (WhatsApp may structurally notify `whatsAppWorker.receiveInboundEnquiry` when source=whatsapp).
4. Qualify and score leads from observed submission fields only — never invent conversions.
5. Route leads to CRM via injected `crmWorker.captureLead` / `updateLeadStatus` / `recordContact`.
6. Route qualified leads to booking via injected `bookingWorker.createBooking` or structural trigger.
7. Track conversion stages and measure funnel performance from store captures (empty store = zero/unknown).
8. Produce a machine-readable Lead Generation Report (`LGW-RPT-v1` / `LGW-001-v1`) with `consumableByQ709: true`.
9. Submit findings through the Executive Reporting Runtime and preserve funnel audit history.

## Integrations

The worker integrates with:

- Local Business Factory Core
- CRM Worker
- WhatsApp Worker
- Local SEO Worker
- Booking Worker
- Worker Registry
- Worker Lifecycle
- Executive Reporting Runtime
- Worker Performance Review (optional)
- Worker Recovery System

## Boundaries

The Lead Generation Worker:

- **does** prepare lead funnels, capture/qualify/score leads, route to CRM/booking via injections, and produce Lead Generation Reports
- does **not** execute advertising campaigns
- does **not** replace CRM
- does **not** replace booking worker
- does **not** deliver customer jobs
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** fabricate lead or conversion results
- does **not** bypass Grand King approval
- does **not** implement Q7-09 or later

## Metrics discipline

Funnel metrics reflect observed captured leads in the store only. An empty store yields zero totals and unknown averages. The worker never fabricates conversion rates, ad performance, or unobserved funnel drop-offs.

## Lead Generation Report

Each report includes: reportId, timestamp, businessProjectId, funnelId, leadSource, leadQualificationStatus, leadScore, crmIntegrationStatus, bookingIntegrationStatus, conversionStage, funnelPerformanceSummary, auditStatus, outstandingIssues, confidenceScore, metadataVersion, reportVersion, workerId, forms, capturedLeads, sourceAttribution, sourceSeoReportId, boundary locks, submittedToExecutiveReporting, executiveReportId, traceabilityRefs, and `consumableByQ709: true`.

## Safety

Credentials are never exposed. Prohibited personal data is never exposed. Complete lead traceability and funnel audit history are preserved. Sensitive values are masked in logs. Structural signals only.
