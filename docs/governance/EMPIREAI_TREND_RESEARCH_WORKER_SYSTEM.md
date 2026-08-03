# EmpireAI Trend Research Worker

PILLOW-TRW-001 / Q4-03 provides the Trend Research Worker.

The Trend Research Worker discovers high-value content opportunities by monitoring search trends, competitor channels, social platforms, audience behaviour, and current events. It identifies emerging and declining trends **before** content planning. It does **not** decide which topics will be produced and does **not** generate content.

> Note: Doctrine ID is **PILLOW-TRW-001**. Metadata version `TRW-001-v1`. Report version `TRW-RPT-v1`. Public alias: `TrwTrendResearchReport`.

## Boundaries

The Trend Research Worker:

- **does** monitor search, competitor, social, audience, and current-event signals; identify emerging and declining trends; categorize discovered opportunities; score trend confidence; and produce machine-readable Trend Research Reports
- does **not** select publishing topics
- does **not** write scripts
- does **not** generate thumbnails
- does **not** publish content
- does **not** generate content directly
- does **not** implement Q4-04 or later
- does **not** override Pillow or Grand King
- uses **approved research sources only**

## Trend Research Report

Each report includes: Trend Report ID, Timestamp, Channel ID, Trend Category, Trend Topic, Discovery Source, Search Demand, Social Signals, Competitor Activity, Current Event Relevance, Confidence Score, Supporting Evidence (with fact vs assumption distinction), Recommended Priority, Trend Direction, Opportunity Category, and Metadata version (`TRW-001-v1`).

Complete source traceability and historical trend records are preserved. Facts are distinguished from assumptions. Audit history is preserved.

## Approved Research Sources

`google_trends`, `youtube_trends`, `tiktok_trends`, `competitor_channel`, `news_wire`, `social_listening`, `audience_analytics`, `approved_research_feed`, `multi_source`

## Prerequisites

- Q4-01 Media Factory Core
- Q4-02 Editor-in-Chief Worker (`PILLOW-ECW-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive enterprise information is never logged. Reports are submitted through the Executive Reporting Runtime.
