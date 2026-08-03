# EmpireAI Sales Page Worker

PILLOW-SPW-001 / Q5-08 provides the Sales Page Worker.

The Sales Page Worker transforms approved digital product information into complete landing-page structure and original sales copy (structural signals only). It receives approved digital product information, generates complete landing page structure, generates compelling headlines, generates benefit-driven copy, generates feature sections, generates pricing presentation, generates testimonials or labeled placeholders (never fabricated), generates FAQ sections, generates call-to-action sections, generates guarantee sections, optimizes page structure for readability and conversion, and produces machine-readable Sales Page Reports. It **does** create sales page copy and structure. It does **not** process payments, deliver products, publish websites or pages, fabricate testimonials, override Pillow or Grand King, or implement Q5-09 or later.

> Note: Doctrine ID is **PILLOW-SPW-001**. Metadata version `SPW-001-v1`. Report version `SPW-RPT-v1`. Worker ID: `wkr-sales-page-01`. Module ID: `sales-page-worker`. Factory: `digital-products-factory`. Role: `role-creator-sales-page`. Sales Page IDs: `spw-spg-*`. Product IDs: `spw-prd-*`. Section IDs: `spw-sec-*`.

## Boundaries

The Sales Page Worker:

- **does** create sales pages (copy + structure) from approved digital product information
- **does** receive approved digital product information; generate complete landing page structure; generate compelling headlines; generate benefit-driven copy; generate feature sections; generate pricing presentation; generate testimonials or placeholders; generate FAQ sections; generate call-to-action sections; generate guarantee sections; optimize page structure for readability and conversion; and produce machine-readable Sales Page Reports
- does **not** process payments
- does **not** deliver products
- does **not** publish websites
- does **not** publish pages directly
- does **not** fabricate testimonials (placeholders must be clearly labeled; approved testimonials only when provided)
- does **not** implement Q5-09 or later
- does **not** override Pillow or Grand King
- follows approved product information
- produces original sales copy
- maintains EmpireAI branding standards
- preserves complete traceability and audit history
- performs quality review before submission
- emits structural page content only (markdown / html_structure / json_page_pack / zip_ready signals — never live publication)

## Sales Page Report

Each report includes: Sales Page ID (`spw-spg-*`), Timestamp, Product ID (`spw-prd-*`), Product Title, Landing Page Structure (array of sections with `spw-sec-*` IDs), Headline, CTA Summary, Sections Generated, Assets Referenced (e.g. Design Worker asset refs), Compliance Review (must note no fabricated testimonials, no payments/publishing), Quality Review, Confidence Score, and Metadata version (`SPW-001-v1`).

Orchestration extras include researchReportId, opportunityId, businessId, factoryMissionId, pageType/productType, headlines, benefitCopy, featureSections, pricingPresentation, testimonials (fabricated:false with placeholder/approved status), faqs, ctas, guarantees, readabilityOptimized, conversionOptimized, selfReviewPassed, selfReviewFindings, selfReviewSummary, researchCompliance, workerId, reportVersion, traceabilityRefs, preservedDecisions, executive reporting submission fields, and force-locked boundary flags.

## Supported page types

Extensible: `product_landing_page`, `long_form_sales_page`, `short_form_sales_page`, `lead_magnet_page`, `webinar_registration_page`, `course_sales_page`, `ebook_sales_page`, `template_product_page`, `unknown`. Default page type: `product_landing_page`.

## Prerequisites

- Q5-01 Digital Products Factory Core (`PILLOW-DPF-001`)
- Q5-02 Digital Product Research Worker (`PILLOW-DPR-001`)
- Q5-03 Ebook Worker (`PILLOW-EBW-001`)
- Q5-04 Prompt Product Worker (`PILLOW-PPW-001`)
- Q5-05 Course Builder Worker (`PILLOW-CBW-001`)
- Q5-06 Template Builder Worker (`PILLOW-TBW-001`)
- Q5-07 Design Worker (`PILLOW-DW-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive enterprise information is never logged. Sales Page Reports are submitted through the Executive Reporting Runtime. Export formats are structural readiness signals only — never website publication, payment processing, or product delivery.
