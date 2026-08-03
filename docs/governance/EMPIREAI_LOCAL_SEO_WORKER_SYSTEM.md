# EmpireAI Local SEO Worker

PILLOW-LSEO-001 / Q7-07 provides the Local SEO Worker inside the Local Business Factory.

The Local SEO Worker consumes Q7-03 Service Offer Reports and prepares structural local SEO assets: landing/service/city/area page outlines, Google Business Profile recommendations, local keywords, titles/meta, structured data outlines, citation recommendations, internal linking, and NAP consistency notes. It produces machine-readable Local SEO Reports consumable by Q7-08.

The Local SEO Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It links SEO sessions to Local Business Factory Core projects via `businessProjectId` and to offers via `sourceOfferReportId`. Optional CRM/WhatsApp bindings may inform NAP wording and customer-facing language — they never invent rankings or traffic.

## Workflow

1. Consume an approved service offer from `serviceOfferReport`, `offerReportId` + Service Offer Worker, or `fixtureServiceOffer` (deterministic tests).
2. Generate Google Business Profile recommendations (categories, description, services, photos, posts, NAP checklist) — never modify live GBP automatically.
3. Generate landing pages, service pages, and city/area pages (titles, meta, headings, body outlines, URL recommendations, FAQs).
4. Generate local keyword phrases from offer services and location.
5. Generate SEO titles and meta / Open Graph recommendations.
6. Generate structured data recommendations (LocalBusiness, Service, FAQPage, BreadcrumbList outlines).
7. Generate citation recommendations and internal linking maps.
8. Evaluate SEO completeness honestly from generated asset presence only — never claim live ranking or traffic performance.
9. Produce a machine-readable Local SEO Report (`LSEO-RPT-v1` / `LSEO-001-v1`) with `consumableByQ708: true`.
10. Submit findings through the Executive Reporting Runtime and preserve audit history.

## Integrations

The worker integrates with:

- Local Business Factory Core
- Service Offer Worker
- CRM Worker (optional NAP / contact language)
- WhatsApp Worker (optional customer-facing language)
- Worker Registry
- Worker Lifecycle
- Executive Reporting Runtime
- Worker Performance Review
- Worker Recovery System

## Boundaries

The Local SEO Worker:

- **does** prepare local SEO assets from approved service offers and produce Local SEO Reports
- does **not** publish websites
- does **not** purchase backlinks
- does **not** manipulate search rankings
- does **not** modify live Google Business Profiles automatically
- does **not** modify unrelated platform components
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** fabricate SEO performance results
- does **not** bypass Grand King approval
- does **not** implement Q7-08 or later

## Completeness discipline

SEO completeness scores reflect presence of prepared assets (pages, GBP recommendations, keywords, metadata, schema, citations). The worker never claims live ranking positions, organic traffic, conversion rates, or other fabricated performance results.

## Local SEO Report

Each report includes: reportId, timestamp, businessProjectId, targetLocation, serviceCategory, landingPagesGenerated, googleBusinessRecommendations, localKeywords, metadata, structuredDataRecommendations, citationRecommendations, seoCompletenessStatus, auditStatus, outstandingIssues, confidenceScore, metadataVersion, reportVersion, workerId, internalLinkingRecommendations, napConsistencyRecommendations, faqAssets, sourceOfferReportId, boundary locks, submittedToExecutiveReporting, executiveReportId, traceabilityRefs, and `consumableByQ708: true`.

## Safety

Credentials are never exposed. Complete traceability and audit history are preserved. Sensitive values are masked in logs. Structural signals only.
