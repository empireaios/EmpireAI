# EMPIREAI Currency Intelligence System

> **Classification:** CANONICAL — Global Expansion Module  
> **Document ID:** PILLOW-CUR-001  
> **Mission:** X4-05  
> **Module ID:** `currency-intelligence`  
> **Metadata version:** CUR-001-v1  
> **Programme:** Global Expansion  
> **Depends on:** Global Expansion Framework (X4-01), Country Intelligence Engine (X4-02), Localization Engine (X4-03), Language Intelligence (X4-04)

## Purpose

Currency Intelligence establishes enterprise-wide multi-currency capability — managing supported currencies, detecting customer currency preferences, converting prices with validated exchange baselines, monitoring fluctuations, supporting regional pricing, detecting anomalies, and generating currency recommendations.

## Completion outcome

International financial support.

## Scope

Strictly limited to currency intelligence (X4-05). Does not implement Tax, Logistics, or later X4 missions.

## Safety

- Never expose credentials or authentication tokens  
- Never perform financial conversions using unvalidated exchange data  
- Preserve financial traceability, auditability, and enterprise integrity  
- Structural FX baselines only (no live exchange provider APIs in X4-05)  
- Never log sensitive financial information  

## Runtime

`pillow/src/currency-intelligence/`

## Architecture

- Currency Intelligence Manager  
- Currency Management Engine  
- Exchange Rate Engine  
- Regional Pricing Engine  
- Currency Analytics Engine  
- Currency Recommendation Engine  
- Currency Metadata Generator  
- Currency Validator  
- Health Monitor  
- Recovery Manager  

## Configuration

`config/currency-intelligence.config.json` and `CURRENCY_INTELLIGENCE_*` environment variables.

## APIs

- `GET /api/pillow/currency-intelligence`  
- `POST /api/pillow/currency-intelligence/connect`  
- `POST /api/pillow/currency-intelligence/manage`  
- `POST /api/pillow/currency-intelligence/preference`  
- `POST /api/pillow/currency-intelligence/convert`  
- `POST /api/pillow/currency-intelligence/rates`  
- `POST /api/pillow/currency-intelligence/fluctuations`  
- `POST /api/pillow/currency-intelligence/pricing`  
- `POST /api/pillow/currency-intelligence/anomalies`  
- `POST /api/pillow/currency-intelligence/recommend`  
- `POST /api/pillow/currency-intelligence/diagnostics`  
