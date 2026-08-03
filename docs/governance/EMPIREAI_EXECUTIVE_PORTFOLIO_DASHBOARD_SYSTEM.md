# EMPIREAI Executive Portfolio Dashboard System

> **Classification:** CANONICAL — Portfolio Intelligence Module  
> **Document ID:** PILLOW-EPD-001  
> **Mission:** X2-06  
> **Module ID:** `executive-portfolio-dashboard`  
> **Metadata version:** EPD-001-v1  
> **Programme:** Portfolio Intelligence  
> **Depends on:** Enterprise Portfolio Framework (X2-01), Multi-Company Registry (X2-02), Portfolio Performance Engine (X2-03), Cross-Business Knowledge Engine (X2-04), Capital Distribution Engine (X2-05)

## Purpose

The Executive Portfolio Dashboard establishes executive portfolio visibility — portfolio summary, company performance, KPIs, capital allocation, growth, company health, enterprise alerts, recommendations, and drill-down capability.

## Scope

Strictly limited to the Executive Portfolio Dashboard (X2-06). Does not implement Risk/Balance engines or later Portfolio Intelligence missions. Does not render UI surfaces outside structural dashboard records.

## Safety

- Never expose credentials or authentication tokens  
- Never permit unauthorized access to enterprise information  
- Preserve dashboard traceability and auditability  
- Preserve enterprise integrity  
- Structural signals only — sensitive values redacted from logs  

## Runtime

`pillow/src/executive-portfolio-dashboard/`

## Configuration

`config/executive-portfolio-dashboard.config.json` and `EXECUTIVE_PORTFOLIO_DASHBOARD_*` environment variables.
