# EMPIREAI Portfolio Risk Engine System

> **Classification:** CANONICAL — Portfolio Intelligence Module  
> **Document ID:** PILLOW-PRE-001  
> **Mission:** X2-07  
> **Module ID:** `portfolio-risk-engine`  
> **Metadata version:** PRE-001-v1  
> **Programme:** Portfolio Intelligence  
> **Depends on:** Enterprise Portfolio Framework (X2-01), Multi-Company Registry (X2-02), Portfolio Performance Engine (X2-03), Cross-Business Knowledge Engine (X2-04), Capital Distribution Engine (X2-05), Executive Portfolio Dashboard (X2-06)

## Purpose

The Portfolio Risk Engine establishes enterprise portfolio risk management — continuous monitoring of enterprise, company, financial, operational, supplier concentration, and customer concentration risks, with scoring, emerging-risk detection, and mitigation recommendations.

## Scope

Strictly limited to the Portfolio Risk Engine (X2-07). Does not implement Portfolio Balance Engine, Business Health Ranking, or later Portfolio Intelligence missions.

## Safety

- Never expose credentials or authentication tokens  
- Never suppress critical enterprise risks  
- Preserve risk traceability and auditability  
- Preserve enterprise integrity  
- Structural signals only — sensitive values redacted from logs  

## Runtime

`pillow/src/portfolio-risk-engine/`

## Configuration

`config/portfolio-risk-engine.config.json` and `PORTFOLIO_RISK_ENGINE_*` environment variables.
