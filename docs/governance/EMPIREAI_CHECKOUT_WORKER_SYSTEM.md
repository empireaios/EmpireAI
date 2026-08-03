# EmpireAI Checkout Worker

PILLOW-CKW-001 / Q5-09 provides the Checkout Worker.

The Checkout Worker transforms approved digital product information into checkout workflow preparation signals (structural only). It receives approved digital product information, generates checkout workflow steps, prepares payment provider configuration (structural readiness — never API keys or secrets), generates order summaries, generates customer confirmation workflows, validates required purchase information, prepares post-payment handoff signals for the Digital Delivery Worker (does not deliver), configures payment provider abstraction across multiple providers, validates checkout readiness, and produces machine-readable Checkout Reports. It **does** prepare checkout workflows. It does **not** charge customers, execute payment transactions, deliver products, publish storefronts, store sensitive payment credentials, override Pillow or Grand King, or implement Q5-10 or later.

> Note: Doctrine ID is **PILLOW-CKW-001**. Metadata version `CKW-001-v1`. Report version `CKW-RPT-v1`. Worker ID: `wkr-checkout-01`. Module ID: `checkout-worker`. Factory: `digital-products-factory`. Role: `role-creator-checkout`. Checkout IDs: `ckw-chk-*`. Product IDs: `ckw-prd-*`. Validation IDs: `ckw-val-*`. Engine IDs: `ckw-eng-*`. Run IDs: `ckw-run-*`. Decision IDs: `ckw-dec-*`.

## Boundaries

The Checkout Worker:

- **does** prepare checkout workflows from approved digital product information
- **does** receive approved digital product information; generate checkout workflow; prepare payment provider configuration (structural); generate order summary; generate customer confirmation workflow; validate required purchase information; prepare post-payment handoff (signal only); configure payment provider abstraction; validate checkout readiness; and produce machine-readable Checkout Reports
- does **not** charge customers
- does **not** execute payment transactions
- does **not** deliver products
- does **not** publish storefronts
- does **not** store sensitive payment credentials (no API keys, secrets, card numbers, or tokens)
- does **not** implement Q5-10 or later
- does **not** override Pillow or Grand King
- follows approved product information
- validates checkout integrity before submission
- preserves complete traceability and audit history
- emits structural checkout signals only — never live payment execution or product delivery

## Checkout Report

Each report includes: Checkout ID (`ckw-chk-*`), Timestamp, Product ID (`ckw-prd-*`), Product Title, Checkout Flow (steps describing the purchase path), Payment Provider Configuration (structural — provider name, mode, currency, webhook endpoint placeholder, supported methods — never secrets), Order Summary (line items, subtotal, currency, discounts/coupons placeholders), Customer Information Requirements (email, name, billing country, etc.), Delivery Handoff Status (`not_prepared` | `prepared` | `ready_for_handoff` | `blocked`), Validation Results, Confidence Score, and Metadata version (`CKW-001-v1`).

Orchestration extras include researchReportId, opportunityId, businessId, factoryMissionId, salesPageId, checkoutFlowSteps, supportedProviders, confirmationWorkflow, purchaseInformationValid, checkoutReady, handoffTarget (`digital-delivery-worker` / `wkr-digital-delivery-01` as string signals only), selfReviewPassed, selfReviewFindings, qualityReview, complianceReview, workerId, reportVersion, traceabilityRefs, preservedDecisions, executive reporting submission fields, and force-locked boundary flags.

## Supported checkout flows and features

Checkout flows (extensible): `one_time_purchase`, `subscription_ready_placeholder`, `lead_to_checkout`, `unknown`. Default flow: `one_time_purchase`.

Feature signals: `coupon_support`, `discount_support`, `order_summary`, `tax_configuration_support`, `currency_support`, `payment_provider_abstraction`, `confirmation_workflow`.

Payment provider abstraction (structural readiness only): `stripe_ready`, `paypal_ready`, `paddle_ready`, `manual_invoice_ready`, `unknown`.

## Prerequisites

- Q5-01 Digital Products Factory Core (`PILLOW-DPF-001`)
- Q5-02 Digital Product Research Worker (`PILLOW-DPR-001`)
- Q5-03 Ebook Worker (`PILLOW-EBW-001`)
- Q5-04 Prompt Product Worker (`PILLOW-PPW-001`)
- Q5-05 Course Builder Worker (`PILLOW-CBW-001`)
- Q5-06 Template Builder Worker (`PILLOW-TBW-001`)
- Q5-07 Design Worker (`PILLOW-DW-001`)
- Q5-08 Sales Page Worker (`PILLOW-SPW-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive payment credentials are never stored. Card numbers, API keys, and secrets must never appear in Checkout Reports. Sensitive enterprise information is never logged. Checkout Reports are submitted through the Executive Reporting Runtime. Post-payment handoff is a readiness signal for Digital Delivery Worker only — never delivery execution. Payment provider configuration is structural readiness only — never live charging.
