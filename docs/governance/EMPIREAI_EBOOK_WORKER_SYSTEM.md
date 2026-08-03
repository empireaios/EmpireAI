# EmpireAI Ebook Worker

PILLOW-EBW-001 / Q5-03 provides the Ebook Worker.

The Ebook Worker transforms approved Digital Product Research into export-ready written digital products. It receives approved product research, creates product outlines and chapter structure, generates complete written content with tables/checklists/summaries plus references and appendices, applies consistent formatting, performs self-review, prepares export-ready ebook assets (structural signals only), and produces machine-readable Ebook Reports. It does **not** build sales pages, process payments, deliver products to customers, or publish products directly.

> Note: Doctrine ID is **PILLOW-EBW-001**. Metadata version `EBW-001-v1`. Report version `EBW-RPT-v1`. Public alias: `EbwEbookReport`. Worker ID: `wkr-ebook-01`. Module ID: `ebook-worker`. Factory: `digital-products-factory`. Role: `role-creator-ebook-worker`.

## Boundaries

The Ebook Worker:

- **does** receive approved digital product research; create product outlines; create chapter structure; generate complete written content; generate tables, checklists, and summaries; generate references and appendices; apply consistent formatting; perform self-review; prepare export-ready ebook assets; and produce machine-readable Ebook Reports
- does **not** build sales pages
- does **not** process payments
- does **not** deliver products to customers
- does **not** publish products directly
- does **not** implement Q5-04 or later
- does **not** override Pillow or Grand King
- follows approved product research and approved product intent
- produces original content
- preserves complete traceability and audit history
- performs self-review before submission
- emits structural export signals only

## Ebook Report

Each report includes: Ebook ID (`ebw-ebk-*`), Timestamp, Product ID (`ebw-prd-*`), Product Title, Product Type, Target Audience, Chapter Structure (chapter number, title, summary, word count), Word Count, Included Resources (tables, checklists, summaries, references, appendices), Quality Review, Export Formats (`markdown`, `pdf_ready`, `epub_ready`, `docx_ready` — structural signals), Confidence Score, and Metadata version (`EBW-001-v1`).

Orchestration extras include researchReportId, opportunityId, businessId, factoryMissionId, outline, chapters (with body content), formattingApplied, selfReviewPassed, selfReviewFindings, selfReviewSummary, researchCompliance, workerId, reportVersion, traceabilityRefs, preservedDecisions, executive reporting submission fields, and force-locked boundary flags.

## Supported product types

Extensible: `ebook`, `guide`, `manual`, `handbook`, `workbook`, `checklist_collection`, `sop_collection`, `reference_guide`, `unknown`.

## Prerequisites

- Q5-01 Digital Products Factory Core (`PILLOW-DPF-001`)
- Q5-02 Digital Product Research Worker (`PILLOW-DPR-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive enterprise information is never logged. Ebook reports are submitted through the Executive Reporting Runtime. Export formats are structural readiness signals only — never actual publication or customer delivery.
