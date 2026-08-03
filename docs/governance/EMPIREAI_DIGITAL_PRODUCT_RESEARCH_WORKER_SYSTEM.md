# EmpireAI Digital Product Research Worker

PILLOW-DPR-001 / Q5-02 provides the Digital Product Research Worker.

The Digital Product Research Worker discovers high-value digital product opportunities by analysing customer pain points, search demand, market gaps, competitor products, and emerging trends. It discovers underserved niches, estimates demand and commercial opportunity, ranks opportunities, and produces machine-readable Digital Product Research Reports **before** product creation. It does **not** create digital products, sales pages, or process payments.

> Note: Doctrine ID is **PILLOW-DPR-001**. Metadata version `DPR-001-v1`. Report version `DPR-RPT-v1`. Public alias: `DprDigitalProductResearchReport`. Worker ID: `wkr-digital-product-research-01`.

## Boundaries

The Digital Product Research Worker:

- **does** analyse customer pain points, search demand, market gaps, competitor products, and emerging trends; discover underserved niches; estimate demand and commercial opportunity; rank opportunities; and produce machine-readable Digital Product Research Reports
- does **not** create digital products
- does **not** create sales pages
- does **not** process payments
- does **not** invent unsupported market evidence
- does **not** implement Q5-03 or later
- does **not** override Pillow or Grand King
- uses **approved research sources only**
- distinguishes **facts from assumptions**
- preserves complete source traceability and audit history

## Digital Product Research Report

Each report includes: Research Report ID (`dpr-rsh-*`), Timestamp, Opportunity ID (`dpr-opp-*`), Product Category, Target Audience, Customer Pain Points, Market Gap, Demand Assessment (with demand level/score), Competitor Summary, Revenue Potential (with score), Opportunity Score, Supporting Evidence (with fact vs assumption distinction), Confidence Score, Recommended Priority, Ranking (when ranked), and Metadata version (`DPR-001-v1`).

Orchestration extras include businessId, factoryMissionId, productType, researchTopic, discoverySource, evidenceKinds, workerId, reportVersion, traceabilityRefs, preservedDecisions, and executive reporting submission fields.

## Product categories / types

DPF-aligned: `template`, `toolkit`, `printable`, `software_tool`, `membership`, `bundle`, `digital_download`, `unknown`.

## Approved Research Sources

`search_demand`, `competitor_catalog`, `marketplace_signals`, `audience_pain_signals`, `niche_forums`, `product_review_signals`, `trend_observatory`, `approved_research_feed`, `multi_source`

## Prerequisites

- Q5-01 Digital Products Factory Core (`PILLOW-DPF-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive enterprise information is never logged. Reports are submitted through the Executive Reporting Runtime. All findings are structural research signals only.
