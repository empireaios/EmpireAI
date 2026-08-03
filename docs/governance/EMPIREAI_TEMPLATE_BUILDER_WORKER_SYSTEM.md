# EmpireAI Template Builder Worker

PILLOW-TBW-001 / Q5-06 provides the Template Builder Worker.

The Template Builder Worker transforms approved Digital Product Research into export-ready reusable template products. It receives approved product research, generates reusable templates, generates planners, generates spreadsheets, generates contracts and document templates, generates business forms and checklists, generates reusable prompt libraries, validates usability and completeness (self-review), prepares export-ready template packages (structural signals only), and produces machine-readable Template Builder Reports. It does **not** build sales pages, process payments, deliver products to customers, or publish products directly.

> Note: Doctrine ID is **PILLOW-TBW-001**. Metadata version `TBW-001-v1`. Report version `TBW-RPT-v1`. Public alias: `TbwTemplateBuilderReport`. Worker ID: `wkr-template-builder-01`. Module ID: `template-builder-worker`. Factory: `digital-products-factory`. Role: `role-creator-template-builder`.

## Boundaries

The Template Builder Worker:

- **does** receive approved digital product research; generate reusable templates; generate planners; generate spreadsheets; generate contracts and document templates; generate business forms and checklists; generate reusable prompt libraries; validate usability and completeness; prepare export-ready template packages; and produce machine-readable Template Builder Reports
- does **not** build sales pages
- does **not** process payments
- does **not** deliver products to customers
- does **not** publish products directly
- does **not** implement Q5-07 or later
- does **not** override Pillow or Grand King
- follows approved product research and approved product intent
- produces original reusable assets
- preserves complete traceability and audit history
- validates usability before submission and performs self-review
- emits structural export signals only

## Template Builder Report

Each report includes: Template Product ID (`tbw-tpl-*`), Timestamp, Product ID (`tbw-prd-*`), Product Title, Product Category, Template Types, Included Assets, Target Audience, Supported Formats (`markdown`, `csv`, `xlsx_schema`, `docx_outline`, `json_pack`), Quality Review, Export Formats (`markdown`, `csv_ready`, `xlsx_ready`, `docx_ready`, `zip_ready` — structural signals), Confidence Score, and Metadata version (`TBW-001-v1`).

Orchestration extras include researchReportId, opportunityId, businessId, factoryMissionId, productType, templates (with body/sections), planners, spreadsheets, contracts, forms, checklists, promptLibrary, usabilityValidated, selfReviewPassed, selfReviewFindings, selfReviewSummary, researchCompliance, workerId, reportVersion, traceabilityRefs, preservedDecisions, executive reporting submission fields, and force-locked boundary flags.

## Supported product types

Extensible: `business_templates`, `spreadsheet_templates`, `financial_templates`, `project_planners`, `calendars`, `contracts`, `checklists`, `sop_templates`, `forms`, `prompt_templates`, `unknown`.

## Prerequisites

- Q5-01 Digital Products Factory Core (`PILLOW-DPF-001`)
- Q5-02 Digital Product Research Worker (`PILLOW-DPR-001`)
- Q5-03 Ebook Worker (`PILLOW-EBW-001`)
- Q5-04 Prompt Product Worker (`PILLOW-PPW-001`)
- Q5-05 Course Builder Worker (`PILLOW-CBW-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive enterprise information is never logged. Template Builder Reports are submitted through the Executive Reporting Runtime. Export formats are structural readiness signals only — never actual publication or customer delivery.
