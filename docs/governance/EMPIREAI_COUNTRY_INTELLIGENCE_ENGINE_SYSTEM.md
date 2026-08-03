# EMPIREAI Country Intelligence Engine System

> **Classification:** CANONICAL — Global Expansion Module  
> **Document ID:** PILLOW-CIE-001  
> **Mission:** X4-02  
> **Module ID:** `country-intelligence-engine`  
> **Metadata version:** CIE-001-v1  
> **Programme:** Global Expansion  
> **Depends on:** Global Expansion Framework (X4-01)

## Purpose

The Country Intelligence Engine evaluates countries for international expansion using structural signals — market size, economic indicators, purchasing power, competitive landscape, ease of doing business, digital commerce readiness, and operational feasibility — then ranks and recommends optimal expansion markets.

## Completion outcome

Select optimal expansion markets.

## Scope

Strictly limited to country intelligence (X4-02). Does not implement Localization, Language, Currency, Tax, Logistics, or later X4 missions.

## Safety

- Never expose credentials or authentication tokens  
- Never recommend expansion using unvalidated country data  
- Preserve evaluation traceability, auditability, and enterprise integrity  
- Structural signals only (no live external economic API calls in X4-02)

## Runtime

`pillow/src/country-intelligence-engine/`

## Configuration

`config/country-intelligence-engine.config.json` and `COUNTRY_INTELLIGENCE_ENGINE_*` environment variables.

## APIs

- `GET /api/pillow/country-intelligence-engine`  
- `POST /api/pillow/country-intelligence-engine/connect`  
- `POST /api/pillow/country-intelligence-engine/evaluate`  
- `POST /api/pillow/country-intelligence-engine/economic`  
- `POST /api/pillow/country-intelligence-engine/market`  
- `POST /api/pillow/country-intelligence-engine/readiness`  
- `POST /api/pillow/country-intelligence-engine/rank`  
- `POST /api/pillow/country-intelligence-engine/recommend`  
- `POST /api/pillow/country-intelligence-engine/diagnostics`  
