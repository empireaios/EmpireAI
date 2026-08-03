# EmpireAI Product Listing Worker

PILLOW-PLW-001 / Q3-08 provides the Product Listing Worker.

The Product Listing Worker prepares complete marketplace-ready product listings from approved product information and approved product images.

Its responsibility is **listing preparation only**. It generates titles, descriptions, bullet points, attributes, variants, SEO fields, and marketplace-specific listing packages. It does **not** publish listings.

> Note: Doctrine ID is **PILLOW-PLW-001**. Metadata version `PLW-001-v1`. Report version `PLW-RPT-v1`. Public alias: `PlwProductListingReport`.

## Boundaries

The Product Listing Worker:

- **does** receive approved product information and images, generate titles/descriptions/bullets/attributes/variants/SEO fields, validate required listing fields, produce marketplace-specific listing packages, and produce machine-readable Product Listing Reports
- does **not** publish listings automatically
- does **not** modify supplier information
- does **not** modify pricing
- does **not** implement Q3-09 or later
- does **not** override Pillow or Grand King

## Product Listing Report

Each report includes: Listing ID, Timestamp, Product ID, Marketplace, Product Title, Product Description, Bullet Points, Attributes, Variants, SEO Fields, Listing Validation Status, Listing Package, and Metadata version (`PLW-001-v1`).

## Listing Validation Status

- **pass** — required marketplace fields are complete and ready for Pillow review
- **review** — listing is usable but needs Pillow attention (e.g. missing images for image-required marketplaces)
- **fail** — required fields are incomplete or blocked by non-compliant images

## Prerequisites

- Q3-07 Product Image Worker (`PILLOW-PIW-001`)

## Safety

Product and supplier traceability are preserved. Credentials and authentication tokens are never exposed. Listing packages are marked never auto-published. Reports are submitted through the Executive Reporting Runtime.
