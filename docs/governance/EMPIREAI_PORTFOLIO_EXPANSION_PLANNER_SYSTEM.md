# EMPIREAI Portfolio Expansion Planner System

> **Classification:** CANONICAL — Portfolio Intelligence Module  
> **Document ID:** PILLOW-PEP-001  
> **Mission:** X2-18  
> **Module ID:** `portfolio-expansion-planner`  
> **Metadata version:** PEP-001-v1  
> **Programme:** Portfolio Intelligence  
> **Depends on:** Enterprise Portfolio Framework (X2-01), Portfolio Performance Engine (X2-03), Capital Distribution Engine (X2-05), Portfolio Risk Engine (X2-07), Business Health Ranking (X2-09), Acquisition Evaluation Engine (X2-15), Portfolio Optimization Engine (X2-16), Company Lifecycle Manager (X2-17)

## Purpose

Portfolio Expansion Planner identifies and prioritizes structural expansion opportunities across markets, industries, internal growth, and acquisition-linked expansion — estimating investment and returns and generating approval-gated recommendations for intelligent portfolio growth. Automatic expansion initiation beyond configured approval policies is forbidden.

## Scope

Strictly limited to portfolio expansion planning (X2-18). Does not implement deal execution, company creation, or later programmes.

## Primary deliverable

Expansion planning.

## Completion outcome

Intelligent portfolio growth.

## Capabilities

- Identify expansion opportunities  
- Evaluate new markets, industries, internal expansion, and acquisition expansion  
- Prioritize opportunities and estimate investment / returns  
- Generate enterprise expansion recommendations  
- Machine-readable expansion records (`pep-*`)  
- Status, health, and failure reporting  
- Validation, health monitoring, and automatic recovery  

## Expansion record model

Each record includes: Expansion Plan ID, Timestamp, Portfolio reference, Expansion opportunity, Expansion category, Estimated investment, Expected return, Expansion priority, Validation status, Metadata version.

## Safety

- Never expose credentials or authentication tokens  
- Never initiate expansion automatically beyond configured approval policies  
- Never log sensitive enterprise information  
- Preserve expansion traceability and auditability  
- Preserve enterprise integrity  
- Structural recommendations only — approval-gated  

## Runtime

`pillow/src/portfolio-expansion-planner/`

## Configuration

`config/portfolio-expansion-planner.config.json` and `PORTFOLIO_EXPANSION_PLANNER_*` environment variables.

## APIs

- `GET /api/pillow/portfolio-expansion-planner`  
- `POST /api/pillow/portfolio-expansion-planner/connect`  
- `POST /api/pillow/portfolio-expansion-planner/identify-opportunities`  
- `POST /api/pillow/portfolio-expansion-planner/evaluate-markets`  
- `POST /api/pillow/portfolio-expansion-planner/evaluate-industries`  
- `POST /api/pillow/portfolio-expansion-planner/evaluate-internal`  
- `POST /api/pillow/portfolio-expansion-planner/evaluate-acquisition`  
- `POST /api/pillow/portfolio-expansion-planner/prioritize`  
- `POST /api/pillow/portfolio-expansion-planner/estimate-costs`  
- `POST /api/pillow/portfolio-expansion-planner/estimate-returns`  
- `POST /api/pillow/portfolio-expansion-planner/recommend`  
- `POST /api/pillow/portfolio-expansion-planner/diagnostics`  
