# EMPIREAI Portfolio Forecast Engine System

> **Classification:** CANONICAL — Portfolio Intelligence Module  
> **Document ID:** PILLOW-PFE-001  
> **Mission:** X2-14  
> **Module ID:** `portfolio-forecast-engine`  
> **Metadata version:** PFE-001-v1  
> **Programme:** Portfolio Intelligence  
> **Depends on:** Enterprise Portfolio Framework (X2-01), Portfolio Performance Engine (X2-03), Capital Distribution Engine (X2-05), Executive Portfolio Dashboard (X2-06), Portfolio Risk Engine (X2-07), Portfolio Balance Engine (X2-08), Business Health Ranking (X2-09), Shared Customer Intelligence (X2-12), Shared Supplier Intelligence (X2-13)

## Purpose

Portfolio Forecast Engine generates enterprise-wide structural forecasts for revenue, profit, company growth, capital requirements, customer growth, supplier capacity, and portfolio risks — enabling prediction of enterprise-wide growth through scenario and executive forecasts.

## Scope

Strictly limited to portfolio forecasting (X2-14). Does not implement acquisitions or later Portfolio Intelligence missions.

## Primary deliverable

Portfolio forecasting.

## Completion outcome

Predict enterprise-wide growth.

## Capabilities

- Forecast portfolio revenue and profit  
- Forecast company growth, capital requirements, customer growth, and supplier capacity  
- Forecast portfolio risks  
- Generate forecast scenarios and executive forecasts  
- Machine-readable forecast records (`pfe-*`)  
- Status, health, and failure reporting  
- Validation, health monitoring, and automatic recovery  

## Forecast record model

Each record includes: Forecast ID, Timestamp, Portfolio reference, Forecast period, Revenue forecast, Profit forecast, Growth forecast, Risk forecast, Confidence score, Validation status, Metadata version.

## Safety

- Never expose credentials or authentication tokens  
- Never present forecasts as guaranteed outcomes  
- Never log sensitive enterprise information  
- Preserve forecast traceability and auditability  
- Preserve enterprise integrity  
- Structural projections only — not guarantees  

## Runtime

`pillow/src/portfolio-forecast-engine/`

## Configuration

`config/portfolio-forecast-engine.config.json` and `PORTFOLIO_FORECAST_ENGINE_*` environment variables.

## APIs

- `GET /api/pillow/portfolio-forecast-engine`  
- `POST /api/pillow/portfolio-forecast-engine/connect`  
- `POST /api/pillow/portfolio-forecast-engine/forecast-revenue`  
- `POST /api/pillow/portfolio-forecast-engine/forecast-profit`  
- `POST /api/pillow/portfolio-forecast-engine/forecast-growth`  
- `POST /api/pillow/portfolio-forecast-engine/forecast-capital`  
- `POST /api/pillow/portfolio-forecast-engine/forecast-customer-growth`  
- `POST /api/pillow/portfolio-forecast-engine/forecast-supplier-capacity`  
- `POST /api/pillow/portfolio-forecast-engine/forecast-risks`  
- `POST /api/pillow/portfolio-forecast-engine/generate-scenarios`  
- `POST /api/pillow/portfolio-forecast-engine/generate-executive`  
- `POST /api/pillow/portfolio-forecast-engine/diagnostics`  
