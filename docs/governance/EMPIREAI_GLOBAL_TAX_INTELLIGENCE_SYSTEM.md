# EMPIREAI Global Tax Intelligence System

> **Classification:** CANONICAL — Global Expansion Module  
> **Document ID:** PILLOW-GTI-001  
> **Mission:** X4-07  
> **Module ID:** `global-tax-intelligence`  
> **Metadata version:** GTI-001-v1  
> **Programme:** Global Expansion  
> **Depends on:** Global Expansion Framework (X4-01), Country Intelligence Engine (X4-02), Localization Engine (X4-03), Language Intelligence (X4-04), Currency Intelligence (X4-05), Regional Compliance Engine (X4-06)

## Purpose

The Global Tax Intelligence engine establishes enterprise-wide international tax intelligence — country-specific tax rules, regulation update monitoring, indirect/direct taxes, cross-border requirements, obligation estimation, compliance risk detection, optimization opportunity detection, and recommendations — without providing unvalidated tax calculations as authoritative legal advice.

## Completion outcome

Cross-border tax management.

## Scope

Strictly limited to global tax intelligence (X4-07). Does not implement Logistics (X4-08) or later X4 missions.

## Safety

- Never expose credentials or authentication tokens  
- Never provide unvalidated tax calculations as authoritative legal advice (`authoritativeLegalAdviceClaim` always `none`)  
- Preserve tax calculation traceability, auditability, and enterprise integrity  
- Structural signals only (no live tax authority API calls in X4-07)  
- Never log sensitive financial information  

## Runtime

`pillow/src/global-tax-intelligence/`

## Architecture

- Global Tax Intelligence Manager  
- International Tax Rules Engine  
- Tax Calculation Engine  
- Tax Compliance Engine  
- Tax Risk Analyzer  
- Tax Recommendation Engine  
- Tax Metadata Generator  
- Tax Validator  
- Health Monitor  
- Recovery Manager  

## Configuration

`config/global-tax-intelligence.config.json` and `GLOBAL_TAX_INTELLIGENCE_*` environment variables.

## APIs

- `GET /api/pillow/global-tax-intelligence`  
- `POST /api/pillow/global-tax-intelligence/connect`  
- `POST /api/pillow/global-tax-intelligence/country-rules`  
- `POST /api/pillow/global-tax-intelligence/regulation-updates`  
- `POST /api/pillow/global-tax-intelligence/indirect`  
- `POST /api/pillow/global-tax-intelligence/direct`  
- `POST /api/pillow/global-tax-intelligence/cross-border`  
- `POST /api/pillow/global-tax-intelligence/estimate`  
- `POST /api/pillow/global-tax-intelligence/compliance-risks`  
- `POST /api/pillow/global-tax-intelligence/optimization`  
- `POST /api/pillow/global-tax-intelligence/recommend`  
- `POST /api/pillow/global-tax-intelligence/diagnostics`  
