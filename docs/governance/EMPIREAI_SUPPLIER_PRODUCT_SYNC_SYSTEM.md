# EmpireAI Supplier Product Sync System

**Mission ID:** R2-05  
**Status:** Active · Supplier & Fulfilment  
**Programme:** Supplier & Fulfilment (Real World Operations)  
**Canonical ID:** PILLOW-SPS-001

## Constitutional Purpose

Implement Supplier Product Sync for EmpireAI. This mission consumes R2-02 through R2-04 and establishes unified product synchronization across all supported suppliers.

**Primary deliverable:** Catalog synchronization  
**Completion outcome:** Live supplier catalog.

## Scope (R2-05 Only)

Receiving supplier product data · catalog synchronization · new/updated/discontinued product detection · supplier product ID mapping · supplier metadata preservation · duplicate detection · synchronization failure detection · health monitoring · recovery.

**Out of scope:** Supplier Inventory Sync · Supplier Pricing Engine · Supplier Ranking Engine · live production activation · supplier data modification without validation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Supplier Product Sync (R2-05 / PILLOW-SPS-001)               │
├─────────────────────────────────────────────────────────────┤
│  Sync Manager · Catalog Engine · Product Mapper               │
│  Change Detector · Synchronization Engine · Metadata Gen    │
│  Validation Engine · Validator · Health Monitor · Recovery  │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  CJdropshipping (R2-02) · AliExpress (R2-03) · 1688 (R2-04) │
│  Supplier Framework (R2-01)                                   │
└─────────────────────────────────────────────────────────────┘
```

## Supplier Product Record Model

Each supplier product record includes: Product ID · Supplier ID · Supplier product ID · SKU · Product title · Product description · Product category · Product images · Product attributes · Product status · Synchronization status · Supplier metadata · Metadata version.

## Safety

- **Never exposes** supplier credentials or authentication tokens.
- **Never overwrites** supplier data without validation.
- **Supplier product traceability** preserved across all operations.
- **Auditability** and synchronization integrity maintained.

## Configuration

Externalized via `config/supplier-product-sync.config.json` and environment variables (`SUPPLIER_PRODUCT_SYNC_*`).

## Supported Suppliers

- `cj-dropshipping` (R2-02)
- `aliexpress` (R2-03)
- `1688` (R2-04)
