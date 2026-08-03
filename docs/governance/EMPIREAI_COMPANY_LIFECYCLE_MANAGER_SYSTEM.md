# EMPIREAI Company Lifecycle Manager System

> **Classification:** CANONICAL — Portfolio Intelligence Module  
> **Document ID:** PILLOW-CLM-001  
> **Mission:** X2-17  
> **Module ID:** `company-lifecycle-manager`  
> **Metadata version:** CLM-001-v1  
> **Programme:** Portfolio Intelligence  
> **Depends on:** Enterprise Portfolio Framework (X2-01), Multi-Company Registry (X2-02), Portfolio Performance Engine (X2-03), Business Health Ranking (X2-09), Portfolio Forecast Engine (X2-14), Portfolio Optimization Engine (X2-16)

## Purpose

Company Lifecycle Manager governs company stages across launch, growth, mature, and retirement — assessing maturity, detecting transition signals, and generating approval-gated recommendations so companies can be launched, grown, matured, and retired systematically.

## Scope

Strictly limited to company lifecycle management (X2-17). Does not implement company creation factories, acquisitions, or later programmes.

## Primary deliverable

Company lifecycle governance.

## Completion outcome

Launch, grow, mature, and retire companies systematically.

## Capabilities

- Manage lifecycle stages and track maturity  
- Detect lifecycle transitions (recommend only — never auto-apply beyond approval policies)  
- Manage launch, growth, mature, and retirement stages  
- Generate lifecycle recommendations and analytics  
- Machine-readable lifecycle records (`clm-*`)  
- Status, health, and failure reporting  
- Validation, health monitoring, and automatic recovery  

## Lifecycle record model

Each record includes: Lifecycle Record ID, Timestamp, Company reference, Current lifecycle stage, Previous lifecycle stage, Maturity score, Transition recommendation, Lifecycle status, Validation status, Metadata version.

## Safety

- Never expose credentials or authentication tokens  
- Never transition lifecycle stages automatically beyond configured approval policies  
- Never log sensitive enterprise information  
- Preserve lifecycle traceability and auditability  
- Preserve enterprise integrity  
- Structural recommendations only — approval-gated  

## Runtime

`pillow/src/company-lifecycle-manager/`

## Configuration

`config/company-lifecycle-manager.config.json` and `COMPANY_LIFECYCLE_MANAGER_*` environment variables.

## APIs

- `GET /api/pillow/company-lifecycle-manager`  
- `POST /api/pillow/company-lifecycle-manager/connect`  
- `POST /api/pillow/company-lifecycle-manager/manage-stage`  
- `POST /api/pillow/company-lifecycle-manager/assess-maturity`  
- `POST /api/pillow/company-lifecycle-manager/detect-transitions`  
- `POST /api/pillow/company-lifecycle-manager/manage-launch`  
- `POST /api/pillow/company-lifecycle-manager/manage-growth`  
- `POST /api/pillow/company-lifecycle-manager/manage-mature`  
- `POST /api/pillow/company-lifecycle-manager/manage-retirement`  
- `POST /api/pillow/company-lifecycle-manager/recommend`  
- `POST /api/pillow/company-lifecycle-manager/analytics`  
- `POST /api/pillow/company-lifecycle-manager/diagnostics`  
