# EMPIREAI Business Health Ranking System

> **Classification:** CANONICAL — Portfolio Intelligence Module  
> **Document ID:** PILLOW-BHR-001  
> **Mission:** X2-09  
> **Module ID:** `business-health-ranking`  
> **Metadata version:** BHR-001-v1  
> **Programme:** Portfolio Intelligence  
> **Depends on:** Enterprise Portfolio Framework (X2-01), Multi-Company Registry (X2-02), Portfolio Performance Engine (X2-03), Cross-Business Knowledge Engine (X2-04), Capital Distribution Engine (X2-05), Executive Portfolio Dashboard (X2-06), Portfolio Risk Engine (X2-07), Portfolio Balance Engine (X2-08)

## Purpose

The Business Health Ranking engine measures overall company health and produces objective enterprise rankings across financial, operational, customer, growth, and operational-risk dimensions. It detects declining and high-performing businesses and generates management priorities so executive attention is allocated where it creates the most Long-Term Empire Value.

## Scope

Strictly limited to Business Health Ranking (X2-09). Does not implement later Portfolio Intelligence missions. Does not manipulate rankings — scores are derived objectively from portfolio signals. Does not replace the backend Global Business Health Engine; this module is the Portfolio Intelligence ranking layer under Pillow.

## Primary deliverable

Company ranking — prioritize management attention.

## Capabilities

- Measure overall company health  
- Rank by operational, financial, growth, customer health, and operational risk  
- Detect declining and high-performing businesses  
- Generate management priorities  
- Machine-readable business health records (`bhr-*`)  
- Ranking status, health, and failure reporting  
- Validation, health monitoring, and automatic recovery  

## Safety

- Never expose credentials or authentication tokens  
- Never manipulate business rankings  
- Preserve ranking traceability and auditability  
- Preserve enterprise integrity  
- Structural signals only — sensitive values redacted from logs  

## Runtime

`pillow/src/business-health-ranking/`

## Configuration

`config/business-health-ranking.config.json` and `BUSINESS_HEALTH_RANKING_*` environment variables.

## APIs

- `GET /api/pillow/business-health-ranking`  
- `POST /api/pillow/business-health-ranking/connect`  
- `POST /api/pillow/business-health-ranking/measure`  
- `POST /api/pillow/business-health-ranking/rank`  
- `POST /api/pillow/business-health-ranking/detect-declining`  
- `POST /api/pillow/business-health-ranking/detect-high-performing`  
- `POST /api/pillow/business-health-ranking/priorities`  
- `POST /api/pillow/business-health-ranking/diagnostics`  
