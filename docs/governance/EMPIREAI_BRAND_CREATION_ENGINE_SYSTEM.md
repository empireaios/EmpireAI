# EMPIREAI Brand Creation Engine System

> **Classification:** CANONICAL — Company Factory Module  
> **Document ID:** PILLOW-BCE-001  
> **Mission:** X1-05  
> **Module ID:** `brand-creation-engine`  
> **Metadata version:** BCE-001-v1  
> **Dependencies:** X1-01 Company Factory Framework · X1-02 Business Opportunity Discovery · X1-03 Market Validation Engine · X1-04 Business Model Generator  

## Purpose

The Brand Creation Engine produces complete structural business identities — company names, brand identity, positioning, messaging, values, voice, colour/typography recommendations, and guideline references — as machine-readable brand records.

## Scope

Strictly limited to automated branding (X1-05). Does not implement domains, legal entity formation, or marketplace listing.

## Safety

- Never expose credentials or authentication tokens  
- Structural signals only — no fabricated market brand facts  
- Prevent duplicate brand identities without validation  
- Preserve brand traceability, auditability, and data integrity  
- Sensitive values redacted from logs  

## Runtime

`pillow/src/brand-creation-engine/`

## Configuration

`config/brand-creation-engine.config.json` and `BRAND_CREATION_ENGINE_*` environment variables.
