# EmpireAI Supplier Pricing Engine System

**Mission ID:** R2-07  
**Status:** Active · Supplier & Fulfilment  
**Programme:** Supplier & Fulfilment (Real World Operations)  
**Canonical ID:** PILLOW-SPE-001

## Constitutional Purpose

Implement Supplier Pricing Engine for EmpireAI. This mission consumes Supplier Product Sync (R2-05) and Supplier Inventory Sync (R2-06) to establish centralized supplier pricing management.

**Primary deliverable:** Dynamic pricing  
**Completion outcome:** Live cost updates.

## Scope (R2-07 Only)

Receiving supplier pricing data · synchronizing supplier prices · detecting price increases and decreases · recording historical price changes · managing supplier currency information · landed cost calculations · pricing validation · abnormal price movement detection · machine-readable pricing records · pricing status and health reporting · failure reporting.

**Out of scope:** Supplier Ranking Engine · live production activation · pricing overwrite without validation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Supplier Pricing Engine (R2-07 / PILLOW-SPE-001)         │
├─────────────────────────────────────────────────────────────┤
│  Pricing Manager · Price Synchronization Engine               │
│  Price Change Detector · Cost Calculation Engine              │
│  Currency Handler · Pricing Validation Engine               │
│  Pricing Metadata Generator · Pricing Validator               │
│  Health Monitor · Recovery Manager                            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Supplier Product Sync (R2-05) · Supplier Inventory (R2-06) │
└─────────────────────────────────────────────────────────────┘
```

## Supplier Pricing Record Model

Each pricing record includes: Pricing Record ID · Supplier ID · Supplier Product ID · Internal Product ID · Current supplier price · Previous supplier price · Currency · Price change amount · Price change percentage · Effective timestamp · Validation status · Metadata version.

## Safety

- **Never exposes** supplier credentials or authentication tokens.
- **Never overwrites** pricing without validation.
- **Pricing traceability** and auditability preserved.

## Configuration

Externalized via `config/supplier-pricing-engine.config.json` and environment variables (`SUPPLIER_PRICING_ENGINE_*`).

## Supported Suppliers

- `cj-dropshipping` (R2-02)
- `aliexpress` (R2-03)
- `1688` (R2-04)
