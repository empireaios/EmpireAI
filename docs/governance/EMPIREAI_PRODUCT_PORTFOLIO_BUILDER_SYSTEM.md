# EMPIREAI Product Portfolio Builder System

> **Classification:** CANONICAL — Company Factory Module  
> **Document ID:** PILLOW-PPB-001  
> **Mission:** X1-08  
> **Module ID:** `product-portfolio-builder`  
> **Metadata version:** PPB-001-v1  
> **Dependencies:** X1-01 Company Factory Framework · X1-02 Business Opportunity Discovery · X1-03 Market Validation Engine · X1-04 Business Model Generator · X1-07 Store Generation Engine  

## Purpose

The Product Portfolio Builder produces intelligent product selection — discovering suitable products, evaluating opportunities, categorizing and ranking products, estimating profitability and demand, detecting overlaps, and recommending portfolio improvements — as machine-readable product portfolio records.

## Scope

Strictly limited to product portfolio generation (X1-08). Does not publish products, place supplier orders, or list inventory automatically.

## Safety

- Never expose credentials or authentication tokens  
- Never publish product portfolios automatically without validation  
- Structural signals only — no fabricated market or inventory facts  
- Preserve portfolio traceability, auditability, and data integrity  
- Sensitive values redacted from logs  

## Runtime

`pillow/src/product-portfolio-builder/`

## Configuration

`config/product-portfolio-builder.config.json` and `PRODUCT_PORTFOLIO_BUILDER_*` environment variables.
