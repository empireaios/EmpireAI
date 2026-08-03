# EMPIREAI Store Generation Engine System

> **Classification:** CANONICAL — Company Factory Module  
> **Document ID:** PILLOW-SGE-001  
> **Mission:** X1-07  
> **Module ID:** `store-generation-engine`  
> **Metadata version:** SGE-001-v1  
> **Dependencies:** X1-01 Company Factory Framework · X1-04 Business Model Generator · X1-05 Brand Creation Engine · X1-06 Domain & Digital Asset Planner  

## Purpose

The Store Generation Engine produces ready-to-operate online storefront structures — website structure, navigation, homepage layouts, product catalogue and category structures, company information pages, legal page templates, and deployment packages — as machine-readable storefront records.

## Scope

Strictly limited to storefront generation (X1-07). Does not deploy storefronts, process payments, or provision hosting automatically.

## Safety

- Never expose credentials or authentication tokens  
- Never deploy storefronts automatically without validation  
- Structural signals only — no fabricated live-store claims  
- Preserve storefront traceability, auditability, and data integrity  
- Sensitive values redacted from logs  

## Runtime

`pillow/src/store-generation-engine/`

## Configuration

`config/store-generation-engine.config.json` and `STORE_GENERATION_ENGINE_*` environment variables.
