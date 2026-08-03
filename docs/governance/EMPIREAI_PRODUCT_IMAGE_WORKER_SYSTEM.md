# EmpireAI Product Image Worker

PILLOW-PIW-001 / Q3-07 provides the Product Image Worker.

The Product Image Worker prepares marketplace-ready product images and supporting creatives from approved supplier assets.

Its responsibility is **visual asset preparation only**. It transforms approved supplier images into optimized, compliant product assets for supported marketplaces and produces Product Image Reports for downstream commerce workers.

> Note: Doctrine ID is **PILLOW-PIW-001**. Metadata version `PIW-001-v1`. Report version `PIW-RPT-v1`. Public alias: `PiwProductImageReport`.

## Boundaries

The Product Image Worker:

- **does** receive approved supplier images, validate quality, detect duplicates/unusable assets, organize image sets, prepare marketplace-compliant images, generate standardized variants, preserve metadata, validate compliance, package visual assets, and produce machine-readable Product Image Reports
- does **not** publish listings
- does **not** generate advertisements
- does **not** contact suppliers
- does **not** overwrite original source assets
- does **not** implement Q3-08 or later
- does **not** override Pillow or Grand King

## Product Image Report

Each report includes: Image Report ID, Timestamp, Product ID, Supplier ID, Source Images, Processed Images, Image Quality Status, Compliance Status, Image Variants, Processing Summary, Supporting Evidence, and Metadata version (`PIW-001-v1`).

## Quality & Compliance

- **Image quality:** `pass` | `review` | `fail`
- **Compliance:** `compliant` | `review_required` | `non_compliant`

## Prerequisites

- Q3-05 Supplier Evaluation Worker (`PILLOW-SEW-001`) for supplier/product traceability
- Q3-06 Supplier Negotiation Worker (`PILLOW-SNW-001`) completed in programme sequence

## Safety

Original supplier assets are always preserved. Derived copies are created for processing. Credentials and authentication tokens are never exposed. Reports are submitted through the Executive Reporting Runtime.
