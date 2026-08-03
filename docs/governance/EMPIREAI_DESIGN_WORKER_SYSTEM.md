# EmpireAI Design Worker

PILLOW-DW-001 / Q5-07 provides the Design Worker.

The Design Worker transforms approved digital product information into export-ready visual design assets for digital products. It receives approved digital product information, generates ebook covers, generates course covers, generates product branding assets, generates promotional graphics, generates realistic product mockups, generates preview images, maintains visual branding consistency, prepares export-ready design assets (structural signals only), and produces machine-readable Design Worker Reports. It does **not** build sales pages, process payments, deliver products, publish assets directly, or publish products directly.

> Note: Doctrine ID is **PILLOW-DW-001**. Metadata version `DW-001-v1`. Report version `DW-RPT-v1`. Public alias: `DwDesignWorkerReport`. Worker ID: `wkr-design-01`. Module ID: `design-worker`. Factory: `digital-products-factory`. Role: `role-creator-design-worker`.

## Boundaries

The Design Worker:

- **does** receive approved digital product information; generate ebook covers; generate course covers; generate product branding assets; generate promotional graphics; generate realistic product mockups; generate preview images; maintain visual branding consistency; prepare export-ready design assets; and produce machine-readable Design Worker Reports
- does **not** build sales pages
- does **not** process payments
- does **not** deliver products
- does **not** publish assets directly
- does **not** publish products directly
- does **not** implement Q5-08 or later
- does **not** override Pillow or Grand King
- follows approved product intent
- produces original visual assets
- maintains consistent branding
- preserves complete traceability and audit history
- performs quality review before submission
- emits structural export signals only (descriptions, dimensions, format hints — never binary image blobs)

## Design Worker Report

Each report includes: Design Report ID (`dw-dsr-*`), Timestamp, Product ID (`dw-prd-*`), Product Title, Asset Types Created, Branding Theme, Preview Assets, Mockup Assets, Export Formats (`png_ready`, `jpg_ready`, `svg_ready`, `pdf_ready`, `zip_ready` — structural signals), Quality Review, Confidence Score, and Metadata version (`DW-001-v1`).

Orchestration extras include researchReportId, opportunityId, businessId, factoryMissionId, productType, productCategory, brandingThemeDetails, ebookCovers, courseCovers, brandingAssets, promotionalGraphics, allAssets, brandingConsistencyValidated, selfReviewPassed, selfReviewFindings, selfReviewSummary, researchCompliance, workerId, reportVersion, traceabilityRefs, preservedDecisions, executive reporting submission fields, and force-locked boundary flags.

## Supported asset types

Extensible: `ebook_cover`, `course_cover`, `product_cover`, `product_graphics`, `promotional_graphics`, `mockups`, `preview_images`, `branding_assets`, `social_media_assets`, `product_icons`, `unknown`. Default product/asset type: `branding_assets`.

## Prerequisites

- Q5-01 Digital Products Factory Core (`PILLOW-DPF-001`)
- Q5-02 Digital Product Research Worker (`PILLOW-DPR-001`)
- Q5-03 Ebook Worker (`PILLOW-EBW-001`)
- Q5-04 Prompt Product Worker (`PILLOW-PPW-001`)
- Q5-05 Course Builder Worker (`PILLOW-CBW-001`)
- Q5-06 Template Builder Worker (`PILLOW-TBW-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive enterprise information is never logged. Design Worker Reports are submitted through the Executive Reporting Runtime. Export formats are structural readiness signals only — never actual publication, asset delivery, or customer fulfillment.
